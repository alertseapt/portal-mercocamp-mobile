<template>
  <div v-if="showModal" class="modal-overlay" @click="handleModalClick">
    <div class="modal-content large batch-products-modal">
      <!-- Header -->
      <div class="modal-header">
        <h3>
          <i class="fas fa-list-alt"></i>
          Configurar Produtos
        </h3>
        <button class="btn-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Progress Steps -->
      <div class="progress-steps">
        <div class="step-header">
          <div class="step-info">
            <div class="step-counter">
              <span class="step-current">{{ currentFileIndex + 1 }}</span>
              <span class="step-separator">/</span>
              <span class="step-total">{{ parsedFiles.length }}</span>
            </div>
            <div class="nfe-details">
              <div class="nfe-info-header">
                <div class="nfe-info-row">
                  <span class="nfe-number">
                    <i class="fas fa-file-alt"></i>
                    NFe {{ currentFile?.nfeData?.number || 'N/A' }}
                  </span>
                  <span
                    v-if="currentFile?.nfeData?.supplier_name"
                    class="supplier-name"
                  >
                    <i class="fas fa-truck"></i>
                    {{ currentFile.nfeData.supplier_name }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="date-input-header">
            <div class="date-input-row">
              <label class="date-header-label" for="nfe-schedule-date-header">
                <i class="fas fa-calendar-alt"></i>
                Data de Agendamento
              </label>
              <input
                id="nfe-schedule-date-header"
                v-model="currentFileDate"
                type="date"
                class="form-control date-input-compact"
                :min="minDate"
                @change="updateFileDate"
                required
              />
              <div class="prevision-checkbox-container">
                <label class="prevision-checkbox-label">
                  <input
                    type="checkbox"
                    v-model="currentFilePrevision"
                    @change="updateFilePrevision"
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
                    v-model="currentFileCrossdock"
                    @change="updateFileCrossdock"
                    :disabled="isCrossdockDisabled"
                    class="prevision-checkbox"
                  />
                  <span class="prevision-label-text">Crossdock</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-container">
        <i class="fas fa-spinner fa-spin"></i>
        <p>{{ loadingText }}</p>
      </div>

      <!-- Mensagem para cliente integration=0 -->
      <div v-if="!loading && !clientRequiresProducts" class="modal-body">
        <div class="alert alert-info">
          <h6>
            <i class="fas fa-info-circle"></i> Agendamento Simplificado
            (Integration = 0)
          </h6>
          <p class="mb-2">
            Este cliente está configurado para
            <strong>agendamento simplificado</strong>. Os produtos usarão
            automaticamente os códigos e descrições originais da NFe.
          </p>
          <div class="mb-2">
            <strong>O que acontece:</strong>
            <ul class="mb-0 mt-1">
              <li>
                <i class="fas fa-check text-success"></i> Usa códigos e
                descrições originais da NFe
              </li>
              <li>
                <i class="fas fa-check text-success"></i> Não precisa configurar
                produtos manualmente
              </li>
              <li>
                <i class="fas fa-check text-success"></i> Agendamento criado com
                a data selecionada
              </li>
              <li>
                <i class="fas fa-info-circle text-info"></i> Não há integração
                com sistema CORPEM
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- File Products Configuration -->
      <div
        v-if="!loading && clientRequiresProducts"
        class="modal-body products-modal-body"
      >
        <div class="products-section">
          <div class="products-controls">
            <div class="checkbox-controls">
              <div class="controls-row controls-row-values">
                <div class="controls-left">
                  <label class="master-checkbox">
                    <input
                      type="checkbox"
                      v-model="selectAllProducts"
                      @change="toggleAllProducts"
                    />
                    Marcar todos
                  </label>
                  <span class="products-hint">
                    <i class="fas fa-info-circle"></i>
                    Produtos marcados usarão código e descrição do fornecedor
                    automaticamente
                  </span>
                </div>
                <div class="controls-right values-comparison">
                  <span
                    class="value-label"
                    :class="{ 'value-mismatch': !valuesMatch }"
                  >
                    [Valor configurado: {{ formatCurrency(configuredTotal) }}]
                  </span>
                  <span class="value-label value-nfe">
                    [NF-e: {{ formatCurrency(nfeTotal) }}]
                  </span>
                </div>
              </div>
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
                  <th>Embal.</th>
                  <th v-if="showFactorColumn" class="col-fator">Fator</th>
                  <th class="col-valor">Valor Un.</th>
                  <th class="col-ean">
                    Código EAN
                    <i class="fas fa-edit" title="Editável"></i>
                  </th>
                  <th width="50"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="product in currentFileProducts"
                  :key="product.id"
                  :class="{
                    'product-use-supplier':
                      product.useSupplierData && !product.inutilizado,
                    'product-locked':
                      product.wasLocked &&
                      !product.wasModified &&
                      !product.inutilizado,
                    'product-inutilizado': product.inutilizado,
                  }"
                >
                  <td class="checkbox-cell">
                    <label
                      class="product-checkbox"
                      v-if="!product.inutilizado && !product.isAdded"
                    >
                      <input
                        type="checkbox"
                        v-model="product.useSupplierData"
                        @change="toggleProductSupplierData(product)"
                      />
                      <span class="checkmark-small"></span>
                    </label>
                    <span v-else>—</span>
                  </td>
                  <td :title="product.supplier_code">
                    <strong>{{
                      product.isAdded ? '—' : product.supplier_code || ''
                    }}</strong>
                    <i
                      v-if="
                        product.wasLocked &&
                        !product.wasModified &&
                        !product.inutilizado
                      "
                      class="fas fa-info-circle product-info-icon"
                      title="Produto já cadastrado - clique para editar"
                      style="color: #17a2b8; margin-left: 5px"
                    ></i>
                  </td>
                  <td>
                    <input
                      v-model="product.client_code"
                      :disabled="product.useSupplierData || product.inutilizado"
                      @mousedown="
                        handleProductInputFocus(product, 'client_code', $event)
                      "
                      @focus="
                        handleProductInputFocus(product, 'client_code', $event)
                      "
                      @change="updateProduct(product)"
                      @paste="
                        handlePasteInInput($event, product, 'client_code')
                      "
                      class="form-control form-control-sm"
                      :placeholder="
                        product.useSupplierData && !product.isAdded
                          ? product.supplier_code
                          : ''
                      "
                    />
                  </td>
                  <td
                    :title="product.supplier_description"
                    class="description-cell"
                  >
                    {{
                      product.isAdded ? '—' : product.supplier_description || ''
                    }}
                  </td>
                  <td>
                    <input
                      v-model="product.client_description"
                      :disabled="product.useSupplierData || product.inutilizado"
                      @mousedown="
                        handleProductInputFocus(
                          product,
                          'client_description',
                          $event
                        )
                      "
                      @focus="
                        handleProductInputFocus(
                          product,
                          'client_description',
                          $event
                        )
                      "
                      @change="updateProduct(product)"
                      @paste="
                        handlePasteInInput(
                          $event,
                          product,
                          'client_description'
                        )
                      "
                      class="form-control form-control-sm"
                      :placeholder="
                        product.useSupplierData && !product.isAdded
                          ? product.supplier_description
                          : ''
                      "
                    />
                  </td>
                  <td>
                    <input
                      v-model.number="product.quantity"
                      type="number"
                      step="1"
                      min="0"
                      :disabled="product.inutilizado"
                      @change="onQuantityChange(product)"
                      class="form-control form-control-sm input-no-spinner"
                    />
                  </td>
                  <td>
                    <input
                      :value="product.unit"
                      maxlength="2"
                      :disabled="product.inutilizado"
                      class="form-control form-control-sm input-embalagem"
                      placeholder="Ex: UN"
                      @input="onUnitInput(product, $event.target.value)"
                    />
                  </td>
                  <td v-if="showFactorColumn" class="col-fator">
                    <input
                      type="text"
                      inputmode="numeric"
                      :value="product.factor"
                      :disabled="product.inutilizado"
                      class="form-control form-control-sm input-no-spinner input-fator"
                      placeholder="1"
                      @input="onFactorInput(product, $event.target.value)"
                    />
                  </td>
                  <td class="col-valor">
                    <input
                      type="text"
                      inputmode="decimal"
                      :value="
                        focusedUnitValueKey === product.id
                          ? rawUnitValueInput
                          : formatCurrencyBr(product.unit_value)
                      "
                      :placeholder="product.isAdded ? 'R$ 0,00' : ''"
                      :disabled="product.inutilizado"
                      :class="[
                        'form-control',
                        'form-control-sm',
                        'input-currency-br',
                        product.isAdded && 'input-unit-value-added',
                      ]"
                      @focus="focusUnitValue(product)"
                      @input="onUnitValueInput(product, $event.target.value)"
                      @blur="blurUnitValue(product)"
                    />
                  </td>
                  <td class="col-ean">
                    <input
                      v-model="product.ean_code"
                      :disabled="product.inutilizado"
                      @change="updateProduct(product)"
                      @paste="handlePasteInInput($event, product, 'ean_code')"
                      class="form-control form-control-sm"
                      placeholder="Código EAN"
                    />
                  </td>
                  <td class="td-actions">
                    <template v-if="product.isAdded">
                      <button
                        type="button"
                        class="btn btn-sm btn-trash"
                        title="Remover item"
                        @click="removeOrInutilize(product)"
                      >
                        <i class="fas fa-trash"></i>
                      </button>
                    </template>
                    <template v-else>
                      <button
                        v-if="product.inutilizado"
                        type="button"
                        class="btn btn-sm btn-undo"
                        title="Desfazer inutilização – item voltará a contar no valor da NF-e"
                        @click="undoInutilize(product)"
                      >
                        <i class="fas fa-undo"></i>
                      </button>
                      <button
                        v-else
                        type="button"
                        class="btn btn-sm btn-trash"
                        title="Inutilizar produto – item não contará no valor total"
                        @click="removeOrInutilize(product)"
                      >
                        <i class="fas fa-trash"></i>
                      </button>
                    </template>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="products-add-row">
            <button type="button" class="btn btn-add-item" @click="addProduct">
              <i class="fas fa-plus"></i>
              Adicionar item
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button
          @click="openObservationsModal"
          class="btn btn-info"
          :disabled="loading"
          title="Adicionar observações ao agendamento"
        >
          <i class="fas fa-comment-medical"></i>
          {{ observations ? 'Editar Observações' : '+ Observações' }}
          <span v-if="observations" class="observation-badge">✓</span>
        </button>

        <button
          v-if="currentFileIndex > 0"
          @click="previousFile"
          :disabled="loading"
          class="btn btn-secondary"
        >
          <template v-if="loading">
            <i class="fas fa-spinner fa-spin"></i>
            Salvando...
          </template>
          <template v-else>
            <i class="fas fa-arrow-left"></i>
            Anterior
          </template>
        </button>

        <div class="progress-summary">
          <span class="files-completed"
            >{{ completedFiles }} de {{ parsedFiles.length }} concluídos</span
          >
        </div>

        <button
          v-if="hasNextFile"
          @click="nextFile"
          :disabled="!canProceed || loading"
          class="btn btn-primary"
        >
          <template v-if="loading">
            <i class="fas fa-spinner fa-spin"></i>
            Processando...
          </template>
          <template v-else>
            Próximo
            <i class="fas fa-arrow-right"></i>
          </template>
        </button>

        <button
          v-if="!hasNextFile"
          @click="finalizeBatch"
          :disabled="!canProceed || loading"
          class="btn btn-success"
        >
          <template v-if="loading">
            <i class="fas fa-spinner fa-spin"></i>
            Finalizando...
          </template>
          <template v-else>
            <i class="fas fa-check"></i>
            Solicitar agendamento
          </template>
        </button>
      </div>
    </div>

    <!-- Modal de Observações -->
    <div
      v-if="showObservationsModal"
      class="observations-modal-overlay"
      @click="closeObservationsModal"
    >
      <div class="observations-modal-content" @click.stop>
        <div class="observations-modal-header">
          <h4>
            <i class="fas fa-comment-medical"></i>
            Adicionar Observações
          </h4>
          <button class="btn-close" @click="closeObservationsModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="observations-modal-body">
          <p class="observations-instruction">
            <i class="fas fa-info-circle"></i>
            Digite abaixo as observações que deseja incluir no agendamento.
            Estas informações serão salvas junto com os dados da NFe.
          </p>

          <textarea
            v-model="observations"
            class="observations-textarea"
            placeholder="Digite suas observações aqui..."
            rows="8"
            maxlength="1000"
          ></textarea>

          <div class="observations-counter">
            {{ observations.length }} / 1000 caracteres
          </div>
        </div>

        <div class="observations-modal-footer">
          <button @click="closeObservationsModal" class="btn btn-secondary">
            <i class="fas fa-times"></i>
            Cancelar
          </button>

          <button @click="saveObservations" class="btn btn-success">
            <i class="fas fa-check"></i>
            Salvar Observações
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação para Alterar Produto Cadastrado -->
    <div
      v-if="showProductEditConfirmModal"
      class="product-edit-confirm-modal-overlay"
      @click.self="cancelProductEdit"
    >
      <div class="product-edit-confirm-modal-content">
        <div class="modal-header">
          <h3>
            <i class="fas fa-exclamation-triangle"></i>
            Confirmar Alteração
          </h3>
          <button class="btn-close" @click="cancelProductEdit">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>
            Você está prestes a alterar as informações de um produto já
            cadastrado.
          </p>
          <p><strong>Tem certeza que deseja continuar?</strong></p>
          <div v-if="productToEdit" class="product-info-preview">
            <p><strong>Produto:</strong> {{ productToEdit.supplier_code }}</p>
            <p v-if="productOriginalData">
              <strong>Código atual:</strong>
              {{ productOriginalData.client_code }}
            </p>
            <p v-if="productOriginalData">
              <strong>Descrição atual:</strong>
              {{ productOriginalData.client_description }}
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="cancelProductEdit">
            <i class="fas fa-times"></i>
            Não
          </button>
          <button class="btn btn-primary" @click="confirmProductEdit">
            <i class="fas fa-check"></i>
            Sim, alterar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BatchProductsModal',

  props: {
    showModal: {
      type: Boolean,
      default: false,
    },
    parsedFiles: {
      type: Array,
      default: () => [],
    },
    selectedClient: {
      type: Object,
      default: null,
    },
    bookingToEffectivate: {
      type: Object,
      default: null,
    },
    isEffectivating: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      currentFileIndex: 0,
      loading: false,
      loadingText: '',
      selectAllProducts: false,
      completedFiles: 0,
      processedSchedules: [],
      sessionProductCache: new Map(), // Cache de produtos configurados na sessão atual
      fileDates: new Map(), // Armazena a data de cada arquivo
      filePrevisions: new Map(), // Armazena o status de previsão de cada arquivo
      fileCrossdocks: new Map(), // Armazena o status de crossdock de cada arquivo
      fileNfeTotals: new Map(), // Armazena o valor fixo da NF-e de cada arquivo (calculado uma vez ao abrir)
      observations: '', // Observações do usuário
      showObservationsModal: false, // Controla exibição do modal de observações
      // Modal de confirmação para alterar produto cadastrado
      showProductEditConfirmModal: false,
      productToEdit: null,
      productOriginalData: null, // Dados originais do produto antes da edição
      // Valor unitário: edição sem pular cursor (mostra texto bruto enquanto focado)
      focusedUnitValueKey: null,
      rawUnitValueInput: '',
    }
  },

  computed: {
    currentFile() {
      return this.parsedFiles[this.currentFileIndex] || null
    },

    currentFileProducts() {
      return this.currentFile?.products || []
    },

    /** True se houver ao menos um item adicionado manualmente (isAdded) na lista atual */
    hasAddedItems() {
      return this.currentFileProducts.some(p => p.isAdded)
    },

    /** Exibe a coluna "Fator" apenas quando o estoque/cliente tem show_factor='1'.
     *  Nem todos os estoques usam fator != 1; sem o flag o fator é sempre 1. */
    showFactorColumn() {
      const v = this.selectedClient?.show_factor
      return v === '1' || v === 1
    },

    hasNextFile() {
      return this.currentFileIndex < this.parsedFiles.length - 1
    },

    progressPercentage() {
      if (this.parsedFiles.length === 0) return 0
      return Math.round(
        ((this.currentFileIndex + 1) / this.parsedFiles.length) * 100
      )
    },

    /** Valor da NF-e para comparação: valor fixo calculado uma vez ao abrir o modal */
    nfeTotal() {
      if (!this.currentFile) return 0
      const fileKey = this.currentFile.fileName
      // Retornar valor fixo salvo, ou 0 se ainda não foi calculado
      return this.fileNfeTotals.get(fileKey) || 0
    },

    /** Soma dos valores dos itens ativos (não inutilizados): quantidade × valor unitário */
    configuredTotal() {
      const products = this.currentFileProducts || []
      return products.reduce((sum, p) => {
        if (p.inutilizado) return sum
        const qty = parseFloat(p.quantity) || 0
        const uv = parseFloat(p.unit_value) || 0
        return sum + qty * uv
      }, 0)
    },

    /** Verdadeiro quando valor configurado é igual ao valor da NF-e */
    valuesMatch() {
      const a = this.configuredTotal
      const b = this.nfeTotal
      if (a === b) return true
      return Math.abs(a - b) < 0.01
    },

    clientRequiresProducts() {
      // Se cliente tem integration = 0, NÃO exige produtos (usa dados do fornecedor)
      const requires = !(
        this.selectedClient &&
        (this.selectedClient.integration === 0 ||
          this.selectedClient.integration === '0')
      )
      console.log(`🔍 [BATCH MODAL] clientRequiresProducts():`, {
        hasSelectedClient: !!this.selectedClient,
        integrationValue: this.selectedClient?.integration,
        integrationTypeOf: typeof this.selectedClient?.integration,
        requires: requires,
      })
      return requires
    },

    // Controla a visibilidade da checkbox de crossdocking
    // Aparece apenas quando integration = 1 (no modal de configuração)
    showCrossdockCheckbox() {
      if (!this.selectedClient) {
        console.log('🔍 [CROSSDOCK CHECKBOX] selectedClient não existe')
        return false
      }

      const integrationValue = this.selectedClient?.integration
      const isIntegrationOne =
        integrationValue === 1 || integrationValue === '1'

      console.log('🔍 [CROSSDOCK CHECKBOX] Verificando:', {
        hasSelectedClient: !!this.selectedClient,
        integrationValue,
        integrationType: typeof integrationValue,
        isIntegrationOne,
      })

      // Só mostra quando integration = 1 (no modal de configuração)
      if (!isIntegrationOne) {
        console.log(
          '🔍 [CROSSDOCK CHECKBOX] Integration não é 1, ocultando checkbox'
        )
        return false
      }

      // Verificar valor de crossdocking (aceitar string ou número)
      const crossdockingValue = this.selectedClient?.crossdocking

      console.log('🔍 [CROSSDOCK CHECKBOX] Verificando crossdocking:', {
        crossdockingValue,
        crossdockingType: typeof crossdockingValue,
        isOne: crossdockingValue === '1' || crossdockingValue === 1,
        isTwo: crossdockingValue === '2' || crossdockingValue === 2,
        shouldShow:
          crossdockingValue === '1' ||
          crossdockingValue === '2' ||
          crossdockingValue === 1 ||
          crossdockingValue === 2,
      })

      // Mostrar apenas se crossdocking = 1 ou 2 (string ou número)
      const shouldShow =
        crossdockingValue === '1' ||
        crossdockingValue === '2' ||
        crossdockingValue === 1 ||
        crossdockingValue === 2
      console.log('🔍 [CROSSDOCK CHECKBOX] Resultado final:', shouldShow)
      return shouldShow
    },

    // Controla se a checkbox está desabilitada
    isCrossdockDisabled() {
      if (!this.selectedClient) return false

      const crossdockingValue = this.selectedClient?.crossdocking

      // crossdocking = 2: Checkbox bloqueada (sempre marcada) - aceitar string ou número
      return crossdockingValue === '2' || crossdockingValue === 2
    },

    canProceed() {
      // Validações básicas sempre obrigatórias
      if (!this.currentFile || !this.currentFileDate) {
        return false
      }

      // Se cliente tem integration = 0, NÃO precisa de produtos (usa códigos do fornecedor)
      if (
        this.selectedClient &&
        (this.selectedClient.integration === 0 ||
          this.selectedClient.integration === '0')
      ) {
        console.log(
          '🚫 BatchModal: Cliente com integration=0 - não exige informações de produtos',
          'Integration value:',
          this.selectedClient.integration,
          'Type:',
          typeof this.selectedClient.integration
        )
        return true // Só precisa de arquivo e data
      }

      // Se cliente tem integration = 1 (ou padrão), exige produtos com validação
      if (this.currentFileProducts.length === 0) {
        return false
      }

      // Verificar se todos os produtos (não inutilizados) têm os campos obrigatórios preenchidos
      for (const product of this.currentFileProducts) {
        if (product.inutilizado) continue
        // Se o produto usa dados do fornecedor, não precisa validar os campos editáveis (exceto itens adicionados)
        if (product.useSupplierData && !product.isAdded) {
          continue
        }

        // Se não usa dados do fornecedor (ou é item adicionado), os campos client_code e client_description são obrigatórios
        if (!product.client_code || !product.client_code.trim()) {
          return false
        }
        if (!product.client_description || !product.client_description.trim()) {
          return false
        }
      }

      return true
    },

    currentFileDate: {
      get() {
        if (!this.currentFile) return ''
        const fileKey = this.currentFile.fileName
        return this.fileDates.get(fileKey) || ''
      },
      set(value) {
        if (this.currentFile) {
          const fileKey = this.currentFile.fileName
          this.fileDates.set(fileKey, value)
        }
      },
    },

    currentFilePrevision: {
      get() {
        if (!this.currentFile) return false
        const fileKey = this.currentFile.fileName
        return this.filePrevisions.get(fileKey) || false
      },
      set(value) {
        if (this.currentFile) {
          const fileKey = this.currentFile.fileName
          this.filePrevisions.set(fileKey, value)
        }
      },
    },

    currentFileCrossdock: {
      get() {
        if (!this.currentFile) return false
        const fileKey = this.currentFile.fileName
        return this.fileCrossdocks.get(fileKey) || false
      },
      set(value) {
        if (this.currentFile) {
          const fileKey = this.currentFile.fileName
          this.fileCrossdocks.set(fileKey, value)
        }
      },
    },

    minDate() {
      // Data mínima baseada no level_access do usuário:
      // - level_access = 1 (Client): apenas amanhã ou datas futuras
      // - level_access != 1 (Dev, Admin, Manager, Lobby): hoje ou datas futuras
      const currentUser = this.getCurrentUser
        ? this.getCurrentUser()
        : window.apiClient
          ? window.apiClient.getCurrentUser()
          : null
      const userLevel = currentUser?.level_access

      const referenceDate = new Date()

      if (userLevel === 1) {
        // Usuários nível 1 (Client): data mínima = amanhã
        referenceDate.setDate(referenceDate.getDate() + 1)
      }
      // Outros níveis: data mínima = hoje (data atual)

      return referenceDate.toISOString().split('T')[0]
    },
  },

  watch: {
    showModal: {
      handler(newVal) {
        if (newVal) this.$lockBodyScrollForModal?.()
        else {
          this.$unlockBodyScrollForModal?.()
          this.focusedUnitValueKey = null
          this.rawUnitValueInput = ''
        }
        if (newVal && this.parsedFiles.length > 0) {
          this.currentFileIndex = 0
          this.completedFiles = 0
          this.processedSchedules = []
          this.sessionProductCache.clear() // Limpar cache ao iniciar nova sessão
          this.fileDates.clear() // Limpar datas dos arquivos
          this.filePrevisions.clear() // Limpar previsões dos arquivos
          this.fileCrossdocks.clear() // Limpar crossdocks dos arquivos
          this.fileNfeTotals.clear() // Limpar valores fixos das NF-es
          this.initializeFileDates() // Inicializar datas, previsões e crossdocks
          console.log(
            '🆕 Nova sessão de agendamento em lote iniciada - cache limpo'
          )
          this.loadProductsForCurrentFile()
          // Limpar dados de colagem
          this.resetPasteData()
        }
      },
      immediate: true,
    },

    selectedClient: {
      handler(newClient) {
        console.log('🔍 [CROSSDOCK WATCHER] selectedClient alterado:', {
          hasClient: !!newClient,
          crossdocking: newClient?.crossdocking,
          crossdockingType: typeof newClient?.crossdocking,
          integration: newClient?.integration,
        })
        if (newClient && this.parsedFiles.length > 0) {
          // Aplicar lógica de crossdocking quando cliente é selecionado
          const crossdockingValue = newClient.crossdocking
          if (crossdockingValue === '2' || crossdockingValue === 2) {
            // crossdocking = 2: Marcar todos os arquivos como crossdock
            console.log(
              '🔍 [CROSSDOCK WATCHER] crossdocking = 2, marcando todos como crossdock'
            )
            this.parsedFiles.forEach(file => {
              const fileKey = file.fileName
              this.fileCrossdocks.set(fileKey, true)
            })
          } else if (crossdockingValue !== '1' && crossdockingValue !== 1) {
            // crossdocking diferente de 1 e 2: Resetar todos
            console.log(
              '🔍 [CROSSDOCK WATCHER] crossdocking diferente de 1 e 2, resetando'
            )
            this.parsedFiles.forEach(file => {
              const fileKey = file.fileName
              this.fileCrossdocks.set(fileKey, false)
            })
          } else {
            console.log(
              '🔍 [CROSSDOCK WATCHER] crossdocking = 1, mantendo valores atuais'
            )
          }
        }
      },
      immediate: true,
    },

    currentFileIndex: {
      handler() {
        this.focusedUnitValueKey = null
        this.rawUnitValueInput = ''
        if (this.showModal) {
          this.loadProductsForCurrentFile()
        }
      },
    },

    pasteData: {
      handler(newVal) {
        this.generatePastePreview(newVal)
      },
    },

    currentFileProducts: {
      handler(newProducts) {
        // Salvar valores originais quando produtos são carregados pela primeira vez
        if (newProducts && newProducts.length > 0) {
          newProducts.forEach(product => {
            // Salvar valor unitário e quantidade originais apenas se ainda não foram salvos e produto não foi adicionado manualmente
            if (!product.isAdded && product.original_unit_value === undefined) {
              const originalValue = parseFloat(product.unit_value) || 0
              product.original_unit_value = originalValue
              product.original_quantity = parseFloat(product.quantity) || 0
              console.log(
                `💾 [ORIGINAL VALUE] Salvo valor original para ${product.supplier_code}: ${originalValue} (qty: ${product.original_quantity})`
              )
            }
            // Salvar valores originais de client_code e client_description se ainda não foram salvos
            if (!product.isAdded && product.originalClientCode === undefined) {
              product.originalClientCode = product.client_code || ''
            }
            if (
              !product.isAdded &&
              product.originalClientDescription === undefined
            ) {
              product.originalClientDescription =
                product.client_description || ''
            }
          })
        }
      },
      immediate: true,
    },
  },

  beforeUnmount() {
    this.$unlockBodyScrollForModal?.()
  },

  methods: {
    initializeFileDates() {
      // Aplicar lógica de crossdocking baseada no valor da coluna crossdocking do cliente
      const crossdockingValue = this.selectedClient?.crossdocking
      const defaultCrossdock =
        crossdockingValue === '2' || crossdockingValue === 2 ? true : false

      console.log('🔍 [INIT FILE DATES] Inicializando datas:', {
        crossdockingValue,
        crossdockingType: typeof crossdockingValue,
        defaultCrossdock,
      })

      // Inicializar todas as datas como vazias, previsões e crossdocks conforme lógica
      for (let i = 0; i < this.parsedFiles.length; i++) {
        const fileKey = this.parsedFiles[i].fileName
        this.fileDates.set(fileKey, '')
        this.filePrevisions.set(fileKey, false)
        // Se crossdocking = 2, sempre marcar como true
        this.fileCrossdocks.set(fileKey, defaultCrossdock)
      }
    },

    updateFileDate() {
      // Este método é chamado quando o usuário altera a data
      // A lógica já está no computed setter
      console.log(
        `📅 Data da NFe ${this.currentFile?.nfeData?.number} atualizada para: ${this.currentFileDate}`
      )
    },

    updateFilePrevision() {
      // Este método é chamado quando o usuário altera a checkbox de previsão
      // A lógica já está no computed setter
      console.log(
        `🔮 Previsão da NFe ${this.currentFile?.nfeData?.number} atualizada para: ${this.currentFilePrevision}`
      )
    },

    updateFileCrossdock() {
      // Este método é chamado quando o usuário altera a checkbox de crossdock
      // A lógica já está no computed setter
      console.log(
        `📦 Crossdock da NFe ${this.currentFile?.nfeData?.number} atualizada para: ${this.currentFileCrossdock}`
      )
    },

    setDateForNextFile() {
      // Preencher data e previsão da próxima NFe com os valores atuais
      if (this.hasNextFile && this.currentFileDate) {
        const nextFileIndex = this.currentFileIndex + 1
        const nextFileKey = this.parsedFiles[nextFileIndex].fileName

        // Se a próxima NFe ainda não tem data, usar a data atual
        if (!this.fileDates.get(nextFileKey)) {
          this.fileDates.set(nextFileKey, this.currentFileDate)
          console.log(
            `📅 Data da próxima NFe pré-preenchida: ${this.currentFileDate}`
          )
        }

        // Copiar também o estado de previsão
        if (!this.filePrevisions.has(nextFileKey)) {
          this.filePrevisions.set(nextFileKey, this.currentFilePrevision)
          console.log(
            `🔮 Previsão da próxima NFe pré-preenchida: ${this.currentFilePrevision}`
          )
        }

        // Copiar também o estado de crossdock
        if (!this.fileCrossdocks.has(nextFileKey)) {
          this.fileCrossdocks.set(nextFileKey, this.currentFileCrossdock)
          console.log(
            `📦 Crossdock da próxima NFe pré-preenchido: ${this.currentFileCrossdock}`
          )
        }
      }
    },

    async loadProductsForCurrentFile() {
      if (!this.currentFile || !this.selectedClient) return

      console.log(
        `📄 Carregando produtos para NFe ${this.currentFile.nfeData.number} (${this.currentFileIndex + 1}/${this.parsedFiles.length})`
      )
      console.log(
        `💾 Cache da sessão atual: ${this.sessionProductCache.size} produtos`
      )

      this.loading = true
      this.loadingText = 'Verificando produtos cadastrados...'

      try {
        // Aplicar pré-preenchimento para produtos já cadastrados
        await this.checkExistingProducts()

        // Calcular e salvar valor fixo da NF-e após produtos serem carregados
        this.calculateAndSaveNfeTotal()

        this.updateSelectAllState()
      } catch (error) {
        console.error('Erro ao carregar produtos:', error)
      } finally {
        this.loading = false
        this.loadingText = ''
      }
    },

    /** Calcula e salva o valor fixo da NF-e baseado nos valores originais dos produtos */
    calculateAndSaveNfeTotal() {
      if (!this.currentFile || !this.currentFileProducts.length) return

      const fileKey = this.currentFile.fileName

      // Só calcular se ainda não foi calculado para este arquivo
      if (this.fileNfeTotals.has(fileKey)) {
        console.log(
          `💰 [NFE TOTAL] Valor já existe para ${fileKey}: ${this.fileNfeTotals.get(fileKey)}`
        )
        return
      }

      // Calcular usando os valores originais dos produtos (do XML)
      const nfeTotalValue = this.currentFileProducts
        .filter(p => !p.isAdded)
        .reduce((sum, p) => {
          const qty = parseFloat(p.quantity) || 0
          // Usar valor original se disponível, senão usar o valor atual (primeira vez que carrega)
          const uv =
            parseFloat(
              p.original_unit_value !== undefined
                ? p.original_unit_value
                : p.unit_value
            ) || 0
          return sum + qty * uv
        }, 0)

      this.fileNfeTotals.set(fileKey, nfeTotalValue)
      console.log(
        `💰 [NFE TOTAL] Valor fixo da NF-e calculado e salvo para ${fileKey}: ${nfeTotalValue}`
      )
    },

    async checkExistingProducts() {
      if (!this.currentFileProducts.length || !this.selectedClient) return

      // Garantir factor=1, unit e inutilizado em todos os produtos ao carregar
      // E salvar o valor unitário original para cálculo do valor da NF-e
      this.currentFileProducts.forEach(product => {
        if (product.factor == null || product.factor === '') product.factor = 1
        if (!product.unit) product.unit = 'UN'
        if (product.inutilizado == null) product.inutilizado = false
        // Salvar valor unitário e quantidade originais se ainda não foram salvos (apenas para produtos originais da NF-e)
        if (!product.isAdded && product.original_unit_value === undefined) {
          product.original_unit_value = parseFloat(product.unit_value) || 0
          product.original_quantity = parseFloat(product.quantity) || 0
        }
      })

      try {
        console.log(
          '🔍 Buscando pré-preenchimento para produtos da NFe:',
          this.currentFile.nfeData.number
        )

        const token = localStorage.getItem('token')

        // Preparar dados para a API de pré-preenchimento
        const productsToCheck = this.currentFileProducts.map(product => ({
          supp_code: product.supplier_code || product.code,
          supp_cnpj: this.currentFile.nfeData.supplier_cnpj,
        }))

        // Chamar API de pré-preenchimento em lote
        const response = await this.$http.post(
          '/products/batch-prefill',
          {
            products: productsToCheck,
            cliCnpj: this.selectedClient.cnpj.replace(/[^\d]/g, ''),
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!response.data.success) {
          console.error(
            'Erro ao buscar pré-preenchimento:',
            response.data.message
          )
          return
        }

        console.log(
          `📊 Pré-preenchimento: ${response.data.summary.found} de ${response.data.summary.total} produtos encontrados`
        )

        // Aplicar pré-preenchimento nos produtos
        response.data.data.forEach((prefillResult, index) => {
          const product = this.currentFileProducts[index]
          const productKey = `${product.supplier_code}_${this.currentFile.nfeData.supplier_cnpj}`

          // Primeiro, verificar se o produto foi configurado na sessão atual
          if (this.sessionProductCache.has(productKey)) {
            const sessionData = this.sessionProductCache.get(productKey)
            console.log(
              `🎯 Pré-preenchendo com dados da sessão: ${product.supplier_code}`
            )

            product.client_code = sessionData.client_code
            product.client_description = sessionData.client_description
            product.factor = sessionData.factor || 1
            product.ean_code = sessionData.ean_code || ''
            product.useSupplierData = sessionData.useSupplierData || false
            // Produtos da sessão não ficam bloqueados (já foram configurados pelo usuário)
            product.wasLocked = sessionData.wasLocked || false
            product.wasModified = sessionData.wasModified || false
            product.originalClientCode =
              sessionData.originalClientCode || sessionData.client_code
            product.originalClientDescription =
              sessionData.originalClientDescription ||
              sessionData.client_description
            product.isLocked = false
          } else if (prefillResult.has_data && prefillResult.prefill_data) {
            const prefillData = prefillResult.prefill_data

            console.log(
              `✅ Pré-preenchendo com dados do banco: ${prefillData.supp_code}`
            )

            // Pré-preencher campos editáveis
            product.client_code = prefillData.cli_code
            product.client_description = prefillData.cli_desc
            // Fator: auto-preenche com o último valor salvo (latest_into_case),
            // igual ao código/descrição. Default 1 quando ausente.
            product.factor =
              prefillData.latest_into_case != null &&
              Number(prefillData.latest_into_case) > 0
                ? Number(prefillData.latest_into_case)
                : 1

            // Salvar dados originais para comparação posterior
            product.originalClientCode = prefillData.cli_code || ''
            product.originalClientDescription = prefillData.cli_desc || ''
            // Marcar se estava bloqueado (is_locked pode ser true, false ou undefined)
            product.wasLocked =
              prefillData.is_locked === true ||
              prefillData.is_locked === 'true' ||
              prefillData.is_locked === 1
            product.wasModified = false // Flag para rastrear se foi modificado pelo usuário
            product.productId = prefillData.product_id || null // ID do produto no banco se existir

            // Não bloquear mais - permitir edição com confirmação
            product.isLocked = false

            console.log(
              `📝 [PRODUCT] Produto ${prefillData.supp_code} configurado:`,
              {
                wasLocked: product.wasLocked,
                originalClientCode: product.originalClientCode,
                originalClientDescription: product.originalClientDescription,
                is_locked_from_api: prefillData.is_locked,
              }
            )

            if (product.wasLocked) {
              console.log(
                `🔓 Produto ${prefillData.supp_code} pode ser editado com confirmação (wasLocked=true)`
              )
            }
          } else {
            console.log(`❌ Produto não encontrado - definindo valores padrão`)

            // Produto não encontrado - definir valores padrão
            product.isLocked = false
            product.wasLocked = false
            product.wasModified = false
            // Salvar valores originais de client_code e client_description se ainda não foram salvos
            if (product.originalClientCode === undefined) {
              product.originalClientCode = product.client_code || ''
            }
            if (product.originalClientDescription === undefined) {
              product.originalClientDescription =
                product.client_description || ''
            }
            product.factor = 1
            if (!product.unit) product.unit = 'UN'
            product.client_code = ''
            product.client_description = ''
          }
        })

        // Garantir factor=1 e unit em todos os produtos
        this.currentFileProducts.forEach(product => {
          if (product.factor == null || product.factor === '')
            product.factor = 1
          if (!product.unit) product.unit = 'UN'
          if (product.inutilizado == null) product.inutilizado = false
        })

        // Forçar atualização da interface
        this.$forceUpdate()
      } catch (error) {
        console.error('❌ Erro ao aplicar pré-preenchimento:', error)

        // Em caso de erro, definir valores padrão para todos os produtos
        this.currentFileProducts.forEach(product => {
          product.isLocked = false
          product.factor = 1
          if (!product.unit) product.unit = 'UN'
          product.client_code = ''
          product.client_description = ''
        })

        this.$forceUpdate()
      }
    },

    toggleProductSupplierData(product) {
      if (product.useSupplierData) {
        // Quando marcado, limpar apenas os campos de Cód. Venda e Descrição Venda
        // Os outros campos (quantidade, embalagem, valor unitário, código EAN) não são alterados
        product.client_code = ''
        product.client_description = ''

        // Remover do cache da sessão se estava lá
        const productKey = `${product.supplier_code}_${this.currentFile.nfeData.supplier_cnpj}`
        if (this.sessionProductCache.has(productKey)) {
          this.sessionProductCache.delete(productKey)
          console.log(
            `🗑️ Produto removido do cache (usando dados do fornecedor): ${product.supplier_code}`
          )
        }
      } else {
        // Quando desmarcado, restaurar apenas Cód. Venda e Descrição Venda se houver valores originais salvos
        // Os outros campos (quantidade, embalagem, valor unitário, código EAN) mantêm seus valores atuais
        if (product.originalClientCode !== undefined) {
          product.client_code = product.originalClientCode || ''
        }
        if (product.originalClientDescription !== undefined) {
          product.client_description = product.originalClientDescription || ''
        }
      }
      this.updateProduct(product)
      this.updateSelectAllState()
    },

    toggleAllProducts() {
      const newState = this.selectAllProducts
      this.currentFileProducts.forEach(product => {
        if (product.inutilizado) return
        if (!product.isLocked) {
          product.useSupplierData = newState
          if (newState && !product.isAdded) {
            // Quando marcado, limpar apenas Cód. Venda e Descrição Venda
            product.client_code = ''
            product.client_description = ''
          } else if (!newState && !product.isAdded) {
            // Quando desmarcado, restaurar apenas Cód. Venda e Descrição Venda se houver valores originais
            // Os outros campos mantêm seus valores atuais
            if (product.originalClientCode !== undefined) {
              product.client_code = product.originalClientCode || ''
            }
            if (product.originalClientDescription !== undefined) {
              product.client_description =
                product.originalClientDescription || ''
            }
          }
        }
      })
      this.$forceUpdate()
    },

    updateSelectAllState() {
      const selectable = this.currentFileProducts.filter(p => !p.inutilizado)
      const selectedCount = selectable.filter(p => p.useSupplierData).length

      if (selectedCount === 0) {
        this.selectAllProducts = false
      } else if (selectedCount === selectable.length) {
        this.selectAllProducts = true
      } else {
        this.selectAllProducts = false
      }
    },

    /** Adiciona um item extra à lista (fora da NF-e); código/descrição fornecedor = "—" */
    addProduct() {
      if (!this.currentFile || !Array.isArray(this.currentFile.products)) return
      const products = this.currentFile.products
      const newId = `added-${Date.now()}-${products.length}`
      products.push({
        id: newId,
        isAdded: true,
        supplier_code: '—',
        supplier_description: '—',
        client_code: '',
        client_description: '',
        quantity: 1,
        unit: 'UN',
        unit_value: '',
        ean_code: '',
        useSupplierData: false,
        inutilizado: false,
      })
      this.$forceUpdate()
    },

    /** Inutilizar (original: linha cinza, fora do total) ou remover (item adicionado) */
    removeOrInutilize(product) {
      if (product.isAdded) {
        const idx = this.currentFileProducts.indexOf(product)
        if (idx !== -1) this.currentFile.products.splice(idx, 1)
      } else {
        product.inutilizado = true
      }
      this.updateSelectAllState()
      this.$forceUpdate()
    },

    /** Desfazer inutilização de item original – volta a contar no valor da NF-e */
    undoInutilize(product) {
      if (product.isAdded) return
      product.inutilizado = false
      this.updateSelectAllState()
      this.$forceUpdate()
    },

    /**
     * Chamado ao alterar a quantidade de um produto.
     * Se não houver itens adicionados manualmente, recalcula o valor unitário
     * mantendo o valor total original do produto (original_unit_value × original_quantity).
     */
    onQuantityChange(product) {
      if (!product.isAdded && !this.hasAddedItems) {
        const origUv  = product.original_unit_value
        const origQty = product.original_quantity
        const newQty  = parseFloat(product.quantity) || 0

        if (origUv != null && origQty > 0 && newQty > 0) {
          const totalValue = origUv * origQty
          product.unit_value = Math.round((totalValue / newQty) * 100) / 100
        }
      }
      this.updateProduct(product)
    },

    updateProduct(product) {
      // Forçar reatividade do Vue
      this.$forceUpdate()

      // Não salvar itens adicionados no cache da sessão
      if (product.isAdded) return

      // Salvar em tempo real no cache da sessão se o produto estiver configurado
      if (
        product.client_code &&
        product.client_code.trim() &&
        product.client_description &&
        product.client_description.trim()
      ) {
        const productKey = `${product.supplier_code}_${this.currentFile.nfeData.supplier_cnpj}`
        const productData = {
          client_code: product.client_code,
          client_description: product.client_description,
          factor: product.factor || 1,
          ean_code: product.ean_code || '',
          useSupplierData: product.useSupplierData || false,
          savedAt: new Date().toISOString(),
        }

        this.sessionProductCache.set(productKey, productData)
        console.log(
          `🔄 Cache atualizado em tempo real: ${product.supplier_code} → ${product.client_code}`
        )
      }
    },

    /** Valida se todos os produtos ativos (não inutilizados) têm valor unitário > 0. */
    validateProductValues() {
      const invalidProducts = []

      for (const product of this.currentFileProducts) {
        // Ignorar produtos inutilizados
        if (product.inutilizado) continue

        const unitValue = parseFloat(product.unit_value) || 0

        if (unitValue <= 0) {
          invalidProducts.push({
            code: product.client_code || product.code || 'Sem código',
            description:
              product.client_description ||
              product.description ||
              'Sem descrição',
          })
        }
      }

      return {
        valid: invalidProducts.length === 0,
        invalidProducts,
      }
    },

    /** Exibe alerta sobre produtos com valor zerado, mantendo o usuário na tela para correção. */
    showValueZeroAlert(invalidProducts) {
      const productsList = invalidProducts
        .map((p, idx) => `${idx + 1}. ${p.code} - ${p.description}`)
        .join('\n')

      alert(
        `⚠️ Não é possível prosseguir com produtos de valor zerado\n\n` +
          `Os seguintes produtos estão com valor unitário zerado ou inválido:\n\n` +
          `${productsList}\n\n` +
          `Por favor, corrija os valores antes de continuar.`
      )
    },

    async nextFile() {
      if (!this.canProceed) return

      // Validar valores unitários antes de prosseguir
      const validation = this.validateProductValues()
      if (!validation.valid) {
        this.showValueZeroAlert(validation.invalidProducts)
        return
      }

      // Pré-preencher data da próxima NFe
      this.setDateForNextFile()

      // Salvar arquivo atual
      await this.saveCurrentFile()

      // Avançar para próximo arquivo
      this.currentFileIndex++
    },

    async previousFile() {
      if (this.currentFileIndex > 0) {
        // CORREÇÃO: Se o arquivo atual foi modificado mas não salvo, salvá-lo antes de retroceder
        // Isso evita perda de dados quando o usuário navega entre arquivos
        const currentFileAlreadyProcessed = this.processedSchedules.some(
          schedule => schedule.fileName === this.currentFile?.fileName
        )

        if (
          this.currentFile &&
          !currentFileAlreadyProcessed &&
          this.canProceed
        ) {
          console.log(
            `💾 Salvando arquivo atual antes de retroceder: ${this.currentFile.fileName}`
          )
          await this.saveCurrentFile()
        }

        this.currentFileIndex--
      }
    },

    saveProductsToSessionCache() {
      // Salvar produtos configurados no cache da sessão para usar em próximas notas (não incluir itens adicionados)
      this.currentFileProducts.forEach(product => {
        if (product.isAdded) return
        const productKey = `${product.supplier_code}_${this.currentFile.nfeData.supplier_cnpj}`

        // Só salva se o produto foi efetivamente configurado (tem código do cliente)
        if (product.client_code && product.client_code.trim()) {
          const productData = {
            client_code: product.client_code,
            client_description: product.client_description,
            factor: product.factor || 1,
            ean_code: product.ean_code || '',
            useSupplierData: product.useSupplierData || false,
            savedAt: new Date().toISOString(),
          }

          this.sessionProductCache.set(productKey, productData)
          console.log(
            `💾 Produto salvo no cache da sessão: ${product.supplier_code} → ${product.client_code}`
          )
        }
      })
    },

    async saveCurrentFile() {
      if (!this.canProceed) {
        console.warn(
          `⚠️ Tentativa de salvar arquivo ${this.currentFile?.fileName || 'desconhecido'} rejeitada - dados incompletos`
        )
        return
      }

      console.log(
        `💾 [SAVE] Iniciando salvamento de ${this.currentFile.fileName} (NFe ${this.currentFile.nfeData.number})`
      )

      // Verificar se já foi processado
      const alreadyProcessed = this.processedSchedules.some(
        schedule => schedule.fileName === this.currentFile.fileName
      )

      if (alreadyProcessed) {
        console.log(
          `⚠️ [SAVE] Arquivo ${this.currentFile.fileName} já foi processado, pulando...`
        )
        return
      }

      // Salvar produtos no cache da sessão primeiro
      this.saveProductsToSessionCache()

      this.loading = true
      this.loadingText = `Salvando NFe ${this.currentFile.nfeData.number}...`

      try {
        const currentUser = this.getCurrentUser()
        const token = localStorage.getItem('token')

        if (!token) {
          throw new Error('Token de autenticação não encontrado')
        }

        // VALIDAÇÃO: Verificar se a data do agendamento é válida (deve ser no mínimo amanhã)
        // Exceções:
        // - Previsões podem ter qualquer data
        // - Usuários com level_access !== 1 podem agendar para qualquer data
        const userLevel = currentUser?.level_access
        const requiresFutureDateValidation = userLevel === 1 // Apenas level 1 precisa validação

        if (
          this.currentFileDate &&
          !this.currentFilePrevision &&
          requiresFutureDateValidation
        ) {
          // Parse manual da data para evitar problemas de timezone
          const [year, month, day] = this.currentFileDate.split('-').map(Number)
          const scheduleDate = new Date(year, month - 1, day) // month é 0-indexed

          const today = new Date()
          today.setHours(0, 0, 0, 0) // Zerar horas para comparação apenas de data

          console.log('📅 Validação de data (level_access = 1):')
          console.log(
            '   Data do agendamento:',
            this.currentFileDate,
            '→',
            scheduleDate
          )
          console.log('   Data de hoje:', today)
          console.log(
            '   Comparação (scheduleDate <= today):',
            scheduleDate <= today
          )

          if (scheduleDate <= today) {
            this.loading = false
            this.loadingText = ''
            alert(
              '⚠️ Data inválida!\n\n' +
                'Os agendamentos devem ser feitos com antecedência mínima de 24 horas.\n\n' +
                'Por favor, corrija a data e tente novamente.'
            )
            throw new Error('DATA_VALIDATION_ERROR') // Lança erro para interromper fluxo
          }
        } else if (
          this.currentFileDate &&
          !this.currentFilePrevision &&
          !requiresFutureDateValidation
        ) {
          console.log(
            `📅 Validação de data: Bypass para level_access !== 1 (level = ${userLevel})`
          )
        }

        const clientCnpj = this.selectedClient.cnpj.replace(/[^\d]/g, '')
        let supplier =
          this.currentFile.nfeData.supplier_name ||
          this.currentFile.nfeData.supplier_cnpj ||
          ''

        if (supplier.length > 50) {
          supplier = supplier.substring(0, 50)
        }

        // Obter XML do arquivo processado (se disponível)
        const xmlContent = this.currentFile.xmlContent || null

        const scheduleData = {
          number: String(this.currentFile.nfeData.number || '').trim(),
          nfe_key: this.currentFile.nfeData.nfe_key,
          client: clientCnpj,
          case_count: parseInt(this.currentFile.nfeData.case_count) || 0,
          date: this.currentFileDate,
          prevision: this.currentFilePrevision ? '1' : null, // Marca se é previsão
          crossdock: this.currentFileCrossdock ? 1 : 0, // Marca se é crossdock (1 ou 0)
          status: 'Solicitado',
          supplier: supplier,
          qt_prod:
            parseInt(this.currentFile.nfeData.qt_prod) ||
            this.currentFileProducts.length,
          info: this.buildInfoObject(),
          is_booking: 0, // Agendamento normal (0 = efetivado)
          xml: xmlContent, // Incluir XML cru na coluna 'xml'
        }

        // Log para debug do XML
        console.log(`📄 [BATCH-MODAL] XML no scheduleData:`, {
          hasXml: !!xmlContent,
          xmlLength: xmlContent ? xmlContent.length : 0,
          xmlPreview: xmlContent ? xmlContent.substring(0, 100) + '...' : null,
        })

        console.log(
          `📦 Salvando agendamento NFe ${this.currentFile.nfeData.number}:`,
          scheduleData
        )

        // Determinar se este é o primeiro arquivo em modo de efetivação
        const isFirstFileInEffectivation =
          this.isEffectivating &&
          this.currentFileIndex === 0 &&
          this.processedSchedules.length === 0
        let response
        let newScheduleId

        if (isFirstFileInEffectivation) {
          // EFETIVAÇÃO: Usar PUT para atualizar o agendamento prévio
          const bookingId = this.bookingToEffectivate.id
          console.log(
            `⬆️ [EFFECTIVATION] Efetivando agendamento #${bookingId} com NFe ${this.currentFile.nfeData.number}`
          )

          // Construir histórico de efetivação
          const now = new Date().toISOString()

          // Histórico existente do agendamento prévio
          let existingHistoric = {}
          if (this.bookingToEffectivate?.historic) {
            try {
              existingHistoric =
                typeof this.bookingToEffectivate.historic === 'string'
                  ? JSON.parse(this.bookingToEffectivate.historic)
                  : this.bookingToEffectivate.historic
            } catch (error) {
              console.warn('⚠️ Erro ao parsear histórico existente:', error)
              existingHistoric = {}
            }
          }

          // Adicionar nova entrada de efetivação ao histórico
          scheduleData.historic = {
            ...existingHistoric,
            [`effectivated_${Date.now()}`]: {
              timestamp: now,
              user: currentUser?.user || 'Sistema',
              action:
                this.bookingToEffectivate.is_booking === 1
                  ? 'Agendamento prévio efetivado'
                  : 'Não agendado efetivado',
              comment: `${this.bookingToEffectivate.is_booking === 1 ? 'Agendamento prévio' : 'Não agendado'} convertido em agendamento completo com NFe ${this.currentFile.nfeData.number}. Produtos configurados: ${this.currentFileProducts.length}.`,
              details: {
                original_booking_id: this.bookingToEffectivate.id,
                original_is_booking: this.bookingToEffectivate.is_booking,
                nfe_key: this.currentFile.nfeData.nfe_key,
                nfe_number: this.currentFile.nfeData.number,
                supplier: supplier,
                products_count: this.currentFileProducts.length,
                status_changed_from:
                  this.bookingToEffectivate.status || 'Solicitado',
                status_changed_to: 'Solicitado',
                xml_processed: true,
                effectivated_at: now,
              },
            },
          }

          console.log(
            `📝 [EFFECTIVATION] Histórico construído:`,
            scheduleData.historic
          )

          response = await this.$http.put(
            `/schedules/${bookingId}`,
            scheduleData,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          )

          newScheduleId = bookingId
          console.log(
            `✅ [EFFECTIVATION] Agendamento #${bookingId} efetivado com sucesso!`
          )

          // Emitir evento de efetivação completa
          this.$emit('effectivation-completed', {
            bookingId: bookingId,
            scheduleData: response.data,
          })
          console.log(
            '📡 Evento effectivation-completed emitido do BatchProductsModal'
          )
        } else {
          // CRIAÇÃO NORMAL: Usar POST para criar novo agendamento
          response = await this.$http.post('/schedules', scheduleData, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          })

          newScheduleId = response.data.id || response.data.schedule?.id
          console.log(`✅ Agendamento salvo! ID: ${newScheduleId}`)
        }

        // Salvar produtos no banco automaticamente
        await this.saveProductsToDatabase(newScheduleId)

        this.processedSchedules.push({
          fileName: this.currentFile.fileName,
          scheduleId: newScheduleId,
          nfeNumber: this.currentFile.nfeData.number,
          products: this.processProductsForSubmission(),
        })

        this.completedFiles++

        console.log(
          `✅ [SAVE] Arquivo ${this.currentFile.fileName} salvo com sucesso! ID: ${newScheduleId}`
        )
        console.log(
          `📊 [SAVE] Progresso: ${this.completedFiles}/${this.parsedFiles.length} arquivos processados`
        )
      } catch (error) {
        console.error('Erro ao salvar NFe:', error)

        // Se erro 409, significa que já foi criado (pode ter acontecido em tentativa anterior)
        if (error.response?.status === 409) {
          console.log('⚠️ NFe já foi processada anteriormente, continuando...')

          // Tentar extrair ID do agendamento da mensagem de erro se disponível
          const errorMsg = error.response?.data?.message || ''
          const idMatch = errorMsg.match(/ID:\s*(\d+)/)
          const existingId = idMatch ? parseInt(idMatch[1]) : null

          if (existingId) {
            console.log(`📝 Usando ID existente: ${existingId}`)

            // Salvar produtos no banco mesmo assim
            try {
              await this.saveProductsToDatabase(existingId)
            } catch (productError) {
              console.error('Erro ao salvar produtos:', productError)
            }

            this.processedSchedules.push({
              fileName: this.currentFile.fileName,
              scheduleId: existingId,
              nfeNumber: this.currentFile.nfeData.number,
              products: this.processProductsForSubmission(),
            })

            this.completedFiles++

            console.log(
              `✅ [SAVE] Arquivo ${this.currentFile.fileName} recuperado com ID existente: ${existingId}`
            )
            console.log(
              `📊 [SAVE] Progresso: ${this.completedFiles}/${this.parsedFiles.length} arquivos processados`
            )
          } else {
            throw new Error(
              'NFe duplicada mas não foi possível obter ID do agendamento existente'
            )
          }
        } else {
          throw error
        }
      } finally {
        this.loading = false
        this.loadingText = ''
      }
    },

    async saveProductsToDatabase(scheduleId) {
      const startTime = Date.now()

      try {
        this.loadingText = 'Salvando produtos otimizado no banco...'

        const products = this.processProductsForSubmission()
        console.log(
          `⚡ Salvando ${products.length} produtos para NFe ${this.currentFile.nfeData.number}...`
        )

        const token = localStorage.getItem('token')

        // OTIMIZAÇÃO: Request otimizado com timeout reduzido
        const response = await this.$http.post(
          '/products/batch-save',
          {
            scheduleId: scheduleId,
            products: products,
            clientCnpj: this.selectedClient.cnpj.replace(/[^\d]/g, ''),
            supplierCnpj: this.currentFile.nfeData.supplier_cnpj,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            timeout: 30000, // 30 segundos timeout (reduzido de default)
          }
        )

        const endTime = Date.now()
        const duration = endTime - startTime

        if (response.data.success) {
          const stats = response.data.data.stats
          console.log(
            `🚀 Produtos salvos otimizados para NFe ${this.currentFile.nfeData.number}:`
          )
          console.log(
            `   ✨ ${stats.created} criados, 📝 ${stats.updated} atualizados`
          )
          console.log(
            `   ⚡ Tempo: ${duration}ms (Backend: ${response.data.data.stats.performance?.duration_ms || 'N/A'}ms)`
          )
          console.log(
            `   📈 Performance: ${response.data.data.stats.performance?.products_per_second || 'N/A'} produtos/seg`
          )
        }
      } catch (error) {
        const endTime = Date.now()
        const duration = endTime - startTime

        console.error(
          `❌ Erro ao salvar produtos no banco (${duration}ms):`,
          error
        )

        // Não re-throw - o agendamento já foi criado
        // Mas log detalhado do erro para debugging
        if (error.code === 'ECONNABORTED') {
          console.error('⏰ Timeout na operação de salvamento de produtos')
        } else if (error.response) {
          console.error(
            '📡 Erro HTTP:',
            error.response.status,
            error.response.data?.error
          )
        }
      }
    },

    async finalizeBatch() {
      const startTime = Date.now()

      try {
        // Validar valores unitários antes de finalizar
        const validation = this.validateProductValues()
        if (!validation.valid) {
          this.showValueZeroAlert(validation.invalidProducts)
          return
        }

        console.log('🏁 Iniciando finalização otimizada do lote...')
        console.log(
          `📊 Estado atual: ${this.completedFiles} de ${this.parsedFiles.length} arquivos processados`
        )

        // CORREÇÃO: Verificar se o arquivo atual precisa ser salvo, independente do contador
        // Isso garante que todos os arquivos sejam processados mesmo se o usuário navegou usando "Anterior"
        const currentFileAlreadyProcessed = this.processedSchedules.some(
          schedule => schedule.fileName === this.currentFile?.fileName
        )

        if (
          this.currentFile &&
          !currentFileAlreadyProcessed &&
          this.canProceed
        ) {
          console.log(
            `💾 Salvando arquivo atual que ainda não foi processado: ${this.currentFile.fileName}`
          )
          await this.saveCurrentFile()
        }

        // SEGURANÇA: Processar todos os arquivos que ainda não foram salvos
        for (let i = 0; i < this.parsedFiles.length; i++) {
          const file = this.parsedFiles[i]
          const alreadyProcessed = this.processedSchedules.some(
            schedule => schedule.fileName === file.fileName
          )

          if (!alreadyProcessed) {
            console.log(
              `🔄 Processando arquivo pendente: ${file.fileName} (índice ${i})`
            )

            // Temporariamente mudar para este arquivo
            const originalIndex = this.currentFileIndex
            this.currentFileIndex = i

            // Verificar se pode prosseguir com este arquivo
            if (this.canProceed) {
              await this.saveCurrentFile()
            } else {
              console.warn(
                `⚠️ Arquivo ${file.fileName} não pode ser processado (dados incompletos)`
              )
            }

            // Restaurar índice original
            this.currentFileIndex = originalIndex
          }
        }

        const endTime = Date.now()
        const totalDuration = endTime - startTime

        // Emitir resultado final otimizado
        console.log(`📊 [FINAL] Resultados finais:`)
        console.log(`   📁 Total de arquivos: ${this.parsedFiles.length}`)
        console.log(
          `   ✅ Processados com sucesso: ${this.processedSchedules.length}`
        )
        console.log(
          `   ❌ Falhas: ${this.parsedFiles.length - this.processedSchedules.length}`
        )

        const result = {
          success: this.processedSchedules.length === this.parsedFiles.length,
          message:
            this.processedSchedules.length === this.parsedFiles.length
              ? `Todos os ${this.processedSchedules.length} agendamento(s) foram processados com sucesso em ${totalDuration}ms`
              : `${this.processedSchedules.length} de ${this.parsedFiles.length} agendamento(s) processados em ${totalDuration}ms`,
          processedFiles: this.processedSchedules.map(schedule => ({
            name: schedule.fileName,
            status: 'success',
            message: `Agendamento ID ${schedule.scheduleId} processado`,
          })),
          stats: {
            total: this.parsedFiles.length,
            success: this.processedSchedules.length,
            errors: this.parsedFiles.length - this.processedSchedules.length,
            created_schedules: this.processedSchedules.length,
            performance: {
              total_duration_ms: totalDuration,
              avg_per_schedule_ms:
                this.processedSchedules.length > 0
                  ? Math.round(totalDuration / this.processedSchedules.length)
                  : 0,
              schedules_per_second:
                this.processedSchedules.length > 0
                  ? Math.round(
                      (this.processedSchedules.length / totalDuration) * 1000
                    )
                  : 0,
            },
          },
        }

        console.log('🚀 Lote finalizado com sucesso!')
        console.log(
          `   📊 ${this.processedSchedules.length} agendamentos processados`
        )
        console.log(`   ⚡ Tempo total: ${totalDuration}ms`)
        console.log(
          `   📈 Performance: ${result.stats.performance.schedules_per_second} agendamentos/seg`
        )

        this.$emit('completed', result)
      } catch (error) {
        console.error('Erro ao finalizar lote:', error)

        // Se for erro de validação de data, não fechar modal - permitir correção
        if (error.message === 'DATA_VALIDATION_ERROR') {
          console.log(
            '⚠️ Validação de data falhou - mantendo modal aberto para correção'
          )
          this.loading = false
          this.loadingText = ''
          return // Interrompe processamento mas mantém modal aberto
        }

        const result = {
          success: this.processedSchedules.length > 0,
          message:
            this.processedSchedules.length > 0
              ? `${this.processedSchedules.length} agendamento(s) processado(s), mas houve erro no último`
              : 'Erro ao processar agendamentos em lote',
          processedFiles: this.processedSchedules.map(schedule => ({
            name: schedule.fileName,
            status: 'success',
            message: `Agendamento ID ${schedule.scheduleId} processado`,
          })),
          stats: {
            total: this.parsedFiles.length,
            success: this.processedSchedules.length,
            errors: this.parsedFiles.length - this.processedSchedules.length,
          },
        }

        this.$emit('completed', result)
      }
    },

    buildInfoObject() {
      const currentUser = this.getCurrentUser()

      const infoObject = {
        ...this.currentFile.nfeData,
        products: this.processProductsForSubmission(),
        created_by: currentUser?.user || 'Sistema',
        created_at: new Date().toISOString(),
        type: 'nfe_schedule',
      }

      // Adicionar observações se existirem
      if (this.observations && this.observations.trim()) {
        infoObject.observacoes = this.observations.trim()
      }

      return infoObject
    },

    openObservationsModal() {
      this.showObservationsModal = true
    },

    closeObservationsModal() {
      this.showObservationsModal = false
    },

    saveObservations() {
      console.log('📝 Observações salvas:', this.observations)
      this.closeObservationsModal()
    },

    processProductsForSubmission() {
      return this.currentFileProducts.map(product => {
        const processedProduct = { ...product }

        // Fator: usa o valor da coluna quando o estoque tem show_factor ligado;
        // caso contrário (coluna oculta) mantém 1. Normaliza para inteiro >= 1.
        const parsedFactor = parseInt(product.factor, 10)
        processedProduct.factor =
          this.showFactorColumn && !isNaN(parsedFactor) && parsedFactor > 0
            ? parsedFactor
            : 1

        // Se o produto está marcado para usar dados do fornecedor (e não é item adicionado)
        if (product.useSupplierData && !product.isAdded) {
          processedProduct.client_code = product.supplier_code
          processedProduct.client_description = product.supplier_description
        }

        // Incluir informações sobre modificações se o produto foi alterado
        if (product.wasModified && product.wasLocked) {
          processedProduct.wasModified = true
          processedProduct.originalClientCode = product.originalClientCode
          processedProduct.originalClientDescription =
            product.originalClientDescription
          processedProduct.productId = product.productId
        }

        // Sinalizar inutilizado para o backend (original da NF: não conta no total)
        if (product.inutilizado) {
          processedProduct.inutilizado = true
        }

        // Remover propriedades de controle que não devem ir para a API
        delete processedProduct.useSupplierData
        delete processedProduct.isLocked
        delete processedProduct.wasLocked
        delete processedProduct.isAdded

        return processedProduct
      })
    },

    handleProductInputFocus(product, fieldName, event) {
      console.log('🔍 [PRODUCT EDIT] Input focado/clicado:', {
        supplier_code: product.supplier_code,
        wasLocked: product.wasLocked,
        wasModified: product.wasModified,
        useSupplierData: product.useSupplierData,
        field: fieldName,
        eventType: event?.type || 'focus',
        originalClientCode: product.originalClientCode,
        originalClientDescription: product.originalClientDescription,
      })

      // Se o produto estava bloqueado e ainda não foi modificado, mostrar modal de confirmação
      if (
        product.wasLocked === true &&
        product.wasModified !== true &&
        !product.useSupplierData
      ) {
        console.log(
          '✅ [PRODUCT EDIT] Mostrando modal de confirmação para:',
          product.supplier_code
        )

        // Prevenir o foco automático até o usuário confirmar
        if (event) {
          if (event.type === 'mousedown') {
            event.preventDefault()
            event.stopPropagation()
            // Bloquear o foco temporariamente
            setTimeout(() => {
              if (event.target) {
                event.target.blur()
              }
            }, 0)
          } else if (event.type === 'focus') {
            event.preventDefault()
            event.target.blur()
          }
        }

        this.productToEdit = product
        this.productOriginalData = {
          client_code: product.originalClientCode || product.client_code || '',
          client_description:
            product.originalClientDescription ||
            product.client_description ||
            '',
          field: fieldName,
        }
        this.showProductEditConfirmModal = true
      } else {
        console.log('❌ [PRODUCT EDIT] Condições não atendidas:', {
          wasLocked: product.wasLocked,
          wasModified: product.wasModified,
          useSupplierData: product.useSupplierData,
          wasLockedType: typeof product.wasLocked,
          wasModifiedType: typeof product.wasModified,
        })
      }
    },

    confirmProductEdit() {
      if (this.productToEdit) {
        // Marcar produto como modificado
        this.productToEdit.wasModified = true
        this.productToEdit.isLocked = false
        console.log(
          `✅ Produto ${this.productToEdit.supplier_code} desbloqueado para edição`
        )

        // Focar no input após confirmar (se houver campo específico)
        this.$nextTick(() => {
          const inputs = document.querySelectorAll('.form-control-sm')
          inputs.forEach(input => {
            if (
              input.value === this.productToEdit.client_code ||
              input.value === this.productToEdit.client_description
            ) {
              input.focus()
            }
          })
        })
      }
      this.cancelProductEdit()
    },

    cancelProductEdit() {
      this.showProductEditConfirmModal = false
      this.productToEdit = null
      this.productOriginalData = null
    },

    getCurrentUser() {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    },

    formatCurrency(value) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value)
    },

    /** Formata valor para exibição em input (Real brasileiro); vazio se valor inválido */
    formatCurrencyBr(value) {
      if (value === '' || value == null || value === undefined) return ''
      const num = Number(value)
      if (Number.isNaN(num)) return ''
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(num)
    },

    /** Parse string em Real brasileiro (R$ 1.234,56) para número */
    parseCurrencyBr(str) {
      if (!str || typeof str !== 'string') return null
      const cleaned = str.replace(/[R$\s]/g, '').trim()
      if (!cleaned) return null
      const br = cleaned.replace(/\./g, '').replace(',', '.')
      const num = parseFloat(br)
      return Number.isNaN(num) ? null : num
    },

    focusUnitValue(product) {
      this.focusedUnitValueKey = product.id
      if (
        product.unit_value !== '' &&
        product.unit_value != null &&
        !Number.isNaN(Number(product.unit_value))
      ) {
        this.rawUnitValueInput = this.formatCurrencyBr(product.unit_value)
      } else {
        this.rawUnitValueInput = ''
      }
    },

    onUnitValueInput(product, str) {
      if (this.focusedUnitValueKey !== product.id) return
      this.rawUnitValueInput = str
    },

    blurUnitValue(product) {
      const parsed = this.parseCurrencyBr(this.rawUnitValueInput)
      product.unit_value = parsed === null ? '' : parsed
      this.focusedUnitValueKey = null
      this.rawUnitValueInput = ''
      this.updateProduct(product)
      this.$nextTick(() => this.$forceUpdate())
    },

    /** Embalagem: apenas 2 caracteres e só letras */
    onUnitInput(product, str) {
      const letters = str
        .replace(/[^A-Za-zÀ-ÿ]/g, '')
        .toUpperCase()
        .slice(0, 2)
      product.unit = letters
      this.updateProduct(product)
      this.$forceUpdate()
    },

    /** Fator: apenas dígitos, máx 4 (1-9999). Vazio fica vazio até o submit,
     *  que normaliza para 1 em processProductsForSubmission. */
    onFactorInput(product, str) {
      const digits = String(str || '').replace(/\D/g, '').slice(0, 4)
      product.factor = digits
      this.updateProduct(product)
      this.$forceUpdate()
    },

    closeModal() {
      this.$emit('close')
    },

    handleModalClick(event) {
      event.stopPropagation()
    },

    // Método principal para funcionalidade de colar diretamente nos inputs
    handlePasteInInput(event, product, fieldName) {
      event.preventDefault()

      // Obter dados da área de transferência
      const clipboardData = event.clipboardData || window.clipboardData
      const pastedData = clipboardData.getData('text')

      if (!pastedData || pastedData.trim() === '') {
        return
      }

      console.log(
        `📋 Dados colados no campo ${fieldName} do produto ${product.supplier_code}:`,
        pastedData
      )

      // Processar dados colados
      this.processPasteDataInInputs(pastedData, product, fieldName)
    },

    processPasteDataInInputs(pastedData, startProduct, startField) {
      try {
        // Dividir dados em linhas (cada linha da planilha = uma linha de produto)
        const lines = pastedData
          .trim()
          .split('\n')
          .filter(line => line.trim() !== '')

        if (lines.length === 0) {
          console.log('❌ Nenhuma linha válida encontrada nos dados colados')
          return
        }

        console.log(`📊 Processando ${lines.length} linha(s) de dados colados`)

        // Encontrar índice do produto inicial
        const startProductIndex = this.currentFileProducts.findIndex(
          p => p.id === startProduct.id
        )

        if (startProductIndex === -1) {
          console.error('❌ Produto inicial não encontrado')
          return
        }

        // Mapear campos para ordem de preenchimento
        const fieldOrder = ['client_code', 'client_description', 'ean_code']
        const startFieldIndex = fieldOrder.indexOf(startField)

        if (startFieldIndex === -1) {
          console.error('❌ Campo inicial inválido:', startField)
          return
        }

        let processedCount = 0
        let currentProductIndex = startProductIndex

        // Processar cada linha da planilha
        lines.forEach((line, lineIndex) => {
          console.log(`🔄 Processando linha ${lineIndex + 1}: ${line}`)

          // Pular produtos bloqueados, avançar para próximo disponível
          while (
            currentProductIndex < this.currentFileProducts.length &&
            this.currentFileProducts[currentProductIndex].isLocked
          ) {
            console.log(
              `🔒 Pulando produto bloqueado: ${this.currentFileProducts[currentProductIndex].supplier_code}`
            )
            currentProductIndex++
          }

          // Verificar se ainda há produtos disponíveis
          if (currentProductIndex >= this.currentFileProducts.length) {
            console.log(
              `⚠️ Fim da lista de produtos atingido, parando processamento`
            )
            return
          }

          const currentProduct = this.currentFileProducts[currentProductIndex]

          // Detectar separador e dividir colunas da linha atual
          const columns = this.parseLineColumns(line)

          if (columns.length === 0) {
            console.log(
              `⚠️ Linha ${lineIndex + 1} vazia, pulando para próximo produto`
            )
            currentProductIndex++
            return
          }

          // Se estava usando dados do fornecedor, desmarcar
          if (currentProduct.useSupplierData) {
            currentProduct.useSupplierData = false
          }

          // Aplicar cada coluna da linha aos campos correspondentes do produto atual
          // IMPORTANTE: Só aplicar nas colunas que realmente existem nos dados
          columns.forEach((cellValue, columnIndex) => {
            const fieldIndex = startFieldIndex + columnIndex

            // Verificar se o campo está dentro dos limites
            if (fieldIndex < fieldOrder.length) {
              const targetField = fieldOrder[fieldIndex]

              // CORREÇÃO: Só aplicar se o valor não estiver vazio
              // Isso evita sobrescrever campos com dados vazios
              if (cellValue && cellValue.trim() !== '') {
                // Aplicar valor no campo correspondente
                currentProduct[targetField] = cellValue.trim()

                console.log(
                  `✅ Linha ${lineIndex + 1}, Coluna ${columnIndex + 1}: ${currentProduct.supplier_code}.${targetField} = "${cellValue.trim()}"`
                )
                processedCount++
              } else {
                console.log(
                  `⚠️ Linha ${lineIndex + 1}, Coluna ${columnIndex + 1}: valor vazio, não sobrescrever ${targetField}`
                )
              }
            } else {
              console.log(
                `⚠️ Coluna ${columnIndex + 1} ignorada (excede campos disponíveis)`
              )
            }
          })

          // Atualizar produto no cache
          this.updateProduct(currentProduct)

          // Avançar para próximo produto (próxima linha da planilha = próximo produto)
          currentProductIndex++
        })

        // Forçar atualização da interface
        this.$forceUpdate()

        console.log(
          `🎉 Processamento concluído: ${processedCount} campos preenchidos`
        )

        // Log de feedback (sem alerta para o usuário)
        console.log(
          `📋 Colagem concluída: ${processedCount} campos preenchidos, ${lines.length} linhas processadas`
        )
      } catch (error) {
        console.error('❌ Erro ao processar dados colados:', error)
        alert('Erro ao processar dados colados. Verifique o formato dos dados.')
      }
    },

    parseLineColumns(line) {
      let columns = []
      let separatorUsed = ''

      // CORREÇÃO: Detectar separadores de forma mais inteligente
      // Priorizar separadores estruturais antes de considerar espaços

      if (line.includes('\t')) {
        // Tab é o separador mais confiável do Excel/Sheets
        columns = line.split('\t')
        separatorUsed = 'Tab'
      } else if (line.includes(';')) {
        // Ponto-e-vírgula - separador comum em CSV
        columns = line.split(';')
        separatorUsed = 'Ponto-e-vírgula'
      } else if (line.includes('|')) {
        // Pipe - separador estrutural
        columns = line.split('|')
        separatorUsed = 'Pipe'
      } else if (line.match(/\s{3,}/)) {
        // CORREÇÃO: Só considerar como separador se há 3+ espaços consecutivos
        // Isso evita dividir textos normais como "Produto de teste"
        columns = line.split(/\s{3,}/)
        separatorUsed = 'Múltiplos espaços (3+)'
      } else {
        // CORREÇÃO: Se não há separadores estruturais claros, tratar como coluna única
        // Isso evita dividir valores com espaços normais
        columns = [line]
        separatorUsed = 'Coluna única (sem separadores estruturais)'
      }

      // Limpar espaços, remover aspas do Excel/Sheets e remover colunas vazias do final
      const cleanedColumns = columns.map(col => {
        let cleaned = col.trim()

        // Remover aspas duplas que o Excel/Sheets adiciona automaticamente
        // Exemplo: "120" -> 120, "Produto teste" -> Produto teste
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
          cleaned = cleaned.slice(1, -1)
        }

        // Remover aspas isoladas no início ou fim (ex: "120 -> 120, 120" -> 120)
        // Isso ocorre quando o Excel divide incorretamente as aspas entre células
        if (cleaned.startsWith('"')) {
          cleaned = cleaned.slice(1)
        }
        if (cleaned.endsWith('"')) {
          cleaned = cleaned.slice(0, -1)
        }

        // Remover aspas duplicadas escapadas pelo Excel (ex: "Teste ""especial""" -> Teste "especial")
        cleaned = cleaned.replace(/""/g, '"')

        // Remover apenas aspas isoladas (uma única aspas sozinha)
        if (cleaned === '"') {
          cleaned = ''
        }

        return cleaned.trim()
      })

      // Remover apenas colunas vazias do final
      while (
        cleanedColumns.length > 0 &&
        cleanedColumns[cleanedColumns.length - 1] === ''
      ) {
        cleanedColumns.pop()
      }

      console.log(
        `📊 Separador detectado: ${separatorUsed}, Colunas: ${cleanedColumns.length}`,
        cleanedColumns
      )

      return cleanedColumns
    },

    // Métodos para funcionalidade de copiar e colar (método antigo - manter para compatibilidade)
    showPasteArea() {
      this.showPasteForm = true
      this.pasteData = ''
      this.pastePreview = []
      this.pasteErrors = []

      // Focar no textarea após um breve delay para garantir que foi renderizado
      this.$nextTick(() => {
        const textarea = this.$el.querySelector('.paste-textarea')
        if (textarea) {
          textarea.focus()
        }
      })
    },

    cancelPaste() {
      this.resetPasteData()
    },

    resetPasteData() {
      this.showPasteForm = false
      this.pasteData = ''
      this.pastePreview = []
      this.pasteErrors = []
    },

    generatePastePreview(data) {
      if (!data || data.trim() === '') {
        this.pastePreview = []
        this.pasteErrors = []
        return
      }

      try {
        const lines = data
          .trim()
          .split('\n')
          .filter(line => line.trim() !== '')
        const preview = []
        const errors = []

        lines.forEach((line, index) => {
          const lineNumber = index + 1

          // Detectar separador automaticamente
          let columns = []
          let separatorUsed = ''

          if (line.includes('\t')) {
            columns = line.split('\t')
            separatorUsed = 'Tab'
          } else if (line.includes(';')) {
            columns = line.split(';')
            separatorUsed = 'Ponto-e-vírgula'
          } else if (line.includes('|')) {
            columns = line.split('|')
            separatorUsed = 'Pipe (|)'
          } else if (line.match(/\s{2,}/)) {
            // Dividir por múltiplos espaços (2 ou mais)
            columns = line.split(/\s{2,}/)
            separatorUsed = 'Múltiplos espaços'
          } else {
            // Tentar dividir por espaço simples como último recurso
            columns = line.split(/\s+/)
            separatorUsed = 'Espaço simples'
          }

          // Limpar espaços extras
          columns = columns.map(col => col.trim()).filter(col => col !== '')

          if (columns.length < 1) {
            errors.push(`Linha ${lineNumber}: Linha vazia ou sem dados válidos`)
          } else if (columns.length === 1) {
            errors.push(
              `Linha ${lineNumber}: Apenas 1 coluna detectada. Certifique-se de usar separadores (Tab, ponto-e-vírgula ou múltiplos espaços)`
            )
          } else if (columns.length > 3) {
            errors.push(
              `Linha ${lineNumber}: ${columns.length} colunas detectadas (máximo 3). Separador: ${separatorUsed}`
            )
          } else {
            // Validar se os campos obrigatórios não estão vazios
            if (!columns[0] || columns[0].trim() === '') {
              errors.push(
                `Linha ${lineNumber}: Código de Venda (1ª coluna) está vazio`
              )
            } else if (!columns[1] || columns[1].trim() === '') {
              errors.push(
                `Linha ${lineNumber}: Descrição de Venda (2ª coluna) está vazia`
              )
            } else {
              preview.push({
                lineNumber,
                codVenda: columns[0] || '',
                descricaoVenda: columns[1] || '',
                codigoEan: columns[2] || '',
                separatorUsed,
              })
            }
          }
        })

        this.pastePreview = preview
        this.pasteErrors = errors
      } catch (error) {
        console.error('Erro ao processar preview:', error)
        this.pasteErrors = ['Erro ao processar dados da planilha']
        this.pastePreview = []
      }
    },

    processPastedData() {
      if (this.pastePreview.length === 0) {
        alert('Não há dados válidos para processar')
        return
      }

      if (this.pasteErrors.length > 0) {
        const confirmMessage = `Foram encontrados ${this.pasteErrors.length} erro(s):\n\n${this.pasteErrors.join('\n')}\n\nDeseja continuar processando apenas os dados válidos?`
        if (!confirm(confirmMessage)) {
          return
        }
      }

      let processedCount = 0
      let skippedCount = 0

      // Aplicar dados nos produtos da NFe atual
      this.pastePreview.forEach((pasteItem, index) => {
        if (index < this.currentFileProducts.length) {
          const product = this.currentFileProducts[index]

          // Só aplicar se o produto não estiver bloqueado
          if (!product.isLocked) {
            // Desmarcar "usar dados do fornecedor" se estava marcado
            product.useSupplierData = false

            // Aplicar dados da planilha
            if (pasteItem.codVenda) {
              product.client_code = pasteItem.codVenda
            }
            if (pasteItem.descricaoVenda) {
              product.client_description = pasteItem.descricaoVenda
            }
            if (pasteItem.codigoEan) {
              product.ean_code = pasteItem.codigoEan
            }

            // Atualizar produto no cache
            this.updateProduct(product)
            processedCount++
          } else {
            skippedCount++
          }
        }
      })

      // Forçar atualização da interface
      this.$forceUpdate()

      // Mostrar resultado
      let message = `✅ ${processedCount} produto(s) atualizado(s) com sucesso!`
      if (skippedCount > 0) {
        message += `\n⚠️ ${skippedCount} produto(s) bloqueado(s) foram ignorados.`
      }
      if (this.pastePreview.length > this.currentFileProducts.length) {
        const extraLines =
          this.pastePreview.length - this.currentFileProducts.length
        message += `\n📋 ${extraLines} linha(s) excedente(s) foram ignoradas.`
      }

      alert(message)

      // Fechar área de colagem
      this.resetPasteData()

      // Atualizar estado do "marcar todos"
      this.updateSelectAllState()
    },
  },
}
</script>

