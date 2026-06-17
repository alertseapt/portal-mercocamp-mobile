<template>
  <div
    v-if="pendingCount > 0 || errorCount > 0"
    class="upq-chip"
    :class="{ 'upq-chip--error': errorCount > 0 && pendingCount === 0 }"
    :role="errorCount > 0 && pendingCount === 0 ? 'button' : undefined"
    @click="onClick"
  >
    <template v-if="pendingCount > 0">
      <i class="fas fa-cloud-upload-alt"></i>
      <i class="fas fa-spinner fa-spin"></i>
      <span>Enviando {{ pendingCount }} imagem{{ pendingCount > 1 ? 'ns' : '' }}…</span>
      <span v-if="errorCount > 0" class="upq-err-tag">{{ errorCount }} c/ erro</span>
    </template>
    <template v-else>
      <i class="fas fa-exclamation-triangle"></i>
      <span>
        {{ errorCount }} imagem{{ errorCount > 1 ? 'ns' : '' }} não enviada{{ errorCount > 1 ? 's' : '' }} —
        toque para tentar de novo
      </span>
    </template>
  </div>
</template>

<script>
import { mapState } from 'pinia'
import { useUploadQueueStore } from '../stores/uploadQueue.js'

export default {
  name: 'UploadQueueIndicator',
  computed: {
    ...mapState(useUploadQueueStore, ['pendingCount', 'errorCount']),
  },
  methods: {
    onClick() {
      if (this.errorCount > 0) useUploadQueueStore().retryAll()
    },
  },
}
</script>

<style scoped>
.upq-chip {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(16px + env(safe-area-inset-bottom));
  /* Abaixo do modal de conferência (z-index 3000): o modal já mostra o próprio
     progresso; o chip é para quando o usuário sai do modal. */
  z-index: 2900;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 92vw;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.96);
  color: #fff;
  font-size: 0.85rem;
  line-height: 1.2;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
}
.upq-chip--error {
  background: rgba(220, 38, 38, 0.96);
  cursor: pointer;
}
.upq-chip i {
  font-size: 0.85rem;
}
.upq-err-tag {
  background: rgba(255, 255, 255, 0.22);
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 0.72rem;
}
</style>
