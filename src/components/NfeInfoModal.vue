<template>
  <div v-if="showModal" class="modal-overlay" @click="handleModalClick">
    <div class="modal-content nfe-info-modal large" ref="modal" tabindex="-1">
      <!-- Header -->
      <div class="modal-header">
        <!-- Linha do título com botão fechar -->
        <div class="header-title-row">
          <h3>
            <i
              :class="
                isBookingSchedule ? 'fas fa-bookmark' : 'fas fa-file-invoice'
              "
            ></i>
            {{
              isBookingSchedule
                ? 'Informações da Marcação'
                : 'Informações da NF-e'
            }}
          </h3>
          <button class="btn-close" @click="closeModal" title="Fechar">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Linha dos botões de ação -->
        <div class="header-buttons">
          <!-- Dropdown para alterar status quando está em Tratativa -->
          <div
            v-if="canChangeStatusFromTratativa"
            class="status-change-dropdown"
          >
            <select
              v-model="selectedNewStatus"
              @change="changeStatusFromTratativa"
              class="form-select form-select-sm"
              title="Alterar status do agendamento"
            >
              <option value="">Alterar Status</option>
              <option
                v-for="status in availableStatusOptions"
                :key="status.value"
                :value="status.value"
              >
                {{ status.label }}
              </option>
            </select>
          </div>

          <button
            v-if="canMarkAsTratativa"
            class="btn btn-sm btn-warning"
            @click="markAsTratativa"
            title="Marcar como Em Tratativa"
          >
            <i class="fas fa-exclamation-triangle"></i> Em Tratativa
          </button>
          <button
            v-if="canCancelSchedule"
            class="btn btn-sm btn-danger"
            @click="cancelSchedule"
            title="Cancelar Agendamento"
          >
            <i class="fas fa-times-circle"></i> Cancelar
          </button>
          <button
            v-if="canIntegrateCorpem"
            class="btn btn-sm btn-success"
            @click="integrateCorpem"
            :disabled="integratingCorpem"
            title="Integrar com CORPEM"
          >
            <i v-if="integratingCorpem" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-exchange-alt"></i>
            Integração
          </button>
          <button
            v-if="canEditSchedule"
            class="btn btn-sm btn-outline-primary"
            @click="openEditModal"
            title="Editar Agendamento"
          >
            <i class="fas fa-cog"></i> Editar
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div v-if="nfeData" class="modal-tabs">
        <button
          v-for="(section, key) in formattedNfeData"
          :key="key"
          :class="['tab-button', { active: activeTab === key }]"
          @click="setActiveTab(key)"
        >
          <i :class="section.icon"></i>
          {{ section.title }}
        </button>
        <!-- Aba NF-e (PDF) - apenas se houver informações do XML -->
        <button
          v-if="hasNfeXmlInfo"
          :class="['tab-button', { active: activeTab === 'nfe-pdf' }]"
          @click="setActiveTab('nfe-pdf')"
        >
          <i class="fas fa-file-pdf"></i>
          NF-e
        </button>
        <!-- Aba Prod. JSON - apenas para agendamentos via API com Pronta Integração -->
        <button
          v-if="hasProntaIntegracao && corpemProductsJson"
          :class="['tab-button', { active: activeTab === 'prod-json' }]"
          @click="setActiveTab('prod-json')"
        >
          <i class="fas fa-cubes"></i>
          Prod. JSON
        </button>
        <!-- Aba NF-e JSON - apenas para agendamentos via API com Pronta Integração -->
        <button
          v-if="hasProntaIntegracao && corpemNfJson"
          :class="['tab-button', { active: activeTab === 'nfe-json' }]"
          @click="setActiveTab('nfe-json')"
        >
          <i class="fas fa-file-code"></i>
          NF-e JSON
        </button>
        <!-- Aba Dev - apenas para usuários com level_access !== 1 -->
        <button
          v-if="canViewDevTab"
          :class="['tab-button', { active: activeTab === 'dev' }]"
          @click="setActiveTab('dev')"
        >
          <i class="fas fa-code"></i>
          Dev
        </button>
      </div>

      <!-- Content -->
      <div class="modal-body">
        <!-- No Data Warning -->
        <div v-if="!nfeData" class="alert alert-warning">
          <i class="fas fa-exclamation-triangle"></i>
          <strong>Aviso:</strong> Não há dados disponíveis para exibir.
        </div>

        <!-- General Tab -->
        <div v-else-if="activeTab === 'general'" class="tab-content">
          <div class="info-grid">
            <div
              v-for="(value, key) in formattedNfeData.general.data"
              :key="key"
              class="info-item"
            >
              <label>{{ key }}:</label>
              <span :class="key === 'Chave da NF-e' ? 'nfe-key' : ''">{{
                value || '-'
              }}</span>
            </div>
          </div>

          <!-- Contextual Information Card (for booking/not scheduled) -->
          <div
            v-if="getContextualInfo()"
            :class="[
              'info-item',
              'contextual-info-item',
              { 'booking-context-highlight': isBookingSchedule },
              {
                'not-scheduled-context-highlight':
                  Number(nfeData.is_booking) === 2,
              },
            ]"
          >
            <label>
              <i :class="getContextualIcon()"></i>
              {{ getContextualLabel() }}
            </label>
            <span class="contextual-info-text">
              {{ getContextualInfo() }}
            </span>
          </div>

          <!-- Observations Card -->
          <div :class="['info-item', 'observations-item']">
            <label>
              <i class="fas fa-sticky-note"></i>
              Observações do Agendamento:
            </label>
            <span
              v-if="getObservations() && getObservations().trim()"
              class="observations-text"
            >
              {{ getObservations() }}
            </span>
            <span v-else class="no-observations">
              <i class="fas fa-info-circle"></i>
              <em>Não há observações para este agendamento</em>
            </span>
          </div>
        </div>

        <!-- Products Tab / Prod. Integrados Tab -->
        <div v-else-if="activeTab === 'products'" class="tab-content">
          <!-- Mensagens apenas para agendamentos normais (não API) -->
          <div
            v-if="!isApiSchedule && hasInutilizedProducts"
            class="products-inutilizados-info"
            role="status"
          >
            <i class="fas fa-info-circle"></i>
            <span
              >Os itens em <strong>destaque (linhas avermelhadas)</strong> foram
              inutilizados no agendamento e não serão integrados ao
              CorpEM.</span
            >
          </div>
          <div
            v-if="!isApiSchedule && hasAddedProducts"
            class="products-adicionados-info"
            role="status"
          >
            <i class="fas fa-info-circle"></i>
            <span
              >Produtos <strong>sem código do fornecedor</strong> foram
              adicionados durante o agendamento e não constam na NF.</span
            >
          </div>
          <!-- Tabela Prod. Integrados (agendamentos via API) -->
          <div
            v-if="isApiSchedule && formattedNfeData.products.data.length > 0"
            class="products-table-container"
          >
            <table class="products-table">
              <thead>
                <tr>
                  <th>Cód. Produto</th>
                  <th>Desc. Produto</th>
                  <th>Quant</th>
                  <th>Valor Unit.</th>
                  <th>Valor Total</th>
                  <th>Cód. Barras</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(product, index) in formattedNfeData.products.data"
                  :key="product.id || index"
                  @click="selectProduct(index)"
                  :class="{
                    'product-row-odd': index % 2 === 1,
                    'product-row-selected': selectedProductIndex === index,
                  }"
                  class="product-row"
                >
                  <td>{{ product.cod_produto || '-' }}</td>
                  <td>{{ product.desc_produto || '-' }}</td>
                  <td>{{ product.quantidade }} {{ product.embalagem }}</td>
                  <td>{{ formatCurrency(product.valor_unit) }}</td>
                  <td>{{ formatCurrency(product.valor_total) }}</td>
                  <td>{{ product.cod_barras || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- Tabela Produtos (agendamentos normais) -->
          <div
            v-else-if="
              !isApiSchedule && formattedNfeData.products.data.length > 0
            "
            class="products-table-container"
          >
            <table class="products-table">
              <thead>
                <tr>
                  <th>Cód. Fornecedor</th>
                  <th>Cód. Venda</th>
                  <th>Descrição Venda</th>
                  <th>Quantidade</th>
                  <th>Valor Unit.</th>
                  <th>Valor Total</th>
                  <th>Código EAN</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(product, index) in formattedNfeData.products.data"
                  :key="product.id || index"
                  @click="selectProduct(index)"
                  :class="{
                    'product-row-odd': index % 2 === 1,
                    'product-row-selected': selectedProductIndex === index,
                    'product-row-inutilizado': isProductInutilizado(product),
                  }"
                  class="product-row"
                  :title="
                    isProductInutilizado(product)
                      ? 'Item inutilizado no agendamento – não será integrado ao CorpEM'
                      : null
                  "
                >
                  <td>
                    {{
                      product.supplier_code ||
                      product.supp_code ||
                      product.suppCode ||
                      product.code ||
                      '-'
                    }}
                  </td>
                  <td>
                    {{
                      product.client_code ||
                      product.cli_code ||
                      product.cliCode ||
                      product.code ||
                      '-'
                    }}
                  </td>
                  <td>
                    {{
                      product.client_description ||
                      product.cli_desc ||
                      product.description ||
                      '-'
                    }}
                  </td>
                  <td>{{ product.quantity }} {{ product.unit }}</td>
                  <td>{{ formatCurrency(product.unit_value) }}</td>
                  <td>{{ formatCurrency(getProductTotal(product)) }}</td>
                  <td>{{ product.ean_code || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">
            <i
              :class="isBookingSchedule ? 'fas fa-bookmark' : 'fas fa-box-open'"
            ></i>
            <h3 v-if="isBookingSchedule">Agendamento de Marcação</h3>
            <h3 v-else-if="isApiSchedule">Nenhum produto integrado</h3>
            <h3 v-else>Nenhum produto encontrado</h3>
            <p v-if="isBookingSchedule">
              Este é um agendamento de marcação. Os produtos serão adicionados
              quando a NF-e for processada.
            </p>
            <p v-else-if="isApiSchedule">
              Este agendamento via API não possui dados de pronta-integração
              (corpem_products_integration / corpem_nf_integration).
            </p>
            <p v-else>Nenhum produto foi encontrado neste agendamento.</p>
          </div>
        </div>

        <!-- NF-e PDF Tab -->
        <div
          v-else-if="activeTab === 'nfe-pdf'"
          class="tab-content nfe-pdf-tab-content"
        >
          <div v-if="nfePdfUrl" class="nfe-pdf-container">
            <iframe
              :src="nfePdfUrl"
              class="nfe-pdf-iframe"
              frameborder="0"
              title="PDF da NF-e"
            ></iframe>
          </div>
          <div v-else-if="loadingNfePdf" class="nfe-pdf-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Carregando PDF da NF-e...</p>
          </div>
          <div v-else-if="nfePdfError" class="nfe-pdf-error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>PDF não disponível</h3>
            <p>{{ nfePdfError.message }}</p>
            <p v-if="nfePdfError.suggestion" class="nfe-pdf-error-suggestion">
              {{ nfePdfError.suggestion }}
            </p>
            <div v-if="nfePdfError.nfeKey" class="nfe-pdf-error-actions">
              <a
                :href="getSefazUrl(nfePdfError.nfeKey)"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-sm btn-outline-primary"
              >
                <i class="fas fa-external-link-alt"></i>
                Consultar na SEFAZ
              </a>
            </div>
          </div>
          <div v-else class="empty-state">
            <i class="fas fa-file-pdf"></i>
            <h3>PDF da NF-e não disponível</h3>
            <p v-if="!hasNfeXmlInfo">
              Este agendamento não possui informações do XML armazenadas na
              coluna 'xml'.
            </p>
            <p v-else>
              Não foi possível carregar o PDF da NF-e para este agendamento.
            </p>
            <p v-if="nfeData && nfeData.nfe_key" class="nfe-key-info">
              Chave de acesso: {{ nfeData.nfe_key }}
            </p>
          </div>
        </div>

        <!-- Prod. JSON Tab (corpem_products_integration) -->
        <div v-else-if="activeTab === 'prod-json'" class="tab-content json-tab">
          <div class="json-section-container">
            <div class="request-section">
              <div class="section-title">
                <i class="fas fa-cubes"></i>
                Cadastro de Mercadorias — enviado ao WMS
              </div>
              <pre class="code-block">{{ formatJSON(corpemProductsJsonSent) }}</pre>
            </div>
          </div>
        </div>

        <!-- NF-e JSON Tab (corpem_nf_integration) -->
        <div v-else-if="activeTab === 'nfe-json'" class="tab-content json-tab">
          <div class="json-section-container">
            <div class="request-section">
              <div class="section-title">
                <i class="fas fa-file-code"></i>
                NF de Entrada — enviado ao WMS
              </div>
              <pre class="code-block">{{ formatJSON(corpemNfJsonSent) }}</pre>
            </div>
          </div>
        </div>

        <!-- Dev Tab -->
        <div v-else-if="activeTab === 'dev'" class="tab-content dev-tab">
          <div
            v-if="requestsData && requestsData.length > 0"
            class="requests-container"
          >
            <div
              v-for="(req, index) in requestsData"
              :key="index"
              class="request-entry"
            >
              <!-- Header clicável -->
              <div
                class="request-header clickable"
                @click="toggleRequest(index)"
              >
                <div class="request-header-left">
                  <i
                    class="fas chevron-icon"
                    :class="
                      isRequestExpanded(index)
                        ? 'fa-chevron-down'
                        : 'fa-chevron-right'
                    "
                  ></i>
                  <span class="request-number">#{{ index + 1 }}</span>
                  <span
                    class="request-status-badge"
                    :class="req.success ? 'success' : 'error'"
                  >
                    {{ req.success ? 'Sucesso' : 'Erro' }}
                  </span>
                  <span v-if="req.integration_type" class="request-type-badge">
                    {{
                      req.integration_type === 'products' ? 'Produtos' : 'NF-e'
                    }}
                  </span>
                </div>
                <span class="request-date">{{
                  formatDateTime(req.timestamp)
                }}</span>
              </div>

              <!-- Conteúdo colapsável -->
              <div v-show="isRequestExpanded(index)" class="request-content">
                <!-- Resposta (sempre visível ao expandir a entrada) -->
                <div class="response-section">
                  <div class="section-title">
                    <i class="fas fa-arrow-down"></i>
                    Resposta
                  </div>
                  <pre class="code-block">{{ formatJSON(req.response && req.response.data !== undefined ? req.response.data : req.response) }}</pre>
                </div>

                <!-- Requisição (sub-dropdown) -->
                <div class="request-section">
                  <div
                    class="section-title clickable"
                    @click="toggleRequisicao(index)"
                  >
                    <i
                      class="fas chevron-icon"
                      :class="isRequisicaoExpanded(index) ? 'fa-chevron-down' : 'fa-chevron-right'"
                    ></i>
                    <i class="fas fa-arrow-up"></i>
                    Requisição
                  </div>
                  <pre v-show="isRequisicaoExpanded(index)" class="code-block">{{ formatJSON(normalizeCorpemPayload(req.request && req.request.payload ? req.request.payload : req.request)) }}</pre>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <i class="fas fa-code"></i>
            <h3>Nenhuma requisição encontrada</h3>
            <p>
              Este agendamento ainda não possui requisições registradas no
              CorpEM.
            </p>
          </div>
        </div>

        <!-- History Tab -->
        <div
          v-else-if="activeTab === 'history'"
          class="tab-content history-tab-content"
        >
          <div
            v-if="
              formattedNfeData.history &&
              formattedNfeData.history.data.length > 0
            "
            class="history-container"
          >
            <div class="history-timeline">
              <div
                v-for="entry in formattedNfeData.history.data"
                :key="entry.id"
                class="history-entry"
              >
                <div class="history-icon">
                  <i :class="getHistoryIcon(entry.action)"></i>
                </div>
                <div class="history-content">
                  <div class="history-header">
                    <h5 class="history-action">{{ entry.action }}</h5>
                    <span class="history-timestamp">{{ entry.timestamp }}</span>
                  </div>
                  <div class="history-user">
                    <i class="fas fa-user"></i>
                    Por: <strong>{{ entry.user }}</strong>
                  </div>
                  <div
                    v-if="entry.changes && entry.changes.length > 0"
                    class="history-changes"
                  >
                    <div class="changes-grid">
                      <div
                        v-for="change in entry.changes"
                        :key="change"
                        class="change-item"
                      >
                        <div class="change-field">
                          {{ change.split(':')[0].trim() }}
                        </div>
                        <div class="change-values">
                          {{ change.split(':')[1].trim() }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="
                      entry.comment &&
                      !entry.comment.startsWith('Alterações realizadas:')
                    "
                    class="history-comment"
                  >
                    <i class="fas fa-comment"></i>
                    <span>{{ entry.comment }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <i class="fas fa-history"></i>
            <h3>Nenhum histórico encontrado</h3>
            <p>Este agendamento ainda não possui histórico de alterações.</p>
          </div>
        </div>
      </div>

      <!-- Footer removido - informação de última atualização não será mais exibida -->

      <!-- Copy Success Toast -->
      <div v-if="copySuccess" class="copy-toast">
        <i class="fas fa-check"></i>
        Copiado para área de transferência!
      </div>
    </div>
  </div>
</template>

<script>
import apiService from '../services/api.js'
import { BASE_URL } from '../config/api.js'

export default {
  name: 'NfeInfoModal',

  props: {
    nfeData: {
      type: Object,
      default: () => ({}),
    },
    showModal: {
      type: Boolean,
      default: false,
    },
    user: {
      type: Object,
      default: null,
    },
  },

  data() {
    return {
      activeTab: 'general',
      expandedSections: {},
      copySuccess: false,
      selectedNewStatus: '',
      reprocessing: false,
      integratingCorpem: false,
      nfePdfUrl: null,
      loadingNfePdf: false,
      nfePdfError: null, // Objeto com mensagem e nfeKey quando o backend retorna erro ao gerar PDF
      expandedRequests: [], // Array de índices das requisições expandidas
      expandedRequisicoes: [], // Array de índices dos sub-dropdowns de Requisição expandidos
      scrollbarKeepAliveInterval: null, // Intervalo para manter scrollbar visível
      selectedProductIndex: null, // Índice do produto selecionado na tabela
      devPollingInterval: null, // Polling da aba Dev em tempo real
    }
  },

  computed: {
    // Verificar se é agendamento de marcação PRÉVIO (is_booking = 1)
    isBookingSchedule() {
      if (!this.nfeData) return false

      const isBookingNum = Number(this.nfeData.is_booking)

      // IMPORTANTE: Retornar true APENAS para is_booking = 1 (prévio/marcação)
      // is_booking = 2 (não agendado) deve retornar false
      if (isBookingNum !== 1) {
        return false
      }

      // Verificações adicionais para confirmar que é uma marcação válida
      const hasRealNfeKey =
        this.nfeData.nfe_key &&
        this.nfeData.nfe_key.length > 10 &&
        !this.nfeData.nfe_key.startsWith('effectivate_')

      const isEffectivated = this.nfeData.info?.type === 'nfe_schedule'

      // É marcação prévio se is_booking = 1 e não foi efetivada
      return !hasRealNfeKey && !isEffectivated
    },

    formattedNfeData() {
      if (!this.nfeData) {
        return {
          general: {
            title: 'Informações Gerais',
            icon: 'fas fa-file-alt',
            data: {},
          },
          products: {
            title: 'Produtos',
            icon: 'fas fa-boxes',
            data: [],
          },
          history: {
            title: 'Histórico',
            icon: 'fas fa-history',
            data: [],
          },
        }
      }

      // Verificar se é uma marcação (agendamento de marcação)
      const isBooking = this.isBookingSchedule

      return {
        general: {
          title: isBooking ? 'Informações da Marcação' : 'Informações Gerais',
          icon: isBooking ? 'fas fa-bookmark' : 'fas fa-file-alt',
          data: isBooking ? this.getBookingData() : this.getNfeData(),
        },
        products: {
          title: this.isApiSchedule ? 'Prod. Integrados' : 'Produtos',
          icon: 'fas fa-boxes',
          data: this.isApiSchedule
            ? this.getIntegratedProducts()
            : this.getProducts(),
        },
        history: {
          title: 'Histórico',
          icon: 'fas fa-history',
          data: this.getHistoryEntries(),
        },
      }
    },

    /** True apenas quando há pelo menos um produto inutilizado na lista (mensagem exibida só nesse caso). */
    hasInutilizedProducts() {
      const products = this.formattedNfeData?.products?.data || []
      return products.some(p => this.isProductInutilizado(p))
    },

    /** True apenas quando há pelo menos um produto adicionado (sem código fornecedor) na lista (mensagem exibida só nesse caso). */
    hasAddedProducts() {
      const products = this.formattedNfeData?.products?.data || []
      return products.some(p => this.isProductAdded(p))
    },

    isApiSchedule() {
      if (!this.nfeData) return false
      if (this.nfeData.info?.xml_source === 'external_api') return true
      const rawP = this.nfeData.corpem_products_integration
      const rawN = this.nfeData.corpem_nf_integration
      if (!rawP && !rawN) return false
      try {
        const parsedP = typeof rawP === 'string' ? JSON.parse(rawP) : rawP
        const parsedN = typeof rawN === 'string' ? JSON.parse(rawN) : rawN
        return !!(parsedP?.CORPEM_ERP_MERC || parsedN?.CORPEM_ERP_DOC_ENT)
      } catch {
        return false
      }
    },

    /** True quando agendamento via API com Pronta Integração ativa (corpem_* preenchidos) */
    hasProntaIntegracao() {
      if (!this.isApiSchedule || !this.nfeData) return false
      const rawP =
        this.nfeData.corpem_products_integration ??
        this.nfeData.corpemProductsIntegration
      const rawN =
        this.nfeData.corpem_nf_integration ?? this.nfeData.corpemNfIntegration
      return !!(rawP || rawN)
    },

    /** Objeto parseado de corpem_products_integration (fallback para exibição sem histórico de req) */
    corpemProductsJson() {
      const raw =
        this.nfeData?.corpem_products_integration ??
        this.nfeData?.corpemProductsIntegration
      if (!raw) return null
      try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw
      } catch {
        return null
      }
    },

    /** Objeto parseado de corpem_nf_integration (fallback para exibição sem histórico de req) */
    corpemNfJson() {
      const raw =
        this.nfeData?.corpem_nf_integration ?? this.nfeData?.corpemNfIntegration
      if (!raw) return null
      try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw
      } catch {
        return null
      }
    },

    /**
     * JSON exibido na aba "Prod. JSON": prefere o payload da última requisição de produtos
     * enviada ao WMS (req[n].request.payload), que reflete a ordem e estrutura exatas do envio.
     * Cai de volta para corpemProductsJson se não houver histórico de requisições.
     */
    corpemProductsJsonSent() {
      const reqs = this.requestsData
      if (Array.isArray(reqs) && reqs.length > 0) {
        const last = [...reqs].reverse().find(r => r.integration_type === 'products')
        if (last?.request?.payload) return last.request.payload
      }
      return this.corpemProductsJson
    },

    /**
     * JSON exibido na aba "NF-e JSON": prefere o payload da última requisição de NF-e
     * enviada ao WMS (req[n].request.payload), que reflete a ordem e estrutura exatas do envio.
     * Cai de volta para corpemNfJson se não houver histórico de requisições.
     */
    corpemNfJsonSent() {
      const reqs = this.requestsData
      if (Array.isArray(reqs) && reqs.length > 0) {
        const last = [...reqs].reverse().find(r => r.integration_type === 'nf_entry')
        if (last?.request?.payload) return last.request.payload
      }
      return this.corpemNfJson
    },

    hasNfeXmlInfo() {
      if (!this.nfeData) return false

      // Prioridade 1: Verificar se há XML na coluna xml
      if (
        this.nfeData.xml &&
        typeof this.nfeData.xml === 'string' &&
        this.nfeData.xml.trim().length > 0
      ) {
        return true
      }

      // Prioridade 2: Verificar se há informações do XML parseado no campo info (compatibilidade)
      if (this.nfeData.info) {
        try {
          const info =
            typeof this.nfeData.info === 'string'
              ? JSON.parse(this.nfeData.info)
              : this.nfeData.info
          // Verificar se tem dados do XML (ide, emit, dest, etc.)
          return !!(info.ide || info.emit || info.dest || info.xml)
        } catch (e) {
          console.warn('⚠️ Erro ao parsear info para verificar XML:', e)
        }
      }
      return false
    },

    requestsData() {
      console.log('🔍 [REQUESTS-DATA] Verificando req:', {
        hasNfeData: !!this.nfeData,
        hasReq: !!this.nfeData?.req,
        reqType: typeof this.nfeData?.req,
        reqValue: this.nfeData?.req,
      })

      if (!this.nfeData?.req) {
        console.log('⚠️ [REQUESTS-DATA] req não encontrado ou vazio')
        return []
      }

      // Se req for string JSON, parsear
      if (typeof this.nfeData.req === 'string') {
        try {
          const parsed = JSON.parse(this.nfeData.req)
          console.log('✅ [REQUESTS-DATA] req parseado com sucesso:', {
            isArray: Array.isArray(parsed),
            length: Array.isArray(parsed) ? parsed.length : 'N/A',
            data: parsed,
          })
          return parsed
        } catch (e) {
          console.error('❌ [REQUESTS-DATA] Erro ao parsear req:', e)
          return []
        }
      }

      // Se já for array, retornar
      if (Array.isArray(this.nfeData.req)) {
        console.log('✅ [REQUESTS-DATA] req já é array:', {
          length: this.nfeData.req.length,
          data: this.nfeData.req,
        })
        return this.nfeData.req
      }

      console.log(
        '⚠️ [REQUESTS-DATA] req não é string nem array, retornando array vazio'
      )
      return []
    },

    statusBadgeClass() {
      const statusMap = {
        Solicitado: 'warning',
        Agendado: 'info',
        Conferência: 'success',
        Recebido: 'success', // Compatibilidade com dados antigos
        Tratativa: 'danger',
        Estoque: 'success',
        Recusar: 'danger',
        Recusado: 'dark',
        Cancelado: 'secondary',
      }
      return statusMap[this.nfeData.status] || 'secondary'
    },

    canEditSchedule() {
      console.log('canEditSchedule user:', this.user)
      // Apenas usuários nível 0 (dev) e nível 2 (gerente) podem editar
      return (
        this.user &&
        this.user.level_access !== undefined &&
        (this.user.level_access === 0 || this.user.level_access === 2)
      )
    },

    canMarkAsTratativa() {
      console.log(
        'canMarkAsTratativa user:',
        this.user,
        'status:',
        this.nfeData?.status
      )

      // Verificar se o usuário tem permissão (apenas níveis 0 e 2)
      if (
        !this.user ||
        this.user.level_access === undefined ||
        !(this.user.level_access === 0 || this.user.level_access === 2)
      ) {
        return false
      }

      // Verificar se o status atual permite mudança para tratativa
      const currentStatus = this.nfeData?.status
      const blockedStatuses = [
        'Em estoque',
        'Estoque',
        'Recusado',
        'Cancelado',
        'Tratativa',
      ]

      return currentStatus && !blockedStatuses.includes(currentStatus)
    },

    canChangeStatusFromTratativa() {
      console.log(
        'canChangeStatusFromTratativa user:',
        this.user,
        'status:',
        this.nfeData?.status
      )

      // Verificar se o usuário tem permissão (nível diferente de 1)
      if (
        !this.user ||
        this.user.level_access === undefined ||
        this.user.level_access === 1
      ) {
        return false
      }

      // Só mostrar dropdown se o status atual for 'Tratativa'
      return this.nfeData?.status === 'Tratativa'
    },

    canCancelScheduleLevel1() {
      console.log(
        '🎯 canCancelScheduleLevel1 - user.level_access:',
        this.user?.level_access,
        'status:',
        this.nfeData?.status
      )

      // Só para usuários nível 1
      if (!this.user || this.user.level_access !== 1) {
        return false
      }

      // Status que usuários nível 1 podem cancelar
      const currentStatus = this.nfeData?.status
      const cancellableStatuses = ['Solicitado', 'Agendado', 'Contestado']

      const canCancel = cancellableStatuses.includes(currentStatus)
      console.log('🎯 Resultado final para nível 1:', canCancel)
      return canCancel
    },

    canCancelSchedule() {
      // Para compatibilidade, manter a função original mas simplificada
      return this.canCancelScheduleLevel1
    },

    availableStatusOptions() {
      // Todos os status possíveis exceto o atual (Tratativa)
      return [
        { value: 'Solicitado', label: 'Solicitado' },
        { value: 'Contestado', label: 'Contestado' },
        { value: 'Agendado', label: 'Agendado' },
        { value: 'Conferência', label: 'Em conferência' },
        { value: 'Recebido', label: 'Em conferência' },
        { value: 'Em estoque', label: 'Em estoque' },
        { value: 'Cancelar', label: 'Cancelar' },
        { value: 'Cancelado', label: 'Cancelado' },
        { value: 'Recusado', label: 'Recusado' },
      ]
    },

    canIntegrateCorpem() {
      console.log('canIntegrateCorpem user:', this.user)

      // Verificar se o usuário tem permissão (apenas níveis 0 e 2)
      if (
        !this.user ||
        this.user.level_access === undefined ||
        !(this.user.level_access === 0 || this.user.level_access === 2)
      ) {
        return false
      }

      // Só mostrar o botão se não for uma marcação (booking) e tiver NFe válida
      if (this.isBookingSchedule) {
        return false
      }

      // Verificar se tem chave NFe válida
      const hasValidNfeKey =
        this.nfeData?.nfe_key &&
        this.nfeData.nfe_key.length > 10 &&
        !this.nfeData.nfe_key.startsWith('effectivate_')

      return hasValidNfeKey
    },

    canViewDevTab() {
      // A aba Dev é visível apenas para usuários com level_access !== 1
      // Ou seja, visível para level_access 0 (dev), 2 (gerente), e outros níveis, mas não para 1
      if (!this.user || this.user.level_access === undefined) {
        return false
      }
      return this.user.level_access !== 1
    },
  },

  methods: {
    // Método para selecionar produto na tabela
    selectProduct(index) {
      if (this.selectedProductIndex === index) {
        this.selectedProductIndex = null // Desselecionar se clicar no mesmo
      } else {
        this.selectedProductIndex = index
      }
    },

    // Métodos para dados de Marcação
    getBookingData() {
      return {
        Tipo: 'Agendamento de Marcação',
        Número: this.nfeData.number || 'N/A',
        Pedido: this.nfeData.NUMPEDCLI || this.nfeData.numpedcli || null,
        Status: this.nfeData.status,
        'Data de Entrega': this.formatDateOnly(this.nfeData.date),
        'Criado por': this.getBookingCreatedBy(),
        'Estoque de Destino': this.getBookingClientInfo(),
        Volumes: this.getVolumeCount() || '0',
        'Criado em': this.getBookingCreatedDate(),
      }
    },

    getNfeData() {
      return {
        'Número da NF-e': this.nfeData.nfe_number || this.nfeData.number,
        'Chave da NF-e': this.nfeData.nfe_key,
        Pedido: this.nfeData.NUMPEDCLI || this.nfeData.numpedcli || null,
        Status: this.nfeData.status,
        'Data de Entrega': this.formatDateOnly(this.nfeData.date),
        Fornecedor: this.getSupplierInfo(),
        Destinatário: this.getClientInfo(),
        Estoque: this.getStockInfo(),
        Volumes: this.getVolumeCount(),
        'Qtd. Produtos': this.nfeData.qt_prod,
        'Valor Total': this.getTotalValue(),
      }
    },

    getBookingClientInfo() {
      // Para marcações, o cliente é armazenado no campo client
      if (this.nfeData.info && this.nfeData.info.client_name) {
        return this.nfeData.info.client_name
      }

      if (this.nfeData.client_info && this.nfeData.client_info.name) {
        return this.nfeData.client_info.name
      }

      return this.nfeData.client || 'Não especificado'
    },

    getBookingCreatedDate() {
      if (this.nfeData.info && this.nfeData.info.created_at) {
        return this.formatDate(this.nfeData.info.created_at)
      }

      if (this.nfeData.created_at) {
        return this.formatDate(this.nfeData.created_at)
      }

      return 'Não disponível'
    },

    getBookingCreatedBy() {
      // Primeiro tentar buscar no info.created_by (mais específico para marcações)
      if (this.nfeData.info && this.nfeData.info.created_by) {
        return this.nfeData.info.created_by
      }

      // Fallback para created_by na raiz
      if (this.nfeData.created_by) {
        return this.nfeData.created_by
      }

      return 'Sistema'
    },

    closeModal() {
      this.$emit('close')
    },

    openEditModal() {
      console.log('🔧 Abrindo modal de edição para:', this.nfeData)
      this.$emit('edit', this.nfeData)
    },

    markAsTratativa() {
      console.log('⚠️ Marcando como tratativa:', this.nfeData)
      this.$emit('mark-tratativa', this.nfeData)
    },

    changeStatusFromTratativa() {
      if (!this.selectedNewStatus) return

      console.log(
        '🔄 Alterando status de tratativa para:',
        this.selectedNewStatus,
        'agendamento:',
        this.nfeData
      )

      this.$emit('change-status', {
        scheduleData: this.nfeData,
        newStatus: this.selectedNewStatus,
      })

      // Reset do dropdown
      this.selectedNewStatus = ''
    },

    cancelSchedule() {
      console.log('❌ Cancelando agendamento:', this.nfeData)

      // Confirmar cancelamento com o usuário
      if (
        !confirm(
          'Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.'
        )
      ) {
        return
      }

      this.$emit('change-status', {
        scheduleData: this.nfeData,
        newStatus: 'Cancelar',
      })
    },

    async integrateCorpem() {
      if (!this.nfeData?.id) {
        console.error('❌ ID do agendamento não encontrado')
        return
      }

      this.integratingCorpem = true

      try {
        console.log(
          '🏢 Iniciando integração CORPEM manual para agendamento:',
          this.nfeData.id
        )

        const response = await apiService.post('/corpem/products/register', {
          schedule_id: this.nfeData.id,
        })

        if (response.success) {
          this.$emit('show-success-toast', {
            title: 'Integração CORPEM Completa',
            message: `Integração realizada com sucesso! ${response.registered_count} produtos e NFe registrados no CORPEM.`,
          })

          console.log('✅ Integração CORPEM concluída:', response)

          // Aguardar um pequeno delay para garantir que o backend salvou os dados
          await new Promise(resolve => setTimeout(resolve, 500))

          // Buscar dados atualizados do agendamento após a integração
          await this.refreshScheduleData()
        } else {
          // Se não foi sucesso completo, mas há resultados parciais
          if (response.results) {
            const productsOk = response.results.products?.success
            const nfeOk = response.results.nfe?.success

            let message = response.message
            if (productsOk && !nfeOk) {
              message += ' (Produtos OK, NFe com erro)'
            } else if (!productsOk && nfeOk) {
              message += ' (NFe OK, Produtos com erro)'
            }

            this.$emit('show-success-toast', {
              title: 'Integração CORPEM Parcial',
              message: message,
            })

            // Aguardar um pequeno delay para garantir que o backend salvou os dados
            await new Promise(resolve => setTimeout(resolve, 500))

            // Mesmo em caso de sucesso parcial, atualizar os dados
            await this.refreshScheduleData()
          } else {
            throw new Error(response.message || 'Erro na integração')
          }
        }
      } catch (error) {
        console.error('❌ Erro na integração CORPEM:', error)

        let errorMessage = 'Erro na integração com CORPEM'
        if (error.response?.error) {
          errorMessage = error.response.error
        } else if (error.message) {
          errorMessage = error.message
        }

        this.$emit('show-error-toast', {
          title: 'Erro na Integração CORPEM',
          message: errorMessage,
        })
      } finally {
        this.integratingCorpem = false
      }
    },

    async refreshScheduleData() {
      if (!this.nfeData?.id) {
        console.warn(
          '⚠️ Não é possível atualizar dados: ID do agendamento não encontrado'
        )
        return
      }

      try {
        console.log(
          '🔄 Buscando dados atualizados do agendamento:',
          this.nfeData.id
        )

        const response = await apiService.get(`/schedules/${this.nfeData.id}`)

        if (response && response.schedule) {
          const updatedSchedule = response.schedule

          console.log('✅ Dados atualizados recebidos:', {
            id: updatedSchedule.id,
            hasReq: !!updatedSchedule.req,
            reqType: typeof updatedSchedule.req,
          })

          // Emitir evento para o componente pai atualizar os dados
          this.$emit('schedule-updated', updatedSchedule)
        } else {
          console.warn('⚠️ Resposta da API não contém schedule:', response)
        }
      } catch (error) {
        console.error(
          '❌ Erro ao buscar dados atualizados do agendamento:',
          error
        )
        // Não mostrar erro para o usuário, apenas logar
      }
    },

    setActiveTab(tab) {
      this.activeTab = tab
      // Se a aba NF-e foi selecionada e ainda não carregou o PDF, carregar agora
      // Mas apenas se houver informações de XML disponíveis
      if (
        tab === 'nfe-pdf' &&
        !this.nfePdfUrl &&
        !this.loadingNfePdf &&
        this.hasNfeXmlInfo
      ) {
        this.loadNfePdf()
      }
    },

    async loadNfePdf() {
      if (!this.nfeData || !this.nfeData.id) {
        console.warn('⚠️ [NFE-PDF] Dados do agendamento não disponíveis')
        return
      }

      this.loadingNfePdf = true
      this.nfePdfUrl = null
      this.nfePdfError = null

      try {
        const token = localStorage.getItem('token')
        const url = `${BASE_URL}/schedules/${this.nfeData.id}/nfe-pdf`
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })

        const data = await response.json().catch(() => ({}))

        if (response.ok) {
          // Sucesso: PDF em base64
          if (data.success && data.pdfBase64) {
            const pdfBlob = this.base64ToBlob(data.pdfBase64, 'application/pdf')
            this.nfePdfUrl = URL.createObjectURL(pdfBlob)
            console.log('✅ [NFE-PDF] PDF carregado a partir do XML')
          } else {
            console.warn(
              '⚠️ [NFE-PDF] PDF não disponível para este agendamento'
            )
          }
        } else {
          // Erro do backend (ex: HTTP 400 - XML não suportado pela biblioteca)
          this.nfePdfError = {
            message:
              data.message ||
              data.error ||
              'Não foi possível gerar o PDF da NF-e.',
            nfeKey: data.nfeKey || this.nfeData?.nfe_key || null,
            suggestion: data.suggestion || null,
          }
          console.warn('⚠️ [NFE-PDF] Backend retornou erro:', data)
        }
      } catch (error) {
        console.error('❌ [NFE-PDF] Erro ao carregar PDF da NF-e:', error)
        this.nfePdfError = {
          message:
            'Erro ao carregar PDF da NF-e. Verifique a conexão e tente novamente.',
          nfeKey: this.nfeData?.nfe_key || null,
          suggestion: null,
        }
      } finally {
        this.loadingNfePdf = false
      }
    },

    getSefazUrl(nfeKey) {
      if (!nfeKey) return '#'
      const cleanKey = String(nfeKey).replace(/[^\d]/g, '')
      return `https://www.nfe.fazenda.gov.br/portal/consulta.aspx?p=${cleanKey}`
    },

    base64ToBlob(base64, mimeType) {
      const byteCharacters = atob(base64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      return new Blob([byteArray], { type: mimeType })
    },

    toggleSection(section) {
      this.expandedSections[section] = !this.expandedSections[section]
    },

    formatDate(dateString) {
      if (!dateString) return '-'

      // Para datas no formato YYYY-MM-DD, evitar conversão de timezone
      if (
        typeof dateString === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateString)
      ) {
        const [year, month, day] = dateString.split('-')
        return `${day}/${month}/${year}`
      }

      // Para timestamps completos (ISO format), usar formatação com hora
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('pt-BR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      } catch (error) {
        return dateString
      }
    },

    formatDateOnly(dateString) {
      if (!dateString) return '-'

      // Para datas no formato YYYY-MM-DD, evitar conversão de timezone
      if (
        typeof dateString === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateString)
      ) {
        const [year, month, day] = dateString.split('-')
        return `${day}/${month}/${year}`
      }

      // Para outros formatos
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('pt-BR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      } catch (error) {
        return dateString
      }
    },

    formatDateTime(dateString) {
      if (!dateString) return '-'

      try {
        const date = new Date(dateString)
        return date.toLocaleString('pt-BR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      } catch (e) {
        return dateString
      }
    },

    normalizeCorpemPayload(payload) {
      if (!payload || typeof payload !== 'object') return payload

      // CORPEM_ERP_DOC_ENT — entrada de NF-e
      if (payload.CORPEM_ERP_DOC_ENT) {
        const docEnt = payload.CORPEM_ERP_DOC_ENT
        const fieldOrder = ['CGCCLIWMS', 'CGCREM', 'OBSRESDP', 'TPDESTNF', 'DEV', 'NUMNF', 'SERIENF', 'DTEMINF', 'VLTOTALNF', 'NUMEPEDCLI', 'CHAVENF', 'CHAVENF_DEV']
        const itemFields = ['NUMSEQ', 'CODPROD', 'QTPROD', 'VLTOTPROD']
        const normalized = {}
        for (const k of fieldOrder) {
          if (docEnt[k] !== undefined) normalized[k] = docEnt[k]
        }
        if (Array.isArray(docEnt.ITENS)) {
          normalized.ITENS = docEnt.ITENS.map(item => {
            const stripped = {}
            for (const k of itemFields) if (item[k] !== undefined) stripped[k] = item[k]
            return stripped
          })
        }
        return { CORPEM_ERP_DOC_ENT: normalized }
      }

      // CORPEM_ERP_MERC — cadastro de produtos
      if (payload.CORPEM_ERP_MERC) {
        const merc = payload.CORPEM_ERP_MERC
        const produtoFieldOrder = [
          'CODPROD', 'NOMEPROD', 'IWS_ERP', 'TPOLRET', 'IAUTODTVEN', 'QTDDPZOVEN',
          'ILOTFAB', 'IDTFAB', 'IDTVEN', 'INSER', 'SEM_LOTE_CKO', 'SEM_DTVEN_CKO',
          'CODFAB', 'NOMEFAB', 'CODGRU', 'NOMEGRU'
        ]
        const embalagemFieldOrder = ['CODUNID', 'FATOR', 'CODBARRA', 'PESOLIQ', 'PESOBRU', 'ALT', 'LAR', 'COMP', 'VOL']

        const reorderEmbalagem = (emb) => {
          if (!emb || typeof emb !== 'object') return emb
          const out = {}
          for (const k of embalagemFieldOrder) if (k in emb) out[k] = emb[k]
          for (const k of Object.keys(emb)) if (!embalagemFieldOrder.includes(k)) out[k] = emb[k]
          if ('CODBARRA' in out && !/^\d+$/.test(String(out.CODBARRA))) out.CODBARRA = ''
          return out
        }
        const reorderProduto = (p) => {
          if (!p || typeof p !== 'object') return p
          const out = {}
          for (const k of produtoFieldOrder) if (k in p) out[k] = p[k]
          for (const k of Object.keys(p)) if (!produtoFieldOrder.includes(k) && k !== 'EMBALAGENS') out[k] = p[k]
          if ('EMBALAGENS' in p) out.EMBALAGENS = Array.isArray(p.EMBALAGENS) ? p.EMBALAGENS.map(reorderEmbalagem) : p.EMBALAGENS
          if ('NCM' in out) out.NCM = ''
          return out
        }
        return {
          CORPEM_ERP_MERC: {
            CGCCLIWMS: merc.CGCCLIWMS || '',
            PRODUTOS: (merc.PRODUTOS || []).map(reorderProduto)
          }
        }
      }

      return payload
    },

    formatJSON(obj) {
      if (!obj) return ''

      try {
        return JSON.stringify(obj, null, 2)
      } catch (e) {
        return String(obj)
      }
    },

    toggleRequest(index) {
      const indexPos = this.expandedRequests.indexOf(index)
      if (indexPos > -1) {
        // Já está expandido, colapsar
        this.expandedRequests.splice(indexPos, 1)
      } else {
        // Está colapsado, expandir
        this.expandedRequests.push(index)
      }
    },

    isRequestExpanded(index) {
      return this.expandedRequests.includes(index)
    },

    toggleRequisicao(index) {
      const pos = this.expandedRequisicoes.indexOf(index)
      if (pos > -1) {
        this.expandedRequisicoes.splice(pos, 1)
      } else {
        this.expandedRequisicoes.push(index)
      }
    },

    isRequisicaoExpanded(index) {
      return this.expandedRequisicoes.includes(index)
    },

    formatCurrency(value) {
      if (!value) return 'R$ 0,00'
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value)
    },

    /** Indica se o produto foi adicionado no agendamento (sem código fornecedor, não consta na NF). */
    isProductAdded(product) {
      const code =
        product.supplier_code ||
        product.supp_code ||
        product.suppCode ||
        product.code
      const s = code != null ? String(code).trim() : ''
      return s === '' || s === '-' || s === '—'
    },

    /** Indica se o produto foi inutilizado no agendamento (não integra CorpEM). Backend retorna inutilizado ou discarded. */
    isProductInutilizado(product) {
      return (
        product.inutilizado === true ||
        product.inutilizado === 'true' ||
        product.inutilizado === 1 ||
        product.discarded === true ||
        product.discarded === 'true' ||
        product.discarded === 1
      )
    },

    /** Valor total do produto: usa total_value se válido, senão calcula quantity * unit_value (produtos adicionados). */
    getProductTotal(product) {
      if (
        product.total_value != null &&
        !Number.isNaN(Number(product.total_value)) &&
        Number(product.total_value) > 0
      ) {
        return Number(product.total_value)
      }
      const qty = Number(product.quantity) || 0
      const unit = Number(product.unit_value) || 0
      return qty * unit
    },

    getVolumeCount() {
      if (this.nfeData.info && this.nfeData.info.case_count) {
        return this.nfeData.info.case_count
      }

      if (this.nfeData.case_count) {
        return this.nfeData.case_count
      }

      if (this.nfeData.volumes) {
        return this.nfeData.volumes
      }

      return '-'
    },

    getTotalValue() {
      // Para marcações, não há valor total inicialmente
      if (this.isBookingSchedule) {
        return 'A definir'
      }

      if (
        this.nfeData.total_value !== undefined &&
        this.nfeData.total_value !== null &&
        this.nfeData.total_value > 0
      ) {
        return this.formatCurrency(this.nfeData.total_value)
      }

      return '-'
    },

    getProducts() {
      // Se for uma marcação, não terá produtos inicialmente
      if (this.isBookingSchedule) {
        return []
      }

      if (
        this.nfeData.info &&
        this.nfeData.info.products &&
        Array.isArray(this.nfeData.info.products)
      ) {
        return this.nfeData.info.products
      }

      if (this.nfeData.products && Array.isArray(this.nfeData.products)) {
        return this.nfeData.products
      }

      return []
    },

    /** Produtos montados a partir de corpem_products_integration + corpem_nf_integration (agendamentos via API) */
    getIntegratedProducts() {
      let produtos = []
      let itens = []
      try {
        const rawP =
          this.nfeData?.corpem_products_integration ??
          this.nfeData?.corpemProductsIntegration
        const rawN =
          this.nfeData?.corpem_nf_integration ??
          this.nfeData?.corpemNfIntegration
        const parsedP =
          rawP != null
            ? typeof rawP === 'string'
              ? JSON.parse(rawP)
              : rawP
            : null
        const parsedN =
          rawN != null
            ? typeof rawN === 'string'
              ? JSON.parse(rawN)
              : rawN
            : null
        if (parsedP?.CORPEM_ERP_MERC?.PRODUTOS)
          produtos = parsedP.CORPEM_ERP_MERC.PRODUTOS
        if (parsedN?.CORPEM_ERP_DOC_ENT?.ITENS)
          itens = parsedN.CORPEM_ERP_DOC_ENT.ITENS
      } catch {
        return []
      }
      const mapByCod = {}
      produtos.forEach(p => {
        const cod = (p.CODPROD || '').toString().trim()
        if (!cod) return
        const emb =
          Array.isArray(p.EMBALAGENS) && p.EMBALAGENS[0] ? p.EMBALAGENS[0] : {}
        mapByCod[cod] = {
          CODPROD: cod,
          NOMEPROD: p.NOMEPROD || '',
          CODUNID: emb.CODUNID || 'UN',
          CODBARRA: emb.CODBARRA || '',
        }
      })
      return itens.map((item, idx) => {
        const cod = (item.CODPROD || '').toString().trim()
        const info = mapByCod[cod] || {
          CODPROD: cod,
          NOMEPROD: '',
          CODUNID: 'UN',
          CODBARRA: '',
        }
        const qty = parseFloat(item.QTPROD) || 0
        const vltot = parseFloat(item.VLTOTPROD) || 0
        const unitVal = qty > 0 ? vltot / qty : 0
        return {
          id: idx,
          cod_produto: info.CODPROD,
          desc_produto: info.NOMEPROD,
          quantidade: qty,
          embalagem: info.CODUNID,
          valor_unit: unitVal,
          valor_total: vltot,
          cod_barras: info.CODBARRA,
        }
      })
    },

    // Card Fornecedor: exibir nome e CNPJ do emitente da NF-e (do XML), mesmo com status "Não agendado"
    getSupplierInfo() {
      if (this.isBookingSchedule) {
        return 'Agendamento de Marcação'
      }

      const info = this.nfeData?.info || {}
      const supplierName = info.supplier_name || info.supplier?.name || ''
      const supplierCnpj = info.supplier_cnpj || info.supplier?.cnpj || ''

      if (supplierName && supplierCnpj) {
        return `${supplierName} - CNPJ: ${supplierCnpj}`
      }
      if (supplierName) return supplierName
      if (supplierCnpj) return `CNPJ: ${supplierCnpj}`

      return this.nfeData.supplier_name || this.nfeData.supplier || '-'
    },

    // Card Destinatário: sempre exibir nome e CNPJ do destinatário da NF-e (do XML), mesmo sem cadastro no sistema
    getClientInfo() {
      const info = this.nfeData?.info || {}
      const destName = info.dest_name || ''
      const destCnpj = info.dest_cnpj || ''

      if (destName && destCnpj) {
        return `${destName} - CNPJ: ${destCnpj}`
      }
      if (destName) return destName
      if (destCnpj) return `CNPJ: ${destCnpj}`

      // Fallback: dados do cadastro (client_name/client_cnpj) ou cliente do agendamento
      const clientName = info.client_name || ''
      const clientCnpj = info.client_cnpj || ''
      if (clientName && clientCnpj) return `${clientName} - CNPJ: ${clientCnpj}`
      if (clientName) return clientName
      if (clientCnpj) return `CNPJ: ${clientCnpj}`

      return this.nfeData.client_name || this.nfeData.client || '-'
    },

    // Card Estoque: só exibir dados de cadastro quando o destinatário tem cadastro; caso contrário apenas "Cliente Não Cadastrado"
    getStockInfo() {
      if (!this.nfeData.client_info) {
        return 'Cliente Não Cadastrado'
      }

      const ci = this.nfeData.client_info
      const notRegistered =
        ci.name === 'Cliente Não Cadastrado' ||
        ci.source === 'fallback_error' ||
        ci.source === 'error'
      if (notRegistered) {
        return 'Cliente Não Cadastrado'
      }

      const stockName = ci.name
      const stockNumber = ci.number
      const stockCnpj =
        ci.cnpj || this.nfeData.client_cnpj || this.nfeData.client

      let stockInfo = ''
      if (stockName && stockName !== `Cliente ${stockCnpj}`)
        stockInfo += stockName
      if (
        stockNumber &&
        stockNumber !== stockCnpj &&
        stockNumber !== stockName
      ) {
        if (stockInfo) stockInfo += ' '
        stockInfo += `(Nº ${stockNumber})`
      }
      if (stockCnpj && stockCnpj !== stockName) {
        if (stockInfo) stockInfo += ' - '
        stockInfo += `CNPJ: ${stockCnpj}`
      }

      return stockInfo || 'Cliente Não Cadastrado'
    },

    getLastUpdateFromHistoric() {
      if (this.nfeData.historic && typeof this.nfeData.historic === 'object') {
        let latestTimestamp = null
        let latestEntry = null

        Object.values(this.nfeData.historic).forEach(entry => {
          if (entry && entry.timestamp) {
            const entryTimestamp = new Date(entry.timestamp)
            if (!latestTimestamp || entryTimestamp > latestTimestamp) {
              latestTimestamp = entryTimestamp
              latestEntry = entry
            }
          }
        })

        if (latestEntry) {
          return {
            timestamp: latestTimestamp.toISOString(),
            user: latestEntry.user || 'Sistema',
          }
        }
      }

      return {
        timestamp: this.nfeData.updated_at || this.nfeData.created_at,
        user: 'Sistema',
      }
    },

    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text)
        this.copySuccess = true
        setTimeout(() => {
          this.copySuccess = false
        }, 2000)
      } catch (error) {
        console.error('Erro ao copiar para área de transferência:', error)
      }
    },

    copySection(sectionData) {
      const text = JSON.stringify(sectionData, null, 2)
      this.copyToClipboard(text)
    },

    copyFullData() {
      const text = JSON.stringify(this.nfeData, null, 2)
      this.copyToClipboard(text)
    },

    formatJsonData(data, level = 0) {
      if (typeof data !== 'object' || data === null) {
        return data
      }

      const indent = '  '.repeat(level)
      const nextIndent = '  '.repeat(level + 1)

      if (Array.isArray(data)) {
        if (data.length === 0) return '[]'

        let result = '[\n'
        data.forEach((item, index) => {
          result += nextIndent + this.formatJsonData(item, level + 1)
          if (index < data.length - 1) result += ','
          result += '\n'
        })
        result += indent + ']'
        return result
      } else {
        const keys = Object.keys(data)
        if (keys.length === 0) return '{}'

        let result = '{\n'
        keys.forEach((key, index) => {
          result +=
            nextIndent +
            `"${key}": ${this.formatJsonData(data[key], level + 1)}`
          if (index < keys.length - 1) result += ','
          result += '\n'
        })
        result += indent + '}'
        return result
      }
    },

    getHistoryEntries() {
      if (!this.nfeData.historic || typeof this.nfeData.historic !== 'object') {
        return []
      }

      const entries = Object.entries(this.nfeData.historic)
        .map(([key, entry]) => ({
          id: key,
          timestamp: this.formatDate(entry.timestamp),
          user: entry.user || 'Sistema',
          action: this.getFormattedAction(entry),
          changes: entry.changes || [],
          comment: entry.comment || '',
          rawEntry: entry,
        }))
        .sort((a, b) => {
          const dateA = new Date(a.rawEntry.timestamp || a.timestamp)
          const dateB = new Date(b.rawEntry.timestamp || b.timestamp)
          return dateB - dateA
        })

      return entries
    },

    getContextualIcon() {
      const isBookingNum = Number(this.nfeData.is_booking)

      if (this.isBookingSchedule) {
        // is_booking = 1 (marcação/prévio)
        return 'fas fa-bookmark'
      } else if (isBookingNum === 2) {
        // is_booking = 2 (não agendado)
        return 'fas fa-bolt'
      }

      return 'fas fa-info-circle'
    },

    getContextualLabel() {
      const isBookingNum = Number(this.nfeData.is_booking)

      if (this.isBookingSchedule) {
        // is_booking = 1 (marcação/prévio)
        return 'Agendamento Prévio (Marcação)'
      } else if (isBookingNum === 2) {
        // is_booking = 2 (não agendado)
        return 'Agendamento Não Agendado'
      }

      return 'Informações do Agendamento'
    },

    getContextualInfo() {
      const contextualInfo = []
      const isBookingNum = Number(this.nfeData.is_booking)

      // Adicionar informações contextuais baseado no tipo de agendamento
      if (this.isBookingSchedule) {
        // is_booking = 1 (marcação/prévio)
        contextualInfo.push('📌 Agendamento Prévio (Marcação)')
        contextualInfo.push(
          'Este agendamento foi criado como marcação prévia, sem a NF-e. A nota fiscal e os produtos serão adicionados quando a carga for efetivada.'
        )

        const createdDate = this.getBookingCreatedDate()
        if (createdDate && createdDate !== 'Não disponível') {
          contextualInfo.push(`\n📅 Data de criação: ${createdDate}`)
        }
      } else if (isBookingNum === 2) {
        // is_booking = 2 (não agendado - efetivado diretamente)
        contextualInfo.push('⚡ Agendamento Não Agendado')
        contextualInfo.push(
          'Este agendamento foi criado e efetivado diretamente como "Não agendado", sem passar pelo processo de solicitação prévia. A NF-e foi processada imediatamente.'
        )

        const createdDate = this.getBookingCreatedDate()
        if (createdDate && createdDate !== 'Não disponível') {
          contextualInfo.push(`\n📅 Data de criação: ${createdDate}`)
        }
      }

      // Retornar informações concatenadas ou null (para v-if funcionar)
      return contextualInfo.length > 0 ? contextualInfo.join('\n') : null
    },

    getObservations() {
      const observations = []

      // Buscar observações do campo info.observacoes (prioridade)
      if (this.nfeData.info && this.nfeData.info.observacoes) {
        observations.push(this.nfeData.info.observacoes)
      }

      // Fallback para campo observations direto (compatibilidade)
      if (
        this.nfeData.observations &&
        this.nfeData.observations !== (this.nfeData.info?.observacoes || '')
      ) {
        observations.push(this.nfeData.observations)
      }

      // Retornar apenas observações reais do usuário (sem informações contextuais)
      return observations.length > 0 ? observations.join('\n\n') : ''
    },

    getFormattedAction(entry) {
      if (entry.changes && entry.changes.length > 0) {
        const changeCount = entry.changes.length
        const mainChange = entry.changes[0].split(':')[0] // Pega o nome do campo da primeira mudança

        if (changeCount === 1) {
          return `${mainChange} alterado`
        } else {
          return `${changeCount} campos alterados`
        }
      }

      return entry.action || 'Alteração realizada'
    },

    getHistoryIcon(action) {
      if (!action) return 'fas fa-question-circle'

      const actionLower = action.toLowerCase()

      if (
        actionLower.includes('efetivada') ||
        actionLower.includes('effectivated')
      ) {
        return 'fas fa-arrow-up text-success'
      } else if (
        actionLower.includes('criado') ||
        actionLower.includes('created')
      ) {
        return 'fas fa-plus-circle text-success'
      } else if (actionLower.includes('status')) {
        return 'fas fa-exchange-alt text-info'
      } else if (actionLower.includes('data') || actionLower.includes('date')) {
        return 'fas fa-calendar-alt text-warning'
      } else if (
        actionLower.includes('editado') ||
        actionLower.includes('edit')
      ) {
        return 'fas fa-edit text-primary'
      } else if (
        actionLower.includes('cancelado') ||
        actionLower.includes('cancel')
      ) {
        return 'fas fa-times-circle text-danger'
      } else if (
        actionLower.includes('conferência') ||
        actionLower.includes('conferencia') ||
        actionLower.includes('received')
      ) {
        return 'fas fa-check-circle text-success'
      } else if (
        actionLower.includes('contestado') ||
        actionLower.includes('contest')
      ) {
        return 'fas fa-exclamation-triangle text-warning'
      } else {
        return 'fas fa-history text-secondary'
      }
    },

    handleModalClick(event) {
      if (event.target.classList.contains('modal-overlay')) {
        this.closeModal()
      }
    },

    startScrollbarKeepAlive() {
      // Parar qualquer intervalo existente
      this.stopScrollbarKeepAlive()

      // Iniciar intervalo para manter scrollbar visível
      this.scrollbarKeepAliveInterval = setInterval(() => {
        this.$nextTick(() => {
          // Verificar se $el existe e é um elemento DOM válido
          if (!this.$el || typeof this.$el.querySelector !== 'function') {
            return
          }

          const tabsContainer = this.$el.querySelector('.modal-tabs')
          if (
            tabsContainer &&
            typeof tabsContainer.scrollLeft !== 'undefined'
          ) {
            // Fazer um pequeno movimento no scroll para manter o thumb visível
            const currentScroll = tabsContainer.scrollLeft
            // Mover 0.1px e voltar (imperceptível visualmente)
            tabsContainer.scrollLeft = currentScroll + 0.1
            setTimeout(() => {
              if (
                tabsContainer &&
                typeof tabsContainer.scrollLeft !== 'undefined'
              ) {
                tabsContainer.scrollLeft = currentScroll
              }
            }, 10)
          }
        })
      }, 2000) // A cada 2 segundos
    },

    stopScrollbarKeepAlive() {
      if (this.scrollbarKeepAliveInterval) {
        clearInterval(this.scrollbarKeepAliveInterval)
        this.scrollbarKeepAliveInterval = null
      }
    },

    /** Controla o polling da aba Dev: dispara refresh ao abrir a aba e a cada 4s enquanto estiver ativa. */
    syncDevPolling() {
      if (this.devPollingInterval) {
        clearInterval(this.devPollingInterval)
        this.devPollingInterval = null
      }
      const shouldPoll =
        this.showModal &&
        this.activeTab === 'dev' &&
        this.nfeData &&
        this.nfeData.id != null
      if (!shouldPoll) return
      this.$emit('refresh-nfe')
      this.devPollingInterval = setInterval(() => {
        if (!this.showModal || this.activeTab !== 'dev') {
          clearInterval(this.devPollingInterval)
          this.devPollingInterval = null
          return
        }
        this.$emit('refresh-nfe')
      }, 4000)
    },
  },

  mounted() {
    console.log('🔍 NfeInfoModal montado:', {
      showModal: this.showModal,
      nfeData: this.nfeData,
    })
    this.$nextTick(() => {
      const modal = this.$refs.modal
      if (modal) {
        modal.focus()
      }
      this.startScrollbarKeepAlive()
    })
  },

  beforeUnmount() {
    if (this.devPollingInterval) {
      clearInterval(this.devPollingInterval)
      this.devPollingInterval = null
    }
    this.stopScrollbarKeepAlive()
  },

  watch: {
    showModal(newVal) {
      console.log('🔄 showModal changed:', newVal, 'nfeData:', !!this.nfeData)
      if (newVal) {
        // Resetar para a primeira aba (Informações Gerais) quando o modal for aberto
        this.activeTab = 'general'
        // Limpar o PDF anterior quando o modal for aberto
        this.nfePdfUrl = null
        this.loadingNfePdf = false
        this.nfePdfError = null
        this.$nextTick(() => {
          console.log(
            '🎯 Modal aberto - canCancelSchedule:',
            this.canCancelSchedule
          )
          this.startScrollbarKeepAlive()
          // Se é agendamento via API mas não tem corpem_*, pedir refresh ao pai (pode ter vindo da lista sem esses campos)
          const hasCorpem = !!(
            this.nfeData?.corpem_products_integration ??
            this.nfeData?.corpem_nf_integration
          )
          const needsCorpem =
            this.isApiSchedule && !hasCorpem && this.nfeData?.id
          if (needsCorpem) {
            this.$emit('refresh-nfe')
          }
        })
      } else {
        this.stopScrollbarKeepAlive()
      }
      this.syncDevPolling()
    },
    activeTab() {
      this.syncDevPolling()
    },

    nfeData: {
      handler(newVal, oldVal) {
        // Limpar o PDF quando os dados do agendamento mudarem (novo agendamento selecionado)
        if (newVal && oldVal && newVal.id !== oldVal?.id) {
          console.log('🔄 Novo agendamento selecionado - limpando PDF anterior')
          this.nfePdfUrl = null
          this.loadingNfePdf = false
          this.nfePdfError = null
          // Se estiver nas abas Prod. JSON ou NF-e JSON e o novo agendamento não tiver Pronta Integração, voltar para general
          if (
            (this.activeTab === 'prod-json' || this.activeTab === 'nfe-json') &&
            !this.hasProntaIntegracao
          ) {
            this.activeTab = 'general'
          }
          // Se estiver na aba NF-e e não houver XML, garantir que mostre a mensagem apropriada
          if (this.activeTab === 'nfe-pdf' && !this.hasNfeXmlInfo) {
            // Não precisa fazer nada, o template já mostra a mensagem quando nfePdfUrl é null
          }
        }
        console.log('🔄 nfeData changed:', {
          hasData: !!newVal,
          id: newVal?.id,
          number: newVal?.number,
          hasInfo: !!newVal?.info,
          infoType: typeof newVal?.info,
          infoIsObject:
            typeof newVal?.info === 'object' && newVal?.info !== null,
          hasProducts: !!newVal?.info?.products,
          productsCount: newVal?.info?.products?.length,
          hasHistoric: !!newVal?.historic,
          historicType: typeof newVal?.historic,
          hasXml: !!(
            newVal?.xml &&
            typeof newVal.xml === 'string' &&
            newVal.xml.trim().length > 0
          ),
        })
      },
      deep: true,
      immediate: true,
    },
  },
}
</script>

