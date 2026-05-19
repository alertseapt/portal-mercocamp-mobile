/**
 * Notificações centralizadas - usa o sistema do app (toast) em vez de window.alert.
 * Aceita: showNotification(message, 'error'|'success'|'warning'|'info')
 * Quando window.__showToast está definido (App.vue mounted), usa o toast do sistema.
 * Fallback para erros: SystemDialog (modal do app). Nunca usa window.alert.
 */
export async function showNotification(message, typeOrOptions = 'info') {
  const opts =
    typeof typeOrOptions === 'string'
      ? { type: typeOrOptions }
      : typeOrOptions || {}
  const type = opts.type || 'info'

  if (typeof window !== 'undefined' && window.__showToast) {
    window.__showToast(message, type)
    return
  }

  if (type === 'error' && typeof window !== 'undefined') {
    try {
      const { useSystemDialogStore } = await import('@/stores/systemDialog')
      const store = useSystemDialogStore()
      await store.showAlert(message, 'Erro')
    } catch (_) {
      console.error('[ERRO]', message)
    }
    return
  }

  console.log(`[${type.toUpperCase()}]`, message)
}
