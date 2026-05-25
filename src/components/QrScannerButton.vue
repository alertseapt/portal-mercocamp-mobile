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

    <!-- Resultado da leitura. O modal SÓ fecha por toque nos botões do card
         (OK ou no botão de avançar status). Não há handler de clique no
         overlay — evita fechar acidentalmente no chão da operação enquanto
         o operador está com luvas/manuseando o tablet. -->
    <div v-if="resultVisible" class="qr-result-overlay">
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
                  <!-- Nome do usuário que executou a ação. Entradas antigas
                       não têm userName (escrito antes do back-end começar a
                       gravar o campo) — nesse caso a linha some. -->
                  <div v-if="entry.userName" class="qr-history-who">
                    <i class="fas fa-user"></i>
                    {{ entry.userName }}
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
          <!-- Linha 1 (FULL WIDTH): ação natural do fluxo. Só aparece quando
               a carga tem um próximo passo no fluxo de QR (carga em
               ENVIADO/DOCANDO/EM ATENDIMENTO/LIBERADO). -->
          <button
            v-if="found && carga && nextTransition"
            class="qr-action-btn qr-action-btn--full"
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
          <!-- Linha 2 (50/50): Ações (out-of-order) + Fechar.
               "Ações" só aparece quando há transições alternativas pra propor. -->
          <div class="qr-footer-row">
            <button
              v-if="found && carga && outOfOrderActions.length > 0"
              class="qr-secondary-btn"
              type="button"
              @click="openActionsMenu"
            >
              <i class="fas fa-ellipsis-h"></i>
              Ações
            </button>
            <button class="qr-close-btn" type="button" @click="closeResult">
              <i class="fas fa-times"></i>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Sub-modal "Ações": lista as transições FORA do fluxo natural,
         empilhado por cima do modal principal. Fecha só pelos botões. -->
    <div v-if="showActionsMenu" class="qr-actions-overlay">
      <div class="qr-actions-card">
        <div class="qr-actions-title">
          <i class="fas fa-list-ul"></i>
          Selecionar ação manual
        </div>
        <p class="qr-actions-hint">
          Use estas opções somente para alterações fora da ordem prevista
          do fluxo.
        </p>
        <ul class="qr-actions-list">
          <li v-for="opt in outOfOrderActions" :key="opt.targetStatus">
            <button
              class="qr-actions-item"
              type="button"
              @click="askConfirm(opt)"
            >
              <i class="fas" :class="opt.icon"></i>
              <span>{{ opt.action }}</span>
            </button>
          </li>
        </ul>
        <div class="qr-actions-footer">
          <button
            class="qr-close-btn"
            type="button"
            @click="closeActionsMenu"
          >
            <i class="fas fa-times"></i>
            Cancelar
          </button>
        </div>
      </div>
    </div>

    <!-- Overlay de animação de sucesso disparado pelo botão de ação natural.
         Sobe por cima de tudo (z-index 2300), bloqueia interação e desaparece
         junto com o auto-close do modal principal (~1.3s). -->
    <div v-if="showSuccessAnimation" class="qr-success-overlay">
      <div class="qr-success-card">
        <div class="qr-success-circle">
          <i class="fas fa-check"></i>
        </div>
        <div class="qr-success-label">{{ successLabel }}</div>
        <div class="qr-success-sub">Confirmado</div>
      </div>
    </div>

    <!-- Sub-modal de confirmação para alterações fora do fluxo.
         Aparece por cima do sub-modal Ações; só fecha pelos botões. -->
    <div v-if="confirmingAction" class="qr-confirm-overlay">
      <div class="qr-confirm-card">
        <div class="qr-confirm-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="qr-confirm-title">Alteração fora do fluxo</div>
        <p class="qr-confirm-msg">
          A ação <strong>{{ confirmingAction.action }}</strong> mudará o
          status da carga para
          <strong>{{ confirmingAction.targetStatus }}</strong>, mesmo não
          sendo a próxima etapa esperada do fluxo. Deseja confirmar?
        </p>
        <div class="qr-confirm-actions">
          <button
            class="qr-close-btn"
            type="button"
            :disabled="advancing"
            @click="cancelConfirm"
          >
            <i class="fas fa-times"></i>
            Cancelar
          </button>
          <button
            class="qr-confirm-go-btn"
            type="button"
            :disabled="advancing"
            @click="confirmOutOfOrderAction"
          >
            <i
              class="fas"
              :class="advancing ? 'fa-spinner fa-spin' : 'fa-check'"
            ></i>
            Confirmar
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