<style scoped>
/* Janela de informações do agendamento: 98% da largura do display */
.nfe-info-modal.large {
  width: 98vw !important;
  max-width: 98vw !important;
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px;
}

/* Linha do título com botão fechar */
.header-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-title-row h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  white-space: nowrap;
}

.header-title-row h3 i {
  font-size: 1rem;
}

/* Botão fechar */
.btn-close {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 6px;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 14px;
  flex-shrink: 0;
}

.btn-close:hover {
  background: #e2e8f0;
  color: #dc3545;
}

/* Linha dos botões de ação */
.header-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: nowrap;
  width: 100%;
  justify-content: flex-start;
}

.header-buttons .btn-sm {
  padding: 0.4rem 0.6rem;
  font-size: 0.875rem;
  flex: 1;
  text-align: center;
  justify-content: center;
}

.header-buttons .status-change-dropdown {
  flex: 1;
}

.header-buttons .status-change-dropdown .form-select-sm {
  width: 100%;
}

.header-buttons .btn-warning {
  font-weight: 600;
}

.status-change-dropdown {
  display: flex;
  align-items: center;
}

.status-change-dropdown .form-select-sm {
  min-width: 140px;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
  border: 2px solid #ffc107;
  border-radius: 0.375rem;
  background-color: #fff3cd;
  color: #664d03;
  font-weight: 500;
}

