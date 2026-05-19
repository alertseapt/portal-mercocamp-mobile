<template>
  <div class="nfe-search-bar">
    <div class="search-container">
      <div class="search-input-group">
        <i class="fas fa-search search-icon"></i>
        <input
          type="text"
          v-model="searchInput"
          @keyup.enter="handleSearch"
          :disabled="loading"
          placeholder="Digite o número da NF-e, código da carga ou chave de acesso (44 dígitos)"
          class="search-input"
          autocomplete="off"
          name="nfe-searchbar-input"
        />
        <button
          @click="handleSearch"
          :disabled="loading || !searchInput.trim()"
          class="search-button"
        >
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-search"></i>
          Buscar
        </button>
      </div>

      <!-- Filter Inputs -->
      <div class="filter-row">
        <div class="filter-group">
          <label for="status">Status:</label>
          <select
            id="status"
            v-model="localFilters.status"
            @change="handleFilterChange"
            class="form-control"
          >
            <option value="">Todos</option>
            <option
              v-for="option in statusOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="date-from">Data de:</label>
          <input
            id="date-from"
            type="date"
            v-model="localFilters.date_from"
            @change="handleFilterChange"
            @keydown="preventDateInput"
            @selectstart.prevent
            @mousedown.prevent="handleDateInputClick"
            @focus.prevent="handleDateInputFocus"
            @paste.prevent
            class="form-control date-input-readonly"
          />
        </div>

        <div class="filter-group">
          <label for="date-to">Data até:</label>
          <input
            id="date-to"
            type="date"
            v-model="localFilters.date_to"
            @change="handleFilterChange"
            @keydown="preventDateInput"
            @selectstart.prevent
            @mousedown.prevent="handleDateInputClick"
            @focus.prevent="handleDateInputFocus"
            @paste.prevent
            class="form-control date-input-readonly"
          />
        </div>

        <div
          v-if="shouldShowClientFilter"
          v-show="shouldShowClientFilter"
          class="filter-group"
        >
          <label for="client-filter">Cliente:</label>
          <button
            id="client-filter"
            class="btn btn-outline-primary client-filter-btn"
            @click="openClientFilterModal"
            :class="{
              'btn-primary': selectedFilterClient,
              'btn-outline-primary': !selectedFilterClient,
            }"
          >
            <div class="client-filter-content">
              <i class="fas fa-warehouse"></i>
              <span class="client-filter-text">{{
                selectedFilterClient
                  ? selectedFilterClient.name
                  : 'Selecionar Cliente'
              }}</span>
              <i
                v-if="selectedFilterClient"
                class="fas fa-times ml-2"
                @click.stop="clearClientFilter"
              ></i>
            </div>
          </button>
        </div>

        <div class="filter-group filter-actions-buttons">
          <button
            v-if="hasActiveFilters"
            class="btn btn-sm btn-outline-danger"
            @click="resetFilters"
            title="Limpar filtros"
          >
            <i class="fas fa-times"></i>
            Limpar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de filtro por cliente -->
    <div
      v-if="showClientFilterModal"
      class="modal-overlay"
      @click="closeClientFilterModal"
    >
      <div class="modal-content estoque-selection-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-warehouse"></i>
            Filtrar por Cliente
          </h3>
          <button class="modal-close-btn" @click="closeClientFilterModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- Search input -->
          <div v-if="!loadingFilterClients" class="search-container">
            <div class="search-input-wrapper">
              <i class="fas fa-search search-icon"></i>
              <input
                type="text"
                v-model="clientFilterSearchQuery"
                placeholder="Pesquisar por nome, CNPJ ou número Corpem..."
                class="search-input"
                @input="filterFilterClients"
                autocomplete="off"
                data-lpignore="true"
                data-form-type="other"
                name="nfe-searchbar-client-filter"
              />
              <button
                v-if="clientFilterSearchQuery"
                @click="clearFilterSearch"
                class="clear-search-btn"
                title="Limpar pesquisa"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="search-results-info" v-if="clientFilterSearchQuery">
              <span
                >{{ filteredFilterClients.length }} de
                {{ availableFilterClients.length }} clientes encontrados</span
              >
            </div>
          </div>

          <!-- Loading state for clients -->
          <div v-if="loadingFilterClients" class="loading-clients-container">
            <div class="loading-spinner">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
            <p class="loading-text">Carregando clientes...</p>
            <small class="loading-subtext"
              >Processando lista de clientes disponíveis</small
            >
          </div>

          <!-- Clients list -->
          <div v-else class="estoque-lista-vertical">
            <div
              v-for="client in filteredFilterClients"
              :key="client.cnpj"
              class="estoque-lista-item clickable-item"
              @click="selectFilterClient(client)"
            >
              <div class="estoque-lista-info">
                <span class="estoque-nome">{{ client.name }}</span>
                <span class="estoque-cnpj"
                  >CNPJ: {{ formatCNPJ(client.cnpj) }}</span
                >
                <span v-if="client.corpem_code" class="estoque-numero"
                  >Corpem: {{ client.corpem_code }}</span
                >
              </div>
              <div class="estoque-lista-arrow">
                <i class="fas fa-chevron-right"></i>
              </div>
            </div>
            <div
              v-if="availableFilterClients.length === 0"
              class="text-muted estoque-lista-vazia"
            >
              <i class="fas fa-info-circle"></i>
              Nenhum cliente disponível para filtro.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import apiService from '../services/api.js'

