<template>
  <div class="note-exchange-page">
    <h1>Criar Pedido de Saída</h1>
    <p class="page-description">
      Envie o XML da NFe para criar uma requisição de pedido de saída
    </p>

    <div class="exchange-container">
      <!-- Seção 1: Upload de XML da NFe -->
      <div class="section">
        <h2>1. XML da Nota Fiscal</h2>
        <div class="upload-section">
          <!-- Upload box grande (quando não há arquivos) -->
          <label
            v-if="xmlFiles.length === 0"
            for="xml-upload"
            class="upload-label"
          >
            <div class="upload-box">
              <input
                type="file"
                id="xml-upload"
                accept=".xml"
                :multiple="true"
                @change="handleXmlUpload"
              />
              <div class="upload-icon">📄</div>
              <div>
                <p class="upload-text">
                  Clique para selecionar arquivo(s) XML da NFe
                </p>
                <p class="upload-hint">
                  Arquivo XML da Nota Fiscal Eletrônica (múltiplos arquivos)
                </p>
              </div>
            </div>
          </label>

          <!-- Botões compactos (quando há arquivos) -->
          <div v-else class="upload-actions-compact">
            <input
              type="file"
              id="xml-upload"
              accept=".xml"
              :multiple="true"
              @change="handleXmlUpload"
              style="display: none"
            />
            <label for="xml-upload" class="btn-select-files">
              <i class="fas fa-file-upload"></i>
              Selecionar arquivos
            </label>
            <button
              type="button"
              @click="clearAllXmlFiles"
              class="btn-clear-compact"
            >
              <i class="fas fa-trash-alt"></i>
              Limpar Todos
            </button>
          </div>

          <!-- Tabela de XMLs processados -->
          <div v-if="xmlFiles.length > 0" class="xmls-table-container">
            <div class="xmls-header">
              <h3>Informações da NFe</h3>
            </div>
            <div class="table-wrapper">
              <table class="xmls-table">
                <thead>
                  <tr>
                    <th>Número NF-e</th>
                    <th>Fornecedor</th>
                    <th>Valor total da nota</th>
                    <th class="action-column"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(xmlData, index) in nfeInfos"
                    :key="index"
                    class="xml-row"
                  >
                    <td class="nfe-number">{{ xmlData.nfeInfo.numero }}</td>
                    <td class="nfe-supplier">
                      {{ xmlData.nfeInfo.fornecedor }}
                    </td>
                    <td class="nfe-value">
                      {{ formatCurrency(xmlData.nfeInfo.valorTotal) }}
                    </td>
                    <td class="action-column">
                      <button
                        type="button"
                        @click="removeXmlFile(index)"
                        class="btn-remove-row"
                        title="Remover este XML"
                      >
                        <i class="fas fa-times"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Seção 2: Upload de Documentos Complementares -->
      <div class="section">
        <h2>2. Documentos (PDF Nota fiscal e documentos complementares)</h2>
        <div class="upload-section">
          <div class="upload-box-wrapper">
            <label for="docs-upload" class="upload-label">
              <div class="upload-box" :class="{ active: docsFiles.length > 0 }">
                <input
                  type="file"
                  id="docs-upload"
                  accept=".pdf,.zpl"
                  multiple
                  @change="handleDocsUpload"
                />
                <div class="upload-icon">📎</div>
                <div v-if="docsFiles.length === 0">
                  <p class="upload-text">Clique para selecionar documentos</p>
                  <p class="upload-hint">
                    Apenas PDF e ZPL (múltiplos arquivos)
                  </p>
                </div>
                <div v-else class="files-selected">
                  <p class="files-count">
                    {{ docsFiles.length }} arquivo(s) selecionado(s)
                  </p>
                </div>
              </div>
            </label>
            <div v-if="docsFiles.length > 0" class="files-list">
              <div
                v-for="(file, index) in docsFiles"
                :key="index"
                class="file-item"
              >
                <span class="file-name-small">{{ file.name }}</span>
                <button
                  type="button"
                  @click="removeDocsFile(index)"
                  class="btn-remove-small"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Seção 3: Seleção de Agendamentos -->
      <div class="section">
        <h2>3. Selecionar Agendamentos</h2>
        <div class="selection-section">
          <button
            @click="openScheduleModal"
            class="btn-select-schedules"
            :disabled="nfeInfos.length === 0"
          >
            <i class="fas fa-list"></i>
            {{
              selectedSchedules.length > 0
                ? 'Alterar Seleção'
                : 'Selecionar Agendamentos'
            }}
          </button>

          <p v-if="nfeInfos.length === 0" class="hint-text">
            Faça upload do(s) XML(s) da NFe primeiro para selecionar
            agendamentos
          </p>

          <!-- Agendamentos Selecionados -->
          <div
            v-if="selectedSchedules.length > 0"
            class="selected-schedules-display"
          >
            <h3>Agendamentos Selecionados ({{ selectedSchedules.length }})</h3>
            <div class="selected-list">
              <div
                v-for="schedule in selectedSchedules"
                :key="schedule.id"
                class="selected-item"
              >
                <div class="schedule-info">
                  <div class="schedule-header">
                    <span class="schedule-id">#{{ schedule.id }}</span>
                    <span class="schedule-number"
                      >NF: {{ schedule.number }}</span
                    >
                  </div>
                  <div class="schedule-details">
                    <span class="schedule-client">{{
                      schedule.client_name || schedule.client
                    }}</span>
                    <span class="schedule-date">{{
                      formatDate(schedule.scheduled_date)
                    }}</span>
                  </div>
                </div>
                <button
                  type="button"
                  @click="removeSelectedSchedule(schedule.id)"
                  class="btn-remove"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Seção 4: Observações (Opcional) -->
      <div class="section">
        <h2>4. Observações (Opcional)</h2>
        <div class="observacoes-section">
          <label for="observacoes" class="observacoes-label">
            <i class="fas fa-comment-alt"></i>
            Observações sobre o lote de pedidos
          </label>
          <textarea
            id="observacoes"
            v-model="observacoes"
            placeholder="Digite observações gerais sobre este lote de pedidos (máximo 200 caracteres)"
            maxlength="200"
            rows="3"
            class="textarea-observacoes"
          ></textarea>
          <small class="char-counter">
            {{ observacoes.length }}/200 caracteres
          </small>
        </div>
      </div>

      <!-- Botão de Envio -->
      <div class="action-section">
        <button
          type="button"
          class="btn-submit"
          :disabled="!canSubmit || submitting"
          @click="submitExchange"
        >
          {{ submitting ? 'Processando...' : 'Criar Pedido de Saída' }}
        </button>
      </div>
    </div>

    <!-- Modal de Seleção de Agendamentos -->
    <div
      v-if="showScheduleModal"
      class="schedule-modal-overlay"
      @click.self="closeScheduleModal"
    >
      <div class="schedule-modal">
        <!-- Header do Modal -->
        <div class="modal-header">
          <h2>Selecionar Agendamentos</h2>
          <p v-if="nfeInfos.length > 0" class="modal-subtitle">
            CNPJ: {{ nfeInfos[0].nfeInfo.cnpjRemetente }} -
            {{ nfeInfos[0].nfeInfo.fornecedor }}
          </p>
          <button @click="closeScheduleModal" class="btn-close-modal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Barra de Busca -->
        <div class="modal-search">
          <div class="search-input-wrapper">
            <i class="fas fa-search search-icon-modal"></i>
            <input
              type="text"
              v-model="modalSearchQuery"
              placeholder="Buscar por número da NFe..."
              class="modal-search-input"
              autocomplete="off"
              data-lpignore="true"
              data-form-type="other"
              name="nfe-exchange-search"
            />
          </div>
        </div>

        <!-- Conteúdo Principal -->
        <div class="modal-content">
          <!-- Loading -->
          <div v-if="modalLoading" class="modal-loading">
            <div class="spinner"></div>
            <p>Carregando agendamentos...</p>
          </div>

          <!-- Lista Vazia -->
          <div
            v-else-if="displayModalSchedules.length === 0"
            class="modal-empty"
          >
            <i class="fas fa-inbox"></i>
            <p>Nenhum agendamento encontrado</p>
          </div>

          <!-- Lista de Agendamentos -->
          <div v-else class="modal-schedules-list">
            <div
              v-for="schedule in displayModalSchedules"
              :key="schedule.id"
              class="modal-schedule-item"
              :class="{ selected: isScheduleSelectedInModal(schedule.id) }"
            >
              <label class="modal-checkbox-label">
                <input
                  type="checkbox"
                  :checked="isScheduleSelectedInModal(schedule.id)"
                  @change="toggleScheduleInModal(schedule)"
                />
                <span class="modal-checkbox-custom"></span>
                <div class="modal-schedule-info">
                  <div class="modal-schedule-header">
                    <span class="modal-schedule-id">#{{ schedule.id }}</span>
                    <span class="modal-schedule-number"
                      >NF: {{ schedule.number }}</span
                    >
                    <span
                      class="modal-schedule-status"
                      :class="
                        'status-' +
                        (schedule.status || '')
                          .toLowerCase()
                          .replace(/\s/g, '-')
                      "
                    >
                      {{ schedule.status || 'Sem status' }}
                    </span>
                  </div>
                  <div class="modal-schedule-details">
                    <span class="modal-schedule-client">{{
                      schedule.client_name || schedule.client
                    }}</span>
                    <span class="modal-schedule-date">{{
                      formatDate(schedule.scheduled_date)
                    }}</span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Footer do Modal -->
        <div class="modal-footer">
          <button @click="closeScheduleModal" class="btn-cancel">
            Cancelar
          </button>
          <button
            @click="confirmScheduleSelection"
            class="btn-confirm"
            :disabled="tempSelectedSchedules.length === 0"
          >
            Confirmar Seleção ({{ tempSelectedSchedules.length }})
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { BASE_URL } from '../config/api.js'