.status-change-dropdown .form-select-sm:focus {
  border-color: #ffb300;
  box-shadow: 0 0 0 0.2rem rgba(255, 193, 7, 0.25);
  outline: none;
}

.status-change-dropdown .form-select-sm:hover {
  background-color: #fff8e1;
}

/* Modal body height adjustment for history tab */
.modal-body {
  min-height: 60vh;
  max-height: calc(90vh - 200px); /* Ajustar para o modal de 90vh */
  display: flex;
  flex-direction: column;
  flex: 1; /* Ocupa todo o espaço disponível */
  min-height: 0; /* Permite que o flex funcione corretamente */
  overflow-y: auto; /* Permitir scroll vertical */
  overflow-x: hidden; /* Evitar scroll horizontal */
}

/* Quando a aba NF-e está ativa, remover padding e garantir que use todo o espaço */
.modal-body:has(.nfe-pdf-tab-content) {
  flex: 1;
  min-height: 0;
  overflow: hidden; /* Manter hidden apenas para a aba PDF */
  padding: 0 !important; /* Remover padding para maximizar espaço do PDF */
  max-height: none !important; /* Remover limite de altura */
  height: 100% !important; /* Garantir altura total */
  display: flex !important; /* Manter flex */
  flex-direction: column !important; /* Manter coluna */
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* Permite que o flex funcione corretamente */
  overflow-y: auto; /* Permitir scroll vertical */
  overflow-x: hidden; /* Evitar scroll horizontal */
}

