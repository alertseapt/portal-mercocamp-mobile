<template>
  <!-- Overlay próprio com z-index acima do EditUserModal (1000). -->
  <div class="signature-overlay" @click.self="onCancel">
    <div class="signature-modal" role="dialog" aria-modal="true" aria-label="Capturar assinatura">
      <div class="signature-header">
        <div class="header-content">
          <i class="fas fa-signature"></i>
          <div>
            <h3>{{ title }}</h3>
            <p>Use o mouse ou o dedo para assinar na área abaixo</p>
          </div>
        </div>
        <button type="button" class="close-btn" @click="onCancel" :disabled="uploading">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="signature-body">
        <div ref="canvasWrapRef" class="canvas-wrap">
          <canvas ref="canvasRef" class="signature-canvas"></canvas>
          <span v-if="canvasEmpty" class="canvas-placeholder">Use o dedo ou o mouse para assinar</span>
        </div>

        <p v-if="errorMessage" class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          {{ errorMessage }}
        </p>
      </div>

      <div class="signature-footer">
        <button type="button" class="btn-secondary" @click="onClear" :disabled="uploading">
          <i class="fas fa-eraser"></i> Limpar
        </button>
        <div class="footer-right">
          <button type="button" class="btn-cancel" @click="onCancel" :disabled="uploading">
            Cancelar
          </button>
          <button
            type="button"
            class="btn-primary"
            :disabled="canvasEmpty || uploading"
            @click="onConfirm"
          >
            <i v-if="uploading" class="fas fa-spinner fa-spin"></i>
            <i v-else class="fas fa-check"></i>
            {{ uploading ? 'Enviando...' : 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import SignaturePad from 'signature_pad'

// Espaçamento (CSS px) entre o traço mais externo da assinatura e a borda do
// PNG recortado que vai pro Drive. Aplicado em cada lado do bbox.
const SIGNATURE_PADDING_CSS = 16
// Raio máximo do traço — usado pra expandir o bbox e não cortar as
// extremidades das linhas. Bate com `maxWidth` do new SignaturePad abaixo.
const SIGNATURE_MAX_WIDTH = 2.6

export default {
  name: 'SignatureDrawerModal',
  props: {
    title: { type: String, default: 'Capturar assinatura' },
    // Quando uploading=true mantemos a UI bloqueada (overlay opaco no botão
    // confirmar). O componente pai controla esse estado durante o POST.
    uploading: { type: Boolean, default: false },
    errorMessage: { type: String, default: '' },
  },
  emits: ['cancel', 'confirm'],
  setup(_props, { emit }) {
    const canvasRef = ref(null)
    const canvasWrapRef = ref(null)
    const canvasEmpty = ref(true)
    let signaturePad = null

    function resizeCanvas() {
      if (!canvasRef.value || !canvasWrapRef.value) return
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      const rect = canvasWrapRef.value.getBoundingClientRect()
      canvasRef.value.width = rect.width * ratio
      canvasRef.value.height = rect.height * ratio
      const ctx = canvasRef.value.getContext('2d')
      ctx.scale(ratio, ratio)
      // Reset do conteúdo evita artefatos durante o resize (rotação,
      // teclado virtual, etc.).
      if (signaturePad) signaturePad.clear()
      canvasEmpty.value = true
    }

    function init() {
      if (!canvasRef.value || signaturePad) return
      resizeCanvas()
      signaturePad = new SignaturePad(canvasRef.value, {
        backgroundColor: 'rgba(255,255,255,0)',
        penColor: '#1e3a8a',
        minWidth: 1.0,
        maxWidth: SIGNATURE_MAX_WIDTH,
      })
      signaturePad.addEventListener('endStroke', () => {
        canvasEmpty.value = signaturePad.isEmpty()
      })
      window.addEventListener('resize', resizeCanvas)
    }

    function destroy() {
      window.removeEventListener('resize', resizeCanvas)
      if (signaturePad) {
        try { signaturePad.off() } catch (_) {}
        signaturePad = null
      }
    }

    /**
     * Gera o PNG recortado ao bbox dos traços + padding (não o canvas
     * inteiro). Mesmo padrão usado no app do totem.
     */
    function cropToBlob() {
      return new Promise((resolve, reject) => {
        const original = canvasRef.value
        if (!original) return reject(new Error('Canvas indisponível'))

        const fallback = () => original.toBlob(b => {
          if (b) resolve(b)
          else reject(new Error('Falha ao gerar PNG'))
        }, 'image/png')

        if (!signaturePad) return fallback()
        const strokes = signaturePad.toData() || []
        const allPoints = strokes.flatMap(s => Array.isArray(s.points) ? s.points : [])
        if (allPoints.length === 0) return fallback()

        const ratio = Math.max(window.devicePixelRatio || 1, 1)
        const cssW = original.width / ratio
        const cssH = original.height / ratio
        const expand = SIGNATURE_PADDING_CSS + SIGNATURE_MAX_WIDTH / 2

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
        for (const p of allPoints) {
          if (p.x < minX) minX = p.x
          if (p.x > maxX) maxX = p.x
          if (p.y < minY) minY = p.y
          if (p.y > maxY) maxY = p.y
        }
        minX = Math.max(0, minX - expand)
        minY = Math.max(0, minY - expand)
        maxX = Math.min(cssW, maxX + expand)
        maxY = Math.min(cssH, maxY + expand)
        const w = Math.max(1, maxX - minX)
        const h = Math.max(1, maxY - minY)

        const cropped = document.createElement('canvas')
        cropped.width = Math.round(w * ratio)
        cropped.height = Math.round(h * ratio)
        const ctx = cropped.getContext('2d')
        ctx.drawImage(
          original,
          Math.round(minX * ratio), Math.round(minY * ratio),
          Math.round(w * ratio), Math.round(h * ratio),
          0, 0,
          cropped.width, cropped.height
        )
        cropped.toBlob(b => {
          if (b) resolve(b)
          else reject(new Error('Falha ao gerar PNG recortado'))
        }, 'image/png')
      })
    }

    function onClear() {
      if (!signaturePad) return
      signaturePad.clear()
      canvasEmpty.value = true
    }

    async function onConfirm() {
      if (canvasEmpty.value) return
      try {
        const blob = await cropToBlob()
        emit('confirm', blob)
      } catch (e) {
        // erro de blob é raro; ainda assim mostramos via prop errorMessage
        // (gerenciada pelo pai); aqui só logamos pra evitar swallow.
        console.error('[SignatureDrawerModal] crop falhou:', e)
      }
    }

    function onCancel() {
      emit('cancel')
    }

    onMounted(async () => {
      await nextTick()
      init()
    })
    onBeforeUnmount(destroy)

    return {
      canvasRef,
      canvasWrapRef,
      canvasEmpty,
      onClear,
      onConfirm,
      onCancel,
    }
  },
}
</script>

<style scoped>
.signature-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 16px;
}
.signature-modal {
  background: #fff;
  border-radius: 14px;
  width: min(720px, 95vw);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}
.signature-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
  color: #fff;
}
.header-content {
  display: flex;
  gap: 12px;
  align-items: center;
}
.header-content i {
  font-size: 1.4rem;
}
.header-content h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}
.header-content p {
  margin: 2px 0 0 0;
  font-size: 0.78rem;
  opacity: 0.85;
}
.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255,255,255,0.15);
  border: 0;
  color: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.close-btn:hover:not(:disabled) { background: rgba(255,255,255,0.25); }
