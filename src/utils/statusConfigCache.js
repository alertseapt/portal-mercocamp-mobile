/**
 * Cache de status (status_config) para exibição de badges na lista de agendamentos.
 * Evita requisições repetidas: ao carregar a lista, o front-end atualiza este cache
 * e cada item usa texto e cores da memória.
 */

const STORAGE_KEY = 'statusConfigCache'

let cache = null
let loadPromise = null

function getBaseUrl() {
  if (typeof window === 'undefined') return '/api'
  const api = window.apiClient || window.apiClient
  const base =
    (api && (api.defaults?.baseURL || api.baseURL)) ||
    window.API_URL ||
    window.BASE_URL ||
    '/api'
  return String(base).replace(/\/$/, '')
}

function darkenHex(hex, amount = 0.25) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return hex
  const num = parseInt(hex.slice(1), 16)
  const r = Math.max(0, ((num >> 16) & 0xff) * (1 - amount))
  const g = Math.max(0, ((num >> 8) & 0xff) * (1 - amount))
  const b = Math.max(0, (num & 0xff) * (1 - amount))
  return (
    '#' +
    [r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('')
  )
}

/** Constrói cache apenas com name, badge_color, text_color (historic não é armazenado localmente) */
function buildCache(list) {
  const byName = {}
  if (Array.isArray(list)) {
    for (const item of list) {
      if (item && item.name) {
        byName[item.name] = {
          name: item.name,
          badge_color: item.badge_color || '#6c757d',
          text_color: item.text_color || '#ffffff',
        }
      }
    }
    if (byName['Em conferência']) {
      byName['Conferência'] = byName['Em conferência']
    }
  }
  return byName
}

function readFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : null
  } catch (e) {
    return null
  }
}

function writeToStorage(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
  } catch (e) {}
}

/**
 * Garante que o cache está preenchido. Quando não há dados localmente (localStorage ou memória),
 * faz requisição à API para obter status_config do banco e listar os status conforme o banco de dados.
 * Pode ser chamado antes de carregar a lista de agendamentos.
 * @param {boolean} [forceRefresh=false] - Se true, sempre busca dados frescos da API (recomendado ao abrir Solicitação ou Histórico)
 * @returns {Promise<void>}
 */
export function ensureStatusConfigCache(forceRefresh = false) {
  const hasValidCache =
    cache && typeof cache === 'object' && Object.keys(cache).length > 0
  if (!forceRefresh && hasValidCache) {
    return Promise.resolve()
  }
  if (loadPromise) return loadPromise

  if (!forceRefresh) {
    cache = readFromStorage()
    const hasLocalData =
      cache && typeof cache === 'object' && Object.keys(cache).length > 0
    if (!hasLocalData) {
      cache = null
    }
  }

  loadPromise = fetch(`${getBaseUrl()}/status-config`, {
    headers:
      typeof localStorage !== 'undefined' && localStorage.getItem('token')
        ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
        : {},
  })
    .then(res => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })
    .then(data => {
      cache = buildCache(data.list || [])
      writeToStorage(cache)
    })
    .catch(() => {
      if (!cache) cache = {}
    })
    .finally(() => {
      loadPromise = null
    })

  return loadPromise
}

/**
 * Retorna os dados de exibição do status (texto e cores) a partir do cache.
 * No banco, o valor pode ser "Conferência"; no cache usamos "Em conferência" para exibição.
 * @param {string} status - Valor do status (ex.: do schedule.status)
 * @returns {{ name: string, badge_color: string, text_color: string } | null}
 */
export function getStatusFromCache(status) {
  if (!status) return null
  if (cache && cache[status]) return cache[status]
  return null
}

/**
 * Retorna objeto para renderizar a badge: label e estilo (ou fallback com class).
 * Use em conjunto com getStatusBadge: se getStatusDisplayInfo retornar style, use :style; senão use class.
 * @param {string} status
 * @returns {{ label: string, style: object, useClass: string }} useClass é a classe CSS quando style está vazio
 */
export function getStatusDisplayInfo(status, getStatusBadgeFallback) {
  const fromCache = getStatusFromCache(status)
  if (fromCache) {
    const borderColor = darkenHex(fromCache.badge_color, 0.25)
    return {
      label: fromCache.name,
      style: {
        backgroundColor: fromCache.badge_color,
        color: fromCache.text_color,
        borderColor: borderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
      },
      useClass: '',
    }
  }
  const fallback = getStatusBadgeFallback
    ? getStatusBadgeFallback(status)
    : { class: 'secondary', label: 'Desconhecido' }
  return {
    label: fallback.label,
    style: {},
    useClass: fallback.class || 'secondary',
  }
}

/**
 * Invalida o cache (útil após criar/editar status na página Status).
 */
export function invalidateStatusConfigCache() {
  cache = null
  loadPromise = null
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {}
}