/* Garantir que a aba NF-e ocupe todo o espaço disponível */
.tab-content.nfe-pdf-tab-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  height: 100%; /* Garantir altura total */
}

/* History Tab Styles */
.history-tab-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.history-container {
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #007bff #f8f9fa;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.history-container::-webkit-scrollbar {
  width: 6px;
}

.history-container::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 3px;
}

.history-container::-webkit-scrollbar-thumb {
  background: #007bff;
  border-radius: 3px;
}

.history-container::-webkit-scrollbar-thumb:hover {
  background: #0056b3;
}

.history-timeline {
  position: relative;
  padding: 1rem 3rem 1rem 3rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: min-content;
}

.history-timeline::before {
  content: '';
  position: absolute;
  left: 1.6rem;
  top: 1rem;
  bottom: 1rem;
  width: 5px;
  height: calc(100% - 2rem);
  background: linear-gradient(to bottom, #007bff, #ffffff);
}

.history-entry {
  position: relative;
  margin-bottom: 1.5rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
  padding: 1rem;
  border-left: 4px solid #007bff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.history-entry:hover {
  background: #e9ecef;
  transform: translateX(2px);
  transition: all 0.2s ease;
}

.history-icon {
  position: absolute;
  left: -2.5rem;
  top: 1rem;
  width: 2rem;
  height: 2rem;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 2px solid #007bff;
}

.history-icon i {
  font-size: 0.875rem;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.history-action {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #495057;
}

.history-timestamp {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 500;
}

.history-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
  color: #6c757d;
}

.history-user strong {
  color: #495057;
}

.history-changes {
  margin-bottom: 0.75rem;
}

.changes-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.change-item {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 0.75rem;
  padding: 0.5rem;
  background: rgba(0, 123, 255, 0.05);
  border-radius: 0.25rem;
  border-left: 3px solid #007bff;
}

.change-field {
  font-size: 0.875rem;
  font-weight: 600;
  color: #495057;
  display: flex;
  align-items: center;
}

.change-values {
  font-size: 0.875rem;
  color: #6c757d;
  font-family: 'Courier New', monospace;
  background: rgba(255, 255, 255, 0.7);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  border: 1px solid #e9ecef;
}

.history-comment {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(0, 123, 255, 0.1);
  border-radius: 0.25rem;
  border-left: 3px solid #007bff;
}

.history-comment i {
  color: #007bff;
  margin-top: 0.125rem;
}

.history-comment span {
  font-size: 0.875rem;
  color: #495057;
  line-height: 1.4;
}

/* Empty state for history */
.history-tab-content .empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 3rem 1rem;
}

