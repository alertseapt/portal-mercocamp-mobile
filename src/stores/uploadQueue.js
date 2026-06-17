// ===================================================
// STORE: fila de envio de imagens em segundo plano (app-level)
// ===================================================
// Singleton do app: a fila vive acima dos modais, então o usuário pode fechar o
// modal de conferência e seguir para outras notas/telas que os envios continuam.
// Os bytes (base64) ficam no IndexedDB (services/uploadDb.js) e são re-hidratados
// ao reabrir o app; o estado reativo guarda só metadados + miniatura.

import { defineStore } from 'pinia'
import apiService from '../services/api.js'
import {
  putUpload,
  getUpload,
  deleteUpload,
  getAllUploads,
} from '../services/uploadDb.js'

// Ouvintes de conclusão (fora do state para não serializar funções no Pinia).
const completionListeners = new Set()

export const useUploadQueueStore = defineStore('uploadQueue', {
  state: () => ({
    // { id, scheduleId, loadId, fileName, status:'pending'|'enviando'|'erro', error, thumbUrl, createdAt, _base64? }
    items: [],
    processing: false,
    online: typeof navigator === 'undefined' ? true : navigator.onLine !== false,
    initialized: false,
  }),

  getters: {
    itemsForSchedule: state => scheduleId =>
      state.items.filter(i => String(i.scheduleId) === String(scheduleId)),
    pendingCount: state =>
      state.items.filter(i => i.status === 'pending' || i.status === 'enviando')
        .length,
    errorCount: state => state.items.filter(i => i.status === 'erro').length,
  },

  actions: {
    /** Carrega a fila persistida e religa o processamento. Idempotente. */
    async init() {
      if (this.initialized) return
      this.initialized = true
      try {
        const records = await getAllUploads()
        records.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
        this.items = records.map(r => ({
          id: r.id,
          scheduleId: r.scheduleId,
          loadId: r.loadId,
          fileName: r.fileName,
          status: 'pending', // qualquer 'enviando' interrompido volta a pendente
          error: null,
          thumbUrl: r.thumbUrl || '',
          createdAt: r.createdAt || Date.now(),
        }))
      } catch (_) {
        /* IndexedDB indisponível: segue só em memória (sem persistência) */
      }

      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => {
          this.online = true
          this.processQueue()
        })
        window.addEventListener('offline', () => {
          this.online = false
        })
        if (typeof document !== 'undefined') {
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') this.processQueue()
          })
        }
      }
      this.processQueue()
    },

    /** Adiciona uma foto à fila e dispara o processamento (não bloqueia a UI). */
    async enqueue({ scheduleId, loadId, fileName, base64, thumbUrl, mimeType = 'image/jpeg' }) {
      const id = `up-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const createdAt = Date.now()
      const item = {
        id,
        scheduleId,
        loadId,
        fileName,
        status: 'pending',
        error: null,
        thumbUrl: thumbUrl || '',
        createdAt,
      }
      try {
        await putUpload({ id, scheduleId, loadId, fileName, base64, thumbUrl, mimeType, createdAt })
      } catch (_) {
        // Sem IndexedDB: mantém os bytes em memória (perde no reload, mas envia agora).
        item._base64 = base64
      }
      this.items.push(item)
      this.processQueue()
      return id
    },

    /** Drena a fila sequencialmente. Single-flight; tolera multi-aba via Web Locks. */
    async processQueue() {
      if (this.processing) return
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        this.online = false
        return
      }
      if (typeof apiService.isAuthenticated === 'function' && !apiService.isAuthenticated()) {
        return
      }
      this.processing = true
      const drain = async () => {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const item = this.items.find(i => i.status === 'pending')
          if (!item) break
          item.status = 'enviando'
          item.error = null
          try {
            let base64 = item._base64
            if (!base64) {
              const rec = await getUpload(item.id).catch(() => null)
              base64 = rec && rec.base64
            }
            if (!base64) {
              // Não está mais na fila local (provável conclusão em outra aba): descarta.
              this._remove(item.id)
              continue
            }
            const resp = await apiService.post(
              `/schedules/${encodeURIComponent(item.scheduleId)}/images`,
              { fileName: item.fileName, base64 }
            )
            const data = typeof resp === 'string' ? JSON.parse(resp) : resp
            await this._complete(item, data)
          } catch (err) {
            item.status = 'erro'
            item.error = (err && err.message) || 'Falha no envio'
            // Não trava a fila: o find() ignora 'erro' e segue para o próximo pendente.
          }
        }
      }
      try {
        if (typeof navigator !== 'undefined' && navigator.locks && navigator.locks.request) {
          await navigator.locks.request('mc-upload-queue', { ifAvailable: true }, async lock => {
            if (!lock) return // outra aba já está processando
            await drain()
          })
        } else {
          await drain()
        }
      } finally {
        this.processing = false
      }
    },

    /** Reprocessa um item com erro. */
    retry(id) {
      const item = this.items.find(i => i.id === id)
      if (!item || item.status !== 'erro') return
      item.status = 'pending'
      item.error = null
      this.processQueue()
    },

    /** Reprocessa todos os itens com erro. */
    retryAll() {
      let any = false
      this.items.forEach(i => {
        if (i.status === 'erro') {
          i.status = 'pending'
          i.error = null
          any = true
        }
      })
      if (any) this.processQueue()
    },

    /** Conclui um envio: remove da fila/IndexedDB e notifica ouvintes. */
    async _complete(item, data) {
      try {
        await deleteUpload(item.id)
      } catch (_) { /* ignore */ }
      this._remove(item.id)
      const file = (data && data.file) || null
      completionListeners.forEach(fn => {
        try {
          fn({
            scheduleId: item.scheduleId,
            loadId: item.loadId,
            file,
            thumbUrl: item.thumbUrl,
            fileName: item.fileName,
          })
        } catch (_) { /* ignore listener error */ }
      })
    },

    _remove(id) {
      const idx = this.items.findIndex(i => i.id === id)
      if (idx !== -1) this.items.splice(idx, 1)
    },

    /**
     * Registra um ouvinte chamado a cada envio concluído com
     * { scheduleId, loadId, file, thumbUrl, fileName }. Retorna unsubscribe.
     */
    onCompleted(fn) {
      completionListeners.add(fn)
      return () => completionListeners.delete(fn)
    },
  },
})
