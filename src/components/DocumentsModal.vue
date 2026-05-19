<template>
  <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content documents-modal">
      <div class="modal-header">
        <h3 class="modal-title-left">
          <i class="fas fa-file-alt"></i>
          {{ isLot ? 'Documentos do Lote' : 'Documentos do Pedido' }}
        </h3>
      </div>

      <div class="modal-body">
        <div v-if="loading" class="loading-state">
          <div class="loader-spinner"></div>
          <p>Carregando documentos...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <p>{{ error }}</p>
        </div>

        <div v-else-if="documents.length === 0" class="empty-state">
          <i class="fas fa-folder-open"></i>
          <h4>Nenhum documento encontrado</h4>
          <p>Este pedido não possui documentos anexados</p>
        </div>

        <div v-else class="documents-list">
          <div
            v-for="(doc, index) in documents"
            :key="index"
            class="document-item"
          >
            <div class="document-icon">
              <i :class="getDocumentIcon(doc.type)"></i>
            </div>
            <div class="document-info">
              <h4 class="document-name">{{ doc.name }}</h4>
              <p class="document-description">{{ doc.description }}</p>
              <span class="document-size" v-if="doc.size">{{
                formatFileSize(doc.size)
              }}</span>
            </div>
            <div class="document-actions">
              <button
                v-if="isZPLFile(doc)"
                @click="convertZplToPdf(doc)"
                class="btn-convert"
                title="Converter ZPL para PDF"
                :disabled="doc.converting"
              >
                <i
                  :class="
                    doc.converting
                      ? 'fas fa-spinner fa-spin'
                      : 'fas fa-file-pdf'
                  "
                ></i>
                {{ doc.converting ? 'Convertendo...' : 'Converter para PDF' }}
              </button>
              <button
                @click="openDocument(doc)"
                class="btn-view"
                title="Visualizar documento"
              >
                <i class="fas fa-eye"></i>
                Visualizar
              </button>
              <button
                v-if="doc.canDownload"
                @click="downloadDocument(doc)"
                class="btn-download"
                title="Baixar documento"
              >
                <i class="fas fa-download"></i>
                Baixar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="closeModal" class="btn-close-footer">
          <i class="fas fa-times"></i>
          Fechar
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { BASE_URL } from '../config/api'