.close-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.signature-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}
.canvas-wrap {
  position: relative;
  width: 100%;
  height: clamp(220px, 45vh, 420px);
  background: #ffffff;
  border: 2px dashed #94a3b8;
  border-radius: 12px;
  overflow: hidden;
}
.signature-canvas {
  width: 100%;
  height: 100%;
  /* impede o scroll padrão do swipe interferir no traço */
  touch-action: none;
  display: block;
}
.canvas-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(1rem, 2.6vh, 1.3rem);
  color: rgba(30, 58, 138, 0.30);
  font-weight: 600;
  font-style: italic;
  pointer-events: none;
}
.error-message {
  margin: 0;
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.signature-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-top: 1px solid #e5e7eb;
  background: #f8fafc;
}
.footer-right {
  display: flex;
  gap: 10px;
}
.btn-primary,
.btn-secondary,
.btn-cancel {
  padding: 10px 18px;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid transparent;
  transition: background 0.15s, opacity 0.15s, transform 0.1s;
}
.btn-primary {
  background: #1e3a8a;
  color: #fff;
}
.btn-primary:hover:not(:disabled) { background: #1d3580; }
.btn-primary:active:not(:disabled) { transform: scale(0.99); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary {
  background: #ffffff;
  color: #475569;
  border-color: #cbd5e1;
}
.btn-secondary:hover:not(:disabled) { background: #f1f5f9; }
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-cancel {
  background: transparent;
  color: #64748b;
}
.btn-cancel:hover:not(:disabled) { background: #f1f5f9; color: #334155; }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