<style scoped>
/* Usar os mesmos estilos do ScheduleCreationModal com adaptações */

.modal-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background-color: rgba(0, 0, 0, 0.7) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 9999 !important;
  padding: 1rem !important;
}

.modal-content {
  background: white !important;
  border-radius: 12px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
  position: relative !important;
  max-height: 95vh !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
}

.batch-products-modal {
  max-width: 98vw !important;
  width: 98vw !important;
  max-height: 90vh !important;
  height: 90vh !important;
  z-index: 10000 !important;
}

/* Sobrescrever estilos globais de .modal-content.large */
.batch-products-modal.modal-content.large,
.modal-content.large.batch-products-modal {
  max-width: 98vw !important;
  width: 98vw !important;
}

.modal-header {
  padding: 1.5rem 2rem 0.5rem 2rem !important;
  border-bottom: none !important;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  flex-shrink: 0 !important;
}

.modal-header h3 {
  margin: 0 !important;
  color: #343a40 !important;
  font-size: 1.1rem !important;
  font-weight: 600 !important;
  display: flex !important;
  align-items: center !important;
  gap: 0.5rem !important;
}

.btn-close {
  background: none !important;
  border: none !important;
  font-size: 1.3rem !important;
  color: #6c757d !important;
  cursor: pointer !important;
  padding: 0.5rem !important;
  line-height: 1 !important;
  border-radius: 6px !important;
  transition: all 0.2s !important;
}

