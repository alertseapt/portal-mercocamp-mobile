/**
 * Store global para diálogos do sistema (confirm/alert).
 * Substitui window.confirm e window.alert por modais centralizados no layout do app.
 */
import { defineStore } from 'pinia'

export const useSystemDialogStore = defineStore('systemDialog', {
  state: () => ({
    visible: false,
    type: 'confirm', // 'confirm' | 'alert'
    title: 'Confirmação',
    message: '',
    primaryLabel: 'OK',
    resolve: null,
  }),

  actions: {
    showConfirm(message, title = 'Confirmação', options = {}) {
      return new Promise(resolve => {
        this.type = 'confirm'
        this.title = title
        this.message = message
        this.primaryLabel = options?.primaryLabel ?? 'OK'
        this.resolve = resolve
        this.visible = true
      })
    },

    showAlert(message, title = 'Aviso', options = {}) {
      return new Promise(resolve => {
        this.type = 'alert'
        this.title = title
        this.message = message
        this.primaryLabel = options?.primaryLabel ?? 'OK'
        this.resolve = () => {
          resolve()
        }
        this.visible = true
      })
    },

    close(result) {
      if (this.resolve) {
        this.resolve(result)
        this.resolve = null
      }
      this.visible = false
      this.message = ''
    },
  },
})
