<template>
  <div class="admin-page">
    <!-- Conteúdo principal -->
    <div class="admin-content">
      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <div class="loader-spinner"></div>
        <p>
          {{
            activeTab === 'users'
              ? 'Carregando usuários...'
              : 'Carregando clientes...'
          }}
        </p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error-container">
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>{{ error }}</p>
          <button @click="loadUsers" class="retry-btn">
            <i class="fas fa-redo"></i>
            Tentar novamente
          </button>
        </div>
      </div>

      <!-- Aba de usuários -->
      <div v-else-if="activeTab === 'users'" class="users-table-container">
        <div class="table-header">
          <div class="header-left">
            <h2>Lista de Usuários</h2>
            <p class="users-count">
              Total: {{ filteredUsers.length }} usuários
            </p>
          </div>
          <div class="header-actions">
            <button @click="openLevelsModal" class="levels-btn">
              <i class="fas fa-layer-group"></i>
              Níveis de acesso
            </button>
            <button @click="openCreateUserModal" class="create-user-btn">
              <i class="fas fa-user-plus"></i>
              Criar Usuário
            </button>
          </div>
        </div>

        <!-- Campo de pesquisa -->
        <div class="users-search-container">
          <div class="search-input-group">
            <i class="fas fa-search search-icon"></i>
            <input
              type="text"
              v-model="userSearchTerm"
              placeholder="Buscar por Nome ou E-mail..."
              class="search-input"
              autocomplete="off"
              data-lpignore="true"
              data-form-type="other"
              name="user-search"
            />
            <button
              v-if="userSearchTerm"
              @click="userSearchTerm = ''"
              class="clear-search-btn"
              type="button"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="users-table">
            <thead>
              <tr>
                <th
                  @click="sortBy('name')"
                  class="sortable-header"
                  :class="{ sorted: sortColumn === 'name' }"
                >
                  <span class="header-content">
                    Nome
                    <i
                      v-if="sortColumn === 'name'"
                      :class="
                        sortDirection === 'asc'
                          ? 'fas fa-sort-up'
                          : 'fas fa-sort-down'
                      "
                      class="sort-icon"
                    ></i>
                    <i v-else class="fas fa-sort sort-icon-inactive"></i>
                  </span>
                </th>
                <th
                  @click="sortBy('user')"
                  class="sortable-header"
                  :class="{ sorted: sortColumn === 'user' }"
                >
                  <span class="header-content">
                    E-mail
                    <i
                      v-if="sortColumn === 'user'"
                      :class="
                        sortDirection === 'asc'
                          ? 'fas fa-sort-up'
                          : 'fas fa-sort-down'
                      "
                      class="sort-icon"
                    ></i>
                    <i v-else class="fas fa-sort sort-icon-inactive"></i>
                  </span>
                </th>
                <th
                  @click="sortBy('level_access')"
                  class="sortable-header"
                  :class="{ sorted: sortColumn === 'level_access' }"
                >
                  <span class="header-content">
                    Nível de Acesso
                    <i
                      v-if="sortColumn === 'level_access'"
                      :class="
                        sortDirection === 'asc'
                          ? 'fas fa-sort-up'
                          : 'fas fa-sort-down'
                      "
                      class="sort-icon"
                    ></i>
                    <i v-else class="fas fa-sort sort-icon-inactive"></i>
                  </span>
                </th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id" class="user-row">
                <td class="user-name">{{ user.name || 'Não informado' }}</td>
                <td class="user-email">{{ user.user }}</td>
                <td class="user-level">
                  <span :class="getLevelClass(user.level_access)">
                    {{ getLevelText(user.level_access) }}
                  </span>
                </td>
                <td class="user-actions">
                  <button
                    @click="openClientsModal(user)"
                    class="action-btn clients-btn"
                    :disabled="loadingUser === user.id"
                  >
                    <i
                      class="fas fa-building"
                      v-if="loadingUser !== user.id"
                    ></i>
                    <i class="fas fa-spinner fa-spin" v-else></i>
                    CNPJs
                  </button>
                  <button
                    @click="openEditUserModal(user)"
                    class="action-btn settings-btn"
                    :disabled="loadingUser === user.id"
                    :title="'Editar usuário ' + user.name"
                  >
                    <i class="fas fa-cog"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Aba de clientes -->
      <div v-else-if="activeTab === 'clients'" class="clients-table-container">
        <div class="table-header">
          <div class="header-left">
            <h2>Lista de Clientes</h2>
            <p class="clients-count">
              Total: {{ filteredClients.length }} clientes
            </p>
          </div>
          <div class="header-actions">
            <button @click="openCreateClientModal" class="create-client-btn">
              <i class="fas fa-building-plus"></i>
              Criar Cliente
            </button>
          </div>
        </div>

        <!-- Campo de pesquisa -->
        <div class="clients-search-container">
          <div class="search-input-group">
            <i class="fas fa-search search-icon"></i>
            <input
              type="text"
              v-model="clientSearchTerm"
              placeholder="Buscar por Corpem, Nome ou CNPJ..."
              class="search-input"
              autocomplete="off"
              data-lpignore="true"
              data-form-type="other"
              name="client-search"
            />
            <button
              v-if="clientSearchTerm"
              @click="clientSearchTerm = ''"
              class="clear-search-btn"
              type="button"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="clients-table">
            <thead>
              <tr>
                <th>Corpem</th>
                <th>Nome</th>
                <th>CNPJ</th>
                <th>CD</th>
                <th>Crossdocking</th>
                <th>Integ.</th>
                <th>Token</th>
                <th>Evid.</th>
                <th>Pronta Int.</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="client in filteredClients"
                :key="client.cnpj"
                class="client-row"
              >
                <td class="client-corpem">{{ client.corpem_code || '-' }}</td>
                <td class="client-name">
                  {{ client.name || 'Não informado' }}
                </td>
                <td class="client-cnpj">{{ formatCNPJ(client.cnpj) }}</td>
                <td class="client-storage">{{ client.storage || '-' }}</td>
                <td class="client-crossdocking">
                  <span
                    :class="getCrossdockingClass(client.crossdocking)"
                    :title="getCrossdockingTooltip(client.crossdocking)"
                  >
                    {{ getCrossdockingLabel(client.crossdocking) }}
                  </span>
                </td>
                <td class="client-integration">
                  <div class="checkbox-container">
                    <input
                      type="checkbox"
                      :checked="client.integration === 1"
                      disabled
                      class="status-checkbox"
                    />
                  </div>
                </td>
                <td class="client-token">
                  <div class="checkbox-container">
                    <input
                      type="checkbox"
                      :checked="client.token !== null && client.token !== ''"
                      disabled
                      class="status-checkbox"
                    />
                  </div>
                </td>
                <td class="client-checkout-evidence">
                  <div class="checkbox-container">
                    <input
                      type="checkbox"
                      :checked="client.checkout_evidence === 1"
                      disabled
                      class="status-checkbox"
                    />
                  </div>
                </td>
                <td class="client-corpem-mounted">
                  <div class="checkbox-container">
                    <input
                      type="checkbox"
                      :checked="client.corpem_mounted_integration === '1'"
                      disabled
                      class="status-checkbox"
                    />
                  </div>
                </td>
                <td class="client-actions">
                  <button
                    @click="editClient(client)"
                    class="btn btn-sm btn-primary action-btn"
                    title="Editar cliente"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal de gerenciamento de CNPJs -->
    <ClientsModal
      v-if="showClientsModal && selectedUser"
      :user="selectedUser"
      :users-list="users"
      :clients="availableClients"
      :loading="clientsLoading"
      @close="closeClientsModal"
      @save="saveUserClients"
    />

    <!-- Modal de criação de usuário -->
    <CreateUserModal
      v-if="showCreateUserModal"
      :current-user="currentUser"
      :available-clients="availableClients"
      :loading="createUserLoading"
      :clients-loading="createUserClientsLoading"
      @close="closeCreateUserModal"
      @save="createUser"
      @load-clients="loadClientsForUser"
    />

    <!-- Modal de níveis de acesso -->
    <div v-if="showLevelsModal" class="modal-overlay" @click="closeLevelsModal">
      <div class="modal-content levels-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-layer-group"></i>
            Níveis de acesso
          </h3>
          <button class="modal-close-btn" @click="closeLevelsModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p class="levels-modal-description">
            Número do nível utilizado no banco de dados e nome designado no
            sistema.
          </p>
          <div class="levels-table-wrapper">
            <table class="levels-table">
              <thead>
                <tr>
                  <th>Nível</th>
                  <th>Nome designado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in accessLevelsList" :key="item.level">
                  <td class="level-number">{{ item.level }}</td>
                  <td class="level-name">{{ item.name }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de edição de usuário -->
    <EditUserModal
      v-if="showEditUserModal"
      :user="selectedEditUser"
      :current-user="currentUser"
      :loading="editUserLoading"
      @close="closeEditUserModal"
      @save="saveUserChanges"
      @delete="confirmDeleteUser"
      @notification="(msg, type) => showNotification(msg, type)"
    />

    <!-- Modal de edição de cliente -->
    <div
      v-if="showEditClientModal"
      class="modal-overlay"
      @click="closeEditClientModal"
    >
      <div class="modal-content edit-client-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i
              :class="
                selectedEditClient && selectedEditClient.cnpj
                  ? 'fas fa-edit'
                  : 'fas fa-plus'
              "
            ></i>
            {{
              selectedEditClient && selectedEditClient.cnpj
                ? 'Editar Cliente'
                : 'Criar Cliente'
            }}
          </h3>
          <button class="modal-close-btn" @click="closeEditClientModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body" v-if="selectedEditClient">
          <form
            @submit.prevent="saveClientChanges(selectedEditClient)"
            class="edit-client-form"
          >
            <div class="form-row">
              <div class="form-group">
                <label for="corpem_code">Código Corpem</label>
                <input
                  type="text"
                  id="corpem_code"
                  v-model="selectedEditClient.corpem_code"
                  class="form-control"
                  placeholder="Código no sistema Corpem"
                />
              </div>
              <div class="form-group">
                <label for="client_name">Nome do Cliente</label>
                <input
                  type="text"
                  id="client_name"
                  v-model="selectedEditClient.name"
                  class="form-control"
                  placeholder="Nome completo do cliente"
                  required
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="client_cnpj">CNPJ</label>
                <input
                  type="text"
                  id="client_cnpj"
                  v-model="selectedEditClient.cnpj"
                  class="form-control"
                  placeholder="XX.XXX.XXX/XXXX-XX"
                  :readonly="selectedEditClient && selectedEditClient.isEdit"
                  :title="
                    selectedEditClient && selectedEditClient.isEdit
                      ? 'CNPJ não pode ser alterado'
                      : 'Digite o CNPJ do cliente'
                  "
                />
                <small
                  class="help-text"
                  v-if="selectedEditClient && selectedEditClient.isEdit"
                  >CNPJ não pode ser alterado</small
                >
                <small class="help-text" v-else
                  >Digite apenas números (será formatado automaticamente)</small
                >
              </div>
              <div class="form-group">
                <label for="storage">CD/Armazenagem</label>
                <input
                  type="text"
                  id="storage"
                  v-model="selectedEditClient.storage"
                  class="form-control"
                  placeholder="Centro de distribuição"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="token">Token de Acesso</label>
                <input
                  type="text"
                  id="token"
                  v-model="selectedEditClient.token"
                  class="form-control"
                  placeholder="Token para API ou integrações"
                />
                <small class="help-text"
                  >Token usado para autenticação em integrações externas</small
                >
              </div>
              <div class="form-group">
                <label for="crossdocking">Crossdocking</label>
                <select
                  id="crossdocking"
                  v-model="selectedEditClient.crossdocking"
                  class="form-control"
                >
                  <option value="0">Não</option>
                  <option value="1">Opcional</option>
                  <option value="2">Sempre</option>
                </select>
                <small class="help-text">
                  <span v-if="selectedEditClient.crossdocking === '2'">
                    Todos os agendamentos deste estoque serão considerados
                    crossdocking
                  </span>
                  <span v-else-if="selectedEditClient.crossdocking === '1'">
                    Pode criar agendamentos com crossdocking (opcional)
                  </span>
                  <span v-else>
                    Não pode criar agendamentos com crossdocking
                  </span>
                </small>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    v-model="selectedEditClient.integration"
                    :true-value="1"
                    :false-value="0"
                    class="form-checkbox"
                  />
                  <span class="checkbox-text">
                    <i class="fas fa-plug"></i>
                    Integração Ativa
                  </span>
                </label>
                <small class="help-text">
                  {{
                    selectedEditClient.integration === 1 ||
                    selectedEditClient.integration === '1' ||
                    selectedEditClient.integration === true
                      ? 'Cliente com integração completa (produtos + CORPEM)'
                      : 'Cliente com agendamento simplificado (sem integração)'
                  }}
                </small>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    v-model="selectedEditClient.checkout_evidence"
                    :true-value="1"
                    :false-value="0"
                    class="form-checkbox"
                  />
                  <span class="checkbox-text">
                    <i class="fas fa-camera"></i>
                    Evidências Obrigatórias
                  </span>
                </label>
                <small class="help-text">
                  {{
                    selectedEditClient.checkout_evidence === 1 ||
                    selectedEditClient.checkout_evidence === '1' ||
                    selectedEditClient.checkout_evidence === true
                      ? 'Cliente requer evidências (imagem ou vídeo) no checkout'
                      : 'Cliente não requer evidências no checkout'
                  }}
                </small>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    v-model="selectedEditClient.corpem_mounted_integration"
                    :true-value="'1'"
                    :false-value="null"
                    class="form-checkbox"
                  />
                  <span class="checkbox-text">
                    <i class="fas fa-code"></i>
                    Pronta integração API
                  </span>
                </label>
                <small class="help-text">
                  {{
                    selectedEditClient.corpem_mounted_integration === '1'
                      ? 'Este estoque exige JSONs de integração CorpEM na requisição da API'
                      : 'Este estoque não exige JSONs de integração na API'
                  }}
                </small>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    v-model="selectedEditClient.xml_cnpj_lock"
                    :true-value="'1'"
                    :false-value="null"
                    class="form-checkbox"
                  />
                  <span class="checkbox-text">
                    <i class="fas fa-lock"></i>
                    Travar estoque pelo CNPJ do destinatário do XML
                  </span>
                </label>
                <small class="help-text">
                  {{
                    selectedEditClient.xml_cnpj_lock === '1'
                      ? 'Quando o CNPJ do destinatário do XML for igual ao CNPJ deste estoque, o estoque é selecionado e bloqueado contra alteração'
                      : 'Seleção de estoque livre — o usuário pode escolher manualmente'
                  }}
                </small>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    v-model="selectedEditClient.show_factor"
                    :true-value="'1'"
                    :false-value="null"
                    class="form-checkbox"
                  />
                  <span class="checkbox-text">
                    <i class="fas fa-layer-group"></i>
                    Exibir coluna "Fator" na configuração de produtos
                  </span>
                </label>
                <small class="help-text">
                  {{
                    selectedEditClient.show_factor === '1'
                      ? 'A coluna Fator aparece no modal de configuração de produtos deste estoque'
                      : 'A coluna Fator fica oculta — o fator é sempre 1'
                  }}
                </small>
              </div>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                @click="closeEditClientModal"
                class="btn btn-secondary"
                :disabled="editClientLoading"
              >
                <i class="fas fa-times"></i>
                Cancelar
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="editClientLoading"
              >
                <i v-if="editClientLoading" class="fas fa-spinner fa-spin"></i>
                <i
                  v-else-if="selectedEditClient && selectedEditClient.isEdit"
                  class="fas fa-save"
                ></i>
                <i v-else class="fas fa-plus"></i>
                {{
                  editClientLoading
                    ? 'Salvando...'
                    : selectedEditClient && selectedEditClient.isEdit
                      ? 'Salvar Alterações'
                      : 'Criar Cliente'
                }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import ClientsModal from '../components/ClientsModal.vue'
import CreateUserModal from '../components/CreateUserModal.vue'
import EditUserModal from '../components/EditUserModal.vue'
import { BASE_URL } from '../config/api.js'
import { useSystemDialogStore } from '@/stores/systemDialog'

// Debug: verificar se BASE_URL está definido
console.log('🔧 [AdminPage] BASE_URL carregado:', BASE_URL, typeof BASE_URL)

export default {
  name: 'AdminPage',
  emits: ['notification'],
  components: {
    ClientsModal,
    CreateUserModal,
    EditUserModal,
  },
  props: {
    initialTab: {
      type: String,
      default: 'users',
      validator: value => ['users', 'clients'].includes(value),
    },
  },
  setup(props, { emit }) {
    // Estado reativo
    const users = ref([])
    const clients = ref([])
    const loading = ref(true)
    const error = ref(null)
    const loadingUser = ref(null)
    const activeTab = ref(props.initialTab)
    const clientSearchTerm = ref('')
    const userSearchTerm = ref('')

    // Estado de ordenação
    const sortColumn = ref('name')
    const sortDirection = ref('asc')

    // Modal de clientes
    const showClientsModal = ref(false)
    const selectedUser = ref(null)
    const availableClients = ref([])
    const clientsLoading = ref(false)

    // Modal de criação de usuário
    const showCreateUserModal = ref(false)
    const createUserLoading = ref(false)
    const createUserClientsLoading = ref(true)
    const modalOpenId = ref(0)

    // Modal de edição de usuário
    const showEditUserModal = ref(false)
    const selectedEditUser = ref(null)
    const editUserLoading = ref(false)

    // Modal de edição de cliente
    const showEditClientModal = ref(false)
    const selectedEditClient = ref(null)
    const editClientLoading = ref(false)

    // Modal de níveis de acesso
    const showLevelsModal = ref(false)
    const accessLevelsList = [
      { level: 0, name: 'Desenvolvedor' },
      { level: 1, name: 'Cliente' },
      { level: 2, name: 'Administrador' },
      { level: 3, name: 'Gerente' },
      { level: 4, name: 'Manutenção' },
      { level: 5, name: 'Não definido' },
      { level: 6, name: 'Não definido' },
      { level: 7, name: 'Expedição' },
      { level: 8, name: 'Carga e Descarga' },
      { level: 9, name: 'Recepção' },
    ]

    // Computed - obter dados do localStorage
    const currentUser = computed(() => {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    })

    const token = computed(() => localStorage.getItem('token'))

    // Função para formatar CNPJ (definida antes da computed property)
    const formatCNPJ = cnpj => {
      if (!cnpj) return '-'
      // Remove tudo que não é dígito
      const digits = cnpj.replace(/\D/g, '')
      // Formata como XX.XXX.XXX/XXXX-XX
      if (digits.length === 14) {
        return digits.replace(
          /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
          '$1.$2.$3/$4-$5'
        )
      }
      return cnpj // Retorna como está se não tiver 14 dígitos
    }

    // Computed - clientes filtrados por pesquisa
    const filteredClients = computed(() => {
      if (!clientSearchTerm.value.trim()) {
        return clients.value
      }

      const searchTerm = clientSearchTerm.value.toLowerCase().trim()

      return clients.value.filter(client => {
        // Pesquisa por nome
        const nameMatch =
          client.name && client.name.toLowerCase().includes(searchTerm)

        // Pesquisa por CNPJ (com ou sem formatação)
        const cnpjMatch =
          client.cnpj &&
          (client.cnpj.includes(searchTerm) ||
            formatCNPJ(client.cnpj).toLowerCase().includes(searchTerm))

        // Pesquisa por número Corpem
        const corpemMatch =
          client.corpem_code &&
          client.corpem_code.toString().includes(searchTerm)

        return nameMatch || cnpjMatch || corpemMatch
      })
    })

    // Computed - usuários ordenados
    const sortedUsers = computed(() => {
      if (!users.value || users.value.length === 0) return []

      const sorted = [...users.value].sort((a, b) => {
        let aValue, bValue

        switch (sortColumn.value) {
          case 'name':
            aValue = (a.name || 'Não informado').toLowerCase()
            bValue = (b.name || 'Não informado').toLowerCase()
            break
          case 'user':
            aValue = (a.user || '').toLowerCase()
            bValue = (b.user || '').toLowerCase()
            break
          case 'level_access':
            aValue = a.level_access ?? 999
            bValue = b.level_access ?? 999
            break
          default:
            return 0
        }

        if (sortColumn.value === 'level_access') {
          // Ordenação numérica para nível de acesso
          return sortDirection.value === 'asc'
            ? aValue - bValue
            : bValue - aValue
        } else {
          // Ordenação alfabética para nome e email
          const comparison = aValue.localeCompare(bValue)
          return sortDirection.value === 'asc' ? comparison : -comparison
        }
      })

      return sorted
    })

    // Computed - usuários filtrados por pesquisa
    const filteredUsers = computed(() => {
      if (!userSearchTerm.value.trim()) {
        return sortedUsers.value
      }

      const searchTerm = userSearchTerm.value.toLowerCase().trim()

      return sortedUsers.value.filter(user => {
        // Pesquisa por nome
        const nameMatch =
          user.name && user.name.toLowerCase().includes(searchTerm)

        // Pesquisa por e-mail
        const emailMatch =
          user.user && user.user.toLowerCase().includes(searchTerm)

        return nameMatch || emailMatch
      })
    })

    // Verificar se é usuário nível 0
    const checkAccess = () => {
      if (!currentUser.value || currentUser.value.level_access !== 0) {
        error.value =
          'Acesso negado. Apenas usuários de nível 0 podem acessar esta página.'
        return false
      }
      return true
    }

    // Carregar usuários
    const loadUsers = async () => {
      if (!checkAccess()) return

      try {
        loading.value = true
        error.value = null

        const response = await fetch(`${BASE_URL}/users/admin/all`, {
          headers: {
            Authorization: `Bearer ${token.value}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Erro ao carregar usuários')
        }

        const data = await response.json()
        // Ordenar usuários alfabeticamente por nome
        users.value = data.users.sort((a, b) => {
          const nameA = (a.name || 'Não informado').toLowerCase()
          const nameB = (b.name || 'Não informado').toLowerCase()
          return nameA.localeCompare(nameB)
        })
      } catch (err) {
        console.error('Erro ao carregar usuários:', err)
        error.value = 'Erro ao carregar usuários. Tente novamente.'
      } finally {
        loading.value = false
      }
    }

    // Carregar clientes
    const loadClients = async () => {
      if (!checkAccess()) return

      try {
        loading.value = true
        error.value = null

        const apiClient = window.apiClient
        const data = apiClient
          ? await apiClient.request('/clients?all=true', { method: 'GET' })
          : await (async () => {
              const res = await fetch(`${BASE_URL}/clients?all=true`, {
                headers: {
                  Authorization: `Bearer ${token.value}`,
                  'Content-Type': 'application/json',
                },
              })
              if (!res.ok) throw new Error('Erro ao carregar clientes')
              return res.json()
            })()

        // Normalizar valores de integration e crossdocking para garantir consistência
        const normalizedClients = data.data.map(client => ({
          ...client,
          integration:
            client.integration === 1 || client.integration === '1' ? 1 : 0,
          crossdocking: client.crossdocking || '0',
          checkout_evidence:
            client.checkout_evidence === 1 ||
            client.checkout_evidence === '1' ||
            client.checkout_evidence === true
              ? 1
              : 0,
          corpem_mounted_integration: client.corpem_mounted_integration || null,
          xml_cnpj_lock:
            client.xml_cnpj_lock === '1' || client.xml_cnpj_lock === 1
              ? '1'
              : null,
          show_factor:
            client.show_factor === '1' || client.show_factor === 1
              ? '1'
              : null,
        }))
        // Ordenar clientes alfabeticamente por nome
        clients.value = normalizedClients.sort((a, b) => {
          const nameA = (a.name || 'Não informado').toLowerCase()
          const nameB = (b.name || 'Não informado').toLowerCase()
          return nameA.localeCompare(nameB)
        })
      } catch (err) {
        console.error('Erro ao carregar clientes:', err)
        error.value = 'Erro ao carregar clientes. Tente novamente.'
      } finally {
        loading.value = false
      }
    }

    // Função para trocar para aba de clientes
    const switchToClientsTab = () => {
      activeTab.value = 'clients'
      if (clients.value.length === 0) {
        loadClients()
      }
    }

    // Função para editar cliente
    const editClient = client => {
      console.log('🔧 Editando cliente:', client)
      // Normalizar integration para garantir que seja número (1 ou 0)
      const normalizedIntegration =
        client.integration === 1 ||
        client.integration === '1' ||
        client.integration === true
          ? 1
          : 0
      // Normalizar checkout_evidence para garantir que seja número (1 ou 0)
      const normalizedCheckoutEvidence =
        client.checkout_evidence === 1 ||
        client.checkout_evidence === '1' ||
        client.checkout_evidence === true
          ? 1
          : 0
      // Normalizar corpem_mounted_integration ('1' ou null)
      const normalizedCorpemMounted =
        client.corpem_mounted_integration === '1' ||
        client.corpem_mounted_integration === 1
          ? '1'
          : null
      // Normalizar xml_cnpj_lock ('1' ou null)
      const normalizedXmlCnpjLock =
        client.xml_cnpj_lock === '1' || client.xml_cnpj_lock === 1 ? '1' : null
      // Normalizar show_factor ('1' ou null)
      const normalizedShowFactor =
        client.show_factor === '1' || client.show_factor === 1 ? '1' : null
      selectedEditClient.value = {
        ...client,
        isEdit: true,
        integration: normalizedIntegration, // Garantir que seja número
        crossdocking: client.crossdocking || '0', // Garantir que crossdocking tenha valor padrão
        checkout_evidence: normalizedCheckoutEvidence, // Garantir que seja número
        corpem_mounted_integration: normalizedCorpemMounted,
        xml_cnpj_lock: normalizedXmlCnpjLock,
        show_factor: normalizedShowFactor,
      } // Fazer cópia para não alterar o original
      showEditClientModal.value = true
    }

    // Função para criar novo cliente
    const openCreateClientModal = () => {
      console.log('➕ Abrindo modal de criação de cliente')
      selectedEditClient.value = {
        cnpj: '',
        name: '',
        corpem_code: '',
        storage: '',
        integration: false,
        crossdocking: '0',
        token: '',
        checkout_evidence: false,
        corpem_mounted_integration: null,
        xml_cnpj_lock: null,
        show_factor: null,
        isEdit: false,
      }
      showEditClientModal.value = true
    }

    // Fechar modal de edição de cliente
    const closeEditClientModal = () => {
      showEditClientModal.value = false
      selectedEditClient.value = null
      editClientLoading.value = false
    }

    // Salvar alterações do cliente
    const saveClientChanges = async clientData => {
      editClientLoading.value = true
      try {
        const isCreating = !clientData.isEdit
        console.log(
          `💾 ${isCreating ? 'Criando novo cliente' : 'Salvando alterações do cliente'}:`,
          clientData
        )
        console.log(`💾 [CLIENT SAVE] crossdocking no clientData:`, {
          value: clientData.crossdocking,
          type: typeof clientData.crossdocking,
          isUndefined: clientData.crossdocking === undefined,
          isNull: clientData.crossdocking === null,
        })

        // Normalizar CNPJ (remover máscara se houver)
        const normalizedCNPJ = clientData.cnpj.replace(/[^\d]/g, '')

        const url = isCreating
          ? `${BASE_URL}/clients`
          : `${BASE_URL}/clients/${normalizedCNPJ}`
        const method = isCreating ? 'POST' : 'PUT'

        // Normalizar integration antes de enviar para garantir consistência
        const normalizedIntegration =
          clientData.integration === 1 ||
          clientData.integration === '1' ||
          clientData.integration === true
            ? 1
            : 0
        // Normalizar checkout_evidence antes de enviar para garantir consistência
        const normalizedCheckoutEvidence =
          clientData.checkout_evidence === 1 ||
          clientData.checkout_evidence === '1' ||
          clientData.checkout_evidence === true
            ? 1
            : 0
        // Normalizar corpem_mounted_integration ('1' ou null)
        const normalizedCorpemMounted =
          clientData.corpem_mounted_integration === '1' ||
          clientData.corpem_mounted_integration === 1
            ? '1'
            : null
        // Normalizar xml_cnpj_lock ('1' ou null)
        const normalizedXmlCnpjLock =
          clientData.xml_cnpj_lock === '1' || clientData.xml_cnpj_lock === 1
            ? '1'
            : null
        // Normalizar show_factor ('1' ou null)
        const normalizedShowFactor =
          clientData.show_factor === '1' || clientData.show_factor === 1
            ? '1'
            : null

        const requestBody = {
          corpem_code: clientData.corpem_code,
          name: clientData.name,
          cnpj: normalizedCNPJ,
          storage: clientData.storage,
          integration: normalizedIntegration,
          crossdocking: clientData.crossdocking || '0',
          token: clientData.token,
          checkout_evidence: normalizedCheckoutEvidence,
          corpem_mounted_integration: normalizedCorpemMounted,
          xml_cnpj_lock: normalizedXmlCnpjLock,
          show_factor: normalizedShowFactor,
        }

        console.log(
          `📤 [CLIENT UPDATE] Enviando dados para ${method} ${url}:`,
          requestBody
        )
        console.log(`📤 [CLIENT UPDATE] Valores normalizados antes do envio:`, {
          integration: {
            original: clientData.integration,
            tipo: typeof clientData.integration,
            normalizado: normalizedIntegration,
          },
          crossdocking: {
            original: clientData.crossdocking,
            tipo: typeof clientData.crossdocking,
            normalizado: requestBody.crossdocking,
          },
        })

        const response = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${token.value}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          const errorData = await response.text()
          throw new Error(`Erro ${response.status}: ${errorData}`)
        }

        const result = await response.json()
        console.log(
          `✅ Cliente ${isCreating ? 'criado' : 'atualizado'}:`,
          result
        )

        if (isCreating) {
          // Adicionar novo cliente à lista
          const newClient = result.client || {
            cnpj: normalizedCNPJ,
            name: clientData.name,
            corpem_code: clientData.corpem_code,
            storage: clientData.storage,
            integration: clientData.integration,
            crossdocking: clientData.crossdocking || '0',
            token: clientData.token,
            checkout_evidence: clientData.checkout_evidence,
            corpem_mounted_integration: normalizedCorpemMounted,
            xml_cnpj_lock: normalizedXmlCnpjLock,
          }
          clients.value.push(newClient)
          showNotification('Cliente criado com sucesso!', 'success')
        } else {
          // Atualizar cliente existente na lista local
          const clientIndex = clients.value.findIndex(
            c => c.cnpj === normalizedCNPJ
          )
          if (clientIndex !== -1) {
            // Normalizar valores de integration, crossdocking, checkout_evidence e corpem_mounted_integration para garantir consistência
            const normalizedClient = {
              ...clients.value[clientIndex],
              ...result.client,
              cnpj: normalizedCNPJ,
              // Normalizar integration: garantir que seja número (1 ou 0)
              integration:
                result.client.integration === 1 ||
                result.client.integration === '1' ||
                result.client.integration === true
                  ? 1
                  : 0,
              // Normalizar crossdocking: garantir que seja string ('0', '1' ou '2')
              crossdocking: result.client.crossdocking || '0',
              // Normalizar checkout_evidence: garantir que seja número (1 ou 0)
              checkout_evidence:
                result.client.checkout_evidence === 1 ||
                result.client.checkout_evidence === '1' ||
                result.client.checkout_evidence === true
                  ? 1
                  : 0,
              // Normalizar corpem_mounted_integration
              corpem_mounted_integration:
                result.client.corpem_mounted_integration || null,
              // Normalizar xml_cnpj_lock ('1' ou null)
              xml_cnpj_lock:
                result.client.xml_cnpj_lock === '1' ||
                result.client.xml_cnpj_lock === 1
                  ? '1'
                  : null,
            }
            console.log(`🔄 [CLIENT UPDATE] Atualizando cliente na lista:`, {
              antes: {
                integration: clients.value[clientIndex].integration,
                crossdocking: clients.value[clientIndex].crossdocking,
              },
              depois: {
                integration: normalizedClient.integration,
                crossdocking: normalizedClient.crossdocking,
              },
              resultadoBackend: {
                integration: result.client.integration,
                crossdocking: result.client.crossdocking,
              },
            })
            clients.value[clientIndex] = normalizedClient
          }
          showNotification('Cliente atualizado com sucesso!', 'success')
        }

        closeEditClientModal()
      } catch (err) {
        console.error('❌ Erro ao atualizar cliente:', err)
        showNotification(err.message || 'Erro ao atualizar cliente.', 'error')
      } finally {
        editClientLoading.value = false
      }
    }

    // Abrir modal de clientes
    const openClientsModal = async user => {
      selectedUser.value = user
      loadingUser.value = user.id

      try {
        await loadClientsForCreateUser()
        showClientsModal.value = true
      } catch (err) {
        console.error('Erro ao carregar clientes:', err)
        error.value = 'Erro ao carregar lista de clientes.'
      } finally {
        loadingUser.value = null
      }
    }

    // Fechar modal de clientes
    const closeClientsModal = () => {
      showClientsModal.value = false
      selectedUser.value = null
      availableClients.value = []
    }

    // Modal de criação de usuário
    const openCreateUserModal = async () => {
      modalOpenId.value++
      showCreateUserModal.value = true
      createUserClientsLoading.value = true

      try {
        await loadClientsForCreateUser() // Carregar clientes disponíveis
      } catch (err) {
        console.error('Erro ao carregar clientes:', err)
        showNotification('Erro ao carregar lista de clientes.', 'error')
      }
    }

    const closeCreateUserModal = () => {
      showCreateUserModal.value = false
      availableClients.value = [] // Limpar clientes ao fechar
      createUserClientsLoading.value = true // Resetar estado de loading
    }

    // Modal de níveis de acesso
    const openLevelsModal = () => {
      showLevelsModal.value = true
    }

    const closeLevelsModal = () => {
      showLevelsModal.value = false
    }

    // Carregar clientes para criação de usuário (com estado separado)
    const loadClientsForCreateUser = async (search = '') => {
      createUserClientsLoading.value = true

      try {
        // Usar endpoint correto baseado no nível do usuário
        // Para nível 0: /users/admin/clients (busca na tabela clients)
        // Para outros níveis: usar endpoint alternativo ou método diferente
        let urlString

        if (currentUser.value?.level_access === 0) {
          // Super admin: buscar todos os clientes na tabela clients
          urlString = `${BASE_URL}/users/admin/clients`
          if (search && search.trim()) {
            const searchParam = encodeURIComponent(search.trim())
            urlString += `?search=${searchParam}`
          }
        } else {
          // Outros usuários: usar endpoint de clientes acessíveis (sem busca por enquanto)
          urlString = `${BASE_URL}/users/clients/accessible`
        }

        console.log('🔍 Carregando clientes (CreateUser)...', {
          urlString: urlString,
          token: token.value ? 'TOKEN_PRESENTE' : 'TOKEN_AUSENTE',
          user: currentUser.value,
          searchTerm: search,
        })

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos

        const response = await fetch(urlString, {
          headers: {
            Authorization: `Bearer ${token.value}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        console.log('📡 Resposta da API (CreateUser):', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        })

        if (!response.ok) {
          const errorData = await response.text()
          console.error('❌ Erro na resposta (CreateUser):', {
            status: response.status,
            statusText: response.statusText,
            body: errorData,
          })
          throw new Error(
            `Erro ${response.status}: ${response.statusText} - ${errorData}`
          )
        }

        const data = await response.json()
        console.log('✅ Dados recebidos (CreateUser):', data)

        // Normalizar estrutura e remover duplicatas por CNPJ (mesmo cliente não pode aparecer 2x)
        if (data.clients) {
          const byCnpj = new Map()
          const norm = v => (String(v || '').replace(/\D/g, '') || '').trim()
          for (const client of data.clients) {
            const key = norm(client.cnpj) || `empty-${byCnpj.size}`
            if (!byCnpj.has(key)) {
              byCnpj.set(key, {
                nome: client.nome || client.name,
                numero: client.numero || client.number,
                cnpj: client.cnpj,
                estabelecimento:
                  client.estabelecimento != null
                    ? String(client.estabelecimento).trim()
                    : '',
                adm: client.adm != null ? String(client.adm).trim() : '',
              })
            }
          }
          availableClients.value = Array.from(byCnpj.values())
        } else {
          availableClients.value = []
        }
      } catch (err) {
        console.error('❌ Erro ao carregar clientes (CreateUser):', {
          message: err.message,
          stack: err.stack,
          type: err.constructor.name,
          name: err.name,
        })

        if (err.name === 'AbortError') {
          throw new Error(
            'Timeout: A requisição demorou mais de 30 segundos para responder'
          )
        }
        throw err
      } finally {
        createUserClientsLoading.value = false
      }
    }

    const loadClientsForUser = searchTerm => {
      loadClientsForCreateUser(searchTerm)
    }

    // Criar usuário
    const createUser = async userData => {
      const capturedOpenId = modalOpenId.value
      createUserLoading.value = true

      try {
        const response = await fetch(`${BASE_URL}/users`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.value}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: userData.email,
            password: 'mercocamp', // Senha padrão
            name: userData.name,
            level_access: userData.level_access,
            cli_access: userData.cli_access,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao criar usuário')
        }

        const result = await response.json()

        // Recarregar lista de usuários
        await loadUsers()

        // Só fechar o modal se ainda for a mesma abertura (evita fechar modal reaberto)
        if (modalOpenId.value === capturedOpenId) {
          closeCreateUserModal()
        }
        showNotification('Usuário criado com sucesso!', 'success')
      } catch (err) {
        console.error('Erro ao criar usuário:', err)
        showNotification(err.message || 'Erro ao criar usuário.', 'error')
      } finally {
        createUserLoading.value = false
      }
    }

    // Modal de edição de usuário
    const openEditUserModal = user => {
      selectedEditUser.value = { ...user } // Clonar o objeto para não modificar o original
      showEditUserModal.value = true
    }

    const closeEditUserModal = () => {
      showEditUserModal.value = false
      selectedEditUser.value = null
    }

    // Salvar alterações do usuário
    const saveUserChanges = async userData => {
      editUserLoading.value = true

      try {
        const id = selectedEditUser.value?.id
        if (!id) {
          showNotification('Usuário não selecionado.', 'error')
          return
        }
        const name = userData.name ?? selectedEditUser.value?.name ?? ''
        const levelAccess =
          typeof userData.level_access === 'number' &&
          Number.isInteger(userData.level_access)
            ? userData.level_access
            : (selectedEditUser.value?.level_access ?? 0)
        const response = await fetch(`${BASE_URL}/users/${id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token.value}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            level_access: levelAccess,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao atualizar usuário')
        }

        // Atualizar usuário na lista local
        const userIndex = users.value.findIndex(
          u => u.id === selectedEditUser.value.id
        )
        if (userIndex !== -1) {
          users.value[userIndex] = { ...users.value[userIndex], ...userData }
        }

        closeEditUserModal()
        showNotification('Usuário atualizado com sucesso!', 'success')
      } catch (err) {
        console.error('Erro ao atualizar usuário:', err)
        showNotification(err.message || 'Erro ao atualizar usuário.', 'error')
      } finally {
        editUserLoading.value = false
      }
    }

    // Confirmar exclusão de usuário (chamado do modal)
    const confirmDeleteUser = user => {
      // Verificar se é tentativa de auto-exclusão
      if (user.id === currentUser.value?.id) {
        showNotification('Você não pode excluir sua própria conta.', 'error')
        return
      }

      // Apenas desenvolvedores podem excluir outros desenvolvedores
      if (user.level_access === 0 && currentUser.value?.level_access !== 0) {
        showNotification(
          'Apenas desenvolvedores podem excluir outros desenvolvedores.',
          'error'
        )
        return
      }

      const confirmation = confirm(
        `Tem certeza que deseja excluir o usuário "${user.name || user.user}"?\n\n` +
          `Esta ação não pode ser desfeita e o usuário perderá acesso ao sistema.`
      )

      if (confirmation) {
        deleteUser(user)
      }
    }

    // Excluir usuário
    const deleteUser = async user => {
      editUserLoading.value = true

      try {
        const response = await fetch(`${BASE_URL}/users/${user.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token.value}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao excluir usuário')
        }

        // Remover usuário da lista local
        users.value = users.value.filter(u => u.id !== user.id)

        closeEditUserModal()
        showNotification(
          `Usuário "${user.name || user.user}" excluído com sucesso.`,
          'success'
        )
      } catch (err) {
        console.error('Erro ao excluir usuário:', err)
        showNotification(err.message || 'Erro ao excluir usuário.', 'error')
      } finally {
        editUserLoading.value = false
      }
    }

    // Salvar acessos do usuário
    const saveUserClients = async selectedClients => {
      try {
        // Formar JSON no formato especificado
        const cliAccess = {}
        selectedClients.forEach(client => {
          cliAccess[client.cnpj] = {
            nome: client.nome,
            numero: client.numero,
          }
        })

        const response = await fetch(
          `${BASE_URL}/users/${selectedUser.value.id}/client-access`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token.value}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cli_access: cliAccess }),
          }
        )

        if (!response.ok) {
          throw new Error('Erro ao salvar acessos do usuário')
        }

        // Atualizar o usuário local
        const userIndex = users.value.findIndex(
          u => u.id === selectedUser.value.id
        )
        if (userIndex !== -1) {
          users.value[userIndex].cli_access = cliAccess
        }

        closeClientsModal()

        // Mostrar sucesso
        showNotification('Acessos do usuário salvos com sucesso!', 'success')
      } catch (err) {
        console.error('Erro ao salvar acessos:', err)
        showNotification('Erro ao salvar acessos do usuário.', 'error')
      }
    }

    // Função de ordenação
    const sortBy = column => {
      if (sortColumn.value === column) {
        // Se clicar na mesma coluna, inverte a direção
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
      } else {
        // Se clicar em coluna diferente, ordena ascendente
        sortColumn.value = column
        sortDirection.value = 'asc'
      }
    }

    // Utilitários
    const getLevelText = level => {
      const levels = {
        0: 'Dev',
        1: 'Client',
        2: 'Admin',
        3: 'Manager',
        7: 'Expedição',
        8: 'Carga/D',
        9: 'Lobby',
      }
      return levels[level] || 'Desconhecido'
    }

    const getLevelClass = level => {
      const classes = {
        0: 'level-developer',
        1: 'level-cliente',
        2: 'level-admin',
        3: 'level-manager',
        7: 'level-expedicao',
        8: 'level-carga-descarga',
        9: 'level-conferente',
      }
      return classes[level] || 'level-unknown'
    }

    const showNotification = (message, type = 'info') => {
      emit('notification', message, type)
    }

    // Funções para formatar Crossdocking
    const getCrossdockingLabel = crossdocking => {
      const value = String(crossdocking || '0')
      switch (value) {
        case '2':
          return 'Sempre'
        case '1':
          return 'Opcional'
        case '0':
        default:
          return 'Não'
      }
    }

    const getCrossdockingTooltip = crossdocking => {
      const value = String(crossdocking || '0')
      switch (value) {
        case '2':
          return 'Todos os agendamentos deste estoque serão considerados crossdocking'
        case '1':
          return 'Pode criar agendamentos com crossdocking (opcional)'
        case '0':
        default:
          return 'Não pode criar agendamentos com crossdocking'
      }
    }

    const getCrossdockingClass = crossdocking => {
      const value = String(crossdocking || '0')
      switch (value) {
        case '2':
          return 'crossdocking-badge crossdocking-always'
        case '1':
          return 'crossdocking-badge crossdocking-optional'
        case '0':
        default:
          return 'crossdocking-badge crossdocking-none'
      }
    }

    // Lifecycle
    onMounted(() => {
      // Carregar dados baseado na aba inicial
      if (props.initialTab === 'clients') {
        loadClients()
      } else {
        loadUsers()
      }
    })

    // Watch para mudanças na prop initialTab
    watch(
      () => props.initialTab,
      newTab => {
        activeTab.value = newTab
        // Carregar dados quando a aba mudar
        if (newTab === 'clients' && clients.value.length === 0) {
          loadClients()
        } else if (newTab === 'users' && users.value.length === 0) {
          loadUsers()
        }
      }
    )

    return {
      users,
      clients,
      filteredClients,
      clientSearchTerm,
      clients,
      loading,
      error,
      loadingUser,
      activeTab,
      sortColumn,
      sortDirection,
      sortedUsers,
      filteredUsers,
      userSearchTerm,
      sortBy,
      currentUser,
      token,
      showClientsModal,
      selectedUser,
      availableClients,
      clientsLoading,
      showCreateUserModal,
      createUserLoading,
      createUserClientsLoading,
      showEditUserModal,
      selectedEditUser,
      editUserLoading,
      showEditClientModal,
      selectedEditClient,
      editClientLoading,
      showLevelsModal,
      accessLevelsList,
      openLevelsModal,
      closeLevelsModal,
      loadUsers,
      loadClients,
      switchToClientsTab,
      editClient,
      openCreateClientModal,
      openClientsModal,
      closeClientsModal,
      saveUserClients,
      openCreateUserModal,
      closeCreateUserModal,
      loadClientsForUser,
      createUser,
      openEditUserModal,
      closeEditUserModal,
      saveUserChanges,
      confirmDeleteUser,
      deleteUser,
      closeEditClientModal,
      saveClientChanges,
      getLevelText,
      getLevelClass,
      formatCNPJ,
      getCrossdockingLabel,
      getCrossdockingTooltip,
      getCrossdockingClass,
    }
  },
}
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f7fafc;
  padding: 20px;
}

