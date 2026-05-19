/**
 * Store global para o modal de informações da NF-e (NfeInfoModal).
 * Permite abrir o modal de qualquer lugar da aplicação com uma única instância reutilizada.
 */
import { defineStore } from 'pinia'

export const useNfeInfoModalStore = defineStore('nfeInfoModal', {
  state: () => ({
    show: false,
    schedule: null,
  }),

  actions: {
    /**
     * Abre o modal com os dados do agendamento.
     * @param {Object} schedule - Dados do agendamento (pode ser objeto parcial, será enriquecido pela API ao exibir)
     */
    openWithSchedule(schedule) {
      if (!schedule) return
      this.schedule = schedule
      this.show = true
    },

    /**
     * Fecha o modal e limpa o estado.
     */
    close() {
      this.show = false
      this.schedule = null
    },

    /**
     * Atualiza o agendamento exibido no modal (ex.: após edição ou mudança de status).
     * @param {Object} schedule - Dados atualizados do agendamento
     */
    setSchedule(schedule) {
      if (this.show && schedule) {
        this.schedule = schedule
      }
    },
  },
})
