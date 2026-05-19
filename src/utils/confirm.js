/**
 * Confirmação via modal do sistema (centralizado, layout do app).
 */
import { useSystemDialogStore } from '@/stores/systemDialog'

export function confirm(message, title = 'Confirmação') {
  if (typeof window === 'undefined') {
    return Promise.resolve(false)
  }
  const store = useSystemDialogStore()
  return store.showConfirm(message, title)
}