.admin-header {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 8px 0;
}

.page-title i {
  color: #3182ce;
  font-size: 1.8rem;
}

.page-description {
  color: #718096;
  margin: 0;
  font-size: 1.1rem;
}

.admin-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loader-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.error-message i {
  color: #e53e3e;
  font-size: 2rem;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #3182ce;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retry-btn:hover {
  background: #2c5aa0;
  transform: translateY(-1px);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
}

.header-left h2 {
  margin: 0;
  color: #2d3748;
  font-size: 1.5rem;
  font-weight: 600;
}

.users-count {
  margin: 0;
  color: #718096;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.levels-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.levels-btn:hover {
  background: #3182ce;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

.levels-btn i {
  font-size: 1rem;
}

/* Modal de níveis de acesso */
.levels-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

.levels-modal .modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.levels-modal .modal-body {
  padding: 1.25rem;
}

.levels-modal-description {
  margin: 0 0 1rem 0;
  color: #64748b;
  font-size: 0.95rem;
}

.levels-table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.levels-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.levels-table th,
.levels-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.levels-table th {
  background: #f8fafc;
  font-weight: 600;
  color: #334155;
}

.levels-table tbody tr:last-child td {
  border-bottom: none;
}

.levels-table tbody tr:hover {
  background: #f8fafc;
}

.levels-table .level-number {
  font-weight: 600;
  color: #1e293b;
  width: 6rem;
}

.levels-table .level-name {
  color: #475569;
}

.create-user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #48bb78;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.create-user-btn:hover {
  background: #38a169;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
}