export default {
  name: 'NfeSearchBar',

  props: {
    showHelp: {
      type: Boolean,
      default: true,
    },
    filters: {
      type: Object,
      default: () => ({}),
    },
    statusOptions: {
      type: Array,
      default: () => [],
    },
  },

  emits: [
    'search-results',
    'search-error',
    'search-start',
    'filters-changed',
    'reset-filters',
    'client-filter-changed',
  ],

  data() {
    return {
      searchInput: '',
      loading: false,
      searchHelp: this.showHelp,
      localFilters: {
        status: '',
        date_from: '',
        date_to: '',
        ...this.filters,
      },

      // Filtro de cliente
      showClientFilterModal: false,
      selectedFilterClient: null,
      availableFilterClients: [],
      filteredFilterClients: [],
      loadingFilterClients: false,
      clientFilterSearchQuery: '',
    }
  },

  watch: {
    filters: {
      handler(newFilters) {
        this.localFilters = { ...this.localFilters, ...newFilters }
      },
      deep: true,
    },
  },

  computed: {
    hasActiveFilters() {
      return Object.values(this.localFilters).some(
        value => value && value.toString().trim() !== ''
      )
    },

    shouldShowClientFilter() {
      try {
        const currentUser = this.getCurrentUser()

        console.log(
          '🔍 [NfeSearchBar shouldShowClientFilter] Verificando visibilidade do filtro:',
          {
            hasUser: !!currentUser,
            level_access: currentUser?.level_access,
            hasCliAccess: !!currentUser?.cli_access,
            cliAccessType: typeof currentUser?.cli_access,
          }
        )

        // Usuários nível 0 sempre veem o filtro (podem ter múltiplos estoques)
        if (currentUser && currentUser.level_access === 0) {
          console.log(
            '✅ [NfeSearchBar shouldShowClientFilter] Usuário nível 0 - mostrando filtro'
          )
          return true
        }

        // Se não tem usuário, não mostrar
        if (!currentUser) {
          console.log(
            '❌ [NfeSearchBar shouldShowClientFilter] Sem usuário - ocultando filtro'
          )
          return false
        }

        // Verificar quantos estoques o usuário tem acesso
        if (
          !currentUser.cli_access ||
          currentUser.cli_access === '' ||
          currentUser.cli_access === '{}' ||
          currentUser.cli_access === null ||
          currentUser.cli_access === undefined
        ) {
          // Sem cli_access significa acesso total, então pode ter múltiplos estoques
          console.log(
            '✅ [NfeSearchBar shouldShowClientFilter] Sem cli_access ou vazio - mostrando filtro (acesso total)'
          )
          return true
        }

        let cliAccess = currentUser.cli_access

        // Se for string, verificar se está vazio antes de parsear
        if (typeof cliAccess === 'string') {
          const trimmed = cliAccess.trim()
          if (
            !trimmed ||
            trimmed === '{}' ||
            trimmed === 'null' ||
            trimmed === 'undefined'
          ) {
            console.log(
              '✅ [NfeSearchBar shouldShowClientFilter] cli_access é string vazia/inválida - mostrando filtro'
            )
            return true
          }
          try {
            cliAccess = JSON.parse(trimmed)
            console.log(
              '📦 [NfeSearchBar shouldShowClientFilter] cli_access parseado:',
              cliAccess
            )
          } catch (e) {
            console.warn(
              '⚠️ [NfeSearchBar shouldShowClientFilter] Erro ao parsear cli_access:',
              e,
              'Valor:',
              cliAccess
            )
            return true // Em caso de erro, mostrar o filtro por segurança
          }
        }

        // Se cli_access está vazio ou inválido, mostrar filtro
        if (
          !cliAccess ||
          typeof cliAccess !== 'object' ||
          Object.keys(cliAccess).length === 0
        ) {
          console.log(
            '✅ [NfeSearchBar shouldShowClientFilter] cli_access vazio/inválido após parse - mostrando filtro'
          )
          return true
        }

        // Se tem apenas 1 estoque no cli_access, ocultar o filtro
        const estoquesCount = Object.keys(cliAccess).length
        console.log(
          `🔢 [NfeSearchBar shouldShowClientFilter] Estoque(s) no cli_access: ${estoquesCount}`,
          Object.keys(cliAccess)
        )
        const shouldShow = estoquesCount > 1
        console.log(
          `${shouldShow ? '✅' : '❌'} [NfeSearchBar shouldShowClientFilter] ${shouldShow ? 'Mostrando' : 'Ocultando'} filtro (${estoquesCount} estoque(s))`
        )
        return shouldShow
      } catch (error) {
        console.error(
          '❌ [NfeSearchBar shouldShowClientFilter] Erro ao verificar filtro:',
          error
        )
        return true // Em caso de erro, mostrar o filtro por segurança
      }
    },
  },

  methods: {
    // Prevenir digitação manual em campos de data
    preventDateInput(event) {
      // Permitir teclas de navegação e controle
      const allowedKeys = [
        'Tab',
        'Enter',
        'Escape',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
        'Delete',
        'Backspace',
      ]

      // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if (event.ctrlKey || event.metaKey) {
        return
      }

      // Bloquear todas as outras teclas
      if (!allowedKeys.includes(event.key)) {
        event.preventDefault()
        event.stopPropagation()
        return false
      }
    },

    // Handler para cliques no input de data - abrir calendário apenas no ícone
    handleDateInputClick(event) {
      const input = event.target
      const rect = input.getBoundingClientRect()
      const clickX = event.clientX - rect.left
      const clickY = event.clientY - rect.top

      // Calcular a posição aproximada do ícone do calendário (geralmente à direita)
      // O ícone geralmente está nos últimos ~30px do input
      const iconAreaStart = rect.width - 40

      // Se o clique foi na área do ícone (últimos 40px), permitir o comportamento padrão
      if (clickX >= iconAreaStart) {
        // Permitir o clique no ícone para abrir o calendário
        input.focus()
        // Usar setTimeout para garantir que o calendário abra após o focus
        setTimeout(() => {
          input.showPicker?.()
        }, 10)
        return
      }

      // Se o clique foi na área de texto, prevenir o comportamento padrão
      event.preventDefault()
      event.stopPropagation()

      // Tentar abrir o calendário programaticamente
      setTimeout(() => {
        input.showPicker?.()
      }, 10)
    },

    // Handler para prevenir foco no texto do input
    handleDateInputFocus(event) {
      const input = event.target
      // Abrir o calendário automaticamente quando o input recebe foco
      setTimeout(() => {
        input.showPicker?.()
      }, 10)
    },

    async handleSearch() {
      // Remover espaços do input conforme solicitado
      const input = this.searchInput.replace(/\s/g, '').trim()

      if (!input) {
        return
      }

      this.loading = true
      this.$emit('search-start')

      try {
        console.log('🔍 Iniciando busca por NFe/chave/código carga:', input)

        const response = await apiService.post(
          '/schedule-verification/search',
          {
            input: input,
          }
        )

        console.log('✅ Resultados da busca:', response)

        if (response && response.success) {
          this.$emit('search-results', {
            results: response.results,
            searchType: response.searchType,
            searchValue: response.searchValue,
          })

          // Limpar campo após busca bem-sucedida
          this.searchInput = ''
        } else {
          const errorMsg = response?.message || 'Erro na busca'
          this.$emit('search-error', errorMsg)
        }
      } catch (error) {
        console.error('❌ Erro na busca por NFe/chave/código carga:', error)

        let errorMessage = 'Erro ao buscar agendamento'
        if (error.response?.error) {
          errorMessage = error.response.error
        } else if (error.message) {
          errorMessage = error.message
        }

        this.$emit('search-error', errorMessage)
      } finally {
        this.loading = false
      }
    },

    resetFilters() {
      this.localFilters = {
        status: '',
        client: '',
        date_from: '',
        date_to: '',
      }
      this.selectedFilterClient = null
      this.$emit('reset-filters')
    },

    handleFilterChange() {
      this.$emit('filters-changed', { ...this.localFilters })
    },

    // Métodos para filtro de cliente
    async openClientFilterModal() {
      this.showClientFilterModal = true
      await this.loadFilterClients()
    },

    closeClientFilterModal() {
      this.showClientFilterModal = false
      this.clearFilterSearch()
    },

    async loadFilterClients() {
      this.loadingFilterClients = true
      try {
        console.log('🏢 Carregando clientes para filtro...')

        // Primeiro tentar usar cache global se disponível
        if (window.globalClientsCache && window.globalClientsCache.clients) {
          console.log('✅ Usando cache global de clientes')
          this.availableFilterClients = window.globalClientsCache.clients
          this.filteredFilterClients = [...this.availableFilterClients]
          console.log(
            `✅ ${this.availableFilterClients.length} clientes carregados do cache`
          )
          return
        }

        // Se não há cache, carregar da API
        console.log('🔄 Carregando clientes da API...')

        const apiClient = window.apiClient
        const response = await Promise.race([
          apiClient.request('/clients', {
            method: 'GET',
          }),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Timeout ao carregar clientes')),
              20000
            )
          ),
        ])

        let allClients = response.data || []
        allClients = allClients.filter(client => client.cnpj)

        const userData = localStorage.getItem('user')
        if (!userData) {
          console.warn('❌ Dados do usuário não encontrados')
          this.availableFilterClients = []
          this.filteredFilterClients = []
          return
        }

        const currentUser = JSON.parse(userData)

        // Filtrar clientes apenas se o usuário não é nível 0 E tem cli_access configurado
        if (currentUser && currentUser.level_access !== 0) {
          if (currentUser.cli_access) {
            let cliAccess = currentUser.cli_access

            // Tratar cli_access se estiver como string
            if (typeof cliAccess === 'string' && cliAccess) {
              try {
                cliAccess = JSON.parse(cliAccess)
              } catch (e) {
                console.warn('Erro ao parsear cli_access:', e)
                cliAccess = null
              }
            }

            // Se tem cli_access válido com chaves, filtrar pelos clientes permitidos
            if (
              cliAccess &&
              typeof cliAccess === 'object' &&
              Object.keys(cliAccess).length > 0
            ) {
              const allowedCNPJs = Object.keys(cliAccess).map(cnpj =>
                cnpj.replace(/[^\d]/g, '')
              )
              allClients = allClients.filter(client => {
                const clientCnpj = (client.cnpj || '').replace(/[^\d]/g, '')
                return allowedCNPJs.includes(clientCnpj)
              })
            }
            // Se cli_access está vazio ou inválido, não filtrar (acesso total)
          }
          // Se não tem cli_access, não filtrar (acesso total)
        }
        // Se level_access === 0, mantém todos os clientes (acesso total)

        this.availableFilterClients = allClients
        this.filteredFilterClients = [...this.availableFilterClients]
        console.log(`✅ ${allClients.length} clientes carregados para filtro`)

        // Salvar no cache global para reutilização
        window.globalClientsCache = {
          clients: allClients,
          loadedAt: Date.now(),
        }
      } catch (error) {
        console.error('❌ Erro ao carregar clientes para filtro:', error)

        if (error.message === 'Timeout ao carregar clientes') {
          console.warn('⏱️ Timeout no carregamento de clientes')
        }

        this.availableFilterClients = []
        this.filteredFilterClients = []
      } finally {
        this.loadingFilterClients = false
      }
    },

    selectFilterClient(client) {
      console.log('🎯 Cliente selecionado para filtro:', client.name)
      this.selectedFilterClient = client
      this.closeClientFilterModal()

      // Emitir evento para o componente pai
      this.$emit('client-filter-changed', client)
    },

    clearClientFilter() {
      console.log('🧹 Limpando filtro de cliente')
      this.selectedFilterClient = null
      this.$emit('client-filter-changed', null)
    },

    // Funções de pesquisa para filtro de cliente
    filterFilterClients() {
      if (!this.clientFilterSearchQuery.trim()) {
        this.filteredFilterClients = [...this.availableFilterClients]
        return
      }

      const searchTerm = this.clientFilterSearchQuery.toLowerCase().trim()

      this.filteredFilterClients = this.availableFilterClients.filter(
        client => {
          // Pesquisa por nome
          const nameMatch =
            client.name && client.name.toLowerCase().includes(searchTerm)

          // Pesquisa por CNPJ (com ou sem formatação)
          const cnpjMatch =
            client.cnpj &&
            (client.cnpj.includes(searchTerm) ||
              this.formatCNPJ(client.cnpj).includes(searchTerm))

          // Pesquisa por número Corpem
          const corpemMatch =
            client.corpem_code &&
            client.corpem_code.toString().includes(searchTerm)

          return nameMatch || cnpjMatch || corpemMatch
        }
      )

      console.log(
        `🔍 Pesquisa filtro por "${searchTerm}": ${this.filteredFilterClients.length} resultado(s)`
      )
    },

    clearFilterSearch() {
      this.clientFilterSearchQuery = ''
      this.filteredFilterClients = [...this.availableFilterClients]
    },

    getCurrentUser() {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return null

        const user = JSON.parse(userData)
        // Parse cli_access se for string
        if (user.cli_access && typeof user.cli_access === 'string') {
          try {
            user.cli_access = JSON.parse(user.cli_access)
          } catch (e) {
            console.warn(
              '⚠️ [NfeSearchBar getCurrentUser] Erro ao parsear cli_access:',
              e
            )
          }
        }
        return user
      } catch (error) {
        console.error(
          '❌ [NfeSearchBar getCurrentUser] Erro ao obter usuário:',
          error
        )
        return null
      }
    },

    formatCNPJ(cnpj) {
      if (!cnpj) return ''
      return cnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      )
    },
  },
}
</script>

