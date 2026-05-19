/**
 * Usuários que só podem usar o BI Diretoria (sub-aba Carteira incluída no mesmo painel).
 * E-mail comparado em minúsculas; aceita `user.user` (legado do portal) ou `user.email`.
 */
const BI_DIRETORIA_PORTAL_ONLY_EMAILS = new Set([
  'toi@grupomercocamp.com.br',
])

/** Só BI — sub-aba Análise Armazéns (sem resto do portal). */
const BI_ARMAZENS_PORTAL_ONLY_EMAILS = new Set([
  'administrativo@mercocamp.com',
])

/**
 * E-mail com acesso à Análise Armazéns além de nível 0 (espelha BI_ARMAZENS_EXTRA_EMAILS no back-end).
 */
const BI_ARMAZENS_EXTRA_EMAILS = new Set([
  'administrativo@mercocamp.com',
  'cristiano.pereira@grupomercocamp.com.br',
])

export function normalizePortalUserEmail(user) {
  if (!user || typeof user !== 'object') return ''
  const raw = user.user || user.email || user.username || ''
  return String(raw).trim().toLowerCase()
}

export function isBiDiretoriaPortalOnlyUser(user) {
  const e = normalizePortalUserEmail(user)
  return e !== '' && BI_DIRETORIA_PORTAL_ONLY_EMAILS.has(e)
}

export function isBiArmazensPortalOnlyUser(user) {
  const e = normalizePortalUserEmail(user)
  return e !== '' && BI_ARMAZENS_PORTAL_ONLY_EMAILS.has(e)
}

/** Análise Armazéns: nível 0, lista extra ou perfil somente Análise Armazéns. */
export function canAccessBiArmazensAnalise(user) {
  if (!user) return false
  if (Number(user.level_access) === 0) return true
  if (isBiArmazensPortalOnlyUser(user)) return true
  const e = normalizePortalUserEmail(user)
  return e !== '' && BI_ARMAZENS_EXTRA_EMAILS.has(e)
}