export default {
  name: 'NoteExchangePage',
  data() {
    return {
      xmlFiles: [], // Array de arquivos XML
      nfeInfos: [], // Array de objetos { fileName, nfeInfo }
      docsFiles: [],
      docsFilesBase64: {},
      searchQuery: '',
      searchResults: [],
      selectedSchedules: [],
      searching: false,
      submitting: false,
      observacoes: '',
      searchTimeout: null,
      // Modal de seleção de agendamentos
      showScheduleModal: false,
      modalSchedules: [],
      modalLoading: false,
      modalSearchQuery: '',
      modalSearchTimeout: null,
      tempSelectedSchedules: [],
    }
  },
  computed: {
    canSubmit() {
      return (
        this.xmlFiles.length > 0 &&
        this.nfeInfos.length > 0 &&
        this.selectedSchedules.length > 0
      )
    },

    // Lista combinada: agendamentos do backend + selecionados que não estejam na lista
    displayModalSchedules() {
      const ids = new Set(this.modalSchedules.map(s => s.id))
      const selectedNotInList = this.tempSelectedSchedules.filter(
        s => !ids.has(s.id)
      )
      return [...selectedNotInList, ...this.modalSchedules]
    },
  },
  watch: {
    modalSearchQuery(newVal) {
      clearTimeout(this.modalSearchTimeout)
      this.modalSearchTimeout = setTimeout(() => {
        this.loadSchedulesByCNPJ(newVal)
      }, 400)
    },
  },
  methods: {
    // Upload de XML - suporta múltiplos arquivos
    async handleXmlUpload(event) {
      const files = Array.from(event.target.files)
      if (!files || files.length === 0) return

      console.log(`📄 ${files.length} arquivo(s) XML selecionado(s)`)

      // Validar extensões
      const invalidFiles = files.filter(
        f => !f.name.toLowerCase().endsWith('.xml')
      )
      if (invalidFiles.length > 0) {
        this.$emit(
          'notification',
          `⚠️ Arquivos inválidos encontrados:\n${invalidFiles.map(f => f.name).join('\n')}\n\nPor favor, selecione apenas arquivos XML válidos.`,
          'error'
        )
        event.target.value = ''
        return
      }

      // Obter nomes dos arquivos já existentes para evitar duplicatas
      const existingFileNames = this.nfeInfos.map(item => item.fileName)

      // Processar todos os XMLs
      const processedList = []
      const errors = []
      const skipped = []

      for (const file of files) {
        // Verificar se arquivo já foi adicionado
        if (existingFileNames.includes(file.name)) {
          console.log(`⚠️ ${file.name} já foi adicionado anteriormente`)
          skipped.push(file.name)
          continue
        }

        try {
          console.log(`📄 Processando: ${file.name}`)

          // Ler o arquivo
          const xmlText = await this.readFileAsText(file)

          // Fazer parsing do XML
          const nfeInfo = this.parseNfeXml(xmlText)

          // Adicionar à lista de processados
          processedList.push({
            file: file,
            fileName: file.name,
            nfeInfo: nfeInfo,
          })

          console.log(`✅ ${file.name} processado com sucesso`)
        } catch (error) {
          console.error(`❌ Erro ao processar ${file.name}:`, error)
          errors.push({
            fileName: file.name,
            error: error.message,
          })
        }
      }

      // ADICIONAR aos arquivos existentes (não substituir)
      if (processedList.length > 0) {
        this.xmlFiles.push(...processedList.map(p => p.file))
        this.nfeInfos.push(...processedList)
      }

      // Mostrar resultado
      let message = ''
      if (processedList.length > 0) {
        message = `✅ ${processedList.length} arquivo(s) adicionado(s) com sucesso!`
      }
      if (skipped.length > 0) {
        message += `\n\n⚠️ ${skipped.length} arquivo(s) já existente(s) (ignorado):\n${skipped.join(', ')}`
      }
      if (errors.length > 0) {
        const errorMsg = errors.map(e => `${e.fileName}: ${e.error}`).join('\n')
        message += `\n\n❌ ${errors.length} arquivo(s) com erro:\n${errorMsg}`
      }

      if (message) {
        const type =
          errors.length > 0
            ? 'error'
            : skipped.length > 0
              ? 'warning'
              : 'success'
        this.$emit('notification', message, type)
      }

      console.log(`📊 Total de XMLs na lista: ${this.nfeInfos.length}`)

      // Limpar input
      event.target.value = ''
    },

    clearAllXmlFiles() {
      this.xmlFiles = []
      this.nfeInfos = []
      document.getElementById('xml-upload').value = ''
      this.$emit('notification', '🗑️ Todos os XMLs foram removidos', 'info')
    },

    removeXmlFile(index) {
      const fileName = this.nfeInfos[index].fileName
      this.xmlFiles.splice(index, 1)
      this.nfeInfos.splice(index, 1)
      this.$emit('notification', `🗑️ XML "${fileName}" removido`, 'info')
    },

    // Upload de Documentos Complementares
    async handleDocsUpload(event) {
      const files = Array.from(event.target.files)
      if (files.length === 0) return

      // Validar formatos - APENAS PDF e ZPL
      const validExtensions = ['.pdf', '.zpl']
      const invalidFiles = files.filter(file => {
        const fileName = file.name.toLowerCase()
        return !validExtensions.some(ext => fileName.endsWith(ext))
      })

      if (invalidFiles.length > 0) {
        const invalidNames = invalidFiles.map(f => f.name).join(', ')
        this.$emit(
          'notification',
          `❌ Arquivos inválidos: ${invalidNames}\n\nApenas PDF e ZPL são aceitos.`,
          'error'
        )
        event.target.value = '' // Limpar input
        return
      }

      this.docsFiles = files

      // Converter para base64 no formato {"nomeArquivo": "base64"}
      try {
        this.docsFilesBase64 = {}

        for (const file of files) {
          const base64Data = await this.readFileAsBase64(file)
          this.docsFilesBase64[file.name] = base64Data.data
        }

        console.log(`✅ ${files.length} documento(s) carregado(s) com sucesso`)
        this.$emit(
          'notification',
          `✅ ${files.length} documento(s) carregado(s)`,
          'success'
        )
      } catch (error) {
        console.error('Erro ao converter documentos:', error)
        this.$emit('notification', '❌ Erro ao processar documentos', 'error')
      }
    },

    removeDocsFile(index) {
      const fileName = this.docsFiles[index].name

      // Remover do array de arquivos
      this.docsFiles.splice(index, 1)

      // Remover do objeto base64
      delete this.docsFilesBase64[fileName]

      // Limpar input se não houver mais arquivos
      if (this.docsFiles.length === 0) {
        document.getElementById('docs-upload').value = ''
      }
    },

    // Busca de Agendamentos
    searchSchedules() {
      // Debounce
      clearTimeout(this.searchTimeout)

      if (!this.searchQuery || this.searchQuery.trim().length < 3) {
        this.searchResults = []
        return
      }

      this.searchTimeout = setTimeout(() => {
        this.performSearch()
      }, 500)
    },

    async performSearch() {
      this.searching = true
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('/schedules', {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            search: this.searchQuery,
            limit: 1000, // Buscar um número grande de resultados
            show_all: true, // IMPORTANTE: Incluir todos os status (inclusive 'Em estoque')
          },
        })

        console.log('📋 Resposta da API:', response.data)

        // A API retorna { schedules: [...], ... }
        let schedules = response.data.schedules || response.data || []

        // Verificar se é um array
        if (!Array.isArray(schedules)) {
          console.error('Resposta não é um array:', schedules)
          this.searchResults = []
          return
        }

        console.log(
          `📊 Total de agendamentos retornados da API: ${schedules.length}`
        )

        // Aplicar filtro de cli_access do usuário
        schedules = this.filterSchedulesByCliAccess(schedules)
        console.log(
          `📊 Após filtro cli_access: ${schedules.length} agendamentos`
        )

        // DEBUG: Mostrar TODOS os agendamentos que contêm o número buscado (antes dos filtros de crossdock/status)
        const matchingNumbers = schedules.filter(
          s => s.number && s.number.toString().includes(this.searchQuery)
        )
        console.log(
          `🔍 DIAGNÓSTICO: ${matchingNumbers.length} agendamentos contêm o número "${this.searchQuery}"`
        )
        matchingNumbers.forEach(schedule => {
          console.log(
            `   📋 ID: ${schedule.id} | NF: ${schedule.number} | Crossdock: ${JSON.stringify(schedule.crossdock)} (tipo: ${typeof schedule.crossdock}) | Status: "${schedule.status}" | CNPJ: ${schedule.client}`
          )
        })

        // Filtrar agendamentos que possuem o número da nota buscado E são crossdock E estão em conferência ou em estoque
        this.searchResults = schedules.filter(schedule => {
          const matchesNumber =
            schedule.number &&
            schedule.number.toString().includes(this.searchQuery)
          const isCrossdock =
            schedule.crossdock === 1 || schedule.crossdock === '1'
          const isValidStatus =
            schedule.status === 'Conferência' ||
            schedule.status === 'Em estoque'

          // Logs de diagnóstico detalhados
          if (matchesNumber && !isCrossdock) {
            console.log(
              `❌ REJEITADO: Agendamento #${schedule.id} - NF ${schedule.number} não é crossdock (crossdock=${JSON.stringify(schedule.crossdock)}, tipo: ${typeof schedule.crossdock})`
            )
          }
          if (matchesNumber && isCrossdock && !isValidStatus) {
            console.log(
              `❌ REJEITADO: Agendamento #${schedule.id} - NF ${schedule.number} é crossdock mas não tem status válido (status="${schedule.status}")`
            )
          }
          if (matchesNumber && isCrossdock && isValidStatus) {
            console.log(
              `✅ APROVADO: Agendamento #${schedule.id} - NF ${schedule.number} passou em todos os filtros`
            )
          }

          return matchesNumber && isCrossdock && isValidStatus
        })

        console.log(
          `✅ Resultado final: ${this.searchResults.length} agendamentos (crossdock + conferência/estoque, após todos os filtros)`
        )
      } catch (error) {
        console.error('Erro ao buscar agendamentos:', error)
        this.$emit('notification', '❌ Erro ao buscar agendamentos', 'error')
        this.searchResults = []
      } finally {
        this.searching = false
      }
    },

    // Filtrar agendamentos baseado no cli_access do usuário
    filterSchedulesByCliAccess(schedules) {
      const currentUser = this.getCurrentUser()

      // Se não tem usuário ou é level 0 (Dev), retorna todos
      if (!currentUser || currentUser.level_access === 0) {
        console.log(
          '👤 Usuário nível 0 ou não autenticado - mostrando todos os agendamentos'
        )
        return schedules
      }

      // Se não tem cli_access, retorna todos (acesso total)
      if (!currentUser.cli_access) {
        console.log(
          '👤 Usuário sem cli_access configurado - mostrando todos os agendamentos'
        )
        return schedules
      }

      // Parsear cli_access se for string
      let cliAccess = currentUser.cli_access
      if (typeof cliAccess === 'string' && cliAccess) {
        try {
          cliAccess = JSON.parse(cliAccess)
        } catch (e) {
          console.warn('⚠️ Erro ao parsear cli_access:', e)
          return schedules // Em caso de erro, retorna todos
        }
      }

      // Se cli_access é vazio ou inválido, retorna todos
      if (
        !cliAccess ||
        typeof cliAccess !== 'object' ||
        Object.keys(cliAccess).length === 0
      ) {
        console.log(
          '👤 cli_access vazio ou inválido - mostrando todos os agendamentos'
        )
        return schedules
      }

      // Extrair CNPJs permitidos e normalizar (remover formatação)
      const allowedCNPJs = Object.keys(cliAccess).map(cnpj =>
        cnpj.replace(/[^\d]/g, '')
      )
      console.log('🔐 CNPJs permitidos para o usuário:', allowedCNPJs)

      // Filtrar agendamentos pelos CNPJs permitidos
      const filtered = schedules.filter(schedule => {
        const scheduleCNPJ = (schedule.client || '').replace(/[^\d]/g, '')
        const hasAccess = allowedCNPJs.includes(scheduleCNPJ)

        if (!hasAccess && scheduleCNPJ) {
          console.log(
            `❌ Agendamento #${schedule.id} - CNPJ ${scheduleCNPJ} não permitido`
          )
        }

        return hasAccess
      })

      console.log(
        `🔐 Filtrado: ${schedules.length} → ${filtered.length} agendamentos (baseado em cli_access)`
      )

      return filtered
    },

    getCurrentUser() {
      try {
        const userData = localStorage.getItem('user')
        return userData ? JSON.parse(userData) : null
      } catch (error) {
        console.error('Erro ao obter usuário:', error)
        return null
      }
    },

    // Seleção de Agendamentos
    toggleSchedule(schedule) {
      const index = this.selectedSchedules.findIndex(s => s.id === schedule.id)

      if (index > -1) {
        this.selectedSchedules.splice(index, 1)
      } else {
        this.selectedSchedules.push(schedule)
      }
    },

    isScheduleSelected(scheduleId) {
      return this.selectedSchedules.some(s => s.id === scheduleId)
    },

    removeSchedule(scheduleId) {
      const index = this.selectedSchedules.findIndex(s => s.id === scheduleId)
      if (index > -1) {
        this.selectedSchedules.splice(index, 1)
      }
    },

    // Envio da Requisição
    async submitExchange() {
      if (!this.canSubmit) return

      this.submitting = true

      try {
        const token = localStorage.getItem('token')

        // Preparar dados para envio
        const formData = new FormData()

        // Adicionar todos os arquivos XML
        this.xmlFiles.forEach((file, index) => {
          formData.append(`xml_${index}`, file)
        })

        // Adicionar informações de todas as NFes
        const allNfeInfos = this.nfeInfos.map(item => item.nfeInfo)
        formData.append('nfeInfos', JSON.stringify(allNfeInfos))
        formData.append('xmlCount', this.xmlFiles.length)

        // Adicionar IDs dos agendamentos selecionados
        formData.append(
          'scheduleIds',
          JSON.stringify(this.selectedSchedules.map(s => s.id))
        )

        // Adicionar documentos complementares se houver
        if (Object.keys(this.docsFilesBase64).length > 0) {
          formData.append('docs', JSON.stringify(this.docsFilesBase64))
        }

        // Adicionar observações se houver
        if (this.observacoes.trim()) {
          formData.append('observacoes', this.observacoes.trim())
        }

        const response = await axios.post('/note-exchange', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        })

        this.$emit(
          'notification',
          `✅ ${this.xmlFiles.length} requisição(ões) de troca criada(s) com sucesso`,
          'success'
        )

        // Emitir evento para App.vue navegar e atualizar lista
        this.$emit('pedido-criado')

        // Resetar formulário
        this.resetForm()
      } catch (error) {
        console.error('Erro ao criar requisição de troca:', error)
        const message =
          error.response?.data?.message || 'Erro ao criar requisição de troca'
        this.$emit('notification', `❌ ${message}`, 'error')
      } finally {
        this.submitting = false
      }
    },

    resetForm() {
      this.xmlFiles = []
      this.nfeInfos = []
      this.docsFiles = []
      this.docsFilesBase64 = {}
      this.searchQuery = ''
      this.searchResults = []
      this.selectedSchedules = []
      this.observacoes = ''

      document.getElementById('xml-upload').value = ''
      document.getElementById('docs-upload').value = ''
    },

    // Utilitários
    readFileAsText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => resolve(e.target.result)
        reader.onerror = reject
        reader.readAsText(file)
      })
    },

    readFileAsBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => {
          const base64 = e.target.result.split(',')[1]
          resolve({
            name: file.name,
            type: file.type,
            data: base64,
          })
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    },

    parseNfeXml(xmlText) {
      // Parse simplificado do XML para extrair informações básicas
      try {
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

        // Verificar se há erro de parse
        const parseError = xmlDoc.querySelector('parsererror')
        if (parseError) {
          throw new Error('XML inválido')
        }

        // Extrair informações da NFe
        const nNF = xmlDoc.querySelector('ide nNF')?.textContent || ''
        const emit = xmlDoc.querySelector('emit xNome')?.textContent || ''
        const cnpjEmit = xmlDoc.querySelector('emit CNPJ')?.textContent || ''
        const vNF =
          xmlDoc.querySelector('total ICMSTot vNF')?.textContent || '0'

        if (!nNF) {
          throw new Error('Número da NF não encontrado no XML')
        }

        if (!cnpjEmit) {
          throw new Error('CNPJ do remetente não encontrado no XML')
        }

        return {
          numero: nNF,
          fornecedor: emit || 'Não identificado',
          cnpjRemetente: cnpjEmit,
          valorTotal: parseFloat(vNF) || 0,
        }
      } catch (error) {
        throw new Error('Erro ao processar XML: ' + error.message)
      }
    },

    formatCurrency(value) {
      if (!value) return 'R$ 0,00'
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value)
    },

    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('pt-BR')
    },

    // Métodos do Modal de Seleção de Agendamentos
    async openScheduleModal() {
      // Verificar se há XMLs carregados
      if (!this.nfeInfos || this.nfeInfos.length === 0) {
        this.$emit(
          'notification',
          '⚠️ Faça upload do XML da NFe primeiro',
          'warning'
        )
        return
      }

      // Usar o CNPJ do primeiro XML como referência
      const firstNfeInfo = this.nfeInfos[0].nfeInfo
      if (!firstNfeInfo || !firstNfeInfo.cnpjRemetente) {
        this.$emit(
          'notification',
          '⚠️ XML não possui CNPJ do remetente',
          'error'
        )
        return
      }

      this.showScheduleModal = true
      this.modalSearchQuery = ''
      this.tempSelectedSchedules = [...this.selectedSchedules] // Copia seleções atuais

      await this.loadSchedulesByCNPJ()
    },

    async loadSchedulesByCNPJ(searchNumber) {
      try {
        this.modalLoading = true
        const token = localStorage.getItem('token')

        if (!token) {
          this.$emit(
            'notification',
            '❌ Sessão expirada. Faça login novamente.',
            'error'
          )
          return
        }

        const firstNfeInfo = this.nfeInfos[0].nfeInfo
        const cnpj = firstNfeInfo.cnpjRemetente.replace(/[^\d]/g, '')

        const params = { cnpj }
        if (searchNumber && searchNumber.trim().length >= 1) {
          params.number = searchNumber.trim()
        }

        const response = await axios.get('/schedules/by-cnpj', {
          headers: { Authorization: `Bearer ${token}` },
          params,
        })

        const schedules = response.data?.schedules || []

        this.modalSchedules = schedules

        if (schedules.length === 0 && !searchNumber) {
          this.$emit(
            'notification',
            '⚠️ Nenhum agendamento encontrado para este CNPJ',
            'warning'
          )
        }
      } catch (error) {
        console.error('Erro ao buscar agendamentos:', error)
        this.$emit(
          'notification',
          '❌ Erro ao buscar agendamentos: ' + error.message,
          'error'
        )
        this.modalSchedules = []
      } finally {
        this.modalLoading = false
      }
    },

    closeScheduleModal() {
      this.showScheduleModal = false
      this.modalSchedules = []
      this.modalSearchQuery = ''
      this.tempSelectedSchedules = []
    },

    confirmScheduleSelection() {
      this.selectedSchedules = [...this.tempSelectedSchedules]
      this.closeScheduleModal()
      this.$emit(
        'notification',
        `✅ ${this.selectedSchedules.length} agendamento(s) selecionado(s)`,
        'success'
      )
    },

    toggleScheduleInModal(schedule) {
      const index = this.tempSelectedSchedules.findIndex(
        s => s.id === schedule.id
      )

      if (index > -1) {
        this.tempSelectedSchedules.splice(index, 1)
      } else {
        this.tempSelectedSchedules.push(schedule)
      }
    },

    isScheduleSelectedInModal(scheduleId) {
      return this.tempSelectedSchedules.some(s => s.id === scheduleId)
    },

    removeSelectedSchedule(scheduleId) {
      const index = this.selectedSchedules.findIndex(s => s.id === scheduleId)
      if (index > -1) {
        this.selectedSchedules.splice(index, 1)
      }
    },
  },
}
</script>