export default {
  name: 'DocumentsModal',
  props: {
    showModal: {
      type: Boolean,
      required: true,
    },
    orderId: {
      type: [Number, String],
      default: null,
    },
    forceProduction: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      loading: false,
      error: null,
      documents: [],
      orderData: null,
    }
  },
  computed: {
    isLot() {
      return typeof this.orderId === 'string' && this.orderId.startsWith('L')
    },
  },
  watch: {
    showModal(newVal) {
      if (newVal && this.orderId) {
        this.loadDocuments()
      }
    },
    orderId(newVal) {
      if (newVal && this.showModal) {
        this.loadDocuments()
      }
    },
  },
  methods: {
    closeModal() {
      this.$emit('close')
    },

    async loadDocuments() {
      if (!this.orderId) {
        this.error = 'ID do pedido não fornecido'
        return
      }

      this.loading = true
      this.error = null
      this.documents = []

      try {
        const token = localStorage.getItem('token')

        // Detectar se é LOT (string começando com "L") ou order ID (número)
        const isLot =
          typeof this.orderId === 'string' && this.orderId.startsWith('L')

        let response
        if (isLot) {
          // Buscar documentos do LOT
          // Usar banco de produção se forceProduction=true
          const params = this.forceProduction
            ? { force_production: 'true' }
            : {}
          response = await axios.get(
            `/expeditions/lot/${this.orderId}/documents`,
            {
              params: params,
              headers: { Authorization: `Bearer ${token}` },
            }
          )

          if (response.data.success && response.data.docs) {
            // Processar documentos do LOT
            this.orderData = {
              lot: response.data.lot,
              docs: response.data.docs,
              checkin_nf: response.data.checkin_nf,
            }
            this.processLotDocuments(response.data.docs)
          } else {
            this.error = 'Nenhum documento encontrado para este lote'
          }
        } else {
          // Buscar documentos de pedido individual
          // Usar banco de produção se forceProduction=true
          const params = this.forceProduction
            ? { force_production: 'true' }
            : {}
          response = await axios.get(`/expeditions/${this.orderId}`, {
            params: params,
            headers: { Authorization: `Bearer ${token}` },
          })

          if (response.data.success) {
            this.orderData = response.data.pedido
            this.processDocuments()
          } else {
            this.error = 'Erro ao carregar dados do pedido'
          }
        }
      } catch (error) {
        console.error('Erro ao carregar documentos:', error)
        this.error =
          error.response?.data?.error || 'Erro ao carregar documentos'
      } finally {
        this.loading = false
      }
    },

    processLotDocuments(docsObject) {
      // Processar documentos do LOT
      // Formato: { "arquivo1.pdf": "base64...", "arquivo2.png": "base64..." }
      const docs = []

      console.log('🔍 [LOT-DOCS] Processando documentos do lote:', docsObject)

      if (docsObject && typeof docsObject === 'object') {
        Object.keys(docsObject).forEach((fileName, index) => {
          const base64Data = docsObject[fileName]

          if (!base64Data) {
            console.warn(
              `⚠️ [LOT-DOCS] Arquivo ${fileName} sem dados! Pulando...`
            )
            return
          }

          docs.push({
            name: fileName,
            description: 'Documento complementar do lote',
            type: this.getFileTypeFromName(fileName),
            data: base64Data,
            size: base64Data.length,
            canDownload: true,
            mimeType: this.getMimeTypeFromName(fileName),
          })

          console.log(
            `✅ [LOT-DOCS] Documento ${index + 1} adicionado: ${fileName}`
          )
        })
      }

      this.documents = docs
      console.log(
        `📄 [LOT-DOCS] Total de ${docs.length} documento(s) do lote processados`
      )
    },

    processDocuments() {
      const docs = []

      console.log('🔍 [DOCS] Processando documentos do pedido:', this.orderData)
      console.log('🔍 [DOCS] orderData.documentos:', this.orderData.documentos)
      console.log('🔍 [DOCS] orderData.docs:', this.orderData.docs)
      console.log('🔍 [DOCS] orderData.etiqueta:', this.orderData.etiqueta)

      // 1. Etiqueta do cliente (campo ETQCLIZPLBASE64)
      if (this.orderData.etiqueta && this.orderData.etiqueta.base64) {
        docs.push({
          name: 'Etiqueta do Cliente',
          description: 'Etiqueta personalizada anexada ao pedido',
          type: 'file',
          data: this.orderData.etiqueta.base64,
          size:
            parseInt(this.orderData.etiqueta.fileSize) ||
            this.orderData.etiqueta.base64.length,
          canDownload: true,
          mimeType: 'application/octet-stream', // Tipo genérico, pode ser ZPL, PDF, TXT, etc.
        })
        console.log('✅ [DOCS] Etiqueta do cliente adicionada')
      }

      // 3. Documentos adicionais (campo documentos)
      if (
        this.orderData.documentos &&
        Array.isArray(this.orderData.documentos)
      ) {
        console.log(
          `🔍 [DOCS] Processando ${this.orderData.documentos.length} documento(s) adicional(is)`
        )
        this.orderData.documentos.forEach((doc, index) => {
          console.log(`📄 [DOCS] Documento ${index + 1}:`, doc)
          console.log(`📄 [DOCS] Campos disponíveis:`, Object.keys(doc))

          // Buscar dados em vários campos possíveis
          const docData =
            doc.data ||
            doc.base64 ||
            doc.content ||
            doc.file ||
            doc.arquivo ||
            null

          console.log(`📄 [DOCS] Dados encontrados:`, {
            hasData: !!doc.data,
            hasBase64: !!doc.base64,
            hasContent: !!doc.content,
            hasFile: !!doc.file,
            hasArquivo: !!doc.arquivo,
            selectedField: docData ? 'encontrado' : 'nenhum',
            dataLength: docData ? docData.length : 0,
          })

          if (!docData) {
            console.warn(
              `⚠️ [DOCS] Documento ${index + 1} sem dados! Pulando...`
            )
            return // Pular este documento
          }

          docs.push({
            name: doc.name || doc.nome || `Documento ${index + 1}`,
            description:
              doc.description || doc.descricao || 'Documento anexado',
            type: doc.type || doc.tipo || 'file',
            data: docData,
            size: doc.size || doc.tamanho || (docData ? docData.length : 0),
            canDownload: true,
            mimeType:
              doc.mimeType ||
              doc.mime_type ||
              doc.mimetype ||
              this.getMimeTypeFromName(doc.name || doc.nome),
          })
        })
        console.log(
          `✅ [DOCS] ${docs.length - (this.orderData.etiqueta?.base64 ? 1 : 0)} documento(s) adicional(is) adicionado(s)`
        )
      } else {
        console.log(
          '⚠️ [DOCS] Nenhum documento adicional encontrado ou documentos não é um array'
        )
      }

      this.documents = docs

      console.log('📄 [DOCS] Total de documentos processados:', docs.length)
      console.log(
        '📄 [DOCS] Lista final de documentos:',
        docs.map(d => ({ name: d.name, type: d.type, hasData: !!d.data }))
      )
    },

    getDocumentIcon(type) {
      const icons = {
        xml: 'fas fa-file-code',
        pdf: 'fas fa-file-pdf',
        image: 'fas fa-file-image',
        zip: 'fas fa-file-archive',
        txt: 'fas fa-file-alt',
        file: 'fas fa-file',
      }
      return icons[type] || 'fas fa-file'
    },

    getMimeTypeFromName(name) {
      if (!name) return 'application/octet-stream'

      const ext = name.split('.').pop().toLowerCase()
      const mimeTypes = {
        pdf: 'application/pdf',
        xml: 'application/xml',
        txt: 'text/plain',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        zip: 'application/zip',
        zpl: 'text/plain',
      }
      return mimeTypes[ext] || 'application/octet-stream'
    },

    getFileTypeFromName(name) {
      if (!name) return 'file'

      const ext = name.split('.').pop().toLowerCase()
      const typeMap = {
        xml: 'xml',
        pdf: 'pdf',
        jpg: 'image',
        jpeg: 'image',
        png: 'image',
        gif: 'image',
        bmp: 'image',
        svg: 'image',
        zip: 'zip',
        rar: 'zip',
        '7z': 'zip',
        txt: 'txt',
        zpl: 'txt',
        log: 'txt',
      }
      return typeMap[ext] || 'file'
    },

    formatFileSize(bytes) {
      if (!bytes || bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    },

    async openDocument(doc) {
      try {
        // Abrir documento diretamente
        await this.openBase64Document(doc)
      } catch (error) {
        console.error('Erro ao abrir documento:', error)
        alert('Erro ao abrir documento. Por favor, tente baixar o arquivo.')
      }
    },

    cleanBase64(base64String) {
      // Validar entrada
      if (!base64String || typeof base64String !== 'string') {
        console.warn('⚠️ [CLEAN] Base64 inválido:', base64String)
        return ''
      }

      // Remove prefixos data: URL se existirem
      // Exemplo: "data:application/pdf;base64,JVBERi0..." -> "JVBERi0..."
      if (base64String.includes(',')) {
        const parts = base64String.split(',')
        return parts[parts.length - 1]
      }
      return base64String
    },

    async openBase64Document(doc) {
      try {
        console.log('📄 [OPEN] Abrindo documento:', doc.name)
        console.log('📄 [OPEN] Tipo:', doc.type)
        console.log('📄 [OPEN] MIME:', doc.mimeType)
        console.log(
          '📄 [OPEN] Tamanho dos dados:',
          doc.data ? doc.data.length : 0
        )
        console.log(
          '📄 [OPEN] Primeiros 50 caracteres:',
          doc.data ? doc.data.substring(0, 50) : 'N/A'
        )

        // Validar se tem dados
        if (!doc.data) {
          throw new Error(
            'Documento sem dados. O campo "data" está vazio ou indefinido.'
          )
        }

        // Determinar MIME type
        const mimeType = doc.mimeType || this.getMimeTypeFromName(doc.name)

        // Limpar base64 (remover prefixos data: URL se existirem)
        const cleanedBase64 = this.cleanBase64(doc.data)

        if (!cleanedBase64) {
          throw new Error('Não foi possível processar os dados do documento.')
        }

        console.log(
          '📄 [OPEN] Base64 limpo - primeiros 50 caracteres:',
          cleanedBase64.substring(0, 50)
        )

        // Converter base64 para blob
        const byteCharacters = atob(cleanedBase64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: mimeType })

        console.log(
          '✅ [OPEN] Blob criado:',
          blob.size,
          'bytes, tipo:',
          blob.type
        )

        // Criar URL temporária
        const url = URL.createObjectURL(blob)

        // Abrir em nova janela
        const newWindow = window.open(url, '_blank')

        // Liberar URL após um tempo
        setTimeout(() => {
          URL.revokeObjectURL(url)
        }, 60000) // 1 minuto

        if (!newWindow) {
          throw new Error(
            'Popup bloqueado. Por favor, permita popups para este site.'
          )
        }

        console.log('✅ [OPEN] Documento aberto com sucesso')
      } catch (error) {
        console.error('❌ [OPEN] Erro ao abrir documento:', error)
        console.error('❌ [OPEN] Dados do documento:', {
          name: doc.name,
          type: doc.type,
          hasData: !!doc.data,
          dataLength: doc.data ? doc.data.length : 0,
        })
        throw error
      }
    },

    async downloadDocument(doc) {
      try {
        const fileName = doc.name
        const mimeType = doc.mimeType || this.getMimeTypeFromName(doc.name)

        // Converter base64 para blob
        console.log('📥 [DOWNLOAD] Processando documento:', doc.name)
        console.log(
          '📥 [DOWNLOAD] Tamanho dos dados:',
          doc.data ? doc.data.length : 0
        )

        // Validar se tem dados
        if (!doc.data) {
          throw new Error(
            'Documento sem dados. O campo "data" está vazio ou indefinido.'
          )
        }

        // Limpar base64 (remover prefixos data: URL se existirem)
        const cleanedBase64 = this.cleanBase64(doc.data)

        if (!cleanedBase64) {
          throw new Error('Não foi possível processar os dados do documento.')
        }

        console.log(
          '📥 [DOWNLOAD] Base64 limpo - tamanho:',
          cleanedBase64.length
        )

        const byteCharacters = atob(cleanedBase64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: mimeType })

        console.log('✅ [DOWNLOAD] Blob criado:', blob.size, 'bytes')

        // Criar link de download
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        // Liberar URL
        setTimeout(() => {
          URL.revokeObjectURL(url)
        }, 1000)

        console.log('✅ Download iniciado:', fileName)
      } catch (error) {
        console.error('Erro ao baixar documento:', error)
        alert('Erro ao baixar documento. Por favor, tente novamente.')
      }
    },

    isZPLFile(doc) {
      // Verificar se o documento é um arquivo ZPL
      if (!doc || !doc.name) return false

      const fileName = doc.name.toLowerCase()
      const isZpl = fileName.endsWith('.zpl')

      console.log(`🔍 [ZPL] Verificando se é ZPL: ${doc.name} → ${isZpl}`)
      return isZpl
    },

    async convertZplToPdf(doc) {
      try {
        console.log('🔄 [ZPL→PDF] Iniciando conversão:', doc.name)

        // Marcar como convertendo
        this.$set(doc, 'converting', true)

        // Limpar base64
        const cleanedBase64 = this.cleanBase64(doc.data)

        if (!cleanedBase64) {
          throw new Error('Não foi possível processar o arquivo ZPL')
        }

        // Decodificar base64 para obter conteúdo ZPL
        const zplContent = atob(cleanedBase64)
        console.log(
          '📄 [ZPL→PDF] Conteúdo ZPL:',
          zplContent.substring(0, 100) + '...'
        )

        // Chamar endpoint de conversão
        const token = localStorage.getItem('token')
        const response = await axios.post(
          '/expeditions/convert-zpl-to-pdf',
          {
            zplContent,
            dpi: '8dpmm',
            width: '4',
            height: '6',
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        if (!response.data.success) {
          throw new Error(
            response.data.error || 'Erro ao converter ZPL para PDF'
          )
        }

        const pdfBase64 = response.data.pdfBase64
        console.log(
          '✅ [ZPL→PDF] Conversão concluída - PDF size:',
          response.data.size,
          'bytes'
        )

        // Criar blob do PDF
        const pdfByteCharacters = atob(pdfBase64)
        const pdfByteNumbers = new Array(pdfByteCharacters.length)
        for (let i = 0; i < pdfByteCharacters.length; i++) {
          pdfByteNumbers[i] = pdfByteCharacters.charCodeAt(i)
        }
        const pdfByteArray = new Uint8Array(pdfByteNumbers)
        const pdfBlob = new Blob([pdfByteArray], { type: 'application/pdf' })

        // Abrir PDF em nova aba com diálogo de impressão
        const pdfUrl = URL.createObjectURL(pdfBlob)
        const newWindow = window.open(pdfUrl, '_blank')

        if (!newWindow) {
          throw new Error(
            'Popup bloqueado. Por favor, permita popups para este site.'
          )
        }

        // Tentar abrir diálogo de impressão após carregar
        newWindow.addEventListener('load', () => {
          setTimeout(() => {
            try {
              newWindow.print()
            } catch (e) {
              console.warn(
                '⚠️ Não foi possível abrir diálogo de impressão automaticamente'
              )
            }
          }, 500)
        })

        // Liberar URL após um tempo
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl)
        }, 60000) // 1 minuto

        console.log('✅ [ZPL→PDF] PDF aberto com sucesso')
      } catch (error) {
        console.error('❌ [ZPL→PDF] Erro na conversão:', error)
        alert(`Erro ao converter ZPL para PDF:\n\n${error.message}`)
      } finally {
        // Desmarcar como convertendo
        this.$set(doc, 'converting', false)
      }
    },
  },
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 10vh 20px;
  box-sizing: border-box;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  height: 80vh;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
  margin: 0 auto;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.documents-modal .modal-header {
  padding: 24px 28px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  flex-wrap: nowrap;
  min-height: auto;
  height: auto;
}