.history-tab-content .empty-state i {
  font-size: 3rem;
  color: #dee2e6;
  margin-bottom: 1rem;
}

.history-tab-content .empty-state h3 {
  color: #6c757d;
  margin-bottom: 0.5rem;
}

.history-tab-content .empty-state p {
  color: #adb5bd;
  margin: 0;
}

/* Mobile Responsive Styles for History Tab */
@media (max-width: 768px) {
  .history-timeline {
    padding: 0.75rem 1rem !important;
    padding-left: 0.5rem !important;
  }

  .history-timeline::before {
    left: 0.5rem !important;
    width: 3px !important;
  }

  .history-entry {
    margin-left: 1.5rem !important;
    padding: 0.75rem !important;
    margin-bottom: 1rem !important;
  }

  .history-icon {
    left: -1.25rem !important;
    width: 1.5rem !important;
    height: 1.5rem !important;
    top: 0.75rem !important;
  }

  .history-icon i {
    font-size: 0.75rem !important;
  }

  .history-header {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 0.25rem !important;
  }

  .history-action {
    font-size: 0.9rem !important;
    width: 100%;
  }

  .history-timestamp {
    font-size: 0.8rem !important;
    align-self: flex-end;
  }

  .history-user {
    font-size: 0.8rem !important;
    flex-wrap: wrap;
  }

  .history-user strong {
    word-break: break-word;
  }

  .change-item {
    grid-template-columns: 1fr !important;
    gap: 0.5rem !important;
    padding: 0.5rem !important;
  }

  .change-field {
    font-size: 0.8rem !important;
    margin-bottom: 0.25rem;
  }

  .change-values {
    font-size: 0.8rem !important;
    padding: 0.4rem !important;
    word-break: break-word;
  }

  .history-comment {
    padding: 0.6rem !important;
    flex-direction: column;
    gap: 0.4rem !important;
  }

  .history-comment i {
    align-self: flex-start;
  }

  .history-comment span {
    font-size: 0.8rem !important;
    word-break: break-word;
  }
}

