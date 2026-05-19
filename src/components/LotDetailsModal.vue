<template>
  <div v-if="showModal" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content lot-details-modal" ref="modal">
      <!-- Header -->
      <div class="modal-header">
        <h3>
          <i class="fas fa-layer-group"></i>
          Detalhes do Lote
        </h3>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="modal-loading">
        <div class="loader-spinner"></div>
        <p>Carregando informações do lote...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="modal-error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
      </div>

      <!-- Content -->
      <div v-else-if="lotData" class="modal-body">
        <div class="details-grid">
          <!-- Card: Informações do Lote -->
          <div class="info-card">
            <div class="card-header">
              <i class="fas fa-info-circle"></i>
              <h4>Informações do Lote</h4>
            </div>
            <div class="card-body">
              <div class="info-row">
                <span class="info-label">Código do Lote:</span>
                <span class="info-value lot-code">{{
                  lotData.lot || '-'
                }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Data de Criação:</span>
                <span class="info-value">{{
                  formatDate(lotData.createdAt)
                }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Criado por:</span>
                <span class="info-value">{{ lotData.createdBy || '-' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Quantidade de Pedidos:</span>
                <span class="info-value highlight">{{
                  lotData.orderCount || 0
                }}</span>
              </div>
            </div>
          </div>

          <!-- Card: Observações -->
          <div class="info-card" v-if="lotData.obs">
            <div class="card-header">
              <i class="fas fa-comment-alt"></i>
              <h4>Observações</h4>
            </div>
            <div class="card-body">
              <div class="observacoes-content">
                {{ lotData.obs }}
              </div>
            </div>
          </div>

          <!-- Card: Pedidos do Lote -->
          <div class="info-card full-width">
            <div class="card-header">
              <i class="fas fa-box"></i>
              <h4>Pedidos do Lote</h4>
            </div>
            <div class="card-body">
              <div
                v-if="lotData.orders && lotData.orders.length > 0"
                class="orders-list"
              >
                <div
                  v-for="order in lotData.orders"
                  :key="order.id"
                  class="order-item"
                >
                  <div class="order-item-content">
                    <div class="order-item-number">
                      <i class="fas fa-box"></i>
                      <span>Pedido #{{ order.numeroPedido }}</span>
                    </div>
                    <div class="order-item-status">
                      <span
                        class="status-badge"
                        :class="getStatusClass(order.status)"
                        :style="{
                          overflow: 'visible',
                          textOverflow: 'clip',
                          maxWidth: 'none',
                          width: 'auto',
                          minWidth: 'auto',
                        }"
                      >
                        {{ getStatusLabel(order.status) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="no-orders">
                <i class="fas fa-inbox"></i>
                <p>Nenhum pedido encontrado neste lote</p>
              </div>
            </div>
          </div>

          <!-- Card: Agendamentos de Entrada -->
          <div
            class="info-card full-width"
            v-if="
              lotData.checkinSchedules && lotData.checkinSchedules.length > 0
            "
          >
            <div class="card-header">
              <i class="fas fa-warehouse"></i>
              <h4>Agendamentos de Entrada</h4>
              <span class="badge-count">{{
                lotData.checkinSchedules.length
              }}</span>
            </div>
            <div class="card-body">
              <div class="schedules-list">
                <div
                  v-for="schedule in lotData.checkinSchedules"
                  :key="schedule.id"
                  class="schedule-item"
                >
                  <div class="schedule-main-info">
                    <div class="schedule-number">
                      <i class="fas fa-file-invoice"></i>
                      <span class="nf-label">NF:</span>
                      <span class="nf-value">{{ schedule.number || '-' }}</span>
                    </div>
                    <div class="schedule-client">
                      <i class="fas fa-building"></i>
                      <span>{{ schedule.clientName || '-' }}</span>
                    </div>
                  </div>
                  <div class="schedule-details">
                    <div class="schedule-detail-item">
                      <span class="detail-label">Status:</span>
                      <span
                        class="status-badge schedule-status"
                        :class="getScheduleStatusClass(schedule.status)"
                      >
                        {{ getScheduleStatusLabel(schedule.status) }}
                      </span>
                    </div>
                    <div class="schedule-detail-item" v-if="schedule.supplier">
                      <span class="detail-label">Fornecedor:</span>
                      <span class="detail-value">{{ schedule.supplier }}</span>
                    </div>
                    <div class="schedule-detail-item" v-if="schedule.qt_prod">
                      <span class="detail-label">Qtd. Produtos:</span>
                      <span class="detail-value">{{ schedule.qt_prod }}</span>
                    </div>
                    <div class="schedule-detail-item">
                      <span class="detail-label">Data:</span>
                      <span class="detail-value">{{
                        formatDate(schedule.date)
                      }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeModal">
          <i class="fas fa-times"></i>
          Fechar
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LotDetailsModal',
  props: {
    showModal: {
      type: Boolean,
      required: true,
    },
    lotCode: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      loading: false,
      error: null,
      lotData: null,
    }
  },
  watch: {
    async showModal(newVal) {
      if (newVal) this.$lockBodyScrollForModal?.()
      else this.$unlockBodyScrollForModal?.()
      if (newVal && this.lotCode) {
        await this.fetchLotDetails()
      }
    },
    lotCode(newVal) {
      if (newVal && this.showModal) {
        this.fetchLotDetails()
      }
    },
  },
  methods: {
    async fetchLotDetails() {
      if (!this.lotCode) {
        this.error = 'Código do lote não fornecido'
        return
      }

      this.loading = true
      this.error = null
      this.lotData = null

      try {
        const token = localStorage.getItem('token')
        const axios = (await import('axios')).default

        const response = await axios.get(`/expeditions/lot/${this.lotCode}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.data.success && response.data.lot) {
          this.lotData = response.data.lot
          console.log('✅ Detalhes do lote recebidos:', this.lotData)
        } else {
          this.error = 'Dados do lote não encontrados'
        }
      } catch (error) {
        console.error('❌ Erro ao buscar detalhes do lote:', error)
        this.error =
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Erro ao carregar detalhes do lote'
      } finally {
        this.loading = false
      }
    },
    closeModal() {
      this.$emit('close')
      // Limpar dados após fechar
      setTimeout(() => {
        this.lotData = null
        this.error = null
      }, 300)
    },
    handleOverlayClick(event) {
      if (event.target === event.currentTarget) {
        this.closeModal()
      }
    },
    formatDate(dateString) {
      if (!dateString) return '-'

      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return '-'

        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')

        return `${day}/${month}/${year} ${hours}:${minutes}`
      } catch {
        return '-'
      }
    },
    getStatusClass(status) {
      const statusMap = {
        Criado: 'status-created',
        Integrado: 'status-integrated',
        Separando: 'status-separating',
        Separado: 'status-separated',
        Embarcado: 'status-shipped',
        Rejeitado: 'status-rejected',
        Erro: 'status-error',
      }
      return statusMap[status] || 'status-default'
    },
    getStatusLabel(status) {
      return status || '-'
    },
    getScheduleStatusClass(status) {
      const statusMap = {
        'Em estoque': 'schedule-status-estoque',
        Conferência: 'schedule-status-conferencia',
        'Em conferência': 'schedule-status-conferencia',
        Agendado: 'schedule-status-agendado',
        Integrado: 'schedule-status-integrado',
        'Check-in': 'schedule-status-checkin',
        Recusado: 'schedule-status-recusado',
        Cancelado: 'schedule-status-cancelado',
      }
      return statusMap[status] || 'schedule-status-default'
    },
    getScheduleStatusLabel(status) {
      return status || '-'
    },
  },
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 10vh 20px;
  box-sizing: border-box;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-width: 900px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
  margin: 0 auto;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Header */
.modal-header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 14px 24px;
  border-bottom: 2px solid #e2e8f0;
  background: linear-gradient(135deg, #1c44f5, #0077ff);
  border-radius: 12px 12px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-header h3 i {
  font-size: 18px;
}

.btn-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 18px;
}

.btn-close:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

/* Body */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* Loading & Error */
.modal-loading,
.modal-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.loader-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modal-loading p,
.modal-error p {
  color: #64748b;
  font-size: 14px;
  margin: 0;
}

.modal-error i {
  font-size: 48px;
  color: #ef4444;
}

/* Details Grid */
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.info-card {
  background: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  overflow: visible !important;
}

.info-card.full-width {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: linear-gradient(135deg, #1c44f5, #0077ff);
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px 10px 0 0;
  width: 100%;
}

.card-header i {
  font-size: 18px;
}

.card-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge-count {
  background: rgba(255, 255, 255, 0.3);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  margin-left: auto;
}

.card-body {
  padding: 16px;
  overflow: visible !important;
}

/* Info Rows */
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #475569;
  font-size: 14px;
}

.info-value {
  color: #1e293b;
  font-size: 14px;
  text-align: right;
}

.info-value.lot-code {
  font-family: 'Courier New', monospace;
  background: #e0e7ff;
  padding: 4px 8px;
  border-radius: 6px;
  color: #4c1d95;
  font-weight: 600;
}

.info-value.highlight {
  font-weight: 700;
  color: #667eea;
  font-size: 16px;
}

/* Observações */
.observacoes-content {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  color: #1e293b;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 60px;
}

/* Orders List */
.orders-list {
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
  overflow: visible !important;
  width: 100% !important;
}

.orders-list > .order-item {
  display: block !important;
}

.orders-list .order-item > .order-item-content {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  align-items: center !important;
}

.orders-list .order-item .order-item-number,
.orders-list .order-item .order-item-status {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
}

.order-item {
  background: white !important;
  padding: 12px 16px !important;
  border-radius: 8px !important;
  border: 1px solid #e2e8f0 !important;
  transition: all 0.2s !important;
  width: 100% !important;
  overflow: visible !important;
  box-sizing: border-box !important;
  display: block !important;
}

.order-item:hover {
  border-color: #667eea !important;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1) !important;
}

.order-item-content {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 16px !important;
  width: 100% !important;
  box-sizing: border-box !important;
}

.order-item-number {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  align-items: center !important;
  gap: 8px !important;
  font-weight: 600 !important;
  color: #1e293b !important;
  font-size: 14px !important;
  flex: 1 1 auto !important;
  min-width: 0 !important;
  overflow: visible !important;
  white-space: nowrap !important;
}

.order-item-number i {
  color: #667eea !important;
  font-size: 14px !important;
  flex-shrink: 0 !important;
}

.order-item-number span {
  white-space: nowrap !important;
  overflow: visible !important;
}

.order-item-status {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  align-items: center !important;
  justify-content: flex-end !important;
  flex: 0 0 auto !important;
  min-width: fit-content !important;
  flex-shrink: 0 !important;
}

.no-orders {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
  color: #94a3b8;
}

.no-orders i {
  font-size: 48px;
}

.no-orders p {
  margin: 0;
  font-size: 14px;
}

/* Status Badges - Sobrescrever estilos globais do App.vue */
.lot-details-modal .status-badge,
.order-item-status .status-badge,
.order-item-content .status-badge {
  display: inline-flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 6px 12px !important;
  border-radius: 7px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.4px !important;
  min-height: auto !important;
  height: auto !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
  /* CRÍTICO: Sobrescrever estilos globais que cortam o texto */
  overflow: visible !important;
  text-overflow: clip !important;
  max-width: none !important;
  width: auto !important;
  min-width: auto !important;
  container-type: normal !important;
  line-height: 1.2 !important;
  vertical-align: middle !important;
}

.lot-details-modal .status-created,
.order-item-status .status-created {
  background: #dbeafe !important;
  color: #1e40af !important;
}

.lot-details-modal .status-integrated,
.order-item-status .status-integrated {
  background: #fef3c7 !important;
  color: #92400e !important;
}

.lot-details-modal .status-separating,
.order-item-status .status-separating {
  background: #dbeafe !important;
  color: #1e40af !important;
}

.lot-details-modal .status-separated,
.order-item-status .status-separated {
  background: #d1fae5 !important;
  color: #065f46 !important;
}

.lot-details-modal .status-shipped,
.order-item-status .status-shipped {
  background: #e9d5ff !important;
  color: #6b21a8 !important;
}

.lot-details-modal .status-rejected,
.order-item-status .status-rejected {
  background: #fed7aa !important;
  color: #9a3412 !important;
}

.lot-details-modal .status-error,
.order-item-status .status-error {
  background: #fee2e2 !important;
  color: #991b1b !important;
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 2px solid #e2e8f0;
  background: #f8f9fa;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #64748b;
  color: white;
}

.btn-secondary:hover {
  background: #475569;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 116, 139, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-content {
    max-width: 100%;
    max-height: 80vh;
    margin: 10px;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .info-card.full-width {
    grid-column: 1;
  }

  .modal-body {
    padding: 16px;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .info-value {
    text-align: left;
  }
}

/* Agendamentos de Entrada */
.schedules-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.schedule-item {
  background: white;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.schedule-item:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.schedule-main-info {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.schedule-number {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1e293b;
}

.schedule-number i {
  color: #667eea;
  font-size: 16px;
}

.nf-label {
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
}

.nf-value {
  color: #1e40af;
  font-size: 15px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.schedule-client {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #475569;
  font-size: 14px;
}

.schedule-client i {
  color: #94a3b8;
  font-size: 13px;
}

.schedule-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.schedule-detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.detail-label {
  color: #64748b;
  font-weight: 600;
  min-width: 80px;
}

.detail-value {
  color: #1e293b;
}

.schedule-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.schedule-status-estoque {
  background: #d1fae5;
  color: #065f46;
}

.schedule-status-conferencia {
  background: #fef3c7;
  color: #92400e;
}

.schedule-status-agendado {
  background: #dbeafe;
  color: #1e40af;
}

.schedule-status-integrado {
  background: #e0e7ff;
  color: #3730a3;
}

.schedule-status-checkin {
  background: #f3e8ff;
  color: #6b21a8;
}

.schedule-status-recusado {
  background: #fee2e2;
  color: #991b1b;
}

.schedule-status-cancelado {
  background: #f3f4f6;
  color: #6b7280;
}

.schedule-status-default {
  background: #e2e8f0;
  color: #334155;
}

/* Media queries para responsividade em mobile */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 10vh 10px !important;
  }

  .modal-content {
    max-width: 95vw !important;
    max-height: 80vh !important;
  }

  .modal-header {
    padding: 12px 16px !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
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
    font-size: 16px !important;
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

  .order-item {
    padding: 10px 12px !important;
  }

  .order-item-content {
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    gap: 12px !important;
  }

  .order-item-number {
    font-size: 13px !important;
    white-space: nowrap !important;
  }

  .order-item-status {
    flex-shrink: 0 !important;
  }

  .order-item-status .status-badge,
  .order-item-content .status-badge {
    font-size: 10px !important;
    padding: 4px 10px !important;
    white-space: nowrap !important;
    letter-spacing: 0.3px !important;
  }
}

@media (max-width: 480px) {
  .modal-header h3 {
    font-size: 13px !important;
    white-space: nowrap !important;
  }

  .modal-header h3 i {
    font-size: 14px !important;
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

  .order-item-content {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 8px !important;
  }

  .order-item-status .status-badge,
  .order-item-content .status-badge {
    font-size: 9px !important;
    padding: 3px 8px !important;
    letter-spacing: 0.2px !important;
  }
}
</style>
