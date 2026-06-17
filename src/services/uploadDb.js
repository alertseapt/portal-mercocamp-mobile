// ===================================================
// UPLOAD DB (IndexedDB) — persistência da fila de envio de imagens
// ===================================================
// Guarda os bytes (base64) das fotos pendentes de envio fora do estado reativo
// do Pinia, sobrevivendo a reload da página/reabertura do app. Funciona tanto no
// navegador quanto na WebView do Capacitor; localStorage (~5MB) não serve para
// imagens. Wrapper mínimo, sem dependências externas.

const DB_NAME = 'mc-uploads'
const DB_VERSION = 1
const STORE = 'pendingUploads'

let dbPromise = null

function openDb() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB indisponível'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

/**
 * Abre uma transação e emite a requisição no MESMO bloco síncrono (evita o
 * auto-commit do IndexedDB entre microtasks). Resolve com o resultado da
 * requisição quando a transação conclui.
 */
async function withStore(mode, fn) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const store = tx.objectStore(STORE)
    let result
    const req = fn(store)
    if (req) {
      req.onsuccess = () => {
        result = req.result
      }
      req.onerror = () => reject(req.error)
    }
    tx.oncomplete = () => resolve(result)
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

/** Grava/atualiza um registro: { id, scheduleId, loadId, fileName, base64, thumbUrl, mimeType, createdAt }. */
export async function putUpload(record) {
  await withStore('readwrite', s => s.put(record))
  return record.id
}

/** Retorna o registro (com base64) ou null. */
export function getUpload(id) {
  return withStore('readonly', s => s.get(id)).then(r => r || null)
}

/** Remove um registro pelo id. */
export function deleteUpload(id) {
  return withStore('readwrite', s => s.delete(id))
}

/** Retorna todos os registros persistidos. */
export function getAllUploads() {
  return withStore('readonly', s => s.getAll()).then(r => r || [])
}
