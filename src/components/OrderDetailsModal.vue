<template>
  <div v-if="showModal" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content order-details-modal" ref="modal">
      <!-- Header -->
      <div class="modal-header">
        <h3>
          <i class="fas fa-box"></i>
          Detalhes do Pedido #{{ orderData?.numeroPedido || orderData?.id }}
        </h3>
      </div>

      <!-- Tabs -->
      <div class="modal-tabs">
        <button
          :class="['tab-button', { active: activeTab === 'details' }]"
          @click="setActiveTab('details')"
        >
          <i class="fas fa-info-circle"></i>
          Detalhes
        </button>
        <button
          :class="['tab-button', { active: activeTab === 'history' }]"
          @click="setActiveTab('history')"
        >
          <i class="fas fa-history"></i>
          Histórico
        </button>
        <button
          v-if="hasNfeXml"
          :class="['tab-button', { active: activeTab === 'nfe-pdf' }]"
          @click="setActiveTab('nfe-pdf')"
        >
          <i class="fas fa-file-pdf"></i>
          NF-e
        </button>
        <button
          :class="['tab-button', { active: activeTab === 'dev' }]"
          @click="setActiveTab('dev')"
        >
          <i class="fas fa-code"></i>
          Dev
        </button>
      </div>

      <!-- Content -->
      <div class="modal-body">
        <!-- Aba: Detalhes -->
        <div v-if="activeTab === 'details'" class="tab-content details-tab">
          <div class="details-grid">
            <!-- Card: Informações Básicas -->
            <div class="info-card">
              <div class="card-header">
                <i class="fas fa-file-invoice"></i>
                <h4>Informações Básicas</h4>
              </div>
              <div class="card-body">
                <div class="info-row">
                  <span class="info-label">Número do Pedido:</span>
                  <span class="info-value">{{
                    orderData?.numeroPedido || '-'
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Número da NF:</span>
                  <span class="info-value">{{
                    orderData?.numeroNF || '-'
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Série da NF:</span>
                  <span class="info-value">{{
                    orderData?.serieNF || '-'
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Chave da NF-e:</span>
                  <span class="info-value nfe-key">{{
                    orderData?.chaveNF || '-'
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Data de Emissão:</span>
                  <span class="info-value">{{
                    formatDate(orderData?.dataEmissao)
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Valor Total:</span>
                  <span class="info-value highlight">{{
                    formatCurrency(orderData?.valorTotal)
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Status:</span>
                  <span class="info-value">
                    <span
                      class="status-badge"
                      :class="getStatusClass(orderData?.status)"
                      :title="getRejectionTooltip(orderData?.rejectionCode)"
                    >
                      {{ getStatusLabel(orderData?.status) }}
                      <i
                        v-if="orderData?.rejectionCode"
                        class="fas fa-info-circle rejection-icon"
                      ></i>
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Card: Estoque -->
            <div class="info-card">
              <div class="card-header">
                <i class="fas fa-warehouse"></i>
                <h4>Estoque</h4>
              </div>
              <div class="card-body">
                <div class="info-row">
                  <span class="info-label">Nome:</span>
                  <span class="info-value">{{
                    orderData?.armazem?.nome || orderData?.armazem || '-'
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">CNPJ:</span>
                  <span class="info-value">{{
                    formatCNPJ(
                      orderData?.armazem?.cnpj || orderData?.cnpjArmazem
                    )
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Card: Destinatário -->
            <div class="info-card">
              <div class="card-header">
                <i class="fas fa-map-marker-alt"></i>
                <h4>Destinatário</h4>
              </div>
              <div class="card-body">
                <div class="info-row">
                  <span class="info-label">Nome:</span>
                  <span class="info-value">{{
                    orderData?.destinatario?.nome || orderData?.cliente || '-'
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">CNPJ/CPF:</span>
                  <span class="info-value">{{
                    formatCNPJ(
                      orderData?.destinatario?.cnpj || orderData?.cnpjCliente
                    )
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">IE:</span>
                  <span class="info-value">{{
                    orderData?.destinatario?.ie || '-'
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">CEP:</span>
                  <span class="info-value">{{
                    formatCEP(orderData?.destinatario?.cep)
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">UF:</span>
                  <span class="info-value">{{
                    orderData?.destinatario?.uf || '-'
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Município:</span>
                  <span class="info-value">{{
                    orderData?.destinatario?.municipio || '-'
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Bairro:</span>
                  <span class="info-value">{{
                    orderData?.destinatario?.bairro || '-'
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Logradouro:</span>
                  <span class="info-value">{{
                    orderData?.destinatario?.logradouro || '-'
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Número:</span>
                  <span class="info-value">{{
                    orderData?.destinatario?.numero || '-'
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Card: Transporte -->
            <div class="info-card" v-if="orderData?.transporte">
              <div class="card-header">
                <i class="fas fa-truck"></i>
                <h4>Transporte</h4>
              </div>
              <div class="card-body">
                <div class="info-row">
                  <span class="info-label">Tipo de Frete:</span>
                  <span class="info-value">{{
                    formatTipoFrete(orderData?.transporte?.tipoFrete)
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Nome Transportadora:</span>
                  <span class="info-value">{{
                    orderData?.transporte?.nomeTransportadora || '-'
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">CNPJ Transportadora:</span>
                  <span class="info-value">{{
                    formatCNPJ(orderData?.transporte?.cnpjTransportadora)
                  }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">UF Transportadora:</span>
                  <span class="info-value">{{
                    orderData?.transporte?.ufTransportadora || '-'
                  }}</span>
                </div>
              </div>
            </div>

            <!-- Card: Itens do Pedido -->
            <div
              class="info-card full-width"
              v-if="orderData?.itens && orderData.itens.length > 0"
            >
              <div class="card-header">
                <i class="fas fa-boxes"></i>
                <h4>Itens do Pedido ({{ orderData.itens.length }})</h4>
              </div>
              <div class="card-body">
                <div class="items-table-container">
                  <table class="items-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Descrição</th>
                        <th class="th-center">Quant.</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, index) in orderData.itens" :key="index">
                        <td>{{ item.CODPROD || '-' }}</td>
                        <td>
                          {{
                            item.DESCPROD ||
                            item.descricao ||
                            item.DESCRICAO ||
                            '-'
                          }}
                        </td>
                        <td class="td-center">{{ item.QTPROD || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Aba: Histórico -->
        <div v-if="activeTab === 'history'" class="tab-content history-tab">
          <div
            v-if="historicData && historicData.length > 0"
            class="history-container"
          >
            <div class="history-timeline">
              <div
                v-for="(entry, index) in historicData"
                :key="index"
                class="history-entry"
              >
                <div class="history-icon">
                  <i :class="getHistoryIcon(entry.action)"></i>
                </div>
                <div class="history-content">
                  <div class="history-header">
                    <h5 class="history-action">
                      {{ entry.action || 'Ação realizada' }}
                    </h5>
                    <span class="history-timestamp">{{
                      formatDateTime(entry.timestamp)
                    }}</span>
                  </div>
                  <div class="history-user">
                    <i class="fas fa-user"></i>
                    Por: <strong>{{ entry.user || 'Sistema' }}</strong>
                  </div>
                  <div v-if="entry.details" class="history-details">
                    <p>{{ entry.details }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <i class="fas fa-history"></i>
            <h3>Nenhum histórico encontrado</h3>
            <p>Este pedido ainda não possui histórico de ações.</p>
          </div>
        </div>

        <!-- Aba: NF-e (PDF renderizado a partir do XML) -->
        <div
          v-if="activeTab === 'nfe-pdf'"
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
            <p
              v-if="nfePdfError.suggestion"
              class="nfe-pdf-error-suggestion"
            >
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
            <p>
              Não foi possível carregar o PDF da NF-e para este pedido.
            </p>
            <p v-if="orderData?.chaveNF" class="nfe-key-info">
              Chave de acesso: {{ orderData.chaveNF }}
            </p>
          </div>
        </div>

        <!-- Aba: Dev -->
        <div v-if="activeTab === 'dev'" class="tab-content dev-tab">
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
                </div>
                <span class="request-date">{{
                  formatDateTime(req.timestamp)
                }}</span>
              </div>

              <!-- Conteúdo colapsável -->
              <div v-show="isRequestExpanded(index)" class="request-content">
                <!-- Requisição -->
                <div class="request-section">
                  <div class="section-title">
                    <i class="fas fa-arrow-up"></i>
                    Requisição
                  </div>
                  <pre class="code-block">{{ formatJSON(req.request) }}</pre>
                </div>

                <!-- Resposta -->
                <div class="response-section">
                  <div class="section-title">
                    <i class="fas fa-arrow-down"></i>
                    Resposta
                  </div>
                  <pre class="code-block">{{ formatJSON(req.response) }}</pre>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <i class="fas fa-code"></i>
            <h3>Nenhuma requisição encontrada</h3>
            <p>
              Este pedido ainda não possui requisições registradas no CorpEM.
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeModal">Fechar</button>
      </div>
    </div>
  </div>
</template>

<script>
import { BASE_URL } from '../config/api.js'

export default {
  name: 'OrderDetailsModal',

  props: {
    showModal: {
      type: Boolean,
      default: false,
    },
    orderData: {
      type: Object,
      default: () => ({}),
    },
  },

  data() {
    return {
      activeTab: 'details',
      expandedRequests: [], // Array de índices das requisições expandidas
      devPollingInterval: null, // Polling da aba Dev em tempo real
      nfePdfUrl: null,
      loadingNfePdf: false,
      nfePdfError: null, // { message, suggestion?, nfeKey? } quando geração falha
      lastNfePdfOrderId: null, // controla recarga quando o pedido muda
    }
  },

  beforeUnmount() {
    if (this.devPollingInterval) {
      clearInterval(this.devPollingInterval)
      this.devPollingInterval = null
    }
    this.revokeNfePdfUrl()
  },

  watch: {
    showModal(newVal) {
      if (newVal) {
        this.activeTab = 'details'
        this.expandedRequests = []
      } else {
        // Ao fechar, libera o blob e força recarga na próxima abertura
        this.revokeNfePdfUrl()
        this.nfePdfError = null
        this.lastNfePdfOrderId = null
      }
      this.syncDevPolling()
    },
    activeTab() {
      this.syncDevPolling()
    },
    'orderData.id'(newId, oldId) {
      // Pedido mudou: descarta PDF anterior
      if (newId !== oldId) {
        this.revokeNfePdfUrl()
        this.nfePdfError = null
        this.lastNfePdfOrderId = null
      }
    },
  },

  computed: {
    historicData() {
      if (!this.orderData?.historic) return []

      // Se historic for string JSON, parsear
      if (typeof this.orderData.historic === 'string') {
        try {
          return JSON.parse(this.orderData.historic)
        } catch (e) {
          console.error('Erro ao parsear historic:', e)
          return []
        }
      }

      // Se já for array, retornar
      return Array.isArray(this.orderData.historic)
        ? this.orderData.historic
        : []
    },

    requestsData() {
      if (!this.orderData?.req) return []

      // Se req for string JSON, parsear
      if (typeof this.orderData.req === 'string') {
        try {
          return JSON.parse(this.orderData.req)
        } catch (e) {
          console.error('Erro ao parsear req:', e)
          return []
        }
      }

      // Se já for array, retornar
      return Array.isArray(this.orderData.req) ? this.orderData.req : []
    },

    hasNfeXml() {
      const od = this.orderData
      if (!od) return false
      // Backend já entrega `hasXml` quando orders.xml está preenchido.
      // Fallback: aceita também `chaveNF` (44 dígitos) — o endpoint poderá responder com link SEFAZ.
      if (od.hasXml === true) return true
      if (od.xml && typeof od.xml === 'string' && od.xml.trim().length > 0) return true
      return false
    },
  },

  methods: {
    setActiveTab(tab) {
      this.activeTab = tab
      // Lazy-load do PDF quando entra na aba NF-e pela primeira vez (ou após troca de pedido)
      if (tab === 'nfe-pdf' && this.hasNfeXml) {
        const id = this.orderData?.id
        if (
          !this.loadingNfePdf &&
          (!this.nfePdfUrl || this.lastNfePdfOrderId !== id)
        ) {
          this.loadNfePdf()
        }
      }
    },

    async loadNfePdf() {
      const id = this.orderData?.id
      if (!id) return

      this.loadingNfePdf = true
      this.revokeNfePdfUrl()
      this.nfePdfError = null
      this.lastNfePdfOrderId = id

      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${BASE_URL}/expeditions/${id}/nfe-pdf`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })
        const data = await response.json().catch(() => ({}))

        if (response.ok && data && data.pdfBase64) {
          const blob = this.base64ToBlob(data.pdfBase64, 'application/pdf')
          this.nfePdfUrl = URL.createObjectURL(blob)
        } else {
          this.nfePdfError = {
            message:
              (data && (data.message || data.error)) ||
              'Não foi possível gerar o PDF da NF-e.',
            nfeKey: (data && data.nfeKey) || this.orderData?.chaveNF || null,
            suggestion: (data && data.suggestion) || null,
          }
        }
      } catch (error) {
        console.error('❌ [ORDER-NFE-PDF] Erro ao carregar PDF:', error)
        this.nfePdfError = {
          message:
            'Erro ao carregar PDF da NF-e. Verifique a conexão e tente novamente.',
          nfeKey: this.orderData?.chaveNF || null,
          suggestion: null,
        }
      } finally {
        this.loadingNfePdf = false
      }
    },

    revokeNfePdfUrl() {
      if (this.nfePdfUrl) {
        try {
          URL.revokeObjectURL(this.nfePdfUrl)
        } catch (_) {}
        this.nfePdfUrl = null
      }
    },

    getSefazUrl(nfeKey) {
      if (!nfeKey) return '#'
      const cleanKey = String(nfeKey).replace(/[^\d]/g, '')
      return `https://www.nfe.fazenda.gov.br/portal/consulta.aspx?p=${cleanKey}`
    },

    base64ToBlob(base64, mimeType) {
      const byteCharacters = atob(base64)
      const len = byteCharacters.length
      const byteNumbers = new Array(len)
      for (let i = 0; i < len; i++) byteNumbers[i] = byteCharacters.charCodeAt(i)
      return new Blob([new Uint8Array(byteNumbers)], { type: mimeType })
    },

    closeModal() {
      this.$emit('close')
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

    handleOverlayClick(event) {
      if (event.target.classList.contains('modal-overlay')) {
        this.closeModal()
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
        this.orderData &&
        (this.orderData.id != null || this.orderData.numeroPedido != null)
      if (!shouldPoll) return
      const orderId = this.orderData.id ?? this.orderData.numeroPedido
      if (orderId == null) return
      this.$emit('refresh-order', { orderId })
      this.devPollingInterval = setInterval(() => {
        if (!this.showModal || this.activeTab !== 'dev') {
          clearInterval(this.devPollingInterval)
          this.devPollingInterval = null
          return
        }
        this.$emit('refresh-order', { orderId })
      }, 4000)
    },

    formatDate(dateString) {
      if (!dateString) return '-'

      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('pt-BR')
      } catch (e) {
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

    formatCurrency(value) {
      if (!value && value !== 0) return '-'

      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value)
    },

    formatCNPJ(cnpj) {
      if (!cnpj) return '-'

      // Remove caracteres não numéricos
      const numbers = cnpj.replace(/\D/g, '')

      if (numbers.length === 14) {
        return numbers.replace(
          /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
          '$1.$2.$3/$4-$5'
        )
      } else if (numbers.length === 11) {
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      }

      return cnpj
    },

    formatCEP(cep) {
      if (!cep) return '-'

      const numbers = cep.replace(/\D/g, '')

      if (numbers.length === 8) {
        return numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
      }

      return cep
    },

    formatTipoFrete(tipo) {
      if (!tipo) return '-'

      const tipos = {
        C: 'CIF (Por conta do remetente)',
        F: 'FOB (Por conta do destinatário)',
        CIF: 'CIF (Por conta do remetente)',
        FOB: 'FOB (Por conta do destinatário)',
      }

      return tipos[tipo.toUpperCase()] || tipo
    },

    formatJSON(obj) {
      if (!obj) return ''

      try {
        return JSON.stringify(obj, null, 2)
      } catch (e) {
        return String(obj)
      }
    },

    getStatusLabel(status) {
      const labels = {
        Criado: 'Criado',
        pendente: 'Pendente',
        Integrado: 'Integrado',
        Rejeitado: 'Rejeitado',
        Erro: 'Erro',
        erro_token: 'Erro - Token',
        erro_corpem: 'Erro - CorpEM',
        erro_envio: 'Erro - Envio',
      }
      return labels[status] || status || 'Pendente'
    },

    getStatusClass(status) {
      const classes = {
        Criado: 'status-criado',
        pendente: 'status-pendente',
        Integrado: 'status-integrado',
        Rejeitado: 'status-rejeitado',
        Erro: 'status-erro',
        erro_token: 'status-erro',
        erro_corpem: 'status-erro',
        erro_envio: 'status-erro',
      }
      return classes[status] || 'status-default'
    },

    getRejectionTooltip(rejectionCode) {
      if (!rejectionCode) return ''

      const rejectionMessages = {
        1: 'Código 1: No. NF Inválido',
        2: 'Código 2: Dt. Emi. Inválida',
        3: 'Código 3: NF/Ped. Existente',
        4: 'Código 4: CNPJ Transp. não Informado',
        5: 'Código 5: No. Pedido não Informado',
        6: 'Código 6: Merc(s). Rejeitada(s)',
        7: 'Código 7: No. N.F. não Informado',
        8: 'Código 8: Série N.F. não Informada',
        9: 'Código 9: Dt. Emissão não Informada',
        A: 'Código A: Vl. N.F. não Informado',
        B: 'Código B: CNPJ/CPF Dest. não Informado',
        V: 'Código V: R. Social Dest. não Informado',
        D: 'Código D: Logradouro não Informado',
        E: 'Código E: Município não Informado',
        F: 'Código F: UF não Informada',
        G: 'Código G: Bairro não Informado',
        H: 'Código H: CEP não Informado',
        I: 'Código I: Vl. N.F. Inválido',
      }

      return (
        rejectionMessages[rejectionCode.toUpperCase()] ||
        `Código de rejeição: ${rejectionCode}`
      )
    },

    getHistoryIcon(action) {
      if (!action) return 'fas fa-circle'

      const actionLower = action.toLowerCase()

      if (actionLower.includes('criado') || actionLower.includes('created')) {
        return 'fas fa-plus-circle text-success'
      } else if (actionLower.includes('integr')) {
        return 'fas fa-exchange-alt text-info'
      } else if (
        actionLower.includes('erro') ||
        actionLower.includes('error')
      ) {
        return 'fas fa-exclamation-circle text-danger'
      } else if (actionLower.includes('cancel')) {
        return 'fas fa-times-circle text-danger'
      } else if (
        actionLower.includes('edit') ||
        actionLower.includes('alter')
      ) {
        return 'fas fa-edit text-warning'
      } else {
        return 'fas fa-circle text-secondary'
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 10vh 20px;
  box-sizing: border-box;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 95vw;
  max-width: 95vw;
  height: 80vh;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
.modal-header button.btn-close,
button.btn-close[data-v-9c8bceb5],
button[class*='btn-close'] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  width: 0 !important;
  height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  position: absolute !important;
  left: -9999px !important;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.modal-header h3 i {
  color: #3b82f6;
  font-size: 16px;
  flex-shrink: 0;
}

.modal-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e5e7eb;
  padding: 0 24px;
  background: #f9fafb;
}

.tab-button {
  padding: 16px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: #6b7280;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: -2px;
}

.tab-button:hover {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  min-height: 0;
}

.tab-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Aba Detalhes */
.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.info-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.info-card.full-width {
  grid-column: 1 / -1;
}

.card-header {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.card-body {
  padding: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #e5e7eb;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: #6b7280;
  flex-shrink: 0;
  margin-right: 16px;
}

.info-value {
  text-align: right;
  color: #1f2937;
  font-weight: 500;
  word-break: break-word;
}

.info-value.nfe-key {
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.info-value.highlight {
  color: #059669;
  font-weight: 600;
  font-size: 18px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  min-width: 100px;
  text-align: center;
  cursor: default;
  position: relative;
}

.status-badge[title]:hover {
  cursor: help;
}

.rejection-icon {
  font-size: 12px;
  opacity: 0.8;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}

.status-criado {
  background: #dbeafe;
  color: #1e40af;
}

.status-pendente {
  background: #fef3c7;
  color: #92400e;
}

.status-integrado {
  background: #d1fae5;
  color: #065f46;
}

.status-rejeitado {
  background: #fef3c7;
  color: #ea580c;
  border: 2px solid #fb923c;
}

.status-erro {
  background: #fee2e2;
  color: #991b1b;
}

.status-default {
  background: #f3f4f6;
  color: #4b5563;
}

/* Tabela de Itens */
.items-table-container {
  overflow-x: auto;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table thead {
  background: #f3f4f6;
}

.items-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.items-table th.th-center {
  text-align: center;
}

.items-table td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
}

.items-table td.td-center {
  text-align: center;
}

.items-table tbody tr:hover {
  background: #f9fafb;
}

/* Aba Histórico */
.history-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.history-container {
  flex: 1;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.history-timeline {
  position: relative;
  padding-left: 70px;
  flex: 1;
  min-height: 100%;
}

.history-timeline::before {
  content: '';
  position: absolute;
  left: 30px;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(to bottom, #3b82f6, #e5e7eb);
  min-height: 100%;
}

.history-entry {
  position: relative;
  margin-bottom: 24px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s;
}

.history-entry:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.history-icon {
  position: absolute;
  left: -58px;
  top: 16px;
  width: 44px;
  height: 44px;
  background: white;
  border: 3px solid #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.history-icon i {
  font-size: 16px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.history-action {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.history-timestamp {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.history-user {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 8px;
}

.history-user strong {
  color: #1f2937;
}

.history-details {
  margin-top: 12px;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

.history-details p {
  margin: 0;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.5;
}

/* Aba Dev */
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

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-state i {
  font-size: 64px;
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 20px;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
}

/* Aba NF-e (PDF) */
.nfe-pdf-tab-content {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  padding: 0;
}
.nfe-pdf-container {
  flex: 1;
  display: flex;
  min-height: 480px;
  height: 100%;
}
.nfe-pdf-iframe {
  width: 100%;
  height: 100%;
  min-height: 480px;
  border: none;
  background: #fff;
}
.nfe-pdf-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6b7280;
  gap: 12px;
}
.nfe-pdf-loading i {
  font-size: 32px;
  color: #2563eb;
}
.nfe-pdf-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  gap: 12px;
}
.nfe-pdf-error-state i {
  font-size: 48px;
  color: #f59e0b;
}
.nfe-pdf-error-state h3 {
  margin: 0;
  font-size: 18px;
  color: #6b7280;
}
.nfe-pdf-error-state p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}
.nfe-pdf-error-suggestion {
  font-style: italic;
  color: #9ca3af;
}
.nfe-pdf-error-actions {
  margin-top: 8px;
}
.nfe-key-info {
  margin-top: 8px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #9ca3af;
}

/* Modal Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

/* Scrollbar */
.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f3f4f6;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #9ca3af;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Responsividade */
@media (max-width: 768px) {
  .details-grid {
    grid-template-columns: 1fr;
  }

  .modal-overlay {
    padding: 10vh 10px !important;
  }

  .modal-content {
    width: 95vw;
    max-width: 95vw;
    height: 80vh;
    max-height: 80vh;
    border-radius: 0;
  }

  .modal-tabs {
    overflow-x: auto;
  }

  .tab-button {
    padding: 12px 16px;
    font-size: 14px;
    white-space: nowrap;
  }
}

/* Media queries para responsividade em mobile */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px !important;
  }

  .modal-content {
    max-width: 95vw !important;
    max-height: 80vh !important;
  }

  .modal-header {
    padding: 12px 16px !important;
    justify-content: center !important;
  }

  .modal-header h3 {
    font-size: 14px !important;
    gap: 8px !important;
    flex-wrap: nowrap !important;
    line-height: 1.3 !important;
    white-space: nowrap !important;
  }

  .modal-header h3 i {
    font-size: 14px !important;
    flex-shrink: 0 !important;
  }

  .modal-body {
    padding: 16px 18px !important;
  }

  .details-grid {
    grid-template-columns: 1fr !important;
    gap: 16px !important;
  }

  .card-header {
    padding: 12px 14px !important;
  }

  .card-header h4 {
    font-size: 14px !important;
  }

  .card-header i {
    font-size: 16px !important;
  }

  .card-body {
    padding: 12px 14px !important;
  }

  .info-row {
    padding: 10px 0 !important;
    font-size: 13px !important;
  }

  .info-label {
    font-size: 12px !important;
  }

  .info-value {
    font-size: 13px !important;
  }

  .tab-button {
    padding: 10px 12px !important;
    font-size: 13px !important;
  }
}

@media (max-width: 480px) {
  .modal-header {
    justify-content: center !important;
  }

  .modal-header h3 {
    font-size: 13px !important;
  }

  .modal-header h3 i {
    font-size: 13px !important;
  }

  .modal-body {
    padding: 12px 14px !important;
  }

  .card-header h4 {
    font-size: 13px !important;
  }

  .info-row {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 4px !important;
  }

  .info-label {
    font-size: 11px !important;
  }

  .info-value {
    font-size: 12px !important;
  }

  .tab-button {
    padding: 8px 10px !important;
    font-size: 12px !important;
  }
}
</style>