<style scoped>
.nfe-search-bar {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-container {
  max-width: 800px;
  margin: 0 auto;
}

.search-input-group {
  display: flex;
  align-items: center;
  position: relative;
  margin-bottom: 0.5rem;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #6c757d;
  z-index: 2;
}

.search-input {
  flex: 1;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px 0 0 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
}

.search-input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.search-button {
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  border: 2px solid #007bff;
  border-left: none;
  border-radius: 0 6px 6px 0;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.search-button:hover:not(:disabled) {
  background: #0056b3;
  border-color: #0056b3;
}

.search-button:disabled {
  background: #6c757d;
  border-color: #6c757d;
  cursor: not-allowed;
}

.search-help {
  text-align: center;
  margin-top: 0.5rem;
}

.search-help .text-muted {
  color: #6c757d !important;
}

/* Filter Styles */
.filter-row {
  display: flex;
  gap: 1rem;
  align-items: end;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  margin-top: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 120px;
  flex: 1;
  max-width: 200px;
}

.filter-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #555;
  margin-bottom: 0.3rem;
}

.filter-group .form-control {
  padding: 0.3rem 0.5rem;
  font-size: 0.85rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  height: 32px;
}

.filter-group .form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.filter-actions-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: end;
  min-width: auto;
  flex: 0 0 auto;
}