.btn-close:hover {
  background-color: #f8f9fa !important;
  color: #dc3545 !important;
}

.modal-body {
  flex: 1 !important;
  padding: 0.25rem 2rem 1.5rem 2rem !important;
  overflow-y: auto !important;
}

.modal-footer {
  padding: 1.5rem 2rem !important;
  border-top: 1px solid #e9ecef !important;
  background: #f8f9fa !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  flex-shrink: 0 !important;
  gap: 1rem !important;
}

.progress-steps {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 2rem 1rem 2rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #dee2e6;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}

.step-info {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex: 1;
}

.step-counter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.7rem;
  font-weight: 800;
  color: #495057;
}

.nfe-details {
  flex: 1;
}

.nfe-info-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nfe-info-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.nfe-number {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: #1e3a8a;
}

.nfe-number i {
  color: #007bff;
  font-size: 0.9rem;
}

.supplier-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #495057;
}

.supplier-name i {
  color: #28a745;
  font-size: 0.75rem;
}

.date-input-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 350px;
}

.date-input-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.date-header-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #495057;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin: 0;
  cursor: pointer;
  white-space: nowrap;
  min-width: 180px;
}

.date-header-label i {
  color: #007bff;
  font-size: 0.85rem;
}

.date-input-compact {
  padding: 0.5rem 0.75rem;
  border: 3px solid #007bff;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.4);
  transition: all 0.3s ease;
  text-align: center;
  cursor: pointer;
  width: 180px;
  flex-shrink: 0;
}

