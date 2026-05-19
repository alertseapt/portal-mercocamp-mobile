<template>
  <div class="xml-upload-page">
    <!-- Access Denied Message -->
    <div v-if="!hasAccess" class="access-denied">
      <div class="access-denied-content">
        <i class="fas fa-lock"></i>
        <h3>Acesso Negado</h3>
        <p>Você não tem permissão para acessar esta funcionalidade.</p>
        <p>
          Por favor, faça login com uma conta autorizada para acessar esta
          funcionalidade.
        </p>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else>
      <!-- Header -->
      <div class="page-header">
        <h2>
          <i class="fas fa-plus-circle"></i>
          Criar Agendamento
        </h2>
      </div>

      <!-- Effectivation Banner -->
      <div v-if="isEffectivating" class="effectivation-banner">
        <div class="effectivation-banner-content">
          <div class="effectivation-icon">
            <i class="fas fa-arrow-circle-up"></i>
          </div>
          <div class="effectivation-info">
            <h3>
              Efetivando Agendamento
              {{
                bookingToEffectivate.is_booking === 1
                  ? 'Prévio'
                  : 'Não Agendado'
              }}
            </h3>
            <div class="effectivation-badges">
              <div class="info-badge badge-storage">
                <i class="fas fa-warehouse"></i>
                <div class="badge-content">
                  <span class="badge-label">Estoque</span>
                  <span class="badge-value">
                    {{
                      bookingToEffectivate.client_name ||
                      bookingToEffectivate.client
                    }}
                  </span>
                </div>
              </div>
              <div class="info-badge badge-date">
                <i class="fas fa-calendar-alt"></i>
                <div class="badge-content">
                  <span class="badge-label">Data</span>
                  <span class="badge-value">{{
                    formatDate(bookingToEffectivate.date)
                  }}</span>
                </div>
              </div>
            </div>
            <div class="effectivation-instruction">
              <i class="fas fa-info-circle"></i>
              <span>
                <strong>Como funciona:</strong> O primeiro XML enviado
                substituirá este agendamento mantendo seu histórico. XMLs
                adicionais criarão novos agendamentos automaticamente.
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Upload Form -->
      <div class="upload-form-container">
        <form @submit.prevent="handleSubmit" class="upload-form">
          <!-- File Upload Area -->
          <div class="form-section">
            <label class="section-title">
              <i class="fas fa-file-alt"></i>
              Selecione os arquivos XML das notas fiscais para criar os
              agendamentos
            </label>
            <div
              class="file-drop-zone"
              :class="{
                'drag-over': isDragOver,
                'has-files': selectedFiles.length,
              }"
              @drop="handleDrop"
              @dragover="handleDragOver"
              @dragleave="handleDragLeave"
              @click="triggerFileInput"
            >
              <input
                ref="fileInput"
                type="file"
                multiple
                accept=".xml"
                @change="handleFileSelect"
                style="display: none"
              />

              <div v-if="selectedFiles.length === 0" class="drop-zone-content">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Arraste os arquivos XML aqui ou clique para selecionar</p>
                <small>Selecione um ou mais arquivos XML das NFes</small>
              </div>

              <div v-else class="selected-files">
                <div class="selected-files-header">
                  <h4>Arquivos selecionados ({{ selectedFiles.length }})</h4>
                  <button
                    type="button"
                    class="btn-add-more"
                    @click="triggerFileInput"
                    title="Adicionar mais arquivos"
                  >
                    <i class="fas fa-plus"></i>
                    Adicionar mais
                  </button>
                </div>
                <div class="file-list">
                  <div
                    v-for="(file, index) in selectedFiles"
                    :key="index"
                    class="file-item"
                  >
                    <i class="fas fa-file-alt"></i>
                    <span class="file-name">{{ file.name }}</span>
                    <span class="file-size">{{
                      formatFileSize(file.size)
                    }}</span>
                    <button
                      v-if="selectedClientData && !clientRequiresProducts"
                      type="button"
                      @click.stop="openObservationsModal(file, index)"
                      class="observation-file-btn"
                      :class="{
                        'has-observation': fileObservations[file.name],
                      }"
                      :title="
                        fileObservations[file.name]
                          ? 'Editar observações'
                          : 'Adicionar observações'
                      "
                    >
                      <i class="fas fa-comment-medical"></i>
                      <span class="obs-text">obs</span>
                      <span v-if="fileObservations[file.name]" class="obs-badge"
                        >✓</span
                      >
                    </button>
                    <button
                      type="button"
                      @click.stop="removeFile(index)"
                      class="remove-file-btn"
                      title="Remover arquivo"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Client/CNPJ Selection -->
          <div class="form-section">
            <label class="section-title">
              <i class="fas fa-building"></i>
              Escolha o estoque para qual os produtos serão destinados
            </label>
            <div class="client-selection-area">
              <div v-if="selectedClientData" class="selected-client-display">
                <div class="selected-client-info">
                  <i class="fas fa-warehouse"></i>
                  <div class="client-details">
                    <span class="client-name">{{
                      selectedClientData.name
                    }}</span>
                    <span class="client-cnpj"
                      >CNPJ: {{ formatCNPJ(selectedClientData.cnpj) }}</span
                    >
                    <span v-if="selectedClientData.numero" class="client-numero"
                      >Nº: {{ selectedClientData.numero }}</span
                    >
                  </div>
                </div>
                <button
                  type="button"
                  @click="openClientSelectionModal"
                  class="btn btn-outline-primary btn-change-client"
                >
                  <i class="fas fa-edit"></i>
                  Alterar
                </button>
              </div>

              <div v-else class="no-client-selected">
                <p class="no-client-text">Nenhum cliente selecionado</p>
                <button
                  type="button"
                  @click="openClientSelectionModal"
                  class="btn btn-primary btn-select-client"
                  :disabled="loadingClients"
                >
                  <i v-if="loadingClients" class="fas fa-spinner fa-spin"></i>
                  <i v-else class="fas fa-warehouse"></i>
                  {{ loadingClients ? 'Carregando...' : 'Selecionar Estoque' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Data de Agendamento (para integration=0) -->
          <div
            v-if="selectedClientData && !clientRequiresProducts"
            class="form-section"
          >
            <label class="section-title">
              <i class="fas fa-calendar-alt"></i>
              Data de Agendamento
            </label>
            <div class="date-selection-area">
              <div class="date-input-container">
                <div class="date-with-prevision">
                  <input
                    type="date"
                    id="scheduledDate"
                    v-model="scheduledDate"
                    class="form-control"
                    :min="minDate"
                    required
                  />
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
          </div>

          <!-- Submit Button -->
          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-success btn-upload"
              :disabled="!canSubmit || isUploading"
            >
              <i v-if="isUploading" class="fas fa-spinner fa-spin"></i>
              <i v-else-if="!clientRequiresProducts" class="fas fa-check"></i>
              <i v-else class="fas fa-arrow-right"></i>
              {{
                isUploading
                  ? 'Processando...'
                  : !clientRequiresProducts
                    ? 'Criar Agendamentos'
                    : 'Continuar Agendamento'
              }}
            </button>

            <button
              v-if="selectedFiles.length > 0"
              type="button"
              @click="clearForm"
              class="btn btn-outline-secondary"
              :disabled="isUploading"
            >
              <i class="fas fa-trash"></i>
              Limpar
            </button>
          </div>
        </form>
      </div>

      <!-- Progress and Results Modal -->
      <div
        v-if="showProgressModal"
        class="modal-overlay progress-modal-overlay"
      >
        <div class="modal-content progress-modal-content" @click.stop>
          <div class="modal-header">
            <h3>
              <i class="fas fa-cogs"></i>
              Processamento dos Arquivos
            </h3>
            <button
              v-if="!isUploading && uploadResult"
              class="modal-close-btn"
              @click="closeProgressModal"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body">
            <!-- Upload Progress -->
            <div v-if="isUploading" class="upload-progress">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: uploadProgress + '%' }"
                ></div>
              </div>
              <p class="progress-text">{{ uploadProgressText }}</p>
            </div>

            <!-- Temporary Messages -->
            <div v-if="tempMessage" class="temp-message">
              <div :class="['alert', `alert-${tempMessage.type}`]">
                <i :class="getMessageIcon(tempMessage.type)"></i>
                <p>{{ tempMessage.message }}</p>
              </div>
            </div>

            <!-- Success/Error Messages -->
            <div v-if="uploadResult" class="upload-result">
              <div v-if="uploadResult.success" class="alert alert-success">
                <i class="fas fa-check-circle"></i>
                <div>
                  <h4>Upload realizado com sucesso!</h4>
                  <p>{{ uploadResult.message }}</p>
                  <ul v-if="uploadResult.processedFiles">
                    <li
                      v-for="file in uploadResult.processedFiles"
                      :key="file.name"
                    >
                      {{ file.name }} - {{ file.status }}
                    </li>
                  </ul>
                  <small
                    v-if="
                      uploadResult.success && uploadResult.stats?.errors === 0
                    "
                    class="text-muted mt-2 d-block"
                  >
                    <i class="fas fa-clock"></i> Esta janela será fechada
                    automaticamente em alguns segundos...
                  </small>
                </div>
              </div>

              <div v-else class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i>
                <div>
                  <h4>Erro no upload</h4>
                  <p>{{ uploadResult.message }}</p>
                  <small class="text-muted mt-2 d-block">
                    <i class="fas fa-clock"></i> Esta janela será fechada
                    automaticamente em alguns segundos...
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!isUploading && uploadResult" class="modal-footer">
            <button class="btn btn-secondary" @click="closeProgressModal">
              <i class="fas fa-check"></i>
              OK
            </button>
          </div>
        </div>
      </div>

      <!-- Batch Products Configuration Modal -->
      <BatchProductsModal
        v-if="showBatchProductsModal"
        :show-modal="showBatchProductsModal"
        :parsed-files="parsedFilesForModal"
        :selected-client="selectedClientData"
        :booking-to-effectivate="bookingToEffectivate"
        :is-effectivating="isEffectivating"
        @close="closeBatchProductsModal"
        @completed="handleBatchCompleted"
        @effectivation-completed="handleEffectivationCompleted"
      />

      <!-- Client Selection Modal -->
      <div
        v-if="showClientModal"
        class="modal-overlay"
        @click="closeClientSelectionModal"
      >
        <div class="modal-content estoque-selection-modal" @click.stop>
          <div class="modal-header">
            <h3>
              <i class="fas fa-warehouse"></i>
              Selecionar Estoque
            </h3>
            <button class="modal-close-btn" @click="closeClientSelectionModal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body">
            <!-- Search input -->
            <div v-if="!loadingClients" class="search-container">
              <div class="search-input-wrapper">
                <i class="fas fa-search search-icon"></i>
                <input
                  type="text"
                  v-model="clientSearchQuery"
                  placeholder="Pesquisar por nome, CNPJ ou número Corpem..."
                  class="search-input"
                  @input="filterClients"
                  autocomplete="off"
                  data-lpignore="true"
                  data-form-type="other"
                  name="xml-client-search"
                />
                <button
                  v-if="clientSearchQuery"
                  @click="clearSearch"
                  class="clear-search-btn"
                  title="Limpar pesquisa"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="search-results-info" v-if="clientSearchQuery">
                <span
                  >{{ filteredClients.length }} de
                  {{ availableClients.length }} estoques encontrados</span
                >
              </div>
            </div>

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
                v-for="client in filteredClients"
                :key="client.cnpj"
                class="estoque-lista-item clickable-item"
                @click="selectClient(client)"
              >
                <div class="estoque-lista-info">
                  <span class="estoque-nome">{{ client.name }}</span>
                  <span class="estoque-cnpj"
                    >CNPJ: {{ formatCNPJ(client.cnpj) }}</span
                  >
                  <span v-if="client.corpem_code" class="estoque-numero"
                    >Corpem: {{ client.corpem_code }}</span
                  >
                </div>
                <div class="estoque-lista-arrow">
                  <i class="fas fa-chevron-right"></i>
                </div>
              </div>
              <div
                v-if="availableClients.length === 0"
                class="text-muted estoque-lista-vazia"
              >
                <i class="fas fa-info-circle"></i>
                Nenhum estoque disponível para seu usuário.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Duplicate Error Modal -->
      <div
        v-if="showDuplicateErrorModal"
        class="modal-overlay duplicate-error-modal-overlay"
        @click="closeDuplicateErrorModal"
      >
        <div class="modal-content duplicate-error-modal-content" @click.stop>
          <div class="modal-header duplicate-error-header">
            <h3>
              <i class="fas fa-exclamation-triangle"></i>
              NFe Duplicada
            </h3>
            <button class="modal-close-btn" @click="closeDuplicateErrorModal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body">
            <div class="duplicate-error-content">
              <div class="duplicate-error-icon">
                <i class="fas fa-clone"></i>
              </div>

              <div class="duplicate-error-message">
                <h4>Agendamento não pode ser criado</h4>
                <p class="error-description">
                  Esta NFe já possui um agendamento ativo no sistema e não pode
                  ser agendada novamente.
                </p>

                <div v-if="duplicateErrorDetails" class="error-details">
                  <div
                    v-if="duplicateErrorDetails.nfeNumber"
                    class="detail-item"
                  >
                    <span class="detail-label">Número da NFe:</span>
                    <span class="detail-value">{{
                      duplicateErrorDetails.nfeNumber
                    }}</span>
                  </div>
                  <div
                    v-if="duplicateErrorDetails.fileName"
                    class="detail-item"
                  >
                    <span class="detail-label">Arquivo:</span>
                    <span class="detail-value">{{
                      duplicateErrorDetails.fileName
                    }}</span>
                  </div>
                  <div class="detail-item error-reason">
                    <span class="detail-label">Motivo:</span>
                    <span class="detail-value">{{
                      duplicateErrorDetails.message
                    }}</span>
                  </div>
                </div>

                <div class="duplicate-error-help">
                  <i class="fas fa-info-circle"></i>
                  <span
                    >Apenas agendamentos cancelados ou recusados permitem
                    reutilização da chave NFe.</span
                  >
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeDuplicateErrorModal">
              <i class="fas fa-check"></i>
              Entendi
            </button>
          </div>
        </div>
      </div>

      <!-- Observations Modal -->
      <div
        v-if="showObservationsModal"
        class="modal-overlay observations-modal-overlay"
        @click="closeObservationsModal"
      >
        <div class="modal-content observations-modal-content" @click.stop>
          <div class="modal-header observations-modal-header">
            <h4>
              <i class="fas fa-comment-medical"></i>
              Observações do Arquivo
            </h4>
            <button class="btn-close" @click="closeObservationsModal">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <div class="modal-body observations-modal-body">
            <p class="observations-instruction">
              <i class="fas fa-info-circle"></i>
              Digite abaixo as observações que deseja incluir para este arquivo.
              Estas informações serão salvas junto com o agendamento da NFe.
            </p>

            <div class="file-info-display" v-if="currentObservationFile">
              <i class="fas fa-file-alt"></i>
              <span>{{ currentObservationFile.name }}</span>
            </div>

            <textarea
              v-model="fileObservations[currentObservationFile?.name]"
              class="observations-textarea"
              placeholder="Digite suas observações aqui..."
              rows="8"
              maxlength="1000"
            ></textarea>

            <div class="observations-counter">
              {{
                (fileObservations[currentObservationFile?.name] || '').length
              }}
              / 1000 caracteres
            </div>
          </div>

          <div class="modal-footer observations-modal-footer">
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
    </div>
  </div>
</template>

<script>
import { API_CONFIG } from '../config/api.js'
import BatchProductsModal from '../components/BatchProductsModal.vue'

// Função para verificar se o usuário tem acesso
function hasXmlUploadAccess() {
  const userData = localStorage.getItem('user')
  if (!userData) return false

  try {
    const user = JSON.parse(userData)
    const level = user.level_access

    // Permitir todos os níveis de acesso para criação de agendamentos
    return (
      level === 0 || level === 1 || level === 2 || level === 3 || level === 9
    )
  } catch (error) {
    console.error('Erro ao verificar acesso:', error)
    return false
  }
}

export default {
  name: 'XmlUploadPage',
  components: {
    BatchProductsModal,
  },
  props: {
    bookingToEffectivate: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      selectedFiles: [],
      selectedClient: '',
      selectedClientData: null,
      scheduledDate: '',
      isPrevision: false,
      isCrossdock: false,
      isDragOver: false,
      isUploading: false,
      uploadProgress: 0,
      uploadProgressText: '',
      uploadResult: null,
      tempMessage: null,
      availableClients: [],
      loadingClients: false,
      showClientModal: false,
      showBatchProductsModal: false,
      showProgressModal: false,
      progressModalTimer: null,
      parsedFilesForModal: [],
      clientSearchQuery: '',
      filteredClients: [],
      showDuplicateErrorModal: false,
      duplicateErrorDetails: null,
      firstXmlProcessed: false, // Controle para saber se o primeiro XML já foi processado
      fileObservations: {}, // Armazena observações de cada arquivo (key: fileName)
      showObservationsModal: false, // Controla exibição do modal de observações
      currentObservationFile: null, // Arquivo atual sendo editado
      currentObservationIndex: null, // Índice do arquivo atual
    }
  },

  computed: {
    hasAccess() {
      return hasXmlUploadAccess()
    },

    isEffectivating() {
      return !!this.bookingToEffectivate
    },

    canSubmit() {
      const basicRequirements =
        this.selectedFiles.length > 0 && this.selectedClientData

      // Se cliente não requer produtos (integration=0), precisa também da data
      if (basicRequirements && !this.clientRequiresProducts) {
        return this.scheduledDate // Precisa de data para integration=0
      }

      return basicRequirements
    },

    clientRequiresProducts() {
      // Se cliente tem integration = 0, NÃO exige produtos (usa dados do fornecedor)
      const hasClient = !!this.selectedClientData
      const integrationValue = this.selectedClientData?.integration
      const isIntegrationZero =
        integrationValue === 0 || integrationValue === '0'
      const requires = !(hasClient && isIntegrationZero)

      console.log(`🔍 [XML UPLOAD] clientRequiresProducts():`, {
        hasSelectedClient: hasClient,
        clientName: this.selectedClientData?.name,
        integrationValue: integrationValue,
        integrationTypeOf: typeof integrationValue,
        isIntegrationZero: isIntegrationZero,
        requires: requires,
        logic: `hasClient(${hasClient}) && isIntegrationZero(${isIntegrationZero}) = !requires(${!requires})`,
      })

      if (hasClient && integrationValue !== undefined) {
        if (isIntegrationZero) {
          console.log(
            `✅ [XML UPLOAD] Cliente "${this.selectedClientData.name}" usa AGENDAMENTO SIMPLIFICADO (integration=${integrationValue})`
          )
        } else {
          console.log(
            `📋 [XML UPLOAD] Cliente "${this.selectedClientData.name}" requer CONFIGURAÇÃO DE PRODUTOS (integration=${integrationValue})`
          )
        }
      }

      return requires
    },

    // Controla a visibilidade da checkbox de crossdocking
    // Aparece apenas quando integration = 0 (na página de upload)
    showCrossdockCheckbox() {
      if (!this.selectedClientData) return false

      const integrationValue = this.selectedClientData?.integration
      const isIntegrationZero =
        integrationValue === 0 || integrationValue === '0'

      // Só mostra quando integration = 0 (na página de upload)
      if (!isIntegrationZero) return false

      // Verificar valor de crossdocking
      const crossdockingValue = this.selectedClientData?.crossdocking

      // Mostrar apenas se crossdocking = 1 ou 2
      return crossdockingValue === '1' || crossdockingValue === '2'
    },

    // Controla se a checkbox está desabilitada
    isCrossdockDisabled() {
      if (!this.selectedClientData) return false

      const crossdockingValue = this.selectedClientData?.crossdocking

      // crossdocking = 2: Checkbox bloqueada (sempre marcada)
      return crossdockingValue === '2'
    },

    minDate() {
      // Data mínima baseada no level_access do usuário:
      // - Efetivação (prévio ou não agendado): sempre hoje, independente do nível
      // - level_access = 1 (Client) em criação normal: apenas amanhã ou datas futuras
      // - level_access != 1 (Dev, Admin, Manager, Lobby) em criação normal: hoje ou datas futuras
      if (this.isEffectivating) {
        return new Date().toISOString().split('T')[0]
      }

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
    bookingToEffectivate: {
      immediate: true,
      async handler(booking) {
        if (booking && booking.client) {
          console.log(
            '🔄 [EFFECTIVATION] Detectado agendamento para efetivar:',
            booking
          )

          // Aguardar clientes serem carregados se ainda não estiverem
          if (this.availableClients.length === 0 && !this.loadingClients) {
            console.log(
              '⏳ [EFFECTIVATION] Aguardando clientes serem carregados...'
            )
            await this.loadAvailableClients()
          }

          // Aguardar até que os clientes estejam carregados
          let attempts = 0
          while (this.loadingClients && attempts < 10) {
            await new Promise(resolve => setTimeout(resolve, 200))
            attempts++
          }

          // Auto-selecionar cliente do agendamento
          const clientData = this.availableClients.find(
            c => c.cnpj === booking.client || c.cnpj === booking.client_cnpj
          )

          if (clientData) {
            this.selectClient(clientData)
            console.log(
              '✅ [EFFECTIVATION] Cliente auto-selecionado:',
              clientData.name
            )
          } else {
            console.warn(
              '⚠️ [EFFECTIVATION] Cliente do agendamento não encontrado:',
              booking.client
            )
          }

          // Resetar controle de primeiro XML processado
          this.firstXmlProcessed = false
        }
      },
    },
  },

  async mounted() {
    await this.loadAvailableClients()
    this.$emit('page-ready')
  },

  beforeUnmount() {
    // Limpar timer do modal de progresso ao destruir o componente
    if (this.progressModalTimer) {
      clearTimeout(this.progressModalTimer)
      this.progressModalTimer = null
      console.log('🧹 Timer do modal de progresso limpo no beforeUnmount')
    }
  },

  methods: {
    formatDate(dateString) {
      if (!dateString) return ''

      // Se já estiver no formato dd/mm/yyyy, retorna como está
      if (dateString.includes('/')) return dateString

      // Converte de yyyy-mm-dd para dd/mm/yyyy
      const [year, month, day] = dateString.split('-')
      return `${day}/${month}/${year}`
    },

    async loadAvailableClients() {
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const user = JSON.parse(userData)
          if (Number(user.level_access) === 4) {
            console.log(
              '🏢 XML Upload: Usuário nível 4 (Manutenção) - usando fallback cli_access'
            )
            this.loadingClients = true
            this.loadAvailableClientsFromCliAccess()
            this.loadingClients = false
            return
          }
        } catch (_) {}
      }
      this.loadingClients = true
      try {
        console.log('🏢 XML Upload - Carregando clientes da API...')

        // Buscar dados completos dos clientes da API
        const token =
          localStorage.getItem('token') || localStorage.getItem('authToken')

        const response = await this.$http.get('/clients', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.data && response.data.data) {
          const clients = response.data.data.map(client => ({
            cnpj: client.cnpj,
            name: client.name,
            numero: client.cnpj, // Usar CNPJ como número se não tiver
            storage: client.storage,
            integration: client.integration, // Campo essencial para a funcionalidade
            crossdocking: client.crossdocking || '0', // Campo essencial para crossdocking
            token: client.token,
            corpem_code: client.corpem_code,
            // Controla exibição da coluna "Fator" no BatchProductsModal
            show_factor: client.show_factor || null,
          }))

          console.log('✅ Clientes carregados da API:', clients)
          console.log(
            '📊 Campos integration encontrados:',
            clients.map(c => ({
              name: c.name,
              cnpj: c.cnpj,
              integration: c.integration,
            }))
          )

          this.availableClients = clients
          this.filteredClients = [...clients] // Inicializar lista filtrada

          // Auto-selecionar se há apenas um cliente disponível
          if (clients.length === 1) {
            this.selectClient(clients[0])
            console.log(
              '🎯 Auto-selecionado cliente único:',
              clients[0].name,
              'integration:',
              clients[0].integration
            )
          }
        } else {
          console.log('⚠️ Nenhum cliente encontrado na resposta da API')
          this.availableClients = []
          this.filteredClients = [] // Inicializar lista filtrada vazia
        }
      } catch (error) {
        console.error('❌ Erro ao carregar clientes da API:', error)

        // Fallback para o método anterior usando cli_access
        console.log('🔄 Tentando fallback com cli_access...')
        this.loadAvailableClientsFromCliAccess()
      } finally {
        this.loadingClients = false
      }
    },

    loadAvailableClientsFromCliAccess() {
      try {
        const currentUser = this.getCurrentUser()
        console.log(
          '🏢 XML Upload - Fallback cli_access:',
          currentUser?.cli_access
        )

        if (!currentUser) {
          console.log('❌ Usuário não encontrado')
          this.availableClients = []
          this.filteredClients = [] // Inicializar lista filtrada vazia
          return
        }

        // Processar cli_access diretamente
        let cliAccess = currentUser.cli_access

        // Tratar cli_access se estiver como string
        if (typeof cliAccess === 'string') {
          try {
            cliAccess = JSON.parse(cliAccess)
            console.log('🔄 cli_access parsed from string:', cliAccess)
          } catch (e) {
            console.log('❌ Erro ao fazer parse do cli_access string:', e)
            cliAccess = {}
          }
        }

        if (
          cliAccess &&
          typeof cliAccess === 'object' &&
          Object.keys(cliAccess).length > 0
        ) {
          console.log('✅ cli_access encontrado, processando...')

          const cliAccessEntries = Object.entries(cliAccess)
          console.log('📋 Entradas do cli_access:', cliAccessEntries)

          const clients = cliAccessEntries.map(([cnpj, data]) => {
            console.log(`🏪 Processando cliente ${cnpj}:`, data)
            return {
              cnpj: cnpj,
              name: data.nome || `Cliente ${cnpj}`,
              numero: data.numero || cnpj,
              integration: null, // Campo não disponível no cli_access
            }
          })

          console.log('👥 Clientes processados (fallback):', clients)
          console.log('⚠️ AVISO: Campo integration não disponível no fallback')
          this.availableClients = clients
          this.filteredClients = [...clients] // Inicializar lista filtrada

          // Auto-selecionar se há apenas um cliente disponível
          if (clients.length === 1) {
            this.selectClient(clients[0])
            console.log(
              '🎯 Auto-selecionado cliente único (fallback):',
              clients[0].name
            )
          }
        } else {
          console.log(
            '⚠️ Usuário sem cli_access definido ou cli_access não é objeto'
          )
          this.availableClients = []
          this.filteredClients = [] // Inicializar lista filtrada vazia
        }
      } catch (error) {
        console.error('❌ Erro ao processar cli_access:', error)
        this.showMessage('Erro ao processar lista de clientes.', 'error')
        this.availableClients = []
      }
    },

    getCurrentUser() {
      const userData = localStorage.getItem('user')
      if (!userData) return null

      try {
        return JSON.parse(userData)
      } catch (error) {
        console.error('Erro ao fazer parse dos dados do usuário:', error)
        return null
      }
    },

    triggerFileInput() {
      this.$refs.fileInput.click()
    },

    handleFileSelect(event) {
      const files = Array.from(event.target.files)
      const xmlFiles = files.filter(file =>
        file.name.toLowerCase().endsWith('.xml')
      )

      if (xmlFiles.length !== files.length && files.length > 0) {
        this.showMessage('Apenas arquivos XML são aceitos.', 'warning')
      }

      if (xmlFiles.length > 0) {
        this.addFiles(xmlFiles)
      }

      // Reset the input to allow selecting the same files again if needed
      event.target.value = ''
    },

    handleDrop(event) {
      event.preventDefault()
      this.isDragOver = false
      const files = Array.from(event.dataTransfer.files)
      const xmlFiles = files.filter(file =>
        file.name.toLowerCase().endsWith('.xml')
      )

      if (xmlFiles.length !== files.length && files.length > 0) {
        this.showMessage('Apenas arquivos XML são aceitos.', 'warning')
      }

      if (xmlFiles.length > 0) {
        this.addFiles(xmlFiles)
      }
    },

    handleDragOver(event) {
      event.preventDefault()
      this.isDragOver = true
    },

    handleDragLeave() {
      this.isDragOver = false
    },

    addFiles(files) {
      files.forEach(file => {
        if (!this.selectedFiles.some(f => f.name === file.name)) {
          this.selectedFiles.push(file)
        }
      })
      this.uploadResult = null
    },

    removeFile(index) {
      this.selectedFiles.splice(index, 1)
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    clearForm() {
      this.selectedFiles = []
      this.selectedClient = ''
      this.selectedClientData = null
      this.scheduledDate = ''
      this.isPrevision = false
      this.uploadResult = null
      this.tempMessage = null
      this.fileObservations = {} // Limpar observações dos arquivos
    },

    openClientSelectionModal() {
      this.showClientModal = true
    },

    closeClientSelectionModal() {
      this.showClientModal = false
      // Limpar pesquisa ao fechar modal
      this.clearSearch()
    },

    selectClient(client) {
      this.selectedClientData = client
      this.selectedClient = client.cnpj
      this.closeClientSelectionModal()
      console.log(
        'Cliente selecionado:',
        client.name,
        'CNPJ:',
        client.cnpj,
        'crossdocking:',
        client.crossdocking
      )

      // Aplicar lógica de crossdocking baseada no valor da coluna crossdocking
      const crossdockingValue = client.crossdocking
      console.log('🔍 [SELECT CLIENT] crossdockingValue:', {
        value: crossdockingValue,
        type: typeof crossdockingValue,
        isOne: crossdockingValue === '1' || crossdockingValue === 1,
        isTwo: crossdockingValue === '2' || crossdockingValue === 2,
      })
      if (crossdockingValue === '2' || crossdockingValue === 2) {
        // crossdocking = 2: Checkbox marcada e bloqueada
        this.isCrossdock = true
      } else if (crossdockingValue !== '1' && crossdockingValue !== 1) {
        // crossdocking diferente de 1 e 2: Resetar checkbox
        this.isCrossdock = false
      }
      // crossdocking = 1: Checkbox editável (mantém valor atual ou false)
    },

    showMessage(message, type = 'info') {
      this.tempMessage = { message, type }
      setTimeout(() => {
        this.tempMessage = null
      }, 4000)
    },

    getMessageIcon(type) {
      const icons = {
        info: 'fas fa-info-circle',
        success: 'fas fa-check-circle',
        warning: 'fas fa-exclamation-triangle',
        error: 'fas fa-exclamation-circle',
      }
      return icons[type] || icons.info
    },

    formatCNPJ(cnpj) {
      if (!cnpj) return ''
      return cnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      )
    },

    async handleSubmit() {
      if (!this.canSubmit) return

      console.log('🚀 AGENDAMENTO EM LOTE - INICIADO')
      console.log(
        '📊 Total de arquivos selecionados:',
        this.selectedFiles.length
      )
      console.log('🏢 Cliente selecionado:', {
        name: this.selectedClientData?.name,
        cnpj: this.selectedClient,
        numero: this.selectedClientData?.numero,
      })
      console.log(
        '📋 Lista de arquivos:',
        this.selectedFiles.map(f => f.name)
      )

      this.isUploading = true
      this.uploadProgress = 0
      this.uploadProgressText = 'Iniciando verificação de duplicidade...'
      this.showProgressModal = true
      this.uploadResult = null

      try {
        // Get auth token
        const token =
          localStorage.getItem('token') || localStorage.getItem('authToken')
        console.log('🔑 Token de autenticação:', token ? 'presente' : 'ausente')

        const processedFiles = []
        const totalFiles = this.selectedFiles.length
        const parsedXmlData = []

        // FASE 1: Parse de todos os XMLs e verificação de duplicidade
        console.log('🔍 FASE 1: Iniciando verificação de duplicidade')
        this.uploadProgressText = 'Verificando chaves NFe para duplicidade...'

        for (let i = 0; i < this.selectedFiles.length; i++) {
          const file = this.selectedFiles[i]

          try {
            console.log(
              `📄 Processando arquivo ${i + 1}/${totalFiles}: ${file.name}`
            )
            console.log(
              `📏 Tamanho do arquivo: ${this.formatFileSize(file.size)}`
            )

            this.uploadProgressText = `Verificando ${file.name} (${i + 1}/${totalFiles}) - Parseando XML...`
            this.uploadProgress = Math.round(((i + 0.5) / totalFiles) * 30)

            // IMPORTANTE: Ler o conteúdo do XML ANTES de enviar para parse
            // O arquivo File só pode ser lido uma vez, então precisamos ler antes
            let xmlContent = null
            try {
              xmlContent = await new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = e => {
                  resolve(e.target.result)
                }
                reader.onerror = e => {
                  reject(new Error('Erro ao ler arquivo XML'))
                }
                reader.readAsText(file, 'UTF-8')
              })
              console.log(
                `📄 [${file.name}] XML lido ANTES do parse: ${xmlContent.length} caracteres`
              )
            } catch (readError) {
              console.error(`❌ Erro ao ler XML de ${file.name}:`, readError)
              // Continuar mesmo com erro, mas xmlContent será null
            }

            // Parse XML file (criar um novo File do conteúdo lido para o parse)
            const parseFormData = new FormData()
            // Criar um novo Blob do conteúdo XML para enviar ao parse
            const xmlBlob = xmlContent
              ? new Blob([xmlContent], { type: 'text/xml' })
              : file
            const xmlFileForParse = xmlContent
              ? new File([xmlBlob], file.name, { type: 'text/xml' })
              : file
            parseFormData.append('xml_file', xmlFileForParse)

            console.log(`🔧 Enviando para parse: POST /schedules/parse-xml`)

            let parsedData
            try {
              const parseResponse = await this.$http.post(
                '/schedules/parse-xml',
                parseFormData,
                {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                  },
                }
              )

              parsedData = parseResponse.data
              console.log(
                `✅ XML parseado com sucesso. Chave NFe: ${parsedData.nfe_key}`
              )
            } catch (parseError) {
              // Se erro 409 no parse, já é duplicata detectada pelo backend
              if (parseError.response?.status === 409) {
                const errorMsg =
                  parseError.response?.data?.message ||
                  'NFe já possui agendamento ativo'
                console.log(
                  `❌ NFe é DUPLICATA detectada no parse: ${errorMsg}`
                )

                // Tentar extrair o número da NFe mesmo com erro de duplicata
                let nfeNumber = null
                try {
                  // Ler o conteúdo do arquivo (criar uma nova leitura do arquivo)
                  // Como o arquivo já foi usado no parse, precisamos criar um novo FileReader
                  const fileContent = await new Promise((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = e => resolve(e.target.result)
                    reader.onerror = e => reject(e)
                    reader.readAsText(file)
                  })

                  // Parse mínimo para extrair apenas o número da NFe
                  const parser = new DOMParser()
                  const xmlDoc = parser.parseFromString(fileContent, 'text/xml')

                  // Tentar diferentes caminhos para o número da NFe
                  const nNfElement =
                    xmlDoc.querySelector('nNF') || xmlDoc.querySelector('nf')
                  if (nNfElement) {
                    nfeNumber = nNfElement.textContent
                  }
                } catch (extractError) {
                  console.log(
                    'Não foi possível extrair número da NFe duplicada:',
                    extractError
                  )
                }

                processedFiles.push({
                  name: file.name,
                  status: 'duplicate',
                  message: errorMsg,
                })

                parsedXmlData.push({
                  file: file,
                  parsedData: null,
                  nfeData: nfeNumber ? { number: nfeNumber } : null,
                  status: 'duplicate',
                  error: errorMsg,
                })

                continue // Pular para próximo arquivo
              } else {
                // Outros erros de parse
                throw parseError
              }
            }

            // Verificar se os dados foram parseados corretamente
            // O XML pode ter diferentes estruturas: nfeProc, NFe ou enviNFe
            if (
              !parsedData.data ||
              (!parsedData.data.nfeProc &&
                !parsedData.data.NFe &&
                !parsedData.data.enviNFe)
            ) {
              console.error(
                '📛 Estrutura do XML não reconhecida:',
                parsedData.data
              )
              throw new Error(
                'Estrutura do XML não reconhecida. O arquivo pode estar corrompido.'
              )
            }

            // Verificar se temos a chave NFe
            if (!parsedData.nfe_key) {
              throw new Error('Chave de acesso NFe não encontrada no XML')
            }

            // Verificar se já existe agendamento com esta chave NFe
            this.uploadProgressText = `Verificando ${file.name} (${i + 1}/${totalFiles}) - Checando duplicidade...`
            this.uploadProgress = Math.round(((i + 1) / totalFiles) * 30)

            console.log(
              `🔍 Verificando duplicidade para NFe: ${parsedData.nfe_key}`
            )

            try {
              await this.$http.post(
                '/schedules/check-duplicate',
                {
                  nfe_key: parsedData.nfe_key,
                },
                {
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                }
              )

              // Se chegou até aqui, não é duplicata
              console.log(
                `✅ NFe ${parsedData.nfe_key} não é duplicata - pode ser processada`
              )

              // xmlContent já foi lido antes do parse, então apenas usar o valor já armazenado
              // Se por algum motivo não foi lido, tentar ler novamente
              if (!xmlContent) {
                console.warn(
                  `⚠️ XML não foi lido antes do parse, tentando ler novamente...`
                )
                try {
                  xmlContent = await new Promise((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = e => resolve(e.target.result)
                    reader.onerror = e =>
                      reject(new Error('Erro ao ler arquivo XML'))
                    reader.readAsText(file, 'UTF-8')
                  })
                  console.log(
                    `📄 XML lido após parse: ${xmlContent.length} caracteres`
                  )
                } catch (readError) {
                  console.error(`❌ Erro ao ler XML após parse:`, readError)
                }
              } else {
                console.log(
                  `📄 XML já estava disponível: ${xmlContent.length} caracteres`
                )
              }

              parsedXmlData.push({
                file: file,
                parsedData: parsedData,
                xmlContent: xmlContent, // Conteúdo do XML como texto (já lido antes)
                status: 'ready',
              })
            } catch (duplicateError) {
              // NFe já existe
              const errorMsg =
                duplicateError.response?.data?.message ||
                'NFe já possui agendamento ativo'
              console.log(
                `❌ NFe ${parsedData.nfe_key} é DUPLICATA: ${errorMsg}`
              )

              processedFiles.push({
                name: file.name,
                status: 'error',
                message: errorMsg,
              })

              parsedXmlData.push({
                file: file,
                parsedData: parsedData,
                nfeData: parsedData
                  ? {
                      number:
                        parsedData.number ||
                        parsedData.nfe_number ||
                        parsedData.nNF,
                      supplier_name: parsedData.supplier_name,
                      supplier_cnpj: parsedData.supplier_cnpj,
                    }
                  : null,
                status: 'duplicate',
                error: errorMsg,
              })
            }
          } catch (fileError) {
            console.error(`Erro ao processar ${file.name}:`, fileError)
            processedFiles.push({
              name: file.name,
              status: 'error',
              message:
                fileError.response?.data?.message ||
                'Erro ao processar arquivo XML',
            })

            parsedXmlData.push({
              file: file,
              parsedData: null,
              status: 'error',
              error: fileError.message,
            })
          }
        }

        // FASE 2: Preparar XMLs válidos para configuração de produtos
        const validXmls = parsedXmlData.filter(item => item.status === 'ready')
        const duplicateXmls = parsedXmlData.filter(
          item => item.status === 'duplicate'
        )
        const errorXmls = parsedXmlData.filter(item => item.status === 'error')

        console.log('📊 FASE 1 FINALIZADA - Resumo:')
        console.log(`   ✅ Arquivos válidos: ${validXmls.length}`)
        console.log(`   🔄 Arquivos duplicados: ${duplicateXmls.length}`)
        console.log(`   ❌ Arquivos com erro: ${errorXmls.length}`)

        // Contador de agendamentos realmente criados (declarado no escopo externo)
        let successfulSchedules = 0

        if (validXmls.length > 0) {
          console.log('🏗️ FASE 2: Preparando modal de configuração de produtos')
          this.uploadProgressText = `Preparando configuração de produtos para ${validXmls.length} arquivo(s)...`

          // Preparar dados para o modal de produtos
          this.parsedFilesForModal = []

          for (let i = 0; i < validXmls.length; i++) {
            const xmlData = validXmls[i]
            const file = xmlData.file
            const parsedData = xmlData.parsedData

            try {
              console.log(
                `📦 Criando agendamento ${i + 1}/${validXmls.length}: ${file.name}`
              )
              this.uploadProgressText = `Criando agendamento ${file.name} (${i + 1}/${validXmls.length})...`
              this.uploadProgress =
                30 + Math.round(((i + 1) / validXmls.length) * 50)

              // Transform raw XML data to expected format
              // Normalizar diferentes estruturas de XML NFe
              let nfe, emit, dest, ide, transporta

              try {
                if (parsedData.data.nfeProc) {
                  // Estrutura: nfeProc.NFe.infNFe (NFe processada com protocolo)
                  nfe = parsedData.data.nfeProc.NFe.infNFe
                } else if (parsedData.data.NFe) {
                  // Estrutura: NFe.infNFe (NFe simples sem protocolo)
                  nfe = parsedData.data.NFe.infNFe
                } else if (parsedData.data.enviNFe) {
                  // Estrutura: enviNFe.NFe (lote de NFes)
                  const nfeElement = Array.isArray(parsedData.data.enviNFe.NFe)
                    ? parsedData.data.enviNFe.NFe[0]
                    : parsedData.data.enviNFe.NFe
                  nfe = nfeElement.infNFe
                } else {
                  throw new Error('Estrutura de XML não reconhecida')
                }

                emit = nfe.emit
                dest = nfe.dest
                ide = nfe.ide

                // Extrair transportadora (pode não existir)
                transporta = nfe.transp?.transporta || null
              } catch (structureError) {
                console.error(
                  '📛 Erro ao extrair dados do XML:',
                  structureError
                )
                console.error('📛 Estrutura recebida:', parsedData.data)
                throw new Error(
                  'Não foi possível extrair dados da NFe. Estrutura do XML incompatível.'
                )
              }

              let products = []

              console.log(`📋 Dados da NFe:`)
              console.log(`   📄 Número: ${ide.nNF}`)
              console.log(`   🏢 Emitente: ${emit.xNome} (${emit.CNPJ})`)
              console.log(`   🎯 Destinatário: ${dest.xNome} (${dest.CNPJ})`)
              console.log(
                `   🚚 Transportadora: ${transporta?.xNome || 'Não informada'}`
              )

              // Transform products with detailed information - campos para schema + interface
              if (nfe.det && Array.isArray(nfe.det)) {
                products = nfe.det.map((item, index) => ({
                  id: index + 1,
                  // Campos para schema/backend
                  supp_code: item.prod.cProd,
                  cli_code: item.prod.cProd, // Em agendamentos em lote, usar o mesmo código da NFe
                  description:
                    item.prod.xProd.length > 100
                      ? item.prod.xProd.substring(0, 100)
                      : item.prod.xProd,
                  quantity: parseFloat(item.prod.qCom) || 0,
                  unit_value: parseFloat(item.prod.vUnCom) || 0,
                  latest_into_case: 1,
                  // Campos adicionais para interface
                  supplier_code: item.prod.cProd,
                  client_code: item.prod.cProd,
                  supplier_description: item.prod.xProd,
                  client_description: item.prod.xProd,
                  code: item.prod.cProd,
                  total_value: parseFloat(item.prod.vProd) || 0,
                  unit: item.prod.uCom || 'UN',
                  ean_code: item.prod.cEAN || '',
                }))
              } else if (nfe.det) {
                // Single product
                products.push({
                  id: 1,
                  // Campos para schema/backend
                  supp_code: nfe.det.prod.cProd,
                  cli_code: nfe.det.prod.cProd, // Em agendamentos em lote, usar o mesmo código da NFe
                  description:
                    nfe.det.prod.xProd.length > 100
                      ? nfe.det.prod.xProd.substring(0, 100)
                      : nfe.det.prod.xProd,
                  quantity: parseFloat(nfe.det.prod.qCom) || 0,
                  unit_value: parseFloat(nfe.det.prod.vUnCom) || 0,
                  latest_into_case: 1,
                  // Campos adicionais para interface
                  supplier_code: nfe.det.prod.cProd,
                  client_code: nfe.det.prod.cProd,
                  supplier_description: nfe.det.prod.xProd,
                  client_description: nfe.det.prod.xProd,
                  code: nfe.det.prod.cProd,
                  total_value: parseFloat(nfe.det.prod.vProd) || 0,
                  unit: nfe.det.prod.uCom || 'UN',
                  ean_code: nfe.det.prod.cEAN || '',
                })
              }

              // Calcular quantidade total de produtos (qt_prod)
              const totalQuantity = products.reduce(
                (sum, product) => sum + (product.quantity || 0),
                0
              )

              // Extrair volumes (case_count) do XML - tag <transp><vol><qVol>
              let volumeCount = 0
              if (nfe.transp && nfe.transp.vol) {
                // Pode ser array ou objeto único
                const volData = Array.isArray(nfe.transp.vol)
                  ? nfe.transp.vol[0]
                  : nfe.transp.vol
                volumeCount = parseInt(volData.qVol) || 0
              }

              // Valor total da NFe (vNF) para comparação na configuração de produtos
              const totalNfeValue =
                parseFloat(
                  String(
                    nfe.total?.ICMSTot?.vNF ?? nfe.total?.vNF ?? '0'
                  ).replace(',', '.')
                ) || 0

              // Construir dados da NFe para o modal
              const nfeData = {
                number: ide.nNF,
                nfe_key: parsedData.nfe_key || ide.Id?.replace('NFe', '') || '',
                client_cnpj: this.selectedClient,
                client_name: dest.xNome || '',
                supplier_cnpj: emit.CNPJ,
                supplier_name:
                  emit.xNome.length > 50
                    ? emit.xNome.substring(0, 50)
                    : emit.xNome,
                case_count: volumeCount, // Volumes da NFe (corrigido)
                date: new Date().toISOString().split('T')[0],
                qt_prod: totalQuantity, // Quantidade total de produtos
                total_value: totalNfeValue, // Valor total da NF-e (vNF) para conferência
                stock_location: this.selectedClientData?.name || '',
                // Dados completos da NFe para referência
                total: nfe.total || {},
                emit: emit,
                dest: dest,
                ide: ide,
                det: nfe.det,
                // Transportadora (pode ser null se não houver)
                transporta: transporta,
              }

              // Verificar se cliente requer configuração de produtos
              if (this.clientRequiresProducts) {
                // Cliente integration=1 - adicionar à lista para o modal
                // Obter xmlContent do xmlData (que foi processado anteriormente)
                const xmlContentForModal = xmlData.xmlContent || null
                this.parsedFilesForModal.push({
                  fileName: file.name,
                  nfeData: nfeData,
                  products: products,
                  originalFile: file,
                  xmlContent: xmlContentForModal, // Incluir XML para uso posterior
                })

                console.log(
                  `✅ NFe ${i + 1} preparada para configuração: ${file.name}`
                )
              } else {
                // Cliente integration=0 - criar agendamento diretamente
                console.log(
                  `🚀 NFe ${i + 1} será agendada diretamente (integration=0): ${file.name}`
                )

                // Usar a data selecionada pelo usuário
                nfeData.date = this.scheduledDate

                console.log(
                  `📅 Data selecionada para agendamento direto: ${nfeData.date}`
                )

                // Criar agendamento diretamente usando a API
                try {
                  console.log(
                    `🔄 Tentando criar agendamento para ${file.name}...`
                  )
                  // Obter o conteúdo do XML do objeto xmlData
                  const xmlContent = xmlData.xmlContent || null
                  const result = await this.createDirectSchedule(
                    nfeData,
                    products,
                    file.name,
                    xmlContent
                  )
                  successfulSchedules++
                  console.log(
                    `✅ SUCESSO! Agendamento criado! Total: ${successfulSchedules}/${validXmls.length}`
                  )
                  console.log(`📊 Resultado da criação:`, result)
                  processedFiles.push({
                    name: file.name,
                    status: 'success',
                    message: 'Agendamento criado com sucesso',
                  })
                } catch (createError) {
                  console.error(
                    `❌ ERRO ao criar agendamento para ${file.name}:`,
                    createError
                  )
                  console.error(`📋 Detalhes do erro:`, {
                    message: createError.message,
                    response: createError.response?.data,
                    status: createError.response?.status,
                  })
                  processedFiles.push({
                    name: file.name,
                    status: 'error',
                    message:
                      createError.response?.data?.error ||
                      createError.message ||
                      'Erro ao criar agendamento',
                  })
                }
              }

              this.uploadProgress =
                30 + Math.round(((i + 1) / validXmls.length) * 50)
            } catch (prepareError) {
              console.error(
                `Erro ao preparar ${file.name} para configuração:`,
                prepareError
              )
              processedFiles.push({
                name: file.name,
                status: 'error',
                message: 'Erro ao preparar arquivo para configuração',
              })
            }
          }

          console.log('🔚 LOOP DE PROCESSAMENTO FINALIZADO')
          console.log(
            `   📊 successfulSchedules ao final do loop: ${successfulSchedules}`
          )
          console.log(`   📋 processedFiles:`, processedFiles)
        }

        // FASE 3: Abrir modal de configuração de produtos
        if (this.parsedFilesForModal && this.parsedFilesForModal.length > 0) {
          console.log('🎯 FASE 3: Abrindo modal de configuração de produtos')
          console.log(
            `📊 Total de NFes para configuração: ${this.parsedFilesForModal.length}`
          )

          // Verificar se há arquivos duplicados para alertar o usuário
          const duplicateXmls = parsedXmlData.filter(
            item => item.status === 'duplicate'
          )

          if (duplicateXmls.length > 0) {
            // Mostrar aviso sobre arquivos excluídos antes de continuar
            const shouldContinue =
              await this.showDuplicateWarning(duplicateXmls)
            if (!shouldContinue) {
              this.isUploading = false
              this.uploadProgress = 0
              this.uploadProgressText = ''
              return
            }
          }

          this.uploadProgressText = 'Abrindo configuração de produtos...'
          this.uploadProgress = 90

          // Pequeno delay para mostrar progresso completo
          setTimeout(() => {
            this.showBatchProductsModal = true
            this.showProgressModal = false // Fechar modal de progresso
            this.isUploading = false // Resetar flag de upload
            this.uploadProgress = 0
            this.uploadProgressText = ''
          }, 500)

          return // Não continuar o processamento - será feito no modal
        } else {
          // Se não há NFes para configuração, pode ser que todas foram criadas diretamente (integration=0)
          if (!this.clientRequiresProducts) {
            console.log(
              `✅ FASE 3: Processamento de agendamentos diretos (integration=0) concluído`
            )
            console.log(`   📊 Total de XMLs processados: ${validXmls.length}`)
            console.log(
              `   ✅ Agendamentos criados com sucesso: ${successfulSchedules}`
            )
            console.log(
              `   ❌ Falhas: ${validXmls.length - successfulSchedules}`
            )
            console.log(
              `   🔍 Tipo de successfulSchedules: ${typeof successfulSchedules}`
            )
            console.log(
              `   🔍 Valor de successfulSchedules: ${successfulSchedules}`
            )
            console.log(
              `   🔍 Comparação (successfulSchedules > 0): ${successfulSchedules > 0}`
            )

            // Verificar se algum agendamento foi criado
            if (successfulSchedules > 0) {
              // Mostrar sucesso para agendamentos diretos
              this.uploadProgressText = 'Agendamentos criados com sucesso!'
              this.uploadProgress = 100

              setTimeout(() => {
                this.showProgressModal = false
                this.isUploading = false
                this.uploadProgress = 0
                this.uploadProgressText = ''

                // Contar erros
                const errorCount = processedFiles.filter(
                  f => f.status === 'error'
                ).length

                // Mostrar mensagem de sucesso (com ou sem avisos)
                if (errorCount > 0) {
                  alert(
                    `⚠️ Processamento concluído com avisos!\n\n✅ ${successfulSchedules} NFe(s) foram agendadas com sucesso para ${this.scheduledDate}\n❌ ${errorCount} NFe(s) falharam\n\nVerifique os logs no console para mais detalhes.`
                  )
                } else {
                  alert(
                    `✅ Agendamentos criados com sucesso!\n\n${successfulSchedules} NFe(s) foram agendadas para ${this.scheduledDate}`
                  )
                }

                // Emitir evento para atualizar badges no App.vue
                if (successfulSchedules > 0) {
                  this.$emit('schedules-created')
                  console.log(
                    '📡 Evento schedules-created emitido para App.vue (agendamento direto)'
                  )
                }

                // Limpar formulário
                this.clearForm()
              }, 1500)
            } else {
              // NENHUM agendamento foi criado - mostrar erro
              console.error('❌ ERRO: Nenhum agendamento foi criado!')

              this.uploadProgressText = 'Erro ao criar agendamentos'
              this.uploadProgress = 0

              setTimeout(() => {
                this.showProgressModal = false
                this.isUploading = false

                // Mostrar mensagem de erro detalhada
                const errorMessages = processedFiles
                  .filter(f => f.status === 'error')
                  .map(f => `• ${f.name}: ${f.message}`)
                  .join('\n')

                alert(
                  `❌ Erro ao criar agendamentos!\n\nNenhuma NFe foi agendada.\n\nDetalhes dos erros:\n${errorMessages}\n\nVerifique os logs no console para mais informações.`
                )
              }, 1500)
            }

            return
          } else {
            console.log('⚠️ FASE 3: Nenhuma NFe válida para configuração')
          }
        }

        // Mostrar resultados da verificação se não há NFes válidas
        const validCount = this.parsedFilesForModal
          ? this.parsedFilesForModal.length
          : 0
        const errorCount = processedFiles.filter(
          f => f.status === 'error'
        ).length
        const duplicateFiles = parsedXmlData.filter(
          item => item.status === 'duplicate'
        )
        const duplicateCount = duplicateFiles.length

        console.log('🎯 VERIFICAÇÃO EM LOTE - FINALIZADA')
        console.log('📊 ESTATÍSTICAS FINAIS:')
        console.log(`   ✅ Válidos para configuração: ${validCount}`)
        console.log(`   🔄 Duplicatas: ${duplicateCount}`)
        console.log(`   ❌ Erros de processamento: ${errorCount}`)

        // Se não há arquivos válidos, mostrar resultado
        if (validCount === 0) {
          this.uploadProgress = 100
          this.uploadProgressText = 'Verificação concluída!'

          let resultMessage = 'Nenhum arquivo válido para configuração'
          if (duplicateCount > 0) {
            const duplicateNumbers = duplicateFiles
              .map(item => item.nfeData?.number || 'N/A')
              .filter(num => num && num !== 'N/A')
              .join(', ')

            if (duplicateNumbers) {
              resultMessage += `. ${duplicateCount} NFe(s) já possuíam agendamento: ${duplicateNumbers}`
            } else {
              resultMessage += `. ${duplicateCount} NFe(s) já possuíam agendamento`
            }
          }
          if (errorCount > 0) {
            resultMessage += `, ${errorCount} com erro(s)`
          }

          this.uploadResult = {
            success: false,
            message: resultMessage,
            processedFiles: processedFiles,
            stats: {
              total: totalFiles,
              success: 0,
              duplicates: duplicateCount,
              errors: errorCount,
              valid_for_config: validCount,
            },
          }
        }
      } catch (error) {
        console.error('Erro no processamento em lote:', error)
        this.uploadResult = {
          success: false,
          message: 'Erro geral ao processar arquivos XML',
        }
      } finally {
        // Resetar loading se modal de produtos NÃO foi aberto
        if (!this.showBatchProductsModal) {
          this.isUploading = false

          // Iniciar timer de fechamento automático se houver resultado
          if (this.uploadResult && this.showProgressModal) {
            const closeDelay =
              this.uploadResult.success && this.uploadResult.stats?.errors === 0
                ? 5000
                : 8000

            if (this.progressModalTimer) {
              clearTimeout(this.progressModalTimer)
            }

            this.progressModalTimer = setTimeout(() => {
              this.closeProgressModal()
              console.log(
                '📱 Modal de progresso fechado automaticamente após',
                closeDelay / 1000,
                'segundos'
              )
            }, closeDelay)
          }

          setTimeout(() => {
            this.uploadProgress = 0
            this.uploadProgressText = ''
          }, 2000)
        }
      }
    },

    async showDuplicateWarning(duplicateXmls) {
      const fileNames = duplicateXmls.map(
        item => item.fileName || 'Arquivo desconhecido'
      )
      const reasons = duplicateXmls.map(
        item => item.errorMessage || 'Já possui agendamento ativo'
      )

      let warningMessage = `${duplicateXmls.length} arquivo(s) foram removidos do processo de agendamento:\n\n`

      duplicateXmls.forEach((item, index) => {
        warningMessage += `• ${fileNames[index]}\n  Motivo: ${reasons[index]}\n\n`
      })

      warningMessage += `Deseja continuar com os ${this.parsedFilesForModal.length} arquivo(s) restante(s)?`

      return new Promise(resolve => {
        // Usar confirm nativo do browser para simplicidade
        const shouldContinue = confirm(warningMessage)
        resolve(shouldContinue)
      })
    },

    closeBatchProductsModal() {
      this.showBatchProductsModal = false
      this.parsedFilesForModal = []

      // Resetar flag de upload ao fechar modal de produtos
      this.isUploading = false
      this.uploadProgress = 0
      this.uploadProgressText = ''

      // Se há um resultado de upload pendente, mostrar no modal de progresso
      // Verificar se já não há um modal aberto para evitar duplicatas
      if (this.uploadResult && !this.showProgressModal) {
        this.showProgressModal = true
        console.log(
          '📱 Reabrindo modal de progresso após fechar configuração de produtos'
        )

        // Fechar automaticamente após alguns segundos
        const closeDelay =
          this.uploadResult.success && this.uploadResult.stats?.errors === 0
            ? 5000
            : 8000

        // Limpar timer anterior se existir
        if (this.progressModalTimer) {
          clearTimeout(this.progressModalTimer)
        }

        this.progressModalTimer = setTimeout(() => {
          this.closeProgressModal()
          console.log(
            '📱 Modal de progresso fechado automaticamente após',
            closeDelay / 1000,
            'segundos'
          )
        }, closeDelay)
      }
    },

    closeProgressModal() {
      // Limpar timer existente para evitar múltiplos fechamentos
      if (this.progressModalTimer) {
        clearTimeout(this.progressModalTimer)
        this.progressModalTimer = null
      }

      this.showProgressModal = false
      this.uploadResult = null
      this.tempMessage = null

      // Limpar estado de upload quando o modal de resultado for fechado
      this.isUploading = false
      this.uploadProgress = 0
      this.uploadProgressText = ''

      console.log('📱 Modal de progresso fechado e estado limpo')
    },

    handleBatchCompleted(result) {
      console.log('🎉 Agendamento em lote concluído:', result)

      // Fechar modal de configuração de produtos
      this.closeBatchProductsModal()

      // Configurar estado para mostrar resultado final
      this.isUploading = false
      this.uploadProgress = 100
      this.uploadProgressText = 'Processamento concluído!'

      // Emitir evento para atualizar badges no App.vue
      if (result.success && result.stats && result.stats.success > 0) {
        this.$emit('schedules-created')
        console.log('📡 Evento schedules-created emitido para App.vue')
      }

      // Mostrar resultado final no modal de progresso
      this.uploadResult = {
        success: result.success,
        message: result.message,
        processedFiles: result.processedFiles || [],
        stats: result.stats || {},
      }

      // Mostrar modal de progresso com resultado APENAS se não há modal de configuração aberto
      // e se já não há um modal de progresso aberto
      if (!this.showBatchProductsModal && !this.showProgressModal) {
        this.showProgressModal = true
        console.log('📱 Mostrando modal de progresso com resultado final')

        // Fechar automaticamente após alguns segundos (sucesso em 5s, erro em 8s)
        const closeDelay =
          result.success && result.stats?.errors === 0 ? 5000 : 8000

        // Limpar timer anterior se existir
        if (this.progressModalTimer) {
          clearTimeout(this.progressModalTimer)
        }

        this.progressModalTimer = setTimeout(() => {
          this.closeProgressModal()
          console.log(
            '📱 Modal de progresso fechado automaticamente após',
            closeDelay / 1000,
            'segundos'
          )
        }, closeDelay)
      } else {
        console.log(
          '📱 Modal de configuração ainda aberto, não mostrando modal de progresso'
        )
      }

      // Limpar formulário se todos foram bem-sucedidos
      if (result.success && result.stats?.errors === 0) {
        setTimeout(() => {
          this.clearForm()
        }, 3000)
      }
    },

    handleEffectivationCompleted(data) {
      console.log(
        '📡 [EFFECTIVATION] Evento de efetivação recebido do modal:',
        data
      )

      // Marcar que o primeiro XML foi processado
      this.firstXmlProcessed = true

      // Propagar evento para App.vue
      this.$emit('effectivation-completed', data)
      console.log('📡 Evento effectivation-completed propagado para App.vue')
    },

    async createDirectSchedule(nfeData, products, fileName, xmlContent = null) {
      try {
        // Determinar se este é o primeiro XML em modo de efetivação
        const isFirstXmlInEffectivation =
          this.isEffectivating && !this.firstXmlProcessed
        const operationType = isFirstXmlInEffectivation
          ? 'PUT (EFFECTIVATE)'
          : 'POST (CREATE)'

        console.log(
          `🚀 [DIRECT SCHEDULE] ${operationType} agendamento para NFe ${nfeData.number}`
        )
        console.log(`   📋 Modo efetivação: ${this.isEffectivating}`)
        console.log(`   📋 Primeiro XML: ${!this.firstXmlProcessed}`)
        console.log(`   📋 Operação: ${operationType}`)

        const token =
          localStorage.getItem('token') || localStorage.getItem('authToken')

        // Construir objeto info com produtos e dados da NFe
        const infoObject = {
          products: products,
          nfe_data: {
            emit: nfeData.emit,
            dest: nfeData.dest,
            ide: nfeData.ide,
            det: nfeData.det,
          },
          transporta: nfeData.transporta, // Informações da transportadora
        }

        // Adicionar observações se existirem para este arquivo
        if (fileName && this.fileObservations[fileName]) {
          const observation = this.fileObservations[fileName].trim()
          if (observation) {
            infoObject.observacoes = observation
            console.log(
              `📝 [DIRECT SCHEDULE] Observações incluídas para ${fileName}:`,
              observation
            )
          }
        }

        // Construir payload apenas com campos aceitos pelo schema
        const payload = {
          number: nfeData.number,
          nfe_key: nfeData.nfe_key,
          client: this.selectedClientData.cnpj, // CNPJ do cliente selecionado (mais curto)
          case_count: nfeData.case_count || 0,
          date: nfeData.date,
          prevision: this.isPrevision ? '1' : null, // Marca se é previsão
          crossdock: this.isCrossdock ? 1 : 0, // Marca se é crossdock (1 ou 0)
          supplier: nfeData.supplier_name,
          qt_prod: nfeData.qt_prod || 0,
          is_booking: 0, // Agendamento normal (0 = efetivado)
          info: infoObject,
          created_by: this.getCurrentUser()?.user || 'xmlupload',
          xml: xmlContent, // Incluir XML cru na coluna 'xml'
        }

        // Log para debug do XML
        console.log(`📄 [DIRECT SCHEDULE] XML no payload:`, {
          hasXml: !!xmlContent,
          xmlLength: xmlContent ? xmlContent.length : 0,
          xmlPreview: xmlContent ? xmlContent.substring(0, 100) + '...' : null,
          xmlType: typeof xmlContent,
        })

        console.log(
          `📊 [DIRECT SCHEDULE] Payload para NFe ${nfeData.number}:`,
          payload
        )

        // VALIDAÇÃO: Verificar se a data do agendamento é válida (deve ser no mínimo amanhã)
        // Exceções:
        // - Previsões podem ter qualquer data
        // - Usuários com level_access !== 1 podem agendar para qualquer data
        const currentUser = this.getCurrentUser()
        const userLevel = currentUser?.level_access
        const requiresFutureDateValidation = userLevel === 1 // Apenas level 1 precisa validação

        if (payload.date && !this.isPrevision && requiresFutureDateValidation) {
          // Parse manual da data para evitar problemas de timezone
          const [year, month, day] = payload.date.split('-').map(Number)
          const scheduleDate = new Date(year, month - 1, day) // month é 0-indexed

          const today = new Date()
          today.setHours(0, 0, 0, 0) // Zerar horas para comparação apenas de data

          console.log('📅 Validação de data (level_access = 1):')
          console.log(
            '   Data do agendamento:',
            payload.date,
            '→',
            scheduleDate
          )
          console.log('   Data de hoje:', today)
          console.log(
            '   Comparação (scheduleDate <= today):',
            scheduleDate <= today
          )

          if (scheduleDate <= today) {
            const validationError = new Error('DATA_VALIDATION_ERROR')
            validationError.userMessage =
              '⚠️ Data inválida!\n\n' +
              'Os agendamentos devem ser feitos com antecedência mínima de 24 horas.\n\n' +
              'Por favor, corrija a data e tente novamente.'
            throw validationError
          }
        } else if (
          payload.date &&
          !this.isPrevision &&
          !requiresFutureDateValidation
        ) {
          console.log(
            `📅 Validação de data: Bypass para level_access !== 1 (level = ${userLevel})`
          )
        }

        let response

        if (isFirstXmlInEffectivation) {
          // EFETIVAÇÃO: Usar PUT para atualizar o agendamento prévio
          const bookingId = this.bookingToEffectivate.id
          console.log(`⬆️ [EFFECTIVATION] Efetivando agendamento #${bookingId}`)

          // Construir histórico de efetivação
          const currentUser = this.getCurrentUser()
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
          payload.historic = {
            ...existingHistoric,
            [`effectivated_${Date.now()}`]: {
              timestamp: now,
              user: currentUser?.user || 'Sistema',
              action:
                this.bookingToEffectivate.is_booking === 1
                  ? 'Agendamento prévio efetivado'
                  : 'Não agendado efetivado',
              comment: `${this.bookingToEffectivate.is_booking === 1 ? 'Agendamento prévio' : 'Não agendado'} convertido em agendamento completo com NFe ${nfeData.number}. XML processado com ${products.length} produtos.`,
              details: {
                original_booking_id: this.bookingToEffectivate.id,
                original_is_booking: this.bookingToEffectivate.is_booking,
                nfe_key: nfeData.nfe_key,
                nfe_number: nfeData.number,
                supplier: nfeData.supplier_name,
                products_count: products.length,
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
            payload.historic
          )

          response = await this.$http.put(`/schedules/${bookingId}`, payload, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          // Marcar que o primeiro XML foi processado
          this.firstXmlProcessed = true

          console.log(
            `✅ [EFFECTIVATION] Agendamento #${bookingId} efetivado com sucesso para NFe ${nfeData.number}:`,
            response.data
          )

          // Emitir evento de efetivação completa
          this.$emit('effectivation-completed', {
            bookingId: bookingId,
            scheduleData: response.data,
          })
          console.log('📡 Evento effectivation-completed emitido')
        } else {
          // CRIAÇÃO NORMAL: Usar POST para criar novo agendamento
          response = await this.$http.post('/schedules', payload, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          console.log(
            `✅ [DIRECT SCHEDULE] Agendamento criado com sucesso para NFe ${nfeData.number}:`,
            response.data
          )
        }

        return response.data
      } catch (error) {
        // Se for erro de validação de data, exibir alerta e não re-lançar
        if (error.message === 'DATA_VALIDATION_ERROR') {
          console.log(
            '⚠️ Validação de data falhou - mantendo página aberta para correção'
          )
          alert(error.userMessage || 'Data inválida')
          return null // Retorna null para indicar falha sem crash
        }

        console.error(
          `❌ [DIRECT SCHEDULE] Erro ao ${this.isEffectivating && !this.firstXmlProcessed ? 'efetivar' : 'criar'} agendamento para NFe ${nfeData.number}:`,
          error
        )
        throw error
      }
    },

    // Funções de pesquisa de clientes
    filterClients() {
      if (!this.clientSearchQuery.trim()) {
        this.filteredClients = [...this.availableClients]
        return
      }

      const searchTerm = this.clientSearchQuery.toLowerCase().trim()

      this.filteredClients = this.availableClients.filter(client => {
        // Pesquisa por nome
        const nameMatch =
          client.name && client.name.toLowerCase().includes(searchTerm)

        // Pesquisa por CNPJ (com ou sem formatação)
        const cnpjMatch =
          client.cnpj &&
          (client.cnpj.includes(searchTerm) ||
            this.formatCNPJ(client.cnpj).includes(searchTerm))

        // Pesquisa por número Corpem
        const corpemMatch =
          client.corpem_code &&
          client.corpem_code.toString().includes(searchTerm)

        return nameMatch || cnpjMatch || corpemMatch
      })

      console.log(
        `🔍 Pesquisa por "${searchTerm}": ${this.filteredClients.length} resultado(s) encontrado(s)`
      )
    },

    clearSearch() {
      this.clientSearchQuery = ''
      this.filteredClients = [...this.availableClients]
    },

    showDuplicateError(errorDetails) {
      this.duplicateErrorDetails = errorDetails
      this.showDuplicateErrorModal = true
      // Parar o processo de upload
      this.isUploading = false
      this.showProgressModal = false
    },

    closeDuplicateErrorModal() {
      this.showDuplicateErrorModal = false
      this.duplicateErrorDetails = null
      // Limpar formulário após fechar o modal
      setTimeout(() => {
        this.clearForm()
      }, 300)
    },

    openObservationsModal(file, index) {
      console.log(`📝 Abrindo modal de observações para arquivo: ${file.name}`)
      this.currentObservationFile = file
      this.currentObservationIndex = index
      this.showObservationsModal = true

      // Inicializar observação se não existir
      if (!this.fileObservations[file.name]) {
        this.$set(this.fileObservations, file.name, '')
      }
    },

    closeObservationsModal() {
      console.log('📝 Fechando modal de observações')
      this.showObservationsModal = false
      this.currentObservationFile = null
      this.currentObservationIndex = null
    },

    saveObservations() {
      const fileName = this.currentObservationFile?.name
      const observation = this.fileObservations[fileName]

      console.log(`📝 Salvando observações para ${fileName}:`, observation)

      // Fechar modal
      this.closeObservationsModal()
    },
  },
}
</script>

<style scoped>
.xml-upload-page {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-header h2 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
  margin-top: 0;
  display: block;
  width: 100%;
  line-height: 1.2;
  font-size: 2.2rem;
}

.page-header h2 i {
  margin-right: 0.5rem;
  color: #3498db;
}

.page-subtitle {
  color: #7f8c8d;
  font-size: 1rem;
  margin: 0;
  line-height: 1.3;
  max-width: 600px;
  display: block;
}

.upload-form-container {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.form-section {
  margin-bottom: 1.5rem;
}

.section-title {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.section-title i {
  margin-right: 0.5rem;
  color: #3498db;
}

.file-drop-zone {
  border: 2px dashed #bdc3c7;
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.file-drop-zone:hover,
.file-drop-zone.drag-over {
  border-color: #3498db;
  background: #e3f2fd;
}

.file-drop-zone.has-files {
  border-color: #27ae60;
  background: #e8f5e8;
}

.drop-zone-content i {
  font-size: 3rem;
  color: #bdc3c7;
  margin-bottom: 1rem;
}

.drop-zone-content p {
  font-size: 1.1rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.drop-zone-content small {
  color: #7f8c8d;
}

.selected-files-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.selected-files h4 {
  color: #27ae60;
  margin: 0;
}

.btn-add-more {
  background: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.3s ease;
}

.btn-add-more:hover {
  background: #2980b9;
}

.file-list {
  text-align: left;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 5px;
  margin-bottom: 0.5rem;
  gap: 0.75rem;
}

.file-item > i {
  color: #3498db;
  font-size: 16px;
  flex-shrink: 0;
}

.file-name {
  flex: 1;
  font-weight: 500;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: #7f8c8d;
  font-size: 13px;
  flex-shrink: 0;
}

.remove-file-btn {
  background: none;
  color: #e74c3c;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  padding: 0.25rem;
  width: 28px;
  height: 28px;
  border-radius: 4px;
}

.remove-file-btn:hover {
  background-color: #fee;
  color: #c0392b;
}

.remove-file-btn i {
  font-size: 16px;
  line-height: 1;
}

.remove-file-btn:hover {
  color: #c0392b;
}

.form-select,
.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
}

.form-select:focus,
.form-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.checkbox-container {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.form-checkbox {
  margin-right: 0.75rem;
  transform: scale(1.2);
}

.checkbox-label {
  font-weight: 500;
  color: #2c3e50;
  cursor: pointer;
}

.checkbox-label i {
  margin-right: 0.5rem;
  color: #3498db;
}

.help-text {
  color: #7f8c8d;
  font-size: 0.9rem;
  line-height: 1.4;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.btn {
  padding: 0.75rem 2rem;
  border-radius: 5px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.btn-primary {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
  border-color: #2980b9;
}

.btn-primary:disabled {
  background: #bdc3c7;
  border-color: #bdc3c7;
  cursor: not-allowed;
}

.btn-outline-secondary {
  background: transparent;
  color: #6c757d;
  border-color: #6c757d;
}

.btn-outline-secondary:hover:not(:disabled) {
  background: #6c757d;
  color: white;
}

.upload-progress {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background: #ecf0f1;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3498db, #2ecc71);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  color: #2c3e50;
  font-weight: 500;
}

.temp-message,
.upload-result {
  margin-top: 2rem;
}

.temp-message .alert {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert {
  padding: 1.5rem;
  border-radius: 10px;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.alert i {
  font-size: 1.5rem;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.alert h4 {
  margin: 0 0 0.5rem 0;
}

.alert p {
  margin: 0 0 1rem 0;
}

.alert ul {
  margin: 0;
  padding-left: 1.5rem;
}

.alert-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-success i {
  color: #28a745;
}

.alert-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert-error i {
  color: #dc3545;
}

.alert-warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.alert-warning i {
  color: #f39c12;
}

.alert-info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.alert-info i {
  color: #17a2b8;
}

/* Client Selection Styles */
.client-selection-area {
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
  overflow: hidden;
}

.selected-client-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border: 2px solid #27ae60;
}

.selected-client-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.selected-client-info i {
  color: #27ae60;
  font-size: 1.2rem;
}

.client-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.client-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
}

.client-cnpj {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.client-numero {
  color: #7f8c8d;
  font-size: 0.85rem;
}

.btn-change-client {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.no-client-selected {
  padding: 2rem;
  text-align: center;
}

.no-client-text {
  color: #7f8c8d;
  margin-bottom: 1rem;
}

.btn-select-client {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  background: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.modal-body {
  padding: 0;
  flex: 1;
  overflow-y: auto;
}

.loading-clients-container {
  padding: 3rem;
  text-align: center;
}

.loading-spinner i {
  font-size: 2rem;
  color: #3498db;
  margin-bottom: 1rem;
}

.loading-text {
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.loading-subtext {
  color: #7f8c8d;
}

.estoque-lista-vertical {
  padding: 1rem;
}

.estoque-lista-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  background: white;
  transition: all 0.3s ease;
}

.estoque-lista-item:hover {
  border-color: #3498db;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
}

.estoque-lista-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.estoque-lista-info i {
  color: #3498db;
  font-size: 1.2rem;
}

.estoque-nome {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.1rem;
}

.estoque-cnpj {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-left: 1rem;
}

.estoque-numero {
  color: #7f8c8d;
  font-size: 0.85rem;
  margin-left: 0.5rem;
}

.btn-selecionar-estoque {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  white-space: nowrap;
}

.estoque-lista-vazia {
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
}

.estoque-lista-vazia i {
  font-size: 2rem;
  margin-bottom: 1rem;
  display: block;
}

.access-denied {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.access-denied-content {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 500px;
}

.access-denied-content i {
  font-size: 4rem;
  color: #e74c3c;
  margin-bottom: 2rem;
}

.access-denied-content h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 2rem;
}

.access-denied-content p {
  color: #7f8c8d;
  line-height: 1.6;
  margin-bottom: 1rem;
}

/* Progress Modal Styles */
.progress-modal-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background-color: rgba(0, 0, 0, 0.7) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  z-index: 10000 !important;
  padding: 1rem !important;
}

.progress-modal-content {
  background: white !important;
  border-radius: 12px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
  position: relative !important;
  max-width: 600px !important;
  width: 90% !important;
  max-height: 80vh !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
}

.progress-modal-content .modal-header {
  padding: 1.5rem 2rem !important;
  border-bottom: 1px solid #e9ecef !important;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  flex-shrink: 0 !important;
}

.progress-modal-content .modal-header h3 {
  margin: 0 !important;
  color: #343a40 !important;
  font-size: 1.25rem !important;
  font-weight: 600 !important;
  display: flex !important;
  align-items: center !important;
  gap: 0.5rem !important;
}

.progress-modal-content .modal-body {
  flex: 1 !important;
  padding: 2rem !important;
  overflow-y: auto !important;
}

.progress-modal-content .modal-footer {
  padding: 1.5rem 2rem !important;
  border-top: 1px solid #e9ecef !important;
  background: #f8f9fa !important;
  display: flex !important;
  justify-content: center !important;
  flex-shrink: 0 !important;
}

.modal-close-btn {
  background: none !important;
  border: none !important;
  font-size: 1.5rem !important;
  color: #6c757d !important;
  cursor: pointer !important;
  padding: 0.5rem !important;
  line-height: 1 !important;
  border-radius: 6px !important;
  transition: all 0.2s !important;
}

.modal-close-btn:hover {
  background-color: #f8f9fa !important;
  color: #dc3545 !important;
}

@media (max-width: 768px) {
  .xml-upload-page {
    padding: 1rem;
  }

  .upload-form-container {
    padding: 1.5rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .progress-modal-content {
    max-width: 95% !important;
    width: 95% !important;
    margin: 1rem !important;
  }

  .progress-modal-content .modal-body {
    padding: 1.5rem !important;
  }
}

/* Estilos para pesquisa de clientes */
.search-container {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  background-color: #f8f9fa;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #6c757d;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  background-color: white;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.search-input::placeholder {
  color: #adb5bd;
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  color: #495057;
  background-color: #f1f3f4;
}

.search-results-info {
  margin-top: 8px;
  font-size: 12px;
  color: #6c757d;
  text-align: center;
}

.search-results-info span {
  background-color: #e9ecef;
  padding: 4px 8px;
  border-radius: 12px;
}

/* Estilos para items clicáveis de estoque */
.clickable-item {
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  border-radius: 8px !important;
  margin-bottom: 8px !important;
  padding: 16px !important;
  border: 2px solid #e9ecef !important;
  background-color: white !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
}

.clickable-item:hover {
  background-color: #f8f9fa !important;
  border-color: #007bff !important;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15) !important;
  transform: translateY(-1px) !important;
}

.clickable-item:active {
  transform: translateY(0) !important;
  box-shadow: 0 1px 3px rgba(0, 123, 255, 0.2) !important;
}

.estoque-lista-info {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
}

.estoque-lista-arrow {
  color: #6c757d !important;
  font-size: 16px !important;
  transition: all 0.2s ease !important;
}

.clickable-item:hover .estoque-lista-arrow {
  color: #007bff !important;
  transform: translateX(4px) !important;
}

/* Melhorar espaçamento dos textos */
.estoque-nome {
  font-weight: 600 !important;
  color: #495057 !important;
  font-size: 16px !important;
  margin-bottom: 4px !important;
}

.estoque-cnpj,
.estoque-numero {
  font-size: 14px !important;
  color: #6c757d !important;
}

/* Estilos para modal de seleção de estoque ocupar 95% da altura */
.estoque-selection-modal {
  max-height: 95vh !important;
  height: 95vh !important;
  max-width: 800px !important;
  width: 90% !important;
  margin: 2.5vh auto !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

.estoque-selection-modal .modal-body {
  flex: 1 !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
}

.estoque-lista-vertical {
  flex: 1 !important;
  overflow-y: auto !important;
  padding: 1rem !important;
}

/* Ajustar altura do container de pesquisa */
.search-container {
  flex-shrink: 0 !important;
}

/* Estilos para o banner de efetivação */
.effectivation-banner {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border: 2px solid #2196f3;
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.15);
}

.effectivation-banner-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.effectivation-icon {
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  background: #2196f3;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.effectivation-info {
  flex: 1;
  min-width: 0; /* Permite que o flex item encolha abaixo do tamanho do conteúdo */
}

.effectivation-info h3 {
  margin: 0 0 0.5rem 0;
  color: #1565c0;
  font-size: 1.2rem;
  font-weight: 600;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Badges de informação */
.effectivation-badges {
  display: flex;
  gap: 0.75rem;
  margin: 0 0 0.75rem 0;
  flex-wrap: wrap;
}

.info-badge {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 1rem;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 6px rgba(33, 150, 243, 0.1);
  flex: 1;
  min-width: 0;
  transition: all 0.2s ease;
}

.info-badge:hover {
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 3px 10px rgba(33, 150, 243, 0.15);
  transform: translateY(-1px);
}

.info-badge i {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.badge-storage {
  border-left: 4px solid #4caf50;
}

.badge-storage i {
  color: #4caf50;
}

.badge-date {
  border-left: 4px solid #ff9800;
}

.badge-date i {
  color: #ff9800;
}

.badge-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  flex: 1;
}

.badge-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
}

.badge-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.effectivation-instruction {
  margin: 0;
  padding: 1rem;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border: 1px solid #2196f3;
  border-left: 4px solid #1976d2;
  border-radius: 8px;
  color: #0d47a1;
  font-size: 0.95rem;
  line-height: 1.7;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  word-wrap: break-word;
  overflow-wrap: break-word;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15);
}

.effectivation-instruction i {
  color: #1976d2;
  font-size: 1.1rem;
  margin-top: 3px;
  flex-shrink: 0;
}

.effectivation-instruction strong {
  font-weight: 600;
  color: #0d47a1;
  white-space: nowrap;
}

.effectivation-instruction span {
  flex: 1;
}

@media (max-width: 768px) {
  .effectivation-banner {
    padding: 1rem;
  }

  .effectivation-banner-content {
    flex-direction: column;
    gap: 0.75rem;
  }

  .effectivation-icon {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }

  .effectivation-info h3 {
    font-size: 1rem;
  }

  .effectivation-badges {
    flex-direction: column;
    gap: 0.5rem;
  }

  .info-badge {
    flex: 1 1 100%;
    padding: 0.5rem 0.75rem;
  }

  .info-badge i {
    font-size: 1.1rem;
  }

  .badge-label {
    font-size: 0.65rem;
  }

  .badge-value {
    font-size: 0.875rem;
  }

  .effectivation-instruction {
    font-size: 0.85rem;
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .effectivation-instruction i {
    font-size: 1rem;
  }
}

/* Date with Prevision - Container horizontal */
.date-with-prevision {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.date-with-prevision .form-control {
  flex: 0 0 auto;
  width: auto;
  min-width: 180px;
}

/* Prevision Checkbox Styles */
.date-with-prevision .prevision-checkbox-container {
  display: flex;
  align-items: center;
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  flex-shrink: 0;
}

.prevision-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
  margin: 0;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  white-space: nowrap;
}

.prevision-checkbox-label:hover {
  background: rgba(37, 99, 235, 0.05);
}

.prevision-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #2563eb;
  transition: all 0.3s ease;
}

.prevision-label-text {
  font-size: 0.95rem;
  font-weight: 500;
  color: #374151;
  opacity: 0.6;
  transition: all 0.3s ease;
}

.prevision-checkbox:checked + .prevision-label-text {
  opacity: 1;
  font-weight: 600;
  color: #2563eb;
}

.prevision-checkbox-label:hover .prevision-label-text {
  opacity: 0.85;
}

.prevision-checkbox:checked {
  transform: scale(1.1);
}

/* Botão de observações na lista de arquivos */
.observation-file-btn {
  padding: 0.25rem 0.5rem;
  background: linear-gradient(135deg, #1c44f5, #0077ff);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-shrink: 0;
  height: 28px;
  position: relative;
  box-shadow: 0 2px 4px rgba(28, 68, 245, 0.2);
}

.observation-file-btn i {
  font-size: 13px;
}

.observation-file-btn .obs-text {
  font-size: 11px;
  font-weight: 600;
  text-transform: lowercase;
  letter-spacing: 0.3px;
}

.observation-file-btn:hover {
  background: linear-gradient(135deg, #1538d1, #0066e6);
  transform: scale(1.05);
  box-shadow: 0 3px 8px rgba(28, 68, 245, 0.3);
}

.observation-file-btn.has-observation {
  background: linear-gradient(135deg, #28a745, #20c997);
  box-shadow: 0 2px 4px rgba(40, 167, 69, 0.2);
}

.observation-file-btn.has-observation:hover {
  background: linear-gradient(135deg, #218838, #1aa179);
  box-shadow: 0 3px 8px rgba(40, 167, 69, 0.3);
}

.observation-file-btn .obs-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: #fff;
  color: #28a745;
  font-size: 10px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  border: 1.5px solid #28a745;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

/* Modal de Observações */
.observations-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(2px);
}

.observations-modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.observations-modal-header {
  padding: 20px 24px;
  border-bottom: 2px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.observations-modal-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.observations-modal-header .btn-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.observations-modal-header .btn-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.observations-modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.observations-instruction {
  margin-bottom: 16px;
  padding: 12px 16px;
  background-color: #e7f3ff;
  border-left: 4px solid #2196f3;
  border-radius: 4px;
  color: #1565c0;
  font-size: 14px;
  display: flex;
  align-items: start;
  gap: 10px;
}

.observations-instruction i {
  margin-top: 2px;
}

.file-info-display {
  margin-bottom: 16px;
  padding: 10px 14px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #495057;
  font-size: 14px;
}

.file-info-display i {
  color: #6c757d;
}

.observations-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  min-height: 180px;
  transition: border-color 0.2s ease;
}

.observations-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.observations-counter {
  margin-top: 8px;
  text-align: right;
  font-size: 12px;
  color: #6c757d;
}

.observations-modal-footer {
  padding: 16px 24px;
  border-top: 2px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background-color: #f8f9fa;
}

.observations-modal-footer .btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.observations-modal-footer .btn-secondary {
  background-color: #6c757d;
  color: white;
}

.observations-modal-footer .btn-secondary:hover {
  background-color: #5a6268;
  transform: translateY(-1px);
}

.observations-modal-footer .btn-success {
  background-color: #28a745;
  color: white;
}

.observations-modal-footer .btn-success:hover {
  background-color: #218838;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}
</style>