/**
 * Tabela única do fluxo de QR. Espelha QR_FLOW_TRANSITIONS no back-end
 * (routes/loads.js → PATCH /api/loads/:id/advance-status). Cada item é
 * uma transição POSSÍVEL — fromStatus determina se ela é o "próximo passo
 * natural" (botão grande em cima), e tudo que não for o passo natural nem
 * o status atual entra no menu "Ações" (alteração fora do fluxo).
 *
 * Manter sincronizado com o back-end: se um lado mudar, o outro tem que
 * mudar junto.
 */
const QR_FLOW_ACTIONS = [
  { fromStatus: 'ENVIADO',          targetStatus: 'DOCANDO',         action: 'Confirmar entrada',     icon: 'fa-door-open' },
  { fromStatus: 'DOCANDO',          targetStatus: 'EM ATENDIMENTO',  action: 'Iniciar atendimento',   icon: 'fa-play' },
  { fromStatus: 'EM ATENDIMENTO',   targetStatus: 'LIBERADO',        action: 'Finalizar atendimento', icon: 'fa-flag-checkered' },
  { fromStatus: 'LIBERADO',         targetStatus: 'REGISTRO SAÍDA',  action: 'Registrar saída',       icon: 'fa-sign-out-alt' },
]

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
      // True quando o sub-modal "Ações" (lista de alterações fora do fluxo) está visível.
      showActionsMenu: false,
      // Quando o usuário escolhe uma ação fora do fluxo, guardamos aqui o
      // objeto da transição (targetStatus/action/icon) e exibimos o
      // sub-modal de confirmação. null = sem confirmação pendente.
      confirmingAction: null,
      // Overlay de animação de sucesso disparado ao concluir o botão de
      // ação natural (advanceStatus). Bloqueia toda interação com o modal
      // até o auto-close. successLabel é o texto exibido abaixo do check.
      showSuccessAnimation: false,
      successLabel: '',
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
            userName: v.userName || null, // pode vir null em entradas legadas (sem userName)
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
     * Próximo passo natural do fluxo, derivado do status atual da carga.
     * Quando a carga não está em nenhum fromStatus do QR_FLOW_ACTIONS
     * (ex.: AGUARDANDO, CANCELADA, REGISTRO SAÍDA), devolve null e o botão
     * grande no topo do footer some.
     */
    nextTransition() {
      const status = this.carga && this.carga.status
      return QR_FLOW_ACTIONS.find(t => t.fromStatus === status) || null
    },

    /**
     * Opções para o sub-modal "Ações": todas as transições do fluxo MENOS
     * o passo natural (já tem botão dedicado) e MENOS uma transição cujo
     * targetStatus seja o status atual (carga já está nele). Cada item
     * dispara uma chamada manual ao endpoint (com target_status no body) —
     * o back-end marca no histórico que foi alteração fora do fluxo.
     */
    outOfOrderActions() {
      const status = this.carga && this.carga.status
      const naturalTarget = this.nextTransition && this.nextTransition.targetStatus
      return QR_FLOW_ACTIONS.filter(
        t => t.targetStatus !== status && t.targetStatus !== naturalTarget
      )
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
      this.showActionsMenu = false
      this.confirmingAction = null
      this.showSuccessAnimation = false
      this.successLabel = ''
    },

    /** Abre o sub-modal com a lista de ações fora do fluxo. */
    openActionsMenu() {
      this.showActionsMenu = true
    },

    /** Fecha o sub-modal de ações sem confirmar nada. */
    closeActionsMenu() {
      this.showActionsMenu = false
    },

    /**
     * Usuário escolheu uma ação no sub-modal: armazena a transição e abre
     * o sub-modal de confirmação. Não chama API ainda.
     */
    askConfirm(transition) {
      this.confirmingAction = transition
    },

    /** Cancela a confirmação sem executar a transição. */
    cancelConfirm() {
      this.confirmingAction = null
    },

    /**
     * Executa a transição fora do fluxo confirmada — chama o endpoint com
     * body.target_status para forçar o status escolhido, depois recarrega
     * a carga e fecha os dois sub-modais (deixa o modal principal aberto
     * mostrando o novo estado/histórico).
     */
    async confirmOutOfOrderAction() {
      if (!this.carga || !this.carga.load_id || !this.confirmingAction || this.advancing) return
      const loadId = this.carga.load_id
      const target = this.confirmingAction.targetStatus
      this.advancing = true
      this.errorDetail = ''
      try {
        await apiService.patch(
          `/loads/${encodeURIComponent(loadId)}/advance-status`,
          { target_status: target }
        )
        let resp = await apiService.get(`/loads/${encodeURIComponent(loadId)}`)
        if (typeof resp === 'string') {
          try { resp = JSON.parse(resp) } catch (_) { /* ignora */ }
        }
        const data = resp && (resp.data || resp)
        if (data && data.load_id) {
          this.carga = data
        }
        // Fecha apenas os sub-modais; modal principal permanece com a info
        // atualizada da carga.
        this.confirmingAction = null
        this.showActionsMenu = false
      } catch (error) {
        const msg = String(
          error && (error.message || error.toString()) || 'erro desconhecido'
        )
        this.errorDetail = msg
        // Em caso de falha, esconde os sub-modais e mostra a mensagem de
        // erro no modal principal pra usuário ver e tentar de novo.
        this.confirmingAction = null
        this.showActionsMenu = false
        this.found = false
        this.message =
          `Não foi possível alterar o status da carga "${loadId}". ` +
          'Verifique a conexão e tente novamente.'
      } finally {
        this.advancing = false
      }
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
      // Captura o label da ação ANTES da chamada — em caso de sucesso,
      // exibimos esse texto na animação de confirmação (a transição já
      // mudou e nextTransition pode apontar pro próximo passo).
      const actionLabel =
        (this.nextTransition && this.nextTransition.action) || 'Ação confirmada'
      this.advancing = true
      this.errorDetail = ''
      try {
        await apiService.patch(
          `/loads/${encodeURIComponent(loadId)}/advance-status`
        )
        // Sucesso: dispara a animação de confirmação e agenda o
        // auto-close. NÃO recarregamos a carga aqui — o modal será fechado;
        // se o usuário precisar do próximo passo, escaneia o QR de novo.
        // Mantém advancing=true durante a animação pra deixar o botão
        // travado (defesa contra duplo-click até o overlay aparecer).
        this.successLabel = actionLabel
        this.showSuccessAnimation = true
        // ~1300ms total: ~600ms da animação do check + ~700ms de hold antes
        // do close. Tempo suficiente pro usuário registrar visualmente.
        setTimeout(() => {
          this.closeResult()
        }, 1300)
      } catch (error) {
        const msg = String(
          error && (error.message || error.toString()) || 'erro desconhecido'
        )
        this.errorDetail = msg
        // Não fecha o modal: o usuário vê a falha (Detalhe) e pode tentar
        // de novo ou apertar Fechar pra sair.
        this.found = false
        this.message =
          `Não foi possível avançar o status da carga "${loadId}". ` +
          'Verifique a conexão e tente novamente.'
        this.advancing = false
      }
      // Sem finally: no caminho de sucesso, advancing fica true até o
      // closeResult() resetar tudo (1300ms depois) — evita re-habilitar
      // o botão durante a animação.
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

/* Linha "Por: <nome do usuário>" no rodapé da entrada do histórico. */
.qr-history-who {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 0.85rem;
  color: #495057;
  font-style: italic;
}
.qr-history-who i {
  color: #007bff;
  font-size: 0.8rem;
}

/* Footer do modal principal: agora empilhado em duas linhas.
   Linha 1 = ação natural (full-width verde). Linha 2 = Ações + Fechar (50/50). */
.qr-result-footer {
  padding: 14px 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.qr-footer-row {
  display: flex;
  gap: 10px;
}

.qr-footer-row > button {
  flex: 1 1 0;
  min-width: 0;
}

/* Botão verde de avanço de status. Modificador --full ocupa a largura toda
   na linha 1 do footer; sem o modifier, mantém compatibilidade caso seja
   usado em outro contexto. */
.qr-action-btn {
  background: #28a745;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 12px 22px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.qr-action-btn--full {
  width: 100%;
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

/* Botão azul "Ações" (abre sub-modal de alterações fora do fluxo). */
.qr-secondary-btn {
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.qr-secondary-btn:hover {
  background: #0056b3;
}
.qr-secondary-btn:active {
  transform: scale(0.97);
}

/* Botão cinza "Fechar" (também usado como Cancelar nos sub-modais). */
.qr-close-btn {
  background: #6c757d;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.qr-close-btn:hover:not(:disabled) {
  background: #545b62;
}
.qr-close-btn:active:not(:disabled) {
  transform: scale(0.97);
}
.qr-close-btn:disabled {
  opacity: 0.7;
  cursor: default;
}

/* === Sub-modal "Ações" === */
.qr-actions-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100; /* acima do qr-result-overlay (2000) */
  padding: 20px;
}
.qr-actions-card {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
}
.qr-actions-title {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  background: #007bff;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 700;
}
.qr-actions-hint {
  margin: 0;
  padding: 12px 20px 4px;
  color: #6c757d;
  font-size: 0.9rem;
  line-height: 1.4;
}
.qr-actions-list {
  list-style: none;
  margin: 0;
  padding: 8px 20px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}
.qr-actions-item {
  width: 100%;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-left: 4px solid #007bff;
  border-radius: 8px;
  padding: 14px 16px;
  font-size: 1.05rem;
  font-weight: 600;
  color: #212529;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background 0.15s, transform 0.1s;
}
.qr-actions-item i {
  color: #007bff;
  font-size: 1.15rem;
  flex-shrink: 0;
}
.qr-actions-item:hover {
  background: #e9ecef;
}
.qr-actions-item:active {
  transform: scale(0.98);
}
.qr-actions-footer {
  padding: 14px 20px 18px;
  display: flex;
  justify-content: flex-end;
}

/* === Sub-modal de confirmação === */
.qr-confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2200; /* acima do qr-actions-overlay (2100) */
  padding: 20px;
}
.qr-confirm-card {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 420px;
  padding: 24px 22px 18px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  text-align: center;
}
.qr-confirm-icon {
  font-size: 2.5rem;
  color: #f0ad4e;
  margin-bottom: 10px;
}
.qr-confirm-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #212529;
  margin-bottom: 8px;
}
.qr-confirm-msg {
  margin: 0 0 18px;
  color: #495057;
  font-size: 0.98rem;
  line-height: 1.45;
  text-align: left;
}
.qr-confirm-actions {
  display: flex;
  gap: 10px;
}
.qr-confirm-actions > button {
  flex: 1 1 0;
}
.qr-confirm-go-btn {
  background: #dc3545;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.qr-confirm-go-btn:hover:not(:disabled) {
  background: #bd2130;
}
.qr-confirm-go-btn:active:not(:disabled) {
  transform: scale(0.97);
}
.qr-confirm-go-btn:disabled {
  opacity: 0.7;
  cursor: default;
}

/* === Animação de confirmação após avançar status pelo botão natural ===
   Overlay full-screen com círculo verde + check. Fades suaves no overlay
   e no card; o círculo entra com easing "back-out" pra dar uma sensação
   de pop, e o check entra logo depois com um pequeno bump. */
.qr-success-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2300; /* acima de todo o resto (confirm=2200, actions=2100, result=2000) */
  padding: 20px;
  animation: qr-overlay-fade 0.25s ease forwards;
}