.date-input-compact:focus {
  outline: none;
  border-color: #ffc107;
  background: linear-gradient(135deg, #ffc107 0%, #ffb300 100%);
  color: #212529;
  box-shadow:
    0 6px 25px rgba(255, 193, 7, 0.6),
    0 0 0 4px rgba(255, 193, 7, 0.4);
  transform: translateY(-3px) scale(1.05);
  animation: none;
}

.date-input-compact:hover {
  border-color: #0056b3;
  background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
  box-shadow:
    0 6px 20px rgba(0, 123, 255, 0.5),
    0 0 0 2px rgba(0, 123, 255, 0.3);
  transform: translateY(-2px) scale(1.02);
}

/* Prevision Checkbox Styles */
.date-input-row .prevision-checkbox-container {
  display: flex;
  align-items: center;
  padding: 0;
  margin: 0 0 0 1rem;
  flex-shrink: 0;
}

.prevision-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.3s ease;
  margin: 0;
  white-space: nowrap;
}

.prevision-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #007bff;
  transition: all 0.3s ease;
}

.prevision-label-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: #495057;
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.prevision-checkbox:checked + .prevision-label-text {
  opacity: 1;
  font-weight: 600;
  color: #007bff;
}

.prevision-checkbox-label:hover .prevision-label-text {
  opacity: 0.8;
}

