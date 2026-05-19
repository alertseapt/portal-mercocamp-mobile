/**
 * Serviço para geração de arquivos TXT para integração CORPEM
 * Substitui a funcionalidade da macro Excel
 */

/**
 * Valida se o usuário pode gerar arquivos TXT
 * @param {Object} user - Dados do usuário
 * @param {Array} selectedSchedules - Agendamentos selecionados
 * @returns {Object} - { canGenerate: boolean, reason?: string }
 */
export function validateTXTGeneration(user, selectedSchedules) {
  if (!selectedSchedules || selectedSchedules.length < 1) {
    return { canGenerate: false, reason: 'Nenhum agendamento selecionado' }
  }

  // Verificar nível de acesso do usuário (apenas usuários com level_access 0 ou 2)
  if (!user || !(user.level_access === 0 || user.level_access === 2)) {
    return {
      canGenerate: false,
      reason:
        'Funcionalidade disponível apenas para usuários com nível de acesso 0 ou 2',
    }
  }

  // Verificar se todos os agendamentos têm status permitidos
  const allowedStatuses = ['Agendado', 'Em conferência', 'Conferência']
  const invalidSchedules = selectedSchedules.filter(
    s => !allowedStatuses.includes(s.status)
  )
  if (invalidSchedules.length > 0) {
    return {
      canGenerate: false,
      reason: `Agendamentos com status inválido encontrados: ${invalidSchedules.map(s => s.status).join(', ')}`,
    }
  }

  // Verificar se todos os agendamentos são do mesmo cliente
  const clients = [...new Set(selectedSchedules.map(s => s.client))]
  if (clients.length > 1) {
    return {
      canGenerate: false,
      reason: 'Todos os agendamentos devem ser do mesmo cliente',
    }
  }

  return { canGenerate: true }
}

/**
 * Gera o conteúdo do arquivo TXT no formato CORPEM
 * Formato da linha (101 caracteres): [Pedido:30][NFe:10][Série:3][Data:8][Valor:10][Código:20][Qtd:10][ValorUnit:10]
 * @param {Array} schedules - Agendamentos selecionados
 * @returns {String} - Conteúdo do arquivo TXT
 */
export function generateTXTContent(schedules) {
  let txtContent = ''

  // Usar o ID do agendamento da primeira NFe como número do pedido para todos os itens
  const pedidoCompraUnificado = schedules.length > 0 ? schedules[0].id : ''

  schedules.forEach(schedule => {
    try {
      // Extrair dados da NFe
      const info =
        typeof schedule.info === 'string'
          ? JSON.parse(schedule.info)
          : schedule.info

      // Campos do arquivo TXT (baseado na macro Excel)
      const pedidoCompra = padField(pedidoCompraUnificado || '', 30) // Usando ID do agendamento da primeira NFe como pedido
      const nfFornecedor = padField(schedule.number || '', 10)
      const serieNf = padField('001', 3) // Série padrão

      // Data de emissão formatada (DDMMAAAA - sem zeros desnecessários)
      const dataEmissao = formatDateForTXT(info?.ide?.dhEmi || schedule.date)
      const dataEmissaoPadded = padField(dataEmissao, 8)

      // Valor da nota (pode ser vazio por padrão conforme solicitação)
      const valorNota = padField('', 10)

      // Processar produtos se existirem
      if (info?.products && Array.isArray(info.products)) {
        info.products.forEach(product => {
          const codigoMercadoria = padField(
            product.client_code || product.code || '',
            20
          )
          const quantidade = padField(product.quantity || '', 10)
          const valorUnitario = padField(
            formatMonetaryValue(product.unit_value),
            10
          )

          // Montar linha do TXT (101 caracteres - SEM chave NFe)
          const linha =
            pedidoCompra +
            nfFornecedor +
            serieNf +
            dataEmissaoPadded +
            valorNota +
            codigoMercadoria +
            quantidade +
            valorUnitario

          txtContent += linha + '\n'
        })
      } else {
        // Se não há produtos, criar linha básica sem produto
        const codigoMercadoria = padField('', 20)
        const quantidade = padField('', 10)
        const valorUnitario = padField('', 10)

        // Montar linha do TXT (101 caracteres - SEM chave NFe)
        const linha =
          pedidoCompra +
          nfFornecedor +
          serieNf +
          dataEmissaoPadded +
          valorNota +
          codigoMercadoria +
          quantidade +
          valorUnitario

        txtContent += linha + '\n'
      }
    } catch (error) {
      console.error('Erro ao processar agendamento:', schedule.id, error)
    }
  })

  return txtContent
}

/**
 * Preenche campo com tamanho fixo (padding com espaços)
 * @param {String|Number} value - Valor a ser preenchido
 * @param {Number} size - Tamanho fixo do campo
 * @returns {String} - Campo preenchido
 */
export function padField(value, size) {
  const str = String(value || '').substring(0, size)
  return str + ' '.repeat(Math.max(0, size - str.length))
}

/**
 * Formata data para o padrão do TXT
 * Formato: DDMMAAAA (com zeros à esquerda quando necessário)
 * Exemplo: 01/03/2024 -> 01032024, 15/12/2024 -> 15122024
 * @param {String|Date} dateValue - Data a ser formatada
 * @returns {String} - Data formatada
 */
export function formatDateForTXT(dateValue) {
  if (!dateValue) return ''

  try {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return ''

    const day = String(date.getDate()).padStart(2, '0') // Com zeros à esquerda
    const month = String(date.getMonth() + 1).padStart(2, '0') // Com zeros à esquerda
    const year = String(date.getFullYear())

    return day + month + year
  } catch (error) {
    console.error('Erro ao formatar data:', error)
    return ''
  }
}