<style scoped>
.note-exchange-page {
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #1c44f5;
  font-size: 2rem;
  margin-bottom: 10px;
}

.page-description {
  color: #666;
  margin-bottom: 30px;
  font-size: 1rem;
}

.exchange-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.section {
  background: #fff;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section h2 {
  color: #333;
  font-size: 1.3rem;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}

.section h3 {
  color: #555;
  font-size: 1.1rem;
  margin-bottom: 15px;
}

/* Upload Box */
.upload-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-label {
  cursor: pointer;
  display: block;
}

.upload-box {
  border: 2px dashed #ddd;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  transition: all 0.3s;
  background: #fafafa;
  position: relative;
}

.upload-box:hover {
  border-color: #1c44f5;
  background: #f5f7ff;
}

.upload-box.active {
  border-color: #1c44f5;
  background: #f5f7ff;
}

.upload-box input[type='file'] {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 15px;
}

.upload-text {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 5px;
  font-weight: 500;
}

.upload-hint {
  font-size: 0.9rem;
  color: #999;
}

.file-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
}

.file-name {
  font-size: 1rem;
  color: #1c44f5;
  font-weight: 500;
}

.btn-clear {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: #dc2626;
  transform: scale(1.1);
}

/* Upload Actions Compact (após selecionar arquivos) */
.upload-actions-compact {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
}

