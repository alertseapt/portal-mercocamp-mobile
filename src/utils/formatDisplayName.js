/**
 * Exibe nomes legíveis quando o backend envia só MAIÚSCULAS.
 * Não altera textos que já contêm minúsculas (ex.: "Zakat - crossdocking").
 *
 * @param {unknown} raw
 * @returns {unknown}
 */
export function formatEntityDisplayName(raw) {
  if (raw == null) return raw
  const original = String(raw)
  const s = original.trim()
  if (!s) return raw

  if (/\p{Ll}/u.test(s)) return original

  if (!/\p{L}/u.test(s)) return original

  const capToken = token => {
    if (!token) return token
    const w = token.toLowerCase()
    if (w === 'b2b') return 'B2B'
    if (w === 'b2c') return 'B2C'
    if (/^ltda\.?$/.test(w)) return 'Ltda.'
    if (/^s\.a\.?$/.test(w)) return 'S.A.'
    if (/^\d/.test(w)) {
      return w.replace(
        /^(\d+)(\p{Ll}?)$/u,
        (_, n, l) => n + (l ? l.toUpperCase() : '')
      )
    }
    if (/\p{L}/u.test(w)) {
      return w.charAt(0).toLocaleUpperCase('pt-BR') + w.slice(1)
    }
    return token
  }

  const capPart = part => part.split('-').map(capToken).join('-')

  return s.split(/\s+/).map(capPart).join(' ')
}