/**
 * Formata valor monetário para o padrão do TXT
 * Remove vírgulas/pontos decimais e mantém apenas 2 casas decimais
 * Exemplo: R$ 110,3556 -> 11035 (trunca em 2 casas, não arredonda)
 * @param {String|Number} value - Valor monetário
 * @returns {String} - Valor formatado sem vírgulas
 */
export function formatMonetaryValue(value) {
  if (!value || value === '' || value === 0) return ''

  try {
    // Converter para número se for string
    let numValue =
      typeof value === 'string'
        ? parseFloat(value.replace(',', '.'))
        : parseFloat(value)

    if (isNaN(numValue)) return ''

    // Truncar para 2 casas decimais (não arredondar) e multiplicar por 100
    const truncated = Math.floor(numValue * 100) / 100
    const centavos = Math.floor(truncated * 100)

    return String(centavos)
  } catch (error) {
    console.error('Erro ao formatar valor monetário:', error)
    return ''
  }
}

/**
 * Executa download do arquivo TXT
 * @param {String} content - Conteúdo do arquivo
 * @param {String} filename - Nome do arquivo
 * @returns {Promise} - Promise que resolve após o download ser iniciado
 */
export function downloadTXT(content, filename) {
  return new Promise(resolve => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)

    // Aguardar um pequeno delay para garantir que o browser processe o download
    setTimeout(() => {
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      resolve()
    }, 100)
  })
}

/**
 * FUNÇÃO DESABILITADA TEMPORARIAMENTE - Envia o arquivo TXT para o servidor FTP via backend
 * Esta função está preservada para uso futuro quando a integração FTP for reativada
 * @param {String} txtContent - Conteúdo do arquivo TXT
 * @param {String} filename - Nome do arquivo
 * @returns {Promise<Object>} - { success: boolean, message: string }
 */
/* export async function uploadTXT(txtContent, filename) {
  try {
    console.log(`📤 Enviando arquivo ${filename} para FTP via backend`)

    // Usar a mesma configuração de API do resto da aplicação
    const token = localStorage.getItem('token')

    if (!token) {
      throw new Error('Token de autenticação não encontrado')
    }

    // Processar conteúdo mantendo quebras de linha mas removendo \r
    const processedContent = txtContent
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')

    // Usar axios com configuração do apiService
    const apiService = (await import('./api.js')).default
    const result = await apiService.post('/schedules/upload-txt', {
      txtContent: processedContent,
      filename,
    })
    console.log(
      `✅ Arquivo ${filename} enviado com sucesso para FTP via backend`
    )

    return result
  } catch (error) {
    console.error(`❌ Erro ao enviar arquivo ${filename} para FTP:`, error)

    // Tratamento específico para diferentes tipos de erro
    let errorMessage = 'Erro desconhecido ao enviar para servidor FTP'

    if (
      error.name === 'TypeError' &&
      error.message.includes('Failed to fetch')
    ) {
      errorMessage =
        'Erro de conectividade: Verifique se o backend está acessível'
    } else if (error.message.includes('Token')) {
      errorMessage = 'Erro de autenticação: Faça login novamente'
    } else if (error.message.includes('HTTP 401')) {
      errorMessage = 'Não autorizado: Faça login novamente'
    } else if (error.message.includes('HTTP')) {
      errorMessage = `Erro do servidor: ${error.message}`
    } else {
      errorMessage = `Erro ao enviar para servidor FTP: ${error.message}`
    }

    return {
      success: false,
      message: errorMessage,
    }
  }
} */

/**
 * Gera nome do arquivo no formato: 'clientNumber_id1lid2lid3.txt'
 * @param {String} clientNumber - Número do cliente
 * @param {Array} scheduleIds - Array com os IDs dos agendamentos
 * @returns {String} - Nome do arquivo
 */
export function generateFileName(clientNumber, scheduleIds) {
  // Gerar nome no formato: 'clientNumber_id1lid2lid3.txt'
  const idsString = scheduleIds.join('l')
  return `${clientNumber}_${idsString}.txt`
}

/**
 * Função principal para geração completa do TXT
 * @param {Object} user - Dados do usuário
 * @param {Array} selectedSchedules - Agendamentos selecionados
 * @returns {Promise<Object>} - { success: boolean, message: string, filename?: string }
 */
export async function generateCorpemTXT(user, selectedSchedules) {
  try {
    // Validar permissões
    const validation = validateTXTGeneration(user, selectedSchedules)
    if (!validation.canGenerate) {
      return { success: false, message: validation.reason }
    }

    // Gerar conteúdo
    const txtContent = generateTXTContent(selectedSchedules)

    if (!txtContent.trim()) {
      return {
        success: false,
        message: 'Nenhum conteúdo foi gerado para o arquivo TXT',
      }
    }

    // Gerar nome do arquivo no formato: 'clientNumber_id1lid2lid3.txt'
    const clientNumber =
      selectedSchedules[0].client_info?.number || selectedSchedules[0].client
    const scheduleIds = selectedSchedules.map(s => s.id)
    const filename = generateFileName(clientNumber, scheduleIds)

    // Fazer download do arquivo TXT localmente
    await downloadTXT(txtContent, filename)

    const finalMessage = `Arquivo ${filename} baixado com sucesso! ${selectedSchedules.length} ${selectedSchedules.length === 1 ? 'NFe incluída' : 'NFes incluídas'} no arquivo.`

    return {
      success: true,
      message: finalMessage,
      filename,
    }
  } catch (error) {
    console.error('Erro ao gerar arquivo TXT:', error)
    return {
      success: false,
      message: `Erro ao gerar arquivo TXT: ${error.message}`,
    }
  }
}