.btn-select-files {
  background: linear-gradient(135deg, #1c44f5, #0077ff);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(28, 68, 245, 0.3);
}

.btn-select-files:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(28, 68, 245, 0.4);
  background: linear-gradient(135deg, #0d37d9, #0066e6);
}

.btn-clear-compact {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
}

.btn-clear-compact:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(239, 68, 68, 0.4);
  background: #dc2626;
}

/* XMLs Table Container */
.xmls-table-container {
  margin-top: 20px;
}

.xmls-header {
  margin-bottom: 15px;
}

.xmls-header h3 {
  font-size: 1.1rem;
  color: #1e293b;
  font-weight: 600;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.xmls-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  font-size: 0.95rem;
}

.xmls-table thead {
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
}

.xmls-table thead tr th {
  color: #fff;
  font-weight: 600;
  text-align: left;
  padding: 16px 20px;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #1e3a8a;
}

.xmls-table tbody tr {
  border-bottom: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.xmls-table tbody tr:hover {
  background: #f8fafc;
}

.xmls-table tbody tr:last-child {
  border-bottom: none;
}

.xmls-table tbody td {
  padding: 14px 20px;
  color: #334155;
}

.nfe-number {
  font-weight: 600;
  color: #1e40af;
  font-size: 1rem;
}

.nfe-supplier {
  color: #475569;
  font-weight: 500;
}

.nfe-value {
  font-weight: 700;
  color: #0ea5e9;
  font-size: 1.05rem;
}

.action-column {
  width: 60px;
  text-align: center;
}

.btn-remove-row {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-remove-row:hover {
  background: #dc2626;
  transform: scale(1.05);
}

/* NFe Info Card (Legacy - manter para compatibilidade) */
.nfe-info-card {
  background: linear-gradient(135deg, #f5f7ff 0%, #e8eeff 100%);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #d0d9ff;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-item label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.info-value {
  font-size: 1.1rem;
  color: #1c44f5;
  font-weight: 600;
}

/* Files List */
.files-selected {
  width: 100%;
}

.files-count {
  font-size: 1rem;
  color: #1c44f5;
  font-weight: 500;
  margin-bottom: 10px;
}

.upload-box-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.file-name-small {
  font-size: 0.9rem;
  color: #333;
  flex: 1;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.btn-remove-small {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-remove-small:hover {
  background: #dc2626;
}

/* Search Section */
.search-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-input-container {
  position: relative;
  width: 100%;
}

.search-input {
  width: 100%;
  padding: 15px 45px 15px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #1c44f5;
  box-shadow: 0 0 0 3px rgba(28, 68, 245, 0.1);
}

.search-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 1.2rem;
}

.search-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 30px;
  color: #666;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #1c44f5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Results List */
.search-results {
  margin-top: 10px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
}

.result-item {
  background: #fafafa;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  padding: 15px;
  transition: all 0.3s;
}

.result-item:hover {
  background: #f5f7ff;
  border-color: #1c44f5;
}

.result-item.selected {
  background: #e8f0fe;
  border-color: #1c44f5;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  width: 100%;
}

.checkbox-label input[type='checkbox'] {
  display: none;
}

.checkbox-custom {
  width: 24px;
  height: 24px;
  border: 2px solid #ddd;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
  position: relative;
}

.checkbox-label input[type='checkbox']:checked + .checkbox-custom {
  background: #1c44f5;
  border-color: #1c44f5;
}

.checkbox-label input[type='checkbox']:checked + .checkbox-custom::after {
  content: '✓';
  color: #fff;
  font-size: 1rem;
  font-weight: bold;
}

.schedule-info {
  flex: 1;
}

.schedule-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 8px;
}

.schedule-id {
  font-weight: 600;
  color: #1c44f5;
  font-size: 1rem;
}

.schedule-number {
  font-weight: 500;
  color: #333;
  font-size: 0.95rem;
}

.schedule-details {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 0.9rem;
  color: #666;
}

.schedule-client {
  flex: 1;
}

.schedule-date {
  color: #999;
}

.no-results {
  text-align: center;
  padding: 40px;
  color: #999;
}

.no-results i {
  font-size: 3rem;
  margin-bottom: 15px;
  opacity: 0.3;
}

/* Selected Schedules */
.selected-schedules {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 2px solid #f0f0f0;
}

.selected-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
}

.selected-item {
  background: #e8f0fe;
  border: 1px solid #1c44f5;
  border-radius: 10px;
  padding: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.btn-remove {
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-remove:hover {
  background: #dc2626;
  transform: scale(1.1);
}

/* Action Section */
.action-section {
  display: flex;
  justify-content: flex-end;
  padding: 20px 25px;
}

.btn-submit {
  background: linear-gradient(135deg, #1c44f5, #0077ff);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 15px 40px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(28, 68, 245, 0.3);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(28, 68, 245, 0.4);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

/* Selection Section */
.selection-section {
  padding: 20px 0;
}

.btn-select-schedules {
  background: linear-gradient(135deg, #1c44f5, #0077ff);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 15px 30px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(28, 68, 245, 0.3);
}

.btn-select-schedules:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(28, 68, 245, 0.4);
}

.btn-select-schedules:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.hint-text {
  margin-top: 10px;
  color: #6b7280;
  font-size: 0.9rem;
  font-style: italic;
}

.selected-schedules-display {
  margin-top: 25px;
}

.selected-schedules-display h3 {
  font-size: 1.1rem;
  color: #1f2937;
  margin-bottom: 15px;
}

/* Modal Overlay */
.schedule-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Modal Container */
.schedule-modal {
  background: #fff;
  border-radius: 16px;
  width: 95vw;
  height: 95vh;
  max-width: 95vw;
  max-height: 95vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Modal Header */
.modal-header {
  padding: 25px 70px 25px 30px; /* Adicionado padding-right para dar espaço ao botão de fechar */
  border-bottom: 2px solid #e5e7eb;
  background: linear-gradient(135deg, #f9fafb, #ffffff);
  position: relative;
  display: flex;
  flex-direction: column; /* Garante que h2 e subtitle fiquem em coluna */
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #1f2937;
}

.modal-subtitle {
  margin: 8px 0 0 0; /* Aumentado margem superior de 5px para 8px */
  font-size: 0.95rem;
  color: #6b7280;
  font-style: italic; /* Adicionado itálico conforme solicitado */
  display: block; /* Garante que ocupe toda a largura disponível */
  width: 100%; /* Ocupa toda a largura (menos o padding-right) */
}

.btn-close-modal {
  position: absolute;
  top: 25px;
  right: 30px;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #6b7280;
  font-size: 1.2rem;
}

.btn-close-modal:hover {
  background: #e5e7eb;
  color: #1f2937;
}

/* Modal Search */
.modal-search {
  padding: 20px 30px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
}

.search-input-wrapper {
  position: relative;
  margin-bottom: 15px;
}

.search-icon-modal {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 1rem;
}

.modal-search-input {
  width: 100%;
  padding: 12px 15px 12px 45px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.2s;
}

.modal-search-input:focus {
  outline: none;
  border-color: #1c44f5;
  box-shadow: 0 0 0 3px rgba(28, 68, 245, 0.1);
}

/* Modal Content */
.modal-content {
  flex: 1 !important;
  overflow: hidden !important;
  padding: 20px 30px !important;
  display: flex !important;
  flex-direction: column !important;
  min-height: 0 !important;
  min-width: 100% !important;
}

.modal-loading {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 15px !important;
  color: #6b7280 !important;
}

.modal-empty {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 15px !important;
  color: #9ca3af !important;
}

.modal-empty i {
  font-size: 3rem !important;
}

/* Modal Schedules List */
.modal-schedules-list {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 12px !important;
  overflow-y: auto !important;
  min-height: 0 !important;
  padding-bottom: 10px !important;
}

.modal-schedule-item {
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 15px;
  transition: all 0.2s;
  cursor: pointer;
  flex-shrink: 0 !important;
}

.modal-schedule-item:hover {
  border-color: #1c44f5;
  box-shadow: 0 4px 12px rgba(28, 68, 245, 0.1);
}

.modal-schedule-item.selected {
  background: #eff6ff;
  border-color: #1c44f5;
}

.modal-checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  width: 100%;
}

.modal-checkbox-label input[type='checkbox'] {
  display: none;
}

.modal-checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 5px;
  flex-shrink: 0;
  position: relative;
  transition: all 0.2s;
  margin-top: 2px;
}

.modal-checkbox-label input[type='checkbox']:checked + .modal-checkbox-custom {
  background: #1c44f5;
  border-color: #1c44f5;
}

.modal-checkbox-label
  input[type='checkbox']:checked
  + .modal-checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 14px;
  font-weight: bold;
}

.modal-schedule-info {
  flex: 1;
}

.modal-schedule-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.modal-schedule-id {
  font-weight: 700;
  color: #1f2937;
  font-size: 0.95rem;
}

.modal-schedule-number {
  color: #1c44f5;
  font-weight: 600;
  font-size: 0.95rem;
}

.modal-schedule-status {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modal-schedule-status.status-conferência {
  background: #fef3c7;
  color: #92400e;
}

.modal-schedule-status.status-em-estoque {
  background: #d1fae5;
  color: #065f46;
}

.modal-schedule-status.status-integrado {
  background: #dbeafe;
  color: #1e40af;
}

.modal-schedule-details {
  display: flex;
  gap: 15px;
  color: #6b7280;
  font-size: 0.9rem;
  flex-wrap: wrap;
}

.modal-schedule-client {
  font-weight: 500;
}

/* Modal Footer */
.modal-footer {
  padding: 20px 30px;
  border-top: 2px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

.btn-cancel {
  background: #fff;
  color: #6b7280;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px 30px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #1f2937;
}

.btn-confirm {
  background: linear-gradient(135deg, #1c44f5, #0077ff);
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 12px 30px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(28, 68, 245, 0.3);
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(28, 68, 245, 0.4);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

/* Responsive */
@media (max-width: 768px) {
  .note-exchange-page {
    padding: 20px 15px;
  }

  h1 {
    font-size: 1.5rem;
  }

  .section {
    padding: 20px 15px;
  }

  .upload-box {
    padding: 30px 20px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .schedule-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .schedule-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .btn-submit {
    width: 100%;
  }

  /* Upload Actions Compact Responsive */
  .upload-actions-compact {
    flex-direction: column;
    gap: 10px;
  }

  .btn-select-files,
  .btn-clear-compact {
    width: 100%;
    justify-content: center;
    padding: 10px 20px;
    font-size: 0.9rem;
  }

  /* XMLs Table Responsive */
  .xmls-table thead tr th {
    padding: 12px 10px;
    font-size: 0.8rem;
  }

  .xmls-table tbody td {
    padding: 10px;
    font-size: 0.85rem;
  }

  .nfe-number {
    font-size: 0.9rem;
  }

  .nfe-value {
    font-size: 0.95rem;
  }

  .action-column {
    width: 50px;
  }

  .btn-remove-row {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }

  /* Modal Responsive */
  .schedule-modal {
    width: 98vw;
    height: 98vh;
  }

  .modal-header,
  .modal-search,
  .modal-content,
  .modal-footer {
    padding: 15px 20px;
  }

  .modal-header h2 {
    font-size: 1.2rem;
  }

  .btn-close-modal {
    top: 15px;
    right: 20px;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-confirm {
    width: 100%;
  }
}

/* Seção de Observações */
.observacoes-section {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.observacoes-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
  font-size: 14px;
}

.observacoes-label i {
  color: #3b82f6;
  font-size: 16px;
}

.textarea-observacoes {
  width: 100%;
  padding: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  transition: all 0.2s;
  background: white;
}

.textarea-observacoes:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.textarea-observacoes::placeholder {
  color: #94a3b8;
}

.char-counter {
  display: block;
  text-align: right;
  color: #64748b;
  font-size: 12px;
  margin-top: 6px;
  font-weight: 500;
}
</style>