.prevision-checkbox:checked {
  transform: scale(1.1);
}

@keyframes pulse-glow {
  0%,
  100% {
    box-shadow:
      0 4px 15px rgba(0, 123, 255, 0.4),
      0 0 0 0 rgba(0, 123, 255, 0.7);
    transform: scale(1);
  }
  50% {
    box-shadow:
      0 6px 25px rgba(0, 123, 255, 0.6),
      0 0 0 8px rgba(0, 123, 255, 0.2);
    transform: scale(1.02);
  }
}

@keyframes pulse-icon {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.step-current {
  color: #007bff;
  font-size: 2rem;
  font-weight: 800;
}

.step-separator {
  color: #6c757d;
  font-size: 2rem;
  font-weight: 800;
}

.step-total {
  color: #6c757d;
  font-size: 2rem;
  font-weight: 800;
}

.step-label {
  margin-left: 1rem;
  color: #343a40;
  font-weight: 500;
}

.current-file-info {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.nfe-info-container {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.nfe-info-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.nfe-info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: #495057;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-title i {
  color: #007bff;
  font-size: 1rem;
}

.info-value {
  color: #343a40;
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.4;
  padding-left: 0.25rem;
  word-wrap: break-word;
}

.nfe-info-right {
  min-width: 350px;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 2px solid #007bff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.date-input-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.date-input-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  color: #1e3a8a;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 140px;
  flex-shrink: 0;
}

.date-input-label i {
  color: #007bff;
  font-size: 1.3rem;
  animation: pulse-icon 2s infinite;
}

@keyframes pulse-icon {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.date-input {
  padding: 0.875rem 1rem;
  border: 2px solid #007bff;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e3a8a;
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  transition: all 0.3s ease;
  text-align: center;
  cursor: pointer;
  flex: 1;
  min-width: 160px;
}

.date-input:focus {
  outline: none;
  border-color: #0056b3;
  background: linear-gradient(135deg, #ffffff 0%, #e3f2fd 100%);
  box-shadow:
    0 0 0 0.3rem rgba(0, 123, 255, 0.25),
    0 4px 20px rgba(0, 123, 255, 0.2);
  transform: translateY(-2px);
}

.date-input:hover {
  border-color: #0056b3;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
  transform: translateY(-1px);
}

.progress-summary {
  flex: 1;
  text-align: center;
  font-weight: 600;
  color: #495057;
}

.files-completed {
  font-size: 0.9rem;
}

/* Estilos da tabela de produtos copiados do ScheduleCreationModal */
.products-section {
  margin-top: 0.25rem;
}

.products-controls {
  margin-bottom: 0.25rem;
  padding: 0.75rem 1rem;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  position: relative;
}

.checkbox-controls {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}

.controls-row {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.controls-row-values {
  width: 100%;
  justify-content: space-between;
}

.controls-left {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.controls-right.values-comparison {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.value-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #495057;
}

.value-label.value-mismatch {
  color: #dc3545;
  font-weight: 600;
}

.value-label.value-nfe {
  color: #6c757d;
}

.product-inutilizado {
  background-color: #e9ecef !important;
}

.product-inutilizado td,
.product-inutilizado .form-control,
.product-inutilizado strong {
  opacity: 0.4;
}

/* Botão desfazer permanece sem transparência para ficar visível */
.product-inutilizado .td-actions,
.product-inutilizado .td-actions .btn-undo {
  opacity: 1;
}

.products-add-row {
  margin-top: 1rem;
  padding-top: 0.5rem;
}

/* Botão Adicionar item - texto e ícone brancos */
.btn.btn-add-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #28a745 !important;
  color: #fff !important;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn.btn-add-item:hover {
  background: #218838 !important;
  color: #fff !important;
}

.btn.btn-add-item i {
  color: #fff !important;
}

.btn-trash {
  padding: 0.25rem 0.5rem;
  background: #dc3545;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-trash:hover {
  background: #c82333;
}

.btn-trash i {
  color: #fff;
}

.btn-undo {
  padding: 0.25rem 0.5rem;
  background: #ffc107;
  color: #212529;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-undo:hover {
  background: #e0a800;
}

.td-actions {
  text-align: center;
  vertical-align: middle;
}

/* Remover setas (spinner) dos inputs numéricos na tabela de produtos */
.batch-products-modal .input-no-spinner::-webkit-inner-spin-button,
.batch-products-modal .input-no-spinner::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.batch-products-modal .input-no-spinner {
  -moz-appearance: textfield;
}

/* Coluna Fator: ~metade da largura das demais (input curto, 1-4 dígitos) */
.batch-products-modal .col-fator {
  width: 64px !important;
  min-width: 64px !important;
  max-width: 64px !important;
}
.batch-products-modal .input-fator {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  text-align: center !important;
  padding: 2px 4px !important;
}

/* Larguras explícitas (independentes de nth-child) para as colunas após a
   Embal. — a coluna Fator é condicional e desloca a numeração posicional,
   o que antes colapsava/escondia a coluna Código EAN. */
.batch-products-modal .products-table th.col-valor,
.batch-products-modal .products-table td.col-valor {
  width: 13% !important;
  min-width: 120px !important;
}
.batch-products-modal .products-table td.col-valor {
  padding: 8px 8px !important;
  overflow: visible !important;
}
.batch-products-modal .products-table td.col-valor .input-currency-br {
  padding: 2px 8px !important;
  overflow: visible !important;
  text-overflow: clip !important;
  white-space: nowrap !important;
  font-size: 0.8rem !important;
}
.batch-products-modal .products-table th.col-ean,
.batch-products-modal .products-table td.col-ean {
  width: 13% !important;
  min-width: 100px !important;
}

/* Input de valor unitário: alinhamento e formato Real */
.batch-products-modal .input-currency-br {
  text-align: left !important;
  max-width: 100% !important;
  width: 100% !important;
  box-sizing: border-box !important;
  padding: 2px 8px !important;
  overflow: visible !important;
  white-space: nowrap !important;
  font-size: 0.8rem !important;
}

/* Placeholder vermelho na coluna Valor unitário (itens adicionados) */
.batch-products-modal .input-unit-value-added::placeholder {
  color: #dc3545;
  opacity: 1;
}
.batch-products-modal .input-unit-value-added::-webkit-input-placeholder {
  color: #dc3545;
  opacity: 1;
}
.batch-products-modal .input-unit-value-added::-moz-placeholder {
  color: #dc3545;
  opacity: 1;
}
.batch-products-modal .input-unit-value-added:-ms-input-placeholder {
  color: #dc3545;
  opacity: 1;
}

.paste-button {
  margin-left: auto;
}

/* Estilos para a área de colagem */
.paste-area {
  margin-top: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px solid #007bff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.paste-header h4 {
  margin: 0 0 0.5rem 0;
  color: #007bff;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.paste-instructions {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 0.9rem;
  line-height: 1.4;
}

.paste-textarea {
  width: 100%;
  min-height: 120px;
  padding: 0.75rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.4;
  background: #ffffff;
  resize: vertical;
  transition: border-color 0.3s ease;
}

.paste-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.paste-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.paste-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
}

.paste-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview-count {
  padding: 0.25rem 0.75rem;
  background: #e3f2fd;
  color: #1565c0;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid #bbdefb;
}

.paste-errors {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-count {
  padding: 0.25rem 0.75rem;
  background: #ffebee;
  color: #d32f2f;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid #ffcdd2;
}

.error-details {
  margin-top: 1rem;
  padding: 1rem;
  background: #ffebee;
  border: 2px solid #f44336;
  border-radius: 8px;
}

.error-details h5 {
  margin: 0 0 0.75rem 0;
  color: #d32f2f;
  font-size: 0.95rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.error-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.error-item {
  padding: 0.25rem 0;
  color: #c62828;
  font-size: 0.85rem;
  line-height: 1.4;
}

.error-item:before {
  content: '• ';
  color: #f44336;
  font-weight: bold;
}

.products-table-container {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
  margin-top: 0.5rem;
  max-width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
  background: white;
}

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

.products-table {
  width: 100%;
  min-width: 1000px;
  border-collapse: collapse;
  font-size: 0.85rem !important;
  table-layout: fixed;
  border-spacing: 0;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.products-table th,
.products-table td {
  border: 1px solid #ddd;
  padding: 8px 6px;
  text-align: left;
  vertical-align: top;
  font-size: 0.85rem !important;
}

.products-table th {
  background-color: #f5f5f5;
  font-weight: 600;
  font-size: 0.8rem !important;
  position: sticky;
  top: 0;
  z-index: 10;
}

.form-control-sm {
  font-size: 0.8rem !important;
  padding: 2px 4px;
  height: auto;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 3px;
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
  width: 20px;
  height: 20px;
  cursor: pointer;
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
  width: 20px;
  height: 20px;
  border: 2px solid #007bff;
  border-radius: 3px;
  background-color: #fff;
  transition: all 0.2s ease;
  margin: 0;
}

.product-checkbox input[type='checkbox']:checked + .checkmark-small {
  background-color: #007bff;
  border-color: #007bff;
}

.product-checkbox input[type='checkbox']:checked + .checkmark-small::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.product-checkbox input[type='checkbox']:disabled + .checkmark-small {
  opacity: 0.5;
  cursor: not-allowed;
}

.products-hint {
  font-size: 0.9rem;
  color: #dc3545;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.product-locked {
  background-color: #f0fff0 !important;
  border-left: 4px solid #28a745 !important;
}

.product-use-supplier {
  background-color: #e6f3ff !important;
  border-left: 4px solid #007bff !important;
}

.form-control-sm:disabled {
  background-color: #e8f5e8 !important;
  border: 2px solid #c3e6c3 !important;
  color: #2d5a2d !important;
  cursor: not-allowed !important;
}

.product-use-supplier .form-control-sm:disabled {
  background-color: #e6f3ff !important;
  border: 2px solid #b3d9ff !important;
  color: #004085 !important;
  cursor: not-allowed !important;
}

.checkbox-cell {
  text-align: center !important;
  width: 50px !important;
}

.description-cell {
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
  max-width: 200px;
  line-height: 1.3;
}

/* Larguras das colunas */
.products-table th:nth-child(1),
.products-table td:nth-child(1) {
  width: 5%;
  min-width: 50px;
}
.products-table th:nth-child(2),
.products-table td:nth-child(2) {
  width: 11%;
  min-width: 70px;
}
.products-table th:nth-child(3),
.products-table td:nth-child(3) {
  width: 14%;
  min-width: 80px;
}
.products-table th:nth-child(4),
.products-table td:nth-child(4) {
  width: 27%;
  min-width: 130px;
}
.products-table th:nth-child(5),
.products-table td:nth-child(5) {
  width: 24%;
  min-width: 120px;
}
.products-table th:nth-child(6),
.products-table td:nth-child(6) {
  width: 9%;
  min-width: 60px;
}
.products-table th:nth-child(7),
.products-table td:nth-child(7) {
  width: 5%;
  min-width: 40px;
}
.products-table th:nth-child(8),
.products-table td:nth-child(8) {
  width: 14%;
  min-width: 120px !important;
}

/* Célula de valor unitário - padding extra para evitar corte de texto */
.products-table td:nth-child(8) {
  padding: 8px 8px !important;
  overflow: visible !important;
}

.products-table td:nth-child(8) .input-currency-br {
  padding: 2px 8px !important;
  overflow: visible !important;
  text-overflow: clip !important;
  white-space: nowrap !important;
  font-size: 0.8rem !important;
}
.products-table th:nth-child(9),
.products-table td:nth-child(9) {
  width: 14%;
  min-width: 80px;
}

.product-lock-icon {
  color: #28a745;
  font-size: 14px;
  margin-left: 4px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.loading-container i {
  font-size: 2rem;
  color: #007bff;
  margin-bottom: 1rem;
}

.loading-container p {
  color: #495057;
  font-size: 1.1rem;
  margin: 0;
}

/* Responsividade */
@media (max-width: 1200px) {
  .batch-products-modal {
    max-width: 98vw !important;
    width: 98vw !important;
    max-height: 90vh !important;
    height: 90vh !important;
  }

  .batch-products-modal.modal-content.large,
  .modal-content.large.batch-products-modal {
    max-width: 98vw !important;
    width: 98vw !important;
  }
}

@media (max-width: 768px) {
  .batch-products-modal {
    max-width: 98vw !important;
    width: 98vw !important;
    width: 95vw;
    max-height: 95vh;
    height: 95vh;
  }

  .step-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .step-header {
    flex-direction: column;
    gap: 1rem;
  }

  .date-input-header {
    min-width: unset;
    width: 100%;
  }

  .date-input-row {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .date-header-label {
    min-width: unset;
    font-size: 0.85rem;
  }

  .date-input-compact {
    width: 100%;
    max-width: 200px;
  }

  .nfe-info-row {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .nfe-info-left {
    gap: 1rem;
  }

  .info-title {
    font-size: 0.85rem;
  }

  .info-value {
    font-size: 1rem;
  }

  .nfe-info-container {
    flex-direction: column;
    gap: 1rem;
  }

  .nfe-info-right {
    min-width: unset;
    width: 100%;
    padding: 0.75rem;
  }

  .date-input-container {
    flex-direction: column;
    gap: 0.75rem;
  }

  .date-input-label {
    font-size: 0.95rem;
    text-align: center;
    justify-content: center;
    min-width: unset;
  }

  .date-input {
    padding: 0.875rem 1rem;
    font-size: 1rem;
    min-width: unset;
  }

  .paste-button {
    margin-left: unset;
    margin-top: 0.5rem;
  }

  .paste-area {
    padding: 1rem;
  }

  .paste-textarea {
    min-height: 100px;
    font-size: 0.8rem;
  }

  .paste-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .paste-status {
    margin-left: unset;
    justify-content: center;
    flex-wrap: wrap;
  }

  .paste-preview,
  .paste-errors {
    justify-content: center;
  }
}

/* Estilos para botões */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.5;
  color: #212529;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  transition: all 0.15s ease-in-out;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  color: #fff;
  background-color: #007bff;
  border-color: #007bff;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
  border-color: #004085;
}

.btn-secondary {
  color: #fff;
  background-color: #6c757d;
  border-color: #6c757d;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #545b62;
  border-color: #4e555b;
}

.btn-success {
  color: #fff;
  background-color: #28a745;
  border-color: #28a745;
}

.btn-success:hover:not(:disabled) {
  background-color: #1e7e34;
  border-color: #1c7430;
}

/* Estilos específicos para botões do modal */
.modal-footer .btn {
  min-width: 100px;
}

/* Forçar z-index máximo para garantir que fique acima da sidebar */
.batch-products-modal .modal-overlay {
  z-index: 99999 !important;
}

.batch-products-modal .modal-content {
  z-index: 99999 !important;
}

/* Estilos do Modal de Observações */
.observations-modal-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background-color: rgba(0, 0, 0, 0.8) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 999999 !important;
  padding: 1rem !important;
}

.observations-modal-content {
  background: white !important;
  border-radius: 12px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35) !important;
  max-width: 600px !important;
  width: 100% !important;
  max-height: 90vh !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

.observations-modal-header {
  padding: 1.5rem 2rem !important;
  border-bottom: 2px solid #e9ecef !important;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
}

.observations-modal-header h4 {
  margin: 0 !important;
  color: #343a40 !important;
  font-size: 1.25rem !important;
  font-weight: 600 !important;
  display: flex !important;
  align-items: center !important;
  gap: 0.5rem !important;
}

.observations-modal-header h4 i {
  color: #17a2b8 !important;
  font-size: 1.3rem !important;
}

.observations-modal-body {
  flex: 1 !important;
  padding: 2rem !important;
  overflow-y: auto !important;
}

.observations-instruction {
  margin: 0 0 1.5rem 0 !important;
  padding: 1rem !important;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%) !important;
  border-left: 4px solid #2196f3 !important;
  border-radius: 8px !important;
  color: #0d47a1 !important;
  font-size: 0.95rem !important;
  line-height: 1.6 !important;
  display: flex !important;
  align-items: flex-start !important;
  gap: 0.75rem !important;
}

.observations-instruction i {
  color: #2196f3 !important;
  font-size: 1.1rem !important;
  margin-top: 0.1rem !important;
}

.observations-textarea {
  width: 100% !important;
  padding: 1rem !important;
  border: 2px solid #dee2e6 !important;
  border-radius: 8px !important;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue',
    Arial, sans-serif !important;
  font-size: 1rem !important;
  line-height: 1.6 !important;
  background: #ffffff !important;
  resize: vertical !important;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease !important;
  min-height: 150px !important;
}

.observations-textarea:focus {
  outline: none !important;
  border-color: #17a2b8 !important;
  box-shadow: 0 0 0 0.2rem rgba(23, 162, 184, 0.25) !important;
}

.observations-textarea::placeholder {
  color: #adb5bd !important;
  font-style: italic !important;
}

.observations-counter {
  margin-top: 0.5rem !important;
  text-align: right !important;
  font-size: 0.85rem !important;
  color: #6c757d !important;
  font-weight: 500 !important;
}

.observations-modal-footer {
  padding: 1.5rem 2rem !important;
  border-top: 2px solid #e9ecef !important;
  background: #f8f9fa !important;
  display: flex !important;
  justify-content: flex-end !important;
  gap: 1rem !important;
}

/* Badge de observação preenchida */
.observation-badge {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 20px !important;
  height: 20px !important;
  background: #28a745 !important;
  color: white !important;
  border-radius: 50% !important;
  font-size: 0.75rem !important;
  font-weight: bold !important;
  margin-left: 0.25rem !important;
}

/* Botão Info */
.btn-info {
  color: #fff !important;
  background-color: #17a2b8 !important;
  border-color: #17a2b8 !important;
}

.btn-info:hover:not(:disabled) {
  background-color: #138496 !important;
  border-color: #117a8b !important;
}

/* Responsividade do modal de observações */
@media (max-width: 768px) {
  .observations-modal-content {
    max-width: 95vw !important;
    margin: 1rem !important;
  }

  .observations-modal-header {
    padding: 1rem 1.5rem !important;
  }

  .observations-modal-header h4 {
    font-size: 1.1rem !important;
  }

  .observations-modal-body {
    padding: 1.5rem !important;
  }

  .observations-instruction {
    padding: 0.75rem !important;
    font-size: 0.9rem !important;
  }

  .observations-textarea {
    font-size: 0.95rem !important;
    min-height: 120px !important;
  }

  .observations-modal-footer {
    padding: 1rem 1.5rem !important;
    flex-direction: column !important;
  }

  .observations-modal-footer .btn {
    width: 100% !important;
  }
}

/* Estilos do Modal de Confirmação de Edição de Produto */
.product-edit-confirm-modal-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background-color: rgba(0, 0, 0, 0.8) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 9999999 !important;
  padding: 1rem !important;
}

.product-edit-confirm-modal-content {
  background: white !important;
  border-radius: 12px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35) !important;
  max-width: 500px !important;
  width: 100% !important;
  max-height: 90vh !important;
  display: flex !important;
  flex-direction: column !important;
  z-index: 9999999 !important;
  position: relative !important;
}

.product-edit-confirm-modal-content .modal-header {
  padding: 1.5rem !important;
  border-bottom: 2px solid #e9ecef !important;
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%) !important;
  border-radius: 12px 12px 0 0 !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
}

.product-edit-confirm-modal-content .modal-header h3 {
  margin: 0 !important;
  color: #856404 !important;
  font-size: 1.25rem !important;
  font-weight: 600 !important;
  display: flex !important;
  align-items: center !important;
  gap: 0.5rem !important;
}

.product-edit-confirm-modal-content .modal-header h3 i {
  color: #f39c12 !important;
  font-size: 1.3rem !important;
}

.product-edit-confirm-modal-content .modal-body {
  padding: 1.5rem !important;
  flex: 1 !important;
  overflow-y: auto !important;
}

.product-edit-confirm-modal-content .modal-body p {
  margin: 0 0 1rem 0 !important;
  color: #343a40 !important;
  font-size: 1rem !important;
  line-height: 1.6 !important;
}

.product-info-preview {
  margin-top: 1rem !important;
  padding: 1rem !important;
  background: #f8f9fa !important;
  border-radius: 8px !important;
  border-left: 4px solid #17a2b8 !important;
}

.product-info-preview p {
  margin: 0.5rem 0 !important;
  color: #495057 !important;
  font-size: 0.95rem !important;
}

.product-info-preview strong {
  color: #212529 !important;
  font-weight: 600 !important;
}

.product-edit-confirm-modal-content .modal-footer {
  padding: 1.5rem !important;
  border-top: 2px solid #e9ecef !important;
  background: #f8f9fa !important;
  display: flex !important;
  justify-content: flex-end !important;
  gap: 1rem !important;
  border-radius: 0 0 12px 12px !important;
}

.product-edit-confirm-modal-content .btn {
  padding: 0.75rem 1.5rem !important;
  border-radius: 8px !important;
  font-weight: 600 !important;
  font-size: 1rem !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.5rem !important;
  border: none !important;
}

.product-edit-confirm-modal-content .btn-secondary {
  background-color: #6c757d !important;
  color: white !important;
}

.product-edit-confirm-modal-content .btn-secondary:hover {
  background-color: #5a6268 !important;
}

.product-edit-confirm-modal-content .btn-primary {
  background-color: #17a2b8 !important;
  color: white !important;
}

.product-edit-confirm-modal-content .btn-primary:hover {
  background-color: #138496 !important;
}

.product-edit-confirm-modal-content .btn-close {
  background: transparent !important;
  border: none !important;
  font-size: 1.5rem !important;
  color: #856404 !important;
  cursor: pointer !important;
  padding: 0.25rem 0.5rem !important;
  border-radius: 4px !important;
  transition: all 0.2s ease !important;
}

.product-edit-confirm-modal-content .btn-close:hover {
  background-color: rgba(133, 100, 4, 0.1) !important;
  color: #5a3d00 !important;
}

/* Regras finais para garantir largura de 98% e fontes reduzidas - maior especificidade */
.batch-products-modal.modal-content.large,
.modal-content.large.batch-products-modal,
div.batch-products-modal.modal-content.large,
.modal-overlay .modal-content.large.batch-products-modal,
.modal-overlay div.modal-content.large.batch-products-modal {
  max-width: 98vw !important;
  width: 98vw !important;
  min-width: 98vw !important;
}

/* Garantir fontes reduzidas na tabela */
.batch-products-modal .products-table,
.batch-products-modal .products-table th,
.batch-products-modal .products-table td,
.batch-products-modal .products-table th *,
.batch-products-modal .products-table td * {
  font-size: 0.85rem !important;
}

.batch-products-modal .products-table th {
  font-size: 0.8rem !important;
}

.batch-products-modal .form-control-sm,
.batch-products-modal .products-table input,
.batch-products-modal .products-table .form-control-sm {
  font-size: 0.8rem !important;
}

/* Garantir que o input de valor unitário tenha espaço suficiente */
.batch-products-modal .products-table td:nth-child(8) {
  min-width: 120px !important;
  width: 14% !important;
}

.batch-products-modal .products-table td:nth-child(8) .input-currency-br {
  font-size: 0.8rem !important;
  padding: 2px 8px !important;
}

/* Responsividade do modal de confirmação */
@media (max-width: 768px) {
  .product-edit-confirm-modal-content {
    max-width: 95vw !important;
    margin: 1rem !important;
  }

  .product-edit-confirm-modal-content .modal-header {
    padding: 1rem 1.5rem !important;
  }

  .product-edit-confirm-modal-content .modal-body {
    padding: 1rem !important;
  }

  .product-edit-confirm-modal-content .modal-footer {
    padding: 1rem !important;
    flex-direction: column !important;
  }

  .product-edit-confirm-modal-content .btn {
    width: 100% !important;
    justify-content: center !important;
  }
}
</style>
