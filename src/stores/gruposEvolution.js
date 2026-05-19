import { defineStore } from 'pinia'
import { rejeicaoService } from '@/services/api'

export const useGruposEvolutionStore = defineStore('gruposEvolution', {
  state: () => ({
    grupos: [],
    loading: false,
    error: '',
    fetchedAt: 0,
  }),

  getters: {
    cached: state => state.grupos,
    hasCache: state => Array.isArray(state.grupos) && state.grupos.length > 0,
  },

  actions: {
    async prefetch() {
      if (this.loading) return
      this.loading = true
      this.error = ''
      try {
        const res = await rejeicaoService.getGruposEvolution()
        this.grupos = res?.grupos || res?.data?.grupos || []
        this.fetchedAt = Date.now()
      } catch (e) {
        this.grupos = []
        this.error = e.message || 'Erro ao carregar grupos'
      } finally {
        this.loading = false
      }
    },

    async load(opts = {}) {
      this.loading = true
      this.error = ''
      try {
        const res = await rejeicaoService.getGruposEvolution(
          opts.instanceName,
          opts.participante
        )
        this.grupos = res?.grupos || res?.data?.grupos || []
        this.fetchedAt = Date.now()
      } catch (e) {
        this.grupos = []
        this.error = e.message || 'Erro ao carregar grupos'
        throw e
      } finally {
        this.loading = false
      }
    },

    invalidate() {
      this.grupos = []
      this.error = ''
      this.fetchedAt = 0
    },
  },
})