.filter-actions-buttons .btn {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  height: 32px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Responsivo */
@media (max-width: 1200px) {
  .filter-row {
    flex-wrap: wrap;
  }

  .filter-group {
    min-width: 120px;
    flex: 1 1 auto;
  }
}

@media (max-width: 768px) {
  .search-input-group {
    flex-direction: column;
  }

  .search-input {
    border-radius: 6px;
    border-right: 2px solid #e0e0e0;
    margin-bottom: 0.5rem;
  }

  .search-button {
    border-radius: 6px;
    border: 2px solid #007bff;
    width: 100%;
    justify-content: center;
  }

  .filter-row {
    flex-direction: column;
    width: 100%;
  }

  .filter-group {
    min-width: 100%;
    flex: 1;
  }

  .filter-actions-buttons {
    flex-direction: row;
    justify-content: center;
    min-width: 100%;
  }
}

/* Estilos para filtro de cliente */
.client-filter-btn {
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  min-width: 0;
}

.client-filter-content {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  gap: 0.25rem;
}

.client-filter-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.client-filter-btn:hover {
  border-color: #007bff;
  color: #007bff;
}

.client-filter-btn.btn-primary {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}

.client-filter-btn.btn-primary:hover {
  background-color: #0056b3;
  border-color: #0056b3;
}

.client-filter-btn .fas.fa-times {
  margin-left: 0.25rem;
  padding: 0.1rem;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.client-filter-btn .fas.fa-times:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

/* Modal de cliente - usando exatamente os mesmos estilos do App.vue */
.estoque-selection-modal {
  max-height: 95vh !important;
  height: 95vh !important;
  max-width: 800px !important;
  width: 90% !important;
  margin: 2.5vh auto !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

.estoque-selection-modal .modal-body {
  flex: 1 !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
}

.estoque-lista-vertical {
  flex: 1 !important;
  overflow-y: auto !important;
  padding: 1rem !important;
}

.clickable-item {
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  border-radius: 8px !important;
  margin-bottom: 8px !important;
  padding: 16px !important;
  border: 2px solid #e9ecef !important;
  background-color: white !important;
}

.clickable-item:hover {
  border-color: #007bff !important;
  background-color: #f8f9ff !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15) !important;
}

.estoque-lista-item {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
}

.estoque-lista-info {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
}

.estoque-lista-arrow {
  color: #6c757d !important;
  font-size: 16px !important;
  transition: all 0.2s ease !important;
}

.clickable-item:hover .estoque-lista-arrow {
  color: #007bff !important;
  transform: translateX(2px) !important;
}

.estoque-nome {
  font-weight: 600 !important;
  color: #495057 !important;
  font-size: 16px !important;
  margin-bottom: 4px !important;
}

.estoque-cnpj,
.estoque-numero {
  font-size: 14px !important;
  color: #6c757d !important;
}

.loading-clients-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #6c757d;
}

.loading-spinner {
  font-size: 2rem;
  color: #007bff;
  margin-bottom: 1rem;
}

.loading-text {
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #495057;
}

.loading-subtext {
  font-size: 0.9rem;
  color: #6c757d;
}

.search-container {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.search-input-wrapper {
  position: relative;
  margin-bottom: 0.5rem;
}

.search-input-wrapper .search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  z-index: 2;
}

.search-input-wrapper .search-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 2.5rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.search-input-wrapper .search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.search-input-wrapper .clear-search-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.search-input-wrapper .clear-search-btn:hover {
  background-color: #f8f9fa;
  color: #495057;
}

.search-results-info {
  font-size: 0.875rem;
  color: #6c757d;
  text-align: center;
}

.estoque-lista-vazia {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
}

.estoque-lista-vazia i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #dee2e6;
}
/* Estilos para inputs de data - desabilitar seleção de texto */
.filter-group .date-input-readonly {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  cursor: pointer;
  caret-color: transparent;
}

.filter-group .date-input-readonly::selection {
  background: transparent;
}

.filter-group .date-input-readonly::-moz-selection {
  background: transparent;
}
</style>
