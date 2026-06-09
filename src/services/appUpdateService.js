// ===================================================
// APP UPDATE SERVICE (nativo / Capacitor)
// Verifica se há uma versão mais nova do APK publicada como Release no GitHub
// e, quando há, permite abrir o APK para o usuário instalar a atualização.
//
// Diferente de versionService.js (web, que compara build-info.json local e dá
// reload), aqui a referência é a última Release do repositório do app.
// ===================================================

import axios from 'axios'
import { isNativeApp } from '@/config/api.js'
import buildInfo from '@/build-info.json'

/** Endpoint público (sem auth) da última release publicada do app. */
const RELEASES_LATEST_URL =
  'https://api.github.com/repos/alertseapt/portal-mercocamp-mobile/releases/latest'

/** Quebra "v1.16.30" / "1.16.30" em [1,16,30] para comparação numérica. */
function parseVersion(v) {
  return String(v || '')
    .replace(/^v/i, '')
    .trim()
    .split(/[.+-]/)
    .map(n => parseInt(n, 10))
    .filter(n => !Number.isNaN(n))
}

/** true quando "latest" é estritamente maior que "current" (segmento a segmento). */
export function isNewerVersion(latest, current) {
  const a = parseVersion(latest)
  const b = parseVersion(current)
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const x = a[i] || 0
    const y = b[i] || 0
    if (x > y) return true
    if (x < y) return false
  }
  return false
}

/** Versão instalada do app (gravada em build-info.json no momento do build). */
export function getCurrentVersion() {
  return (buildInfo && buildInfo.version) || '0.0.0'
}

/**
 * Consulta a última release do app no GitHub e compara com a versão instalada.
 * Só executa no app nativo (Capacitor). Nunca lança — em erro/sem update
 * retorna { available: false }.
 *
 * @returns {Promise<{available:boolean, version?:string, tag?:string, url?:string}>}
 */
export async function checkForAppUpdate() {
  if (!isNativeApp()) return { available: false }
  try {
    const { data } = await axios.get(RELEASES_LATEST_URL, {
      timeout: 8000,
      baseURL: undefined, // não usar a baseURL da API
      headers: { Accept: 'application/vnd.github+json' },
    })
    const tag = data && data.tag_name
    if (!tag) return { available: false }

    const current = getCurrentVersion()
    if (!isNewerVersion(tag, current)) return { available: false }

    const apk = (data.assets || []).find(
      a => a && typeof a.name === 'string' && a.name.toLowerCase().endsWith('.apk')
    )
    return {
      available: true,
      version: String(tag).replace(/^v/i, ''),
      tag: String(tag),
      url: (apk && apk.browser_download_url) || data.html_url,
    }
  } catch (e) {
    console.warn('⚠️ [APP-UPDATE] Falha ao verificar atualização:', e?.message || e)
    return { available: false }
  }
}

/**
 * Abre o APK (ou a página da release, como fallback) no navegador do sistema
 * para que o Android baixe e ofereça a instalação da atualização.
 */
export function openAppUpdate(url) {
  if (!url) return
  // target _blank: o Capacitor abre URLs externas no navegador do sistema,
  // que aciona o download manager do Android para o .apk.
  window.open(url, '_blank')
}
