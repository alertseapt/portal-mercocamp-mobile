<template>
  <Teleport to="body">
    <Transition name="system-dialog-fade">
      <div
        v-if="store.visible"
        class="system-dialog-overlay"
        @click.self="handleOverlayClick"
      >
        <div class="system-dialog-box" role="dialog" aria-modal="true">
          <div class="system-dialog-header">
            <div class="system-dialog-header-brand">
              <img
                src="@/assets/images/logo_mercocamp.png"
                alt="Logo"
                class="system-dialog-logo"
              />
              <span class="system-dialog-brand-text">Portal Mercocamp</span>
            </div>
            <button
              type="button"
              class="system-dialog-btn-close"
              aria-label="Fechar"
              @click="handleCancel"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="system-dialog-body">
            <h2 class="system-dialog-body-title">{{ store.title }}</h2>
            <p class="system-dialog-message">{{ store.message }}</p>
          </div>
          <div class="system-dialog-footer">
            <template v-if="store.type === 'confirm'">
              <button
                type="button"
                class="system-dialog-btn system-dialog-btn-cancel"
                @click="handleCancel"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="system-dialog-btn system-dialog-btn-primary"
                @click="handleOk"
              >
                {{ store.primaryLabel }}
              </button>
            </template>
            <template v-else>
              <button
                type="button"
                class="system-dialog-btn system-dialog-btn-primary"
                @click="handleOk"
              >
                {{ store.primaryLabel }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { useSystemDialogStore } from '@/stores/systemDialog'

export default {
  name: 'SystemDialog',
  setup() {
    const store = useSystemDialogStore()
    return { store }
  },
  methods: {
    handleOk() {
      this.store.close(this.store.type === 'confirm' ? true : undefined)
    },
    handleCancel() {
      this.store.close(false)
    },
    handleOverlayClick() {
      if (this.store.type === 'confirm') {
        this.store.close(false)
      }
    },
  },
}
</script>

<style scoped>
.system-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 11000;
  padding: 1rem;
}

.system-dialog-box {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 12px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.08);
  min-width: 360px;
  max-width: 480px;
  overflow: hidden;
}

.system-dialog-header {
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.system-dialog-header-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.system-dialog-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
  flex-shrink: 0;
}

.system-dialog-brand-text {
  font-size: 0.95rem;
  font-weight: 500;
  color: #fff;
  font-family: 'Poppins', sans-serif;
}

.system-dialog-btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    color 0.2s,
    background 0.2s;
}

.system-dialog-btn-close:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.system-dialog-body {
  padding: 1.5rem 1.5rem;
}

.system-dialog-body-title {
  margin: 0 0 0.75rem 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  font-family: 'Poppins', sans-serif;
}

.system-dialog-message {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #e2e8f0;
  white-space: pre-wrap;
  word-break: break-word;
}

.system-dialog-footer {
  padding: 1rem 1.5rem;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.system-dialog-btn {
  padding: 0.5rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Poppins', sans-serif;
  border: none;
}

.system-dialog-btn-primary {
  background: linear-gradient(135deg, #f59e0b, #f97316);
  color: #fff;
}

.system-dialog-btn-primary:hover {
  filter: brightness(1.1);
}

.system-dialog-btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.system-dialog-btn-cancel:hover {
  background: rgba(255, 255, 255, 0.15);
}

.system-dialog-fade-enter-active,
.system-dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}

.system-dialog-fade-enter-active .system-dialog-box,
.system-dialog-fade-leave-active .system-dialog-box {
  transition: transform 0.2s ease;
}

.system-dialog-fade-enter-from,
.system-dialog-fade-leave-to {
  opacity: 0;
}

.system-dialog-fade-enter-from .system-dialog-box,
.system-dialog-fade-leave-to .system-dialog-box {
  transform: scale(0.96);
}
</style>
