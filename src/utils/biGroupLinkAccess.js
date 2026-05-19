/**
 * BI Gerencial Group Link: nível 0 (desenvolvedor) OU e-mail do cliente autorizado
 * (espelha a regra do backend).
 */
const GROUPLINK_GERENCIAL_EMAIL = 'i.duarte@grouplinkone.com'

export function canAccessBiGroupLinkGerencial(user) {
  if (!user) return false
  if (Number(user.level_access) === 0) return true
  const email = String(
    user.user || user.email || user.username || ''
  )
    .trim()
    .toLowerCase()
  return email === GROUPLINK_GERENCIAL_EMAIL
}