.create-user-btn i {
  font-size: 1rem;
}

.create-client-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.create-client-btn:hover {
  background: #3182ce;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

.create-client-btn i {
  font-size: 1rem;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.users-table th {
  background: #f7fafc;
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #2d3748;
  border-bottom: 2px solid #e2e8f0;
}

.sortable-header {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
  position: relative;
}

.sortable-header:hover {
  background: #edf2f7 !important;
}

.sortable-header.sorted {
  background: #e6f2ff !important;
  color: #2b6cb0;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sort-icon {
  font-size: 12px;
  color: #2b6cb0;
  min-width: 12px;
}

.sort-icon-inactive {
  color: #cbd5e0;
  opacity: 0.5;
}

.users-table td {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  color: #4a5568;
}

.user-row:hover {
  background: #f7fafc;
}

.user-email {
  font-family: 'Courier New', monospace;
  font-weight: 500;
}

.user-name {
  font-weight: 500;
}

.user-level span {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.level-developer {
  background: #2d3748;
  color: #ffffff;
}

.level-cliente {
  background: #e2e8f0;
  color: #4a5568;
}

.level-admin {
  background: #3182ce;
  color: #ffffff;
}

.level-manager {
  background: #c6f6d5;
  color: #2f855a;
}

.level-conferente {
  background: #bee3f8;
  color: #2c5282;
}

.level-expedicao {
  background: #fed7aa;
  color: #c2410c;
}

.level-carga-descarga {
  background: #fde68a;
  color: #78350f;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.clients-btn {
  background: #3182ce;
  color: white;
}

.clients-btn:hover:not(:disabled) {
  background: #2c5aa0;
  transform: translateY(-1px);
}

.clients-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.settings-btn {
  background: #718096;
  color: white;
  margin-left: 8px;
}

.settings-btn:hover:not(:disabled) {
  background: #4a5568;
  transform: translateY(-1px);
}

.settings-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.user-actions {
  display: flex;
  align-items: center;
}

/* Estilos específicos para a tabela de clientes */
.clients-table-container {
  width: 100%;
}

/* Container de pesquisa de clientes */
.clients-search-container {
  margin-bottom: 1.5rem;
  margin-top: 1rem;
}

.clients-search-container .search-input-group {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 500px;
  width: 100%;
}

.clients-search-container .search-icon {
  position: absolute;
  left: 16px;
  color: #718096;
  font-size: 1rem;
  z-index: 1;
}

.clients-search-container .search-input {
  width: 100%;
  padding: 12px 45px 12px 45px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #2d3748;
  background: white;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.clients-search-container .search-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.clients-search-container .search-input::placeholder {
  color: #a0aec0;
}

.clients-search-container .clear-search-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  z-index: 1;
}

.clients-search-container .clear-search-btn:hover {
  background: #f7fafc;
  color: #2d3748;
}

/* Container de pesquisa de usuários */
.users-search-container {
  margin-bottom: 1.5rem;
  margin-top: 1rem;
}

.users-search-container .search-input-group {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 500px;
  width: 100%;
}

.users-search-container .search-icon {
  position: absolute;
  left: 16px;
  color: #718096;
  font-size: 1rem;
  z-index: 1;
}

.users-search-container .search-input {
  width: 100%;
  padding: 12px 45px 12px 45px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  color: #2d3748;
  background: white;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.users-search-container .search-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.users-search-container .search-input::placeholder {
  color: #a0aec0;
}

.users-search-container .clear-search-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #718096;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  z-index: 1;
}

.users-search-container .clear-search-btn:hover {
  background: #f7fafc;
  color: #2d3748;
}

.clients-count {
  margin: 0;
  color: #718096;
  font-weight: 500;
}

.clients-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.clients-table th {
  background: #f7fafc;
  padding: 16px;
  text-align: left;
  font-weight: 600;
  color: #2d3748;
  border-bottom: 2px solid #e2e8f0;
}

/* Larguras específicas para colunas */
.clients-table th:nth-child(2),
.clients-table td:nth-child(2) {
  /* Coluna Nome - reduzida */
  max-width: 280px !important;
  min-width: 200px !important;
  width: auto;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
}

.clients-table th:nth-child(3),
.clients-table td:nth-child(3) {
  /* Coluna CNPJ - aumentada */
  min-width: 180px !important;
  width: 180px !important;
  max-width: 180px !important;
  white-space: nowrap !important;
}

.clients-table td {
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  color: #4a5568;
}

.client-row:hover {
  background: #f7fafc;
}

.client-cnpj {
  font-family: 'Courier New', monospace;
  font-weight: 500;
  white-space: nowrap;
  min-width: 180px;
  width: 180px;
  max-width: 180px;
}

.client-name {
  font-weight: 500;
  max-width: 300px;
  min-width: 200px;
  width: auto;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
}

.client-corpem,
.client-storage {
  font-family: 'Courier New', monospace;
  color: #2d3748;
  font-weight: 500;
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-checkbox {
  margin: 0;
  cursor: default;
  width: 20px;
  height: 20px;
  transform: scale(1.2);
}

.status-checkbox:checked {
  opacity: 1 !important;
  background-color: #3498db;
  border-color: #3498db;
}

.client-actions {
  width: 80px;
  text-align: center;
  white-space: nowrap;
}

.action-btn {
  padding: 6px 8px;
  font-size: 0.875rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Modal de edição de cliente */
.edit-client-modal {
  max-width: 600px;
  width: 90%;
  height: 95vh !important;
  max-height: 95vh !important;
  min-height: 95vh !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  margin: 0 !important;
}

/* Modal header dentro do edit-client-modal */
.edit-client-modal .modal-header {
  flex-shrink: 0 !important;
}

/* Modal body dentro do edit-client-modal deve ter scroll */
.edit-client-modal .modal-body {
  flex: 1 !important;
  min-height: 0 !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  padding: 1.5rem !important;
}

/* Modal footer dentro do edit-client-modal */
.edit-client-modal .modal-footer {
  flex-shrink: 0 !important;
}

.edit-client-form .form-row {
  display: flex;
  flex-wrap: wrap; /* Permite quebra de linha quando há muitos cards (ex.: 4 checkboxes) */
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: flex-start;
}

.edit-client-form .form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Cards de checkbox: define base de 220px e permite wrap. Com 4 cards em um modal de
   ~600px, distribui em 2 linhas de 2 cards (≈290px cada) em vez de 4 cards esmagados. */
.edit-client-form .form-group:has(.checkbox-label) {
  flex: 1 1 220px;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

/* Criar espaço equivalente ao label acima do checkbox-label */
.edit-client-form .form-group:has(.checkbox-label)::before {
  content: '';
  height: 1.4rem;
  margin-bottom: 0.5rem;
  display: block;
}

.edit-client-form .form-group:has(.checkbox-label) .checkbox-label {
  margin-top: 0;
}

.edit-client-form .form-group:has(select) {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.edit-client-form .form-group:has(select) label {
  margin-bottom: 0.5rem;
  min-height: 1.4rem;
  display: flex;
  align-items: center;
}

.edit-client-form .form-group label {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  min-height: 1.4rem;
  display: flex;
  align-items: center;
}

/* Garantir que o label do select tenha a mesma altura que o checkbox-label */
.edit-client-form .form-group:has(select) label {
  height: 1.4rem;
  margin-bottom: 0.5rem;
}

/* Ajustar o checkbox-label para alinhar com o label do select */
.edit-client-form .form-group:has(.checkbox-label) {
  padding-top: 0;
}

.edit-client-form .form-group:has(.checkbox-label) .checkbox-label {
  margin-top: 0;
  align-self: flex-start;
}

.edit-client-form .form-control {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.2s ease;
  min-height: 2.75rem; /* Altura consistente para inputs e selects */
  box-sizing: border-box;
  width: 100%; /* Garantir largura total */
}

/* Garantir que o select tenha a mesma altura */
.edit-client-form select.form-control {
  min-height: 2.75rem;
  padding: 0.75rem;
}

.edit-client-form .form-control:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.edit-client-form .form-control:readonly {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.edit-client-form .help-text {
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.edit-client-form .checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
  min-height: 2.75rem; /* Mesma altura do select */
  box-sizing: border-box;
  width: 100%; /* Garantir largura total */
}

.edit-client-form .checkbox-label:hover {
  background: #e9ecef;
  border-color: #3498db;
}

.edit-client-form .form-checkbox {
  width: 18px;
  height: 18px;
  margin: 0;
}

.edit-client-form .checkbox-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #2c3e50;
}

.edit-client-form .checkbox-text i {
  color: #3498db;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e9ecef;
}

@media (orientation: portrait) {
  .edit-client-modal {
    width: 95%;
    margin: 1rem;
  }

  .edit-client-form .form-row {
    flex-direction: column;
    gap: 0;
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-footer .btn {
    width: 100%;
  }
}

.status-text {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-text.active {
  color: #38a169;
}

.status-text.inactive {
  color: #e53e3e;
}

/* Estilos para badge de Crossdocking */
.clients-table th:nth-child(5),
.client-crossdocking {
  text-align: center;
}

.crossdocking-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: help;
}

.crossdocking-always {
  background-color: #c6f6d5;
  color: #22543d;
  border: 1px solid #9ae6b4;
}

.crossdocking-optional {
  background-color: #feebc8;
  color: #7c2d12;
  border: 1px solid #fbd38d;
}

.crossdocking-none {
  background-color: #fed7d7;
  color: #742a2a;
  border: 1px solid #fc8181;
}

@media (orientation: portrait) {
  .admin-page {
    padding: 12px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .table-wrapper {
    font-size: 0.875rem;
  }

  .users-table th,
  .users-table td,
  .clients-table th,
  .clients-table td {
    padding: 12px 8px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
  }

  .checkbox-container {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }

  .status-text {
    font-size: 0.75rem;
  }
}
</style>