.documents-modal .modal-header h3.modal-title-left,
.documents-modal .modal-header .modal-title-left {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 0;
  flex: 0 0 auto;
  justify-content: flex-start;
  text-align: left;
  width: auto;
  max-width: none;
  align-self: center;
  line-height: 1.2;
  height: auto;
  white-space: nowrap;
  flex-wrap: nowrap;
  min-width: 0;
  vertical-align: middle;
}

.documents-modal .modal-header h3 i {
  color: #2563eb !important;
  font-size: 22px !important;
  flex-shrink: 0 !important;
}

.modal-body {
  padding: 24px 28px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

/* Footer */
.modal-footer {
  padding: 20px 28px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8fafc;
}

.btn-close-footer {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  background: #6b7280;
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-close-footer:hover {
  background: #4b5563;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
}

/* Estados de carregamento */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loader-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p,
.error-state p {
  color: #64748b;
  font-size: 14px;
  margin-top: 12px;
}

.error-state i {
  font-size: 48px;
  color: #ef4444;
  margin-bottom: 16px;
}

.empty-state i {
  font-size: 64px;
  color: #cbd5e1;
  margin-bottom: 20px;
}

.empty-state h4 {
  font-size: 18px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 14px;
  color: #94a3b8;
}

/* Lista de documentos */
.documents-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.document-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  transition: all 0.2s;
}

.document-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.document-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: white;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.document-icon i {
  font-size: 24px;
  color: #2563eb;
}

.document-info {
  flex: 1;
  min-width: 0;
}

.document-name {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.document-description {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 6px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.document-size {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

.document-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-convert,
.btn-view,
.btn-download {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-convert {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.btn-convert:hover:not(:disabled) {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-convert:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-view {
  background: #2563eb;
  color: white;
}

.btn-view:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-download {
  background: white;
  color: #2563eb;
  border: 1px solid #2563eb;
  padding: 10px 12px;
}

.btn-download:hover {
  background: #eff6ff;
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-content {
    max-width: 100%;
    height: 80vh;
    max-height: 80vh;
    margin: 10px;
  }

  .document-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .document-actions {
    width: 100%;
  }

  .btn-view,
  .btn-download {
    flex: 1;
  }
}

/* Media queries para responsividade em mobile */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 10vh 10px !important;
  }

  .modal-content {
    max-width: 95vw !important;
    height: 80vh !important;
    max-height: 80vh !important;
    margin: 0 auto !important;
  }

  .documents-modal {
    max-width: 95vw !important;
  }

  .documents-modal .modal-header {
    padding: 16px 18px !important;
    align-items: center !important;
    display: flex !important;
    justify-content: flex-start !important;
    min-height: auto !important;
    height: auto !important;
  }

  .documents-modal .modal-header h3.modal-title-left {
    font-size: 16px !important;
    gap: 8px !important;
    flex-wrap: nowrap !important;
    white-space: nowrap !important;
    line-height: 1.5 !important;
    align-self: center !important;
    display: flex !important;
    height: auto !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .modal-header h3 i {
    font-size: 18px !important;
  }

  .modal-body {
    padding: 16px 18px !important;
    flex: 1 !important;
    min-height: 0 !important;
  }

  .modal-footer {
    padding: 16px 18px !important;
  }

  .btn-close-footer {
    padding: 10px 20px !important;
    font-size: 13px !important;
  }

  .empty-state h4 {
    font-size: 16px !important;
  }

  .empty-state p {
    font-size: 13px !important;
  }

  .document-item {
    padding: 12px !important;
    gap: 12px !important;
  }

  .document-name {
    font-size: 14px !important;
  }

  .document-description {
    font-size: 12px !important;
  }

  .btn-convert,
  .btn-view {
    padding: 8px 12px !important;
    font-size: 12px !important;
  }
}

@media (max-width: 480px) {
  .documents-modal .modal-header {
    align-items: center !important;
    display: flex !important;
    justify-content: flex-start !important;
    min-height: auto !important;
    height: auto !important;
    flex-wrap: nowrap !important;
    padding: 12px 14px !important;
  }

  .documents-modal .modal-header h3.modal-title-left {
    font-size: 14px !important;
    align-self: center !important;
    line-height: 1.2 !important;
    display: flex !important;
    height: auto !important;
    flex-wrap: nowrap !important;
    white-space: nowrap !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    vertical-align: middle !important;
    flex: 0 0 auto !important;
  }

  .modal-body {
    padding: 12px 14px !important;
  }

  .modal-footer {
    padding: 12px 14px !important;
  }

  .btn-close-footer {
    padding: 8px 16px !important;
    font-size: 12px !important;
  }

  .document-item {
    flex-direction: column !important;
    align-items: flex-start !important;
  }

  .document-actions {
    width: 100% !important;
    justify-content: flex-start !important;
  }

  .btn-convert,
  .btn-view {
    flex: 1 !important;
    font-size: 11px !important;
    padding: 6px 10px !important;
  }
}

/* Media query para telas muito pequenas - manter elementos na mesma linha */
@media (max-width: 360px) {
  .documents-modal .modal-header {
    padding: 10px 12px !important;
    gap: 6px !important;
    flex-wrap: nowrap !important;
  }

  .documents-modal .modal-header {
    justify-content: flex-start !important;
  }

  .documents-modal .modal-header h3.modal-title-left {
    font-size: 13px !important;
  }

  .modal-footer {
    padding: 10px 12px !important;
  }

  .btn-close-footer {
    padding: 8px 14px !important;
    font-size: 12px !important;
  }
}
</style>
