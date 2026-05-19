/**
 * BI "Acompanhamento operacional por administrador".
 * Nível 0: visão global (sem restrição quando sem cli_access).
 * Nível 2: apenas clientes da carteira (cli_access).
 * Nível 3: mesma regra por CNPJ — a equipe deve estar refletida no cli_access do gerente.
 */
export function canAccessBiAdministradores(user) {
  if (!user || user.level_access === undefined || user.level_access === null)
    return false
  return [0, 2, 3].includes(Number(user.level_access))
}