.qr-success-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 28px 32px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
  text-align: center;
}

.qr-success-circle {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: #28a745;
  display: flex;
  align-items: center;
  justify-content: center;
  /* "Back-out" cubic-bezier gera um overshoot suave (115% → 100%). */
  animation: qr-success-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.45);
}

.qr-success-circle::after {
  /* Anel pulsante: começa colado no círculo, expande pra fora e fade out.
     Inicia depois do pop pra reforçar visualmente o sucesso. */
  content: '';
  position: absolute;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  border: 4px solid #28a745;
  animation: qr-success-ring 0.9s 0.25s ease-out forwards;
  opacity: 0;
}

.qr-success-circle i {
  color: #fff;
  font-size: 3.4rem;
  /* Check entra com pequeno atraso pra dar leitura sequencial:
     primeiro o círculo, depois o ✔. */
  animation: qr-check-pop 0.4s 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}

.qr-success-label {
  font-size: 1.2rem;
  font-weight: 700;
  color: #212529;
  animation: qr-text-fade 0.4s 0.45s ease forwards;
  opacity: 0;
}

.qr-success-sub {
  font-size: 0.95rem;
  color: #6c757d;
  animation: qr-text-fade 0.4s 0.55s ease forwards;
  opacity: 0;
}

@keyframes qr-overlay-fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes qr-success-pop {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes qr-check-pop {
  0%   { transform: scale(0) rotate(-25deg); opacity: 0; }
  60%  { transform: scale(1.15) rotate(0); opacity: 1; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}

@keyframes qr-success-ring {
  0%   { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.5); opacity: 0; }
}

@keyframes qr-text-fade {
  to { opacity: 1; }
}
</style>
