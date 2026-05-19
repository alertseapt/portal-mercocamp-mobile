import { defineStore } from 'pinia'
import { rejeicaoService } from '@/services/api'

const CACHE_MAX_AGE_MS = 5 * 60 * 1000 // 5 minutos

function paramsKey(params) {
  return JSON.stringify(params || {})
}

export const useRejeicoesStore = defineStore('rejeicoes', {
  state: () => ({
    list: [],
    paramsKey: null,
    fetchedAt: 0,
    loading: false,
    _loadPromise: null,
    _loadingParamsKey: null,
  }),

  actions: {
    getCached(params) {
      const key = paramsKey(params)
      if (this.paramsKey !== key) return null
      if (Date.now() - this.fetchedAt > CACHE_MAX_AGE_MS) return null
      return this.list
    },

    setCache(params, data) {
      this.paramsKey = paramsKey(params)
      this.list = Array.isArray(data) ? data : []
      this.fetchedAt = Date.now()
    },

    getLoadPromiseIfSameParams(params) {
      if (
        !this.loading ||
        !this._loadPromise ||
        this._loadingParamsKey !== paramsKey(params)
      )
        return null
      return this._loadPromise
    },

    async prefetch() {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      const dataFim = hoje.toISOString().slice(0, 10)
      const dataInicio = primeiroDia.toISOString().slice(0, 10)
      const params = { data_inicio: dataInicio, data_fim: dataFim }
      const key = paramsKey(params)
      if (
        this.paramsKey === key &&
        Date.now() - this.fetchedAt < CACHE_MAX_AGE_MS
      )
        return
      if (this.loading && this._loadingParamsKey === key) return
      this.loading = true
      this._loadingParamsKey = key
      this._loadPromise = (async () => {
        try {
          const res = await rejeicaoService.getRejeicoes(params)
          const data = res?.data
          this.setCache(params, data)
        } catch (e) {
          // Prefetch em background
        } finally {
          this.loading = false
          this._loadPromise = null
          this._loadingParamsKey = null
        }
      })()
    },

    invalidate() {
      this.paramsKey = null
      this.list = []
      this.fetchedAt = 0
      this._loadPromise = null
      this._loadingParamsKey = null
    },
  },
})