/* Contextual Information Card */
.contextual-info-item {
  margin-top: 30px !important;
  margin-bottom: 20px !important;
  border: 2px solid #fff3cd !important;
  background: #fffbf0 !important;
  border-radius: 8px !important;
  padding: 16px !important;
}

.contextual-info-item label {
  color: #856404 !important;
  font-weight: 600 !important;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.contextual-info-item label i {
  color: #856404;
  margin-right: 8px;
  font-size: 1.1rem;
}

.contextual-info-text {
  background: #ffffff;
  padding: 14px 16px;
  border-radius: 6px;
  border: 1px solid #ffeaa7;
  line-height: 1.6;
  color: #495057 !important;
  display: block;
  font-size: 0.95rem;
  white-space: pre-line;
}

/* Booking-specific contextual info highlight (is_booking = 1 - Prévio/Marcação) */
.booking-context-highlight {
  border-color: #e1bee7 !important;
  background: linear-gradient(135deg, #f9f5ff 0%, #faf5ff 100%) !important;
  box-shadow: 0 2px 8px rgba(123, 31, 162, 0.15) !important;
}

.booking-context-highlight label {
  color: #7b1fa2 !important;
  font-size: 1rem !important;
}

.booking-context-highlight label i {
  color: #7b1fa2;
  font-size: 1.2rem;
}

.booking-context-highlight .contextual-info-text {
  border-color: #e1bee7;
  background: #fdf9ff;
  color: #4a148c !important;
}

/* Not Scheduled-specific contextual info highlight (is_booking = 2 - Não Agendado) */
.not-scheduled-context-highlight {
  border-color: #ffe082 !important;
  background: linear-gradient(135deg, #fff9e6 0%, #fffbf0 100%) !important;
  box-shadow: 0 2px 8px rgba(255, 160, 0, 0.15) !important;
}

.not-scheduled-context-highlight label {
  color: #e65100 !important;
  font-size: 1rem !important;
}

.not-scheduled-context-highlight label i {
  color: #e65100;
  font-size: 1.2rem;
}

.not-scheduled-context-highlight .contextual-info-text {
  border-color: #ffe082;
  background: #fffef7;
  color: #bf360c !important;
}

/* Observations Card Spacing */
.observations-item {
  margin-top: 20px !important;
  border: 1px solid #e3f2fd !important;
  background: #fafefe !important;
}

.observations-item label {
  color: #1976d2 !important;
  font-weight: 600 !important;
}

.observations-item label i {
  color: #1976d2;
  margin-right: 8px;
}

.observations-text {
  background: #ffffff;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  line-height: 1.5;
  color: #495057 !important;
  white-space: pre-line;
}

.no-observations {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6c757d !important;
  font-style: italic;
  padding: 8px 0;
}

.no-observations i {
  color: #adb5bd;
}

/* Informação sobre itens inutilizados (acima da lista de produtos) */
.products-inutilizados-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.75rem;
  background-color: #fff5f5;
  border: 1px solid #fecaca;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #991b1b;
}

.products-inutilizados-info i {
  flex-shrink: 0;
  color: #dc2626;
}

.products-inutilizados-info strong {
  font-weight: 600;
}

/* Informação sobre produtos adicionados (sem código fornecedor, não constam na NF) */
.products-adicionados-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.75rem;
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #0c4a6e;
}

.products-adicionados-info i {
  flex-shrink: 0;
  color: #0284c7;
}

.products-adicionados-info strong {
  font-weight: 600;
}

/* Tabela de produtos: Descrição Venda mais estreita, Valor Total mais largo (sem quebra) */
.nfe-info-modal .products-table-container .products-table th:nth-child(3),
.nfe-info-modal .products-table-container .products-table td:nth-child(3) {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nfe-info-modal .products-table-container .products-table th:nth-child(6),
.nfe-info-modal .products-table-container .products-table td:nth-child(6) {
  min-width: 120px;
  white-space: nowrap;
}

/* Linha de produto inutilizado: mesmo tom avermelhado em todas (não integra CorpEM) */
.nfe-info-modal
  .products-table-container
  .products-table
  tr.product-row-inutilizado
  td {
  background-color: #ffebeb !important;
}

.nfe-info-modal
  .products-table-container
  .products-table
  tr.product-row-inutilizado:hover
  td {
  background-color: #ffe0e0 !important;
}

.nfe-info-modal
  .products-table-container
  .products-table
  tr.product-row-inutilizado.product-row-selected
  td {
  background-color: #ffd6d6 !important;
}

/* Booking Schedule Specific Styles */
.modal-content.nfe-info-modal .modal-header h3 i.fa-bookmark {
  color: #7b1fa2;
}

.booking-info-highlight {
  background: #f3e5f5 !important;
  border-color: #ba68c8 !important;
}

.booking-info-highlight label {
  color: #7b1fa2 !important;
}

.booking-empty-state {
  background: #f9f5ff;
  border: 2px dashed #ba68c8;
  padding: 2rem;
  text-align: center;
  border-radius: 8px;
  margin: 1rem 0;
}

.booking-empty-state i {
  color: #7b1fa2;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.booking-empty-state h3 {
  color: #7b1fa2;
  margin-bottom: 0.5rem;
}

.booking-empty-state p {
  color: #9c27b0;
  margin: 0;
}

/* NF-e PDF Tab Styles */
.nfe-pdf-tab-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0; /* Permite que o flex funcione corretamente */
  overflow: hidden; /* Evita scroll no container principal */
  position: relative; /* Para posicionamento correto */
  height: 100%; /* Garantir altura total */
}

.nfe-pdf-container {
  flex: 1;
  width: 100%;
  min-height: 0; /* Remover altura mínima fixa para usar todo o espaço disponível */
  height: 100%; /* Garantir altura total */
  display: block; /* Mudar para block para iframe funcionar */
  overflow: hidden; /* Evita scroll no container */
  position: relative; /* Para posicionamento do iframe */
  margin: 0; /* Remover margens */
  padding: 0; /* Remover padding */
}

.nfe-pdf-iframe {
  width: 100%;
  height: 100%;
  min-height: 0; /* Remove min-height fixo */
  border: none; /* Remover borda para maximizar espaço */
  border-radius: 0; /* Remover border-radius para ocupar todo o espaço */
  background: #f8f9fa;
  display: block; /* Garantir que seja exibido como bloco */
  position: absolute; /* Posicionamento absoluto para ocupar todo o container */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.nfe-pdf-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.nfe-pdf-loading i {
  font-size: 3rem;
  color: #007bff;
  margin-bottom: 1rem;
}

.nfe-pdf-loading p {
  color: #6c757d;
  font-size: 1rem;
}

.nfe-pdf-error-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.nfe-pdf-error-state i {
  font-size: 2.5rem;
  color: #f0ad4e;
  margin-bottom: 1rem;
}

.nfe-pdf-error-state h3 {
  color: #856404;
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
}

.nfe-pdf-error-state p {
  color: #6c757d;
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.nfe-pdf-error-state .nfe-pdf-error-suggestion {
  font-style: italic;
  margin-bottom: 1rem;
}

.nfe-pdf-error-state .nfe-pdf-error-actions {
  margin-top: 1rem;
}

/* Footer minimal quando a aba NF-e está ativa - ocupar mínimo espaço possível */
.minimal-footer {
  padding: 0.1rem 0.5rem !important; /* Padding mínimo - apenas espaço para o texto */
  min-height: auto !important;
  max-height: 20px !important; /* Altura máxima ainda mais reduzida */
  height: auto !important;
  border-top: 1px solid #e2e8f0;
  margin: 0 !important;
  flex-shrink: 0; /* Não encolher */
  gap: 0 !important; /* Remover gap entre elementos */
  align-items: center !important; /* Centralizar verticalmente */
  display: flex !important; /* Garantir flex */
}

.minimal-footer .footer-info {
  font-size: 0.6rem !important; /* Fonte ainda menor */
  line-height: 1 !important; /* Altura da linha mínima - sem espaçamento extra */
  margin: 0 !important;
  padding: 0 !important;
  flex: 0 0 auto !important; /* Não expandir */
  align-items: center;
  justify-content: flex-end;
  display: flex;
}

.minimal-footer .footer-info small {
  font-size: 0.6rem !important;
  line-height: 1 !important; /* Sem espaçamento extra */
  margin: 0 !important;
  padding: 0 !important;
}

.minimal-footer .footer-info i {
  font-size: 0.6rem !important; /* Ícone menor */
  margin-right: 0.15rem !important;
  margin-left: 0 !important;
  line-height: 1 !important;
}

.nfe-key-info {
  font-size: 0.875rem;
  color: #6c757d;
  font-family: monospace;
  margin-top: 1rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

/* Abas Prod. JSON e NF-e JSON */
.json-tab {
  padding: 1.5rem;
  overflow-y: auto;
  max-height: calc(90vh - 200px);
}

.json-section-container {
  max-width: 1000px;
  margin: 0 auto;
}

.json-tab .request-section .section-title i {
  color: #10b981;
}

/* Aba Dev */
.dev-tab {
  padding: 1.5rem;
  overflow-y: auto;
  max-height: calc(90vh - 200px);
}

.requests-container {
  max-width: 1000px;
  margin: 0 auto;
}

.request-entry {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
  transition: all 0.2s;
}

.request-entry:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.request-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f9fafb;
  transition: background 0.2s;
}

.request-header.clickable {
  cursor: pointer;
  user-select: none;
}

.request-header.clickable:hover {
  background: #f3f4f6;
}

.request-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chevron-icon {
  color: #6b7280;
  font-size: 14px;
  transition: transform 0.3s ease;
  width: 14px;
}

.request-number {
  font-size: 16px;
  font-weight: 600;
  color: #3b82f6;
}

.request-status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.request-status-badge.success {
  background: #d1fae5;
  color: #065f46;
}

.request-status-badge.error {
  background: #fee2e2;
  color: #991b1b;
}

.request-type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  background: #e0e7ff;
  color: #3730a3;
}

.request-date {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.request-content {
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.request-section,
.response-section {
  margin-bottom: 16px;
}

.request-section:last-child,
.response-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
  font-size: 14px;
}

.section-title.clickable {
  cursor: pointer;
  user-select: none;
  border-radius: 4px;
  padding: 2px 4px;
  margin-left: -4px;
  transition: background 0.15s;
}

.section-title.clickable:hover {
  background: #f3f4f6;
}

.request-section .section-title i {
  color: #10b981;
}

.response-section .section-title i {
  color: #3b82f6;
}

.code-block {
  background: #1f2937;
  color: #f9fafb;
  padding: 16px;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  overflow-x: auto;
  margin: 0;
  line-height: 1.5;
}

.dev-tab .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.dev-tab .empty-state i {
  font-size: 64px;
  color: #d1d5db;
  margin-bottom: 16px;
}

.dev-tab .empty-state h3 {
  font-size: 20px;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.dev-tab .empty-state p {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
}

/* Modal tabs com scroll horizontal quando necessário */
.modal-tabs {
  display: flex;
  overflow-x: scroll;
  overflow-y: hidden;
  flex-wrap: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f8f9fa;
  /* Forçar exibição da scrollbar sempre */
  scrollbar-gutter: stable;
  /* Garantir que a scrollbar sempre apareça */
  padding-bottom: 6px;
}

.modal-tabs::-webkit-scrollbar {
  height: 6px;
  display: block !important;
  -webkit-appearance: none;
}

.modal-tabs::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 3px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.1);
}

.modal-tabs::-webkit-scrollbar-thumb {
  background: #cbd5e0 !important;
  border-radius: 3px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  /* Forçar thumb sempre visível */
  opacity: 1 !important;
  visibility: visible !important;
  display: block !important;
  min-width: 20px;
  /* Garantir que o thumb sempre apareça */
  -webkit-appearance: none;
}

.modal-tabs::-webkit-scrollbar-thumb:hover {
  background: #a0aec0 !important;
}

/* Forçar thumb sempre visível mesmo sem hover */
.modal-tabs:hover::-webkit-scrollbar-thumb {
  background: #cbd5e0 !important;
}

/* Garantir que o thumb não seja ocultado automaticamente */
.modal-tabs::-webkit-scrollbar-thumb:active {
  background: #a0aec0 !important;
}

.tab-button {
  white-space: nowrap;
  flex-shrink: 0;
  min-width: fit-content;
}

/* Estilos para tabela de produtos - linhas zebradas */
.product-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
  background-color: #ffffff;
}

.product-row-odd {
  background-color: #f8f9fa;
}

.product-row:hover:not(.product-row-selected) {
  background-color: #e9ecef;
}

/* Linha selecionada */
.product-row-selected {
  background-color: #cce5ff !important;
}

.product-row-selected td {
  color: #004085;
}
</style>
