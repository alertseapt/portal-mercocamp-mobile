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
              <span class="qr-label">Operação</span>
              <span class="qr-value">{{ carga.operation || '—' }}</span>
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

            <!-- Histórico de alterações da carga: data/hora + ação (e comentário, quando houver). -->
            <div class="qr-history">
              <div class="qr-history-title">
                <i class="fas fa-history"></i>
                Histórico
              </div>
              <div
                v-if="historicEntries.length === 0"
                class="qr-history-empty"
              >
                Sem alterações registradas.
              </div>
              <ol v-else class="qr-history-list">
                <li
                  v-for="(entry, idx) in historicEntries"
                  :key="idx"
                  class="qr-history-item"
                >
                  <div class="qr-history-when">{{ formatDateTime(entry.timestamp) }}</div>
                  <!-- Título do evento: usa `comment` (a frase que descreve o que
                       aconteceu, ex. "Doca 30 atribuída - Carga enviada"). Cai
                       pro `action` quando não houver comment. -->
                  <div class="qr-history-event">
                    {{ entry.comment || entry.action || '—' }}
                  </div>
                  <!-- Subtítulo: só mostra o `action` (ex. "Status alterado")
                       quando houver `comment` também — senão o action já virou
                       título e não deve repetir embaixo. -->
                  <div
                    v-if="entry.comment && entry.action"
                    class="qr-history-meta"
                  >
                    {{ entry.action }}
                  </div>
                </li>
              </ol>
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
          <!-- Botão de avanço de status no fluxo de QR. O label vem do
               `nextTransition` (computado a partir do status atual da carga).
               Quando a carga estiver em status terminal (ex.: REGISTRO SAÍDA,
               CANCELADA, RECUSADO, AGUARDANDO sem doca), o botão some e só
               sobra o OK. -->
          <button
            v-if="found && carga && nextTransition"
            class="qr-action-btn"
            type="button"
            :disabled="advancing"
            @click="advanceStatus"
          >
            <i
              class="fas"
              :class="advancing ? 'fa-spinner fa-spin' : nextTransition.icon"
            ></i>
            {{ nextTransition.action }}
          </button>
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
      // True enquanto a chamada PATCH /loads/:id/advance-status está em voo.
      // Desabilita o botão e troca o ícone por um spinner.
      advancing: false,
    }
  },
  computed: {
    /**
     * Lista achatada e ordenada (mais antiga → mais recente) das entradas
     * do histórico. O back-end devolve `historic` como objeto cujas chaves
     * são `entry_<timestamp>`; aqui converto pra array, ordeno pelo
     * timestamp da entrada e protejo contra string (parse tardio) e null.
     */
    historicEntries() {
      let raw = this.carga && this.carga.historic
      if (!raw) return []
      if (typeof raw === 'string') {
        try {
          raw = JSON.parse(raw)
        } catch (_) {
          return []
        }
      }
      if (typeof raw !== 'object') return []
      const items = []
      for (const key of Object.keys(raw)) {
        const v = raw[key]
        if (v && typeof v === 'object') {
          items.push({
            timestamp: v.timestamp || null,
            user: v.user || null,
            action: v.action || '',
            comment: v.comment || '',
          })
        }
      }
      items.sort((a, b) => {
        const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0
        const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0
        return ta - tb
      })
      // Esconde o evento "Carga criada" — ele aparece em toda carga e não
      // agrega informação no fluxo do leitor de QR (mais relevante são as
      // alterações posteriores: doca atribuída, status, etc.).
      return items.filter(it => {
        const a = String(it.action || '').trim().toLowerCase()
        return a !== 'carga criada'
      })
    },

    /**
     * Mapeia o status atual da carga para a próxima transição do fluxo de
     * leitura de QR. Cada entrada inclui o label do botão e o ícone. Quando
     * a carga não está em nenhum dos status do fluxo (ex.: AGUARDANDO,
     * CANCELADA, REGISTRO SAÍDA), devolve null e o botão some.
     *
     * Espelha exatamente o QR_FLOW_TRANSITIONS no back-end
     * (routes/loads.js → PATCH /api/loads/:id/advance-status). Manter
     * sincronizado: se um lado mudar, o outro tem que mudar junto.
     */
    nextTransition() {
      const status = this.carga && this.carga.status
      const map = {
        ENVIADO:           { action: 'Confirmar entrada',    icon: 'fa-door-open' },
        DOCANDO:           { action: 'Iniciar atendimento',  icon: 'fa-play' },
        'EM ATENDIMENTO':  { action: 'Finalizar atendimento', icon: 'fa-flag-checkered' },
        LIBERADO:          { action: 'Registrar saída',      icon: 'fa-sign-out-alt' },
      }
      return map[status] || null
    },
  },
  methods: {
    /** Formata ISO string para "dd/mm/aaaa hh:mm" (pt-BR), ou '—' se inválida. */
    formatDateTime(iso) {
      if (!iso) return '—'
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return '—'
      const pad = n => String(n).padStart(2, '0')
      return (
        `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ` +
        `${pad(d.getHours())}:${pad(d.getMinutes())}`
      )
    },

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
      this.advancing = false
    },

    /**
     * Avança o status da carga conforme o fluxo de QR (definido pelo
     * back-end). Faz PATCH /api/loads/:id/advance-status, depois recarrega
     * a carga via GET pra atualizar status, histórico e o label do botão.
     * Mantém o modal aberto: o usuário pode ver a nova entrada no histórico
     * e, se o fluxo ainda tiver próximo passo, executar de novo sem
     * rescanear.
     */
    async advanceStatus() {
      if (!this.carga || !this.carga.load_id || this.advancing) return
      const loadId = this.carga.load_id
      this.advancing = true
      this.errorDetail = ''
      try {
        await apiService.patch(
          `/loads/${encodeURIComponent(loadId)}/advance-status`
        )
        // Recarrega pra refletir novo status + nova entrada no histórico.
        let resp = await apiService.get(`/loads/${encodeURIComponent(loadId)}`)
        if (typeof resp === 'string') {
          try { resp = JSON.parse(resp) } catch (_) { /* ignora */ }
        }
        const data = resp && (resp.data || resp)
        if (data && data.load_id) {
          this.carga = data
        }
      } catch (error) {
        const msg = String(
          error && (error.message || error.toString()) || 'erro desconhecido'
        )
        this.errorDetail = msg
        // Não fecha o modal: o usuário vê a falha (Detalhe) e pode tentar
        // de novo ou apertar OK pra sair.
        this.found = false
        this.message =
          `Não foi possível avançar o status da carga "${loadId}". ` +
          'Verifique a conexão e tente novamente.'
      } finally {
        this.advancing = false
      }
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
  /* Ocupa 98% da largura/altura do display (resto fica como margem visual
     do overlay escuro, que ajuda a perceber que o conteúdo é modal). */
  width: 98vw;
  height: 98vh;
  max-width: 98vw;
  max-height: 98vh;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  /* Card vira flex column; body cresce e fica scrollável quando o
     histórico for longo. Sem max-height fixo: aproveita toda a altura
     disponível menos header e footer. */
  flex: 1 1 auto;
  min-height: 0;
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
  font-size: 1rem;
  font-weight: 600;
}

