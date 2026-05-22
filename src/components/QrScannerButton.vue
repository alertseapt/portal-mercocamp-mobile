<template>
  <div class="qr-scanner-root">
    <!-- Botão flutuante (canto superior direito) — mesmo estilo do FAB da sidebar -->
    <button
      class="camera-scan-toggle-fixed"
      type="button"
      :disabled="scanning"
      @click="openScanner"
      aria-label="Ler QR code da carga"
    >
      <i class="fas" :class="scanning ? 'fa-spinner fa-spin' : 'fa-camera'"></i>
    </button>

    <!-- Resultado da leitura -->
    <div
      v-if="resultVisible"
      class="qr-result-overlay"
      @click.self="closeResult"
    >
      <div class="qr-result-card">
        <div
          class="qr-result-header"
          :class="found ? 'is-found' : 'is-notfound'"
        >
          <i
            class="fas"
            :class="found ? 'fa-check-circle' : 'fa-exclamation-circle'"
          ></i>
          <h3>{{ found ? 'Carga encontrada' : 'Carga não encontrada' }}</h3>
        </div>

        <div class="qr-result-body">
          <template v-if="found && carga">
            <div class="qr-row">
              <span class="qr-label">ID</span>
              <span class="qr-value">{{ carga.load_id || '—' }}</span>
            </div>
            <div class="qr-row">
              <span class="qr-label">Status</span>
              <span class="qr-value">{{ carga.status || '—' }}</span>
            </div>
            <div class="qr-row">
              <span class="qr-label">Operação</span>
              <span class="qr-value">{{ carga.operation || '—' }}</span>
            </div>
            <div class="qr-row">
              <span class="qr-label">Armazém</span>
              <span class="qr-value">{{ carga.storage?.name || '—' }}</span>
            </div>
            <div class="qr-row">
              <span class="qr-label">Transportadora</span>
              <span class="qr-value">{{
                carga.transport_company?.name || '—'
              }}</span>
            </div>
            <div class="qr-row">
              <span class="qr-label">Apresentante</span>
              <span class="qr-value">{{ carga.presenter?.name || '—' }}</span>
            </div>
            <div class="qr-row">
              <span class="qr-label">Doca</span>
              <span class="qr-value">{{ carga.dock || '—' }}</span>
            </div>
            <div class="qr-row">
              <span class="qr-label">Agendamentos</span>
              <span class="qr-value">{{ carga.schedules_count ?? '—' }}</span>
            </div>
          </template>
          <template v-else>
            <p class="qr-message">{{ message }}</p>
            <!-- Diagnóstico (fase de testes): valor lido e erro técnico -->
            <div v-if="scannedValue" class="qr-diag">
              <div class="qr-row">
                <span class="qr-label">Lido do QR</span>
                <span class="qr-value">{{ scannedValue }}</span>
              </div>
              <div v-if="errorDetail" class="qr-row">
                <span class="qr-label">Detalhe</span>
                <span class="qr-value">{{ errorDetail }}</span>
              </div>
            </div>
          </template>
        </div>

        <div class="qr-result-footer">
          <button class="qr-ok-btn" type="button" @click="closeResult">
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  BarcodeScanner,
  BarcodeFormat,
} from '@capacitor-mlkit/barcode-scanning'
import apiService from '../services/api.js'

