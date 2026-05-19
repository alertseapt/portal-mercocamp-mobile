/**
 * Converte valor em reais (string 8 dígitos: 6 reais + 2 centavos) para texto por extenso em português.
 * Ex.: "00012345" -> "cento e vinte e três reais e quarenta e cinco centavos"
 */
const UNIDADES = [
  'zero',
  'um',
  'dois',
  'três',
  'quatro',
  'cinco',
  'seis',
  'sete',
  'oito',
  'nove',
]
const DEZES = [
  '',
  'dez',
  'vinte',
  'trinta',
  'quarenta',
  'cinquenta',
  'sessenta',
  'setenta',
  'oitenta',
  'noventa',
]
const DEZENA_ESPECIAL = [
  'dez',
  'onze',
  'doze',
  'treze',
  'catorze',
  'quinze',
  'dezesseis',
  'dezessete',
  'dezoito',
  'dezenove',
]
const CENTENAS = [
  '',
  'cento',
  'duzentos',
  'trezentos',
  'quatrocentos',
  'quinhentos',
  'seiscentos',
  'setecentos',
  'oitocentos',
  'novecentos',
]

function extensoAte999(n) {
  if (n === 0) return ''
  if (n < 10) return UNIDADES[n]
  if (n < 20) return DEZENA_ESPECIAL[n - 10]
  if (n < 100) {
    const dezena = Math.floor(n / 10)
    const un = n % 10
    return un === 0 ? DEZES[dezena] : `${DEZES[dezena]} e ${UNIDADES[un]}`
  }
  const c = Math.floor(n / 100)
  const resto = n % 100
  if (resto === 0) return c === 1 ? 'cem' : CENTENAS[c]
  const restoStr = extensoAte999(resto)
  return `${c === 1 ? 'cento' : CENTENAS[c]} e ${restoStr}`
}

/** Reais de 0 a 999.999 por extenso (para valor em reais no recibo). */
function extensoReaisAte999999(n) {
  if (n === 0) return 'zero'
  if (n <= 999) return extensoAte999(n)
  const milhares = Math.floor(n / 1000)
  const resto = n % 1000
  const milharesStr = milhares === 1 ? 'mil' : `${extensoAte999(milhares)} mil`
  if (resto === 0) return milharesStr
  return `${milharesStr} e ${extensoAte999(resto)}`
}

/**
 * @param {string} value8 - String com 8 dígitos (6 reais + 2 centavos), ex: "00012345" ou "00100000"
 * @returns {string} Valor por extenso, ex: "cento e vinte e três reais e quarenta e cinco centavos" ou "mil reais"
 */
export function valorPorExtenso(value8) {
  const s = String(value8 || '00000000')
    .replace(/\D/g, '')
    .padStart(8, '0')
    .slice(-8)
  const reais = parseInt(s.slice(0, 6), 10)
  const centavos = parseInt(s.slice(6, 8), 10)

  const reaisStr = reais === 0 ? 'zero' : extensoReaisAte999999(reais)
  const reaisLabel = reais === 1 ? 'real' : 'reais'
  const centavosStr = centavos === 0 ? 'zero' : extensoAte999(centavos)
  const centavosLabel = centavos === 1 ? 'centavo' : 'centavos'

  if (centavos === 0) {
    return `${reaisStr} ${reaisLabel}`
  }
  if (reais === 0) {
    return `${centavosStr} ${centavosLabel}`
  }
  return `${reaisStr} ${reaisLabel} e ${centavosStr} ${centavosLabel}`
}