.qr-value {
  color: #212529;
  font-size: 1.05rem;
  text-align: right;
  word-break: break-word;
}

.qr-message {
  margin: 0;
  color: #212529;
  font-size: 1.05rem;
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

/* === Histórico da carga (timeline simples) === */
.qr-history {
  margin-top: 18px;
  padding-top: 12px;
  border-top: 2px solid #f0f0f0;
}

.qr-history-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  color: #495057;
  margin-bottom: 10px;
}

.qr-history-title i {
  color: #007bff;
}

.qr-history-empty {
  font-size: 0.95rem;
  color: #6c757d;
  font-style: italic;
}

.qr-history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qr-history-item {
  position: relative;
  padding: 10px 12px 10px 14px;
  background: #f8f9fa;
  border-left: 3px solid #007bff;
  border-radius: 0 6px 6px 0;
}

.qr-history-when {
  font-family: monospace;
  font-size: 0.95rem;
  color: #6c757d;
  margin-bottom: 2px;
}

/* Título do evento (texto principal de cada entrada do histórico). */
.qr-history-event {
  font-size: 1.05rem;
  font-weight: 600;
  color: #212529;
  word-break: break-word;
}

/* Descrição complementar do evento (aparece embaixo do título). */
.qr-history-meta {
  font-size: 0.9rem;
  color: #6c757d;
  margin-top: 4px;
  word-break: break-word;
}

.qr-result-footer {
  padding: 14px 20px 18px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.qr-ok-btn {
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 28px;
  font-size: 1.05rem;
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

/* Botão de avanço de status no fluxo de QR. Estilo verde (ação positiva)
   pra contrastar com o OK azul; quando desabilitado (advancing=true),
   fica mais opaco e sem cursor de pointer. */
.qr-action-btn {
  background: #28a745;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 22px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.qr-action-btn:hover:not(:disabled) {
  background: #1e7e34;
}

.qr-action-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.qr-action-btn:disabled {
  opacity: 0.7;
  cursor: default;
}
</style>