export default {
  name: 'QrScannerButton',
  data() {
    return {
      scanning: false,
      resultVisible: false,
      found: false,
      message: '',
      carga: null,
      scannedValue: '',
      errorDetail: '',
    }
  },
  methods: {
    async openScanner() {
      if (this.scanning) return
      this.scanning = true
      try {
        // Verifica suporte (web/dispositivos sem suporte caem aqui)
        const { supported } = await BarcodeScanner.isSupported()
        if (!supported) {
          this.showResult(
            false,
            'A leitura de QR code não é suportada neste dispositivo. Use o aplicativo no celular.'
          )
          return
        }

        // Garante o módulo do Google Code Scanner (necessário para scan())
        const moduleOk = await this.ensureGoogleModule()
        if (!moduleOk) {
          this.showResult(
            false,
            'Não foi possível preparar o leitor de QR code. Verifique a conexão e tente novamente.'
          )
          return
        }

        // Abre a câmera com a interface pronta de leitura (Android)
        const { barcodes } = await BarcodeScanner.scan({
          formats: [BarcodeFormat.QrCode],
        })

        if (!barcodes || barcodes.length === 0) {
          // Usuário cancelou a leitura — não exibe mensagem
          return
        }

        const conteudo = (
          barcodes[0].rawValue ||
          barcodes[0].displayValue ||
          ''
        ).trim()
        this.scannedValue = conteudo
        await this.buscarCarga(conteudo)
      } catch (error) {
        // Cancelamento manual em alguns dispositivos chega como erro
        const msg = String(error?.message || '')
        if (/cancel/i.test(msg)) return
        this.showResult(
          false,
          'Não foi possível ler o QR code: ' + (msg || 'erro desconhecido')
        )
      } finally {
        this.scanning = false
      }
    },

    /** Garante que o módulo do Google Barcode Scanner esteja instalado. */
    async ensureGoogleModule() {
      try {
        const { available } =
          await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable()
        if (available) return true
      } catch (_) {
        // Em plataformas sem essa API, segue tentando o scan direto
        return true
      }

      return new Promise(resolve => {
        let settled = false
        BarcodeScanner.addListener(
          'googleBarcodeScannerModuleInstallProgress',
          event => {
            // state: 4=CANCELED, 5=COMPLETED, 6=FAILED
            if (event.state === 5 && !settled) {
              settled = true
              resolve(true)
            } else if ((event.state === 4 || event.state === 6) && !settled) {
              settled = true
              resolve(false)
            }
          }
        )
        BarcodeScanner.installGoogleBarcodeScannerModule().catch(() => {
          if (!settled) {
            settled = true
            resolve(false)
          }
        })
      })
    },

    /** Busca a carga pelo ID lido e exibe o resultado. */
    async buscarCarga(loadId) {
      this.errorDetail = ''
      if (!loadId) {
        this.showResult(false, 'QR code vazio ou inválido.')
        return
      }
      try {
        let resp = await apiService.get(`/loads/${encodeURIComponent(loadId)}`)
        // CapacitorHttp pode entregar a resposta como string (sem content-type
        // JSON detectado) — tenta parsear antes de desistir.
        if (typeof resp === 'string') {
          try {
            resp = JSON.parse(resp)
          } catch (_) {
            /* mantém string para diagnóstico abaixo */
          }
        }
        const data = resp?.data || resp
        if (!data || !data.load_id) {
          // Sucesso HTTP mas sem o formato esperado: registra o que veio
          this.errorDetail =
            typeof resp === 'string'
              ? `resposta texto: ${resp.slice(0, 120)}`
              : `resposta sem load_id: ${JSON.stringify(resp).slice(0, 120)}`
          this.showResult(
            false,
            `Nenhuma carga encontrada para o ID "${loadId}".`
          )
          return
        }
        this.carga = data
        this.found = true
        this.message = ''
        this.resultVisible = true
      } catch (error) {
        // Distingue "não encontrada" (404) de falhas técnicas (rede, auth, etc).
        const detail = String(error?.message || 'erro desconhecido')
        const isNotFound = /não encontrada|not found|404/i.test(detail)
        this.errorDetail = isNotFound ? '' : detail
        this.showResult(
          false,
          isNotFound
            ? `Nenhuma carga encontrada para o ID "${loadId}".`
            : `Falha ao consultar a carga "${loadId}". Verifique a conexão e tente novamente.`
        )
      }
    },

    showResult(found, message = '') {
      this.found = found
      this.message = message
      this.carga = found ? this.carga : null
      this.resultVisible = true
    },

    closeResult() {
      this.resultVisible = false
      this.carga = null
      this.message = ''
      this.found = false
      this.scannedValue = ''
      this.errorDetail = ''
    },
  },
}
</script>

<style scoped>
/* FAB no canto superior direito — espelha o estilo do botão de expansão da
   sidebar (.mobile-menu-toggle-fixed), porém posicionado no topo. */
.camera-scan-toggle-fixed {
  position: fixed !important;
  top: calc(env(safe-area-inset-top, 0px) + 15px) !important;
  right: 15px !important;
  left: auto !important;
  bottom: auto !important;
  z-index: 1060 !important;
  background: #007bff;
  border: none;
  color: white;
  font-size: 1.2rem;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  display: flex !important;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4);
  transition:
    background 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
}

.camera-scan-toggle-fixed:hover {
  background: #0056b3;
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 123, 255, 0.6);
}

.camera-scan-toggle-fixed:active {
  transform: scale(0.95);
}

.camera-scan-toggle-fixed:disabled {
  opacity: 0.7 !important;
  cursor: default;
}

.camera-scan-toggle-fixed:focus {
  outline: 3px solid rgba(0, 123, 255, 0.5);
  outline-offset: 2px;
}

/* Overlay e card do resultado */
.qr-result-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.qr-result-card {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.qr-result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  color: #fff;
}

.qr-result-header i {
  font-size: 1.4rem;
}

.qr-result-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.qr-result-header.is-found {
  background: #28a745;
}

.qr-result-header.is-notfound {
  background: #dc3545;
}

.qr-result-body {
  padding: 18px 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.qr-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
}

.qr-row:last-child {
  border-bottom: none;
}

.qr-label {
  color: #6c757d;
  font-size: 0.85rem;
  font-weight: 600;
}

.qr-value {
  color: #212529;
  font-size: 0.9rem;
  text-align: right;
  word-break: break-word;
}

.qr-message {
  margin: 0;
  color: #212529;
  font-size: 0.95rem;
  line-height: 1.5;
}

.qr-diag {
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px dashed #e0e0e0;
}

.qr-diag .qr-value {
  font-family: monospace;
  font-size: 0.82rem;
}

.qr-result-footer {
  padding: 14px 20px 18px;
  display: flex;
  justify-content: flex-end;
}

.qr-ok-btn {
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 28px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.qr-ok-btn:hover {
  background: #0056b3;
}

.qr-ok-btn:active {
  transform: scale(0.97);
}
</style>
