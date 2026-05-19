<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-container">
      <!-- Header do modal -->
      <div class="modal-header">
        <div class="header-info">
          <h2>
            <i class="fas fa-building"></i>
            Gerenciar CNPJs
          </h2>
          <p class="user-info">
            <span class="user-email">{{ user.user }}</span>
            <span class="user-name" v-if="user.name">{{ user.name }}</span>
          </p>
        </div>
        <button @click="$emit('close')" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Barra de pesquisa e filtro por estabelecimento -->
      <div class="search-section">
        <div class="search-container">
          <div class="search-input-wrapper">
            <i class="fas fa-search"></i>
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Pesquisar por nome, CNPJ ou número..."
              class="search-input"
              autocomplete="off"
              data-lpignore="true"
              data-form-type="other"
              name="clients-modal-search"
            />
            <button
              v-if="searchTerm"
              @click="clearSearch"
              class="clear-search-btn"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="filter-row" v-if="(adminsOptions || []).length > 0">
          <label class="filter-label">
            <i class="fas fa-user-shield"></i>
            Administrador:
          </label>
          <select
            :value="adminEstablishmentsFilterId"
            @change="onAdminChange($event)"
            class="filter-select filter-select-admin"
            title="Restringe a lista aos estabelecimentos dos clientes vinculados a este admin. Nenhum = lista completa, sem filtro por admin."
          >
            <option value="">Nenhum (todos os clientes)</option>
            <option v-for="u in adminsOptions || []" :key="u.id" :value="u.id">
              {{ u.name || u.user }} ({{ u.user }})
            </option>
          </select>
        </div>
        <div class="filter-row" v-if="opcoesAdmDistintos.length > 0">
          <label class="filter-label">
            <i class="fas fa-user-tag"></i>
            Adm (responsável):
          </label>
          <select
            v-model="filterAdm"
            class="filter-select"
            title="Filtrar clientes pelo responsável (adm da wcl) para vincular ao usuário"
          >
            <option value="">Todos</option>
            <option
              v-for="a in opcoesAdmDistintos"
              :key="'adm-' + (a || '_vazio')"
              :value="a || ''"
            >
              {{ a || '(vazio)' }}
            </option>
          </select>
        </div>
        <div class="filter-row" v-if="estabelecimentosOptions.length > 0">
          <label class="filter-label">
            <i class="fas fa-warehouse"></i>
            Estabelecimento:
          </label>
          <select
            v-model="filterEstabelecimento"
            class="filter-select"
            title="Filtrar clientes por estabelecimento (ML, C2, VN...)"
          >
            <option value="">Todos</option>
            <option
              v-for="est in estabelecimentosOptions"
              :key="est"
              :value="est"
            >
              {{ est }}
            </option>
          </select>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-section">
        <div class="loader-spinner"></div>
        <p>Carregando clientes...</p>
      </div>

      <!-- Conteúdo principal -->
      <div v-else class="modal-content">
        <div class="content-columns">
          <!-- Coluna da esquerda: Clientes selecionados -->
          <div class="selected-column">
            <div class="section-header">
              <h3>
                <i class="fas fa-check-circle"></i>
                Clientes Selecionados
                <span class="count"
                  >({{ filteredSelectedClients.length }})</span
                >
              </h3>
            </div>
            <div class="selected-clients">
              <div
                v-if="filteredSelectedClients.length === 0"
                class="no-selected"
              >
                <i class="fas fa-info-circle"></i>
                <p v-if="selectedClients.length === 0">
                  Nenhum cliente selecionado
                </p>
                <p v-else>Nenhum cliente encontrado na busca</p>
              </div>
              <div
                v-else
                v-for="client in filteredSelectedClients"
                :key="client.cnpj"
                class="selected-client-item"
              >
                <div class="client-info">
                  <div class="client-name">{{ client.nome }}</div>
                </div>
                <div class="client-meta-horizontal">
                  <span class="client-number">№ {{ client.numero }}</span>
                  <span class="client-cnpj">{{ formatCNPJ(client.cnpj) }}</span>
                  <span
                    class="client-adm"
                    v-if="client.adm"
                    :title="`Adm: ${client.adm}`"
                  >
                    {{ client.adm }}
                  </span>
                </div>
                <button
                  @click="toggleClient(client)"
                  class="remove-btn"
                  title="Remover cliente"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Coluna da direita: Todos os clientes -->
          <div class="clients-column">
            <div class="section-header section-header-with-action">
              <h3>
                <i class="fas fa-list"></i>
                Todos os Clientes
                <span class="count">({{ filteredClients.length }})</span>
              </h3>
              <button
                v-if="filteredClients.length > 0"
                type="button"
                class="btn-add-all"
                @click="addAllFilteredClients"
                title="Liberar todos os clientes listados para este usuário"
              >
                <i class="fas fa-plus-circle"></i>
                Liberar todos os listados ({{ filteredClients.length }})
              </button>
            </div>

            <div class="clients-list">
              <div v-if="filteredClients.length === 0" class="no-clients">
                <i class="fas fa-search"></i>
                <p>Nenhum cliente encontrado</p>
              </div>

              <div
                v-for="client in filteredClients"
                :key="client.cnpj"
                class="client-item"
                :class="{ selected: isSelected(client) }"
              >
                <div class="client-checkbox">
                  <input
                    type="checkbox"
                    :id="`client-${client.cnpj}`"
                    :checked="isSelected(client)"
                    @change="toggleClient(client)"
                  />
                  <label
                    :for="`client-${client.cnpj}`"
                    class="checkbox-custom"
                  ></label>
                </div>

                <div class="client-details">
                  <div class="client-name">{{ client.nome }}</div>
                </div>
                <div class="client-meta-horizontal">
                  <span class="client-number">№ {{ client.numero }}</span>
                  <span class="client-cnpj">{{ formatCNPJ(client.cnpj) }}</span>
                  <span
                    class="client-estab"
                    v-if="client.estabelecimento"
                    :title="`Estabelecimento: ${client.estabelecimento}`"
                  >
                    {{ client.estabelecimento }}
                  </span>
                  <span
                    class="client-adm"
                    v-if="client.adm"
                    :title="`Adm: ${client.adm}`"
                  >
                    {{ client.adm }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer com ações -->
      <div class="modal-footer">
        <div class="selected-count">
          {{ selectedClients.length }} cliente{{
            selectedClients.length !== 1 ? 's' : ''
          }}
          selecionado{{ selectedClients.length !== 1 ? 's' : '' }}
        </div>
        <div class="footer-actions">
          <button @click="$emit('close')" class="btn btn-secondary">
            <i class="fas fa-times"></i>
            Cancelar
          </button>
          <button
            @click="handleSave"
            class="btn btn-primary"
            :disabled="saving"
          >
            <i class="fas fa-spinner fa-spin" v-if="saving"></i>
            <i class="fas fa-save" v-else></i>
            {{ saving ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'

export default {
  name: 'ClientsModal',
  props: {
    user: {
      type: Object,
      required: true,
    },
    usersList: {
      type: Array,
      default: () => [],
    },
    clients: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close', 'save'],
  setup(props, { emit }) {
    // Estado reativo
    const searchTerm = ref('')
    const filterEstabelecimento = ref('')
    const filterAdm = ref('')
    const selectedClients = ref([])
    const saving = ref(false)
    /** '' = sem filtro por admin; caso contrário, id do admin cujo cli_access define os estabelecimentos */
    const adminEstablishmentsFilterId = ref('')

    // Lista apenas de administradores (níveis 0, 2, 3) para o dropdown — ex.: SAYMON, não todos os usuários
    const adminsOptions = computed(() => {
      const levels = [0, 2, 3] // Desenvolvedor, Administrador, Gerente
      const list = props.usersList.filter(u =>
        levels.includes(Number(u.level_access))
      )
      const ids = new Set(list.map(u => u.id))
      if (props.user && props.user.id && !ids.has(props.user.id)) {
        list.push(props.user)
      }
      return list.sort((a, b) =>
        String(a.name || a.user || '').localeCompare(
          String(b.name || b.user || '')
        )
      )
    })

    const adminScopeUser = computed(() => {
      const raw = adminEstablishmentsFilterId.value
      if (raw === '' || raw == null) return null
      const id = Number(raw)
      if (!Number.isFinite(id)) return null
      let u = props.usersList.find(x => Number(x.id) === id)
      if (!u && props.user && Number(props.user.id) === id) u = props.user
      return u || null
    })

    // Estabelecimentos do admin escopo no dropdown — para filtrar "Todos os Clientes" (vazio = sem filtro)
    const establishmentsOfSelectedAdmin = computed(() => {
      const scopeUser = adminScopeUser.value
      if (
        !scopeUser ||
        !scopeUser.cli_access ||
        typeof scopeUser.cli_access !== 'object'
      )
        return []
      const set = new Set()
      const norm = v => (String(v || '').replace(/\D/g, '') || '').trim()
      const clientList = clientsDeduped.value
      for (const cnpj of Object.keys(scopeUser.cli_access)) {
        const data = scopeUser.cli_access[cnpj]
        let e =
          data &&
          data.estabelecimento != null &&
          String(data.estabelecimento).trim()
            ? String(data.estabelecimento).trim()
            : null
        if (!e && clientList.length > 0) {
          const key = norm(cnpj)
          const client = clientList.find(c => norm(c.cnpj) === key)
          if (
            client &&
            client.estabelecimento != null &&
            String(client.estabelecimento).trim()
          ) {
            e = String(client.estabelecimento).trim()
          }
        }
        if (e) set.add(e)
      }
      return Array.from(set)
    })

    // Valores distintos de adm (responsável wcl) para filtrar e vincular ao usuário
    const opcoesAdmDistintos = computed(() => {
      const set = new Set()
      const list = clientsDeduped.value
      for (const c of list) {
        const a = (c.adm != null ? String(c.adm).trim() : '') || ''
        if (a) set.add(a)
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
    })

    // Lista de estabelecimentos únicos (ML, C2, VN...) para o filtro
    const estabelecimentosOptions = computed(() => {
      const set = new Set()
      const list = clientsDeduped.value
      for (const c of list) {
        const e =
          c.estabelecimento != null && String(c.estabelecimento).trim()
            ? String(c.estabelecimento).trim()
            : null
        if (e) set.add(e)
      }
      return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)))
    })

    // Deduplicar clientes por CNPJ (evita duplicatas vindas da API ou de múltiplas fontes)
    const clientsDeduped = computed(() => {
      const seen = new Set()
      const norm = v => (String(v || '').replace(/\D/g, '') || '').trim()
      return props.clients.filter(c => {
        const key = norm(c.cnpj)
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      })
    })

    // Computed
    const filteredClients = computed(() => {
      let filtered = clientsDeduped.value.filter(client => !isSelected(client))

      // Filtro pelo admin selecionado: apenas clientes dos estabelecimentos desse admin (ex.: SAYMON)
      const adminEstabs = establishmentsOfSelectedAdmin.value
      if (adminEstabs.length > 0) {
        filtered = filtered.filter(client => {
          const e =
            client.estabelecimento != null &&
            String(client.estabelecimento).trim()
              ? String(client.estabelecimento).trim()
              : ''
          return e && adminEstabs.includes(e)
        })
      }

      // Filtro por adm (responsável wcl) — para vincular clientes ao usuário
      if (filterAdm.value && filterAdm.value.trim()) {
        const admVal = filterAdm.value.trim().toLowerCase()
        filtered = filtered.filter(client => {
          const a = (client.adm != null ? String(client.adm).trim() : '') || ''
          return a.toLowerCase() === admVal
        })
      }

      // Filtro por estabelecimento (manual)
      if (filterEstabelecimento.value && filterEstabelecimento.value.trim()) {
        const est = filterEstabelecimento.value.trim()
        filtered = filtered.filter(client => {
          const e =
            client.estabelecimento != null &&
            String(client.estabelecimento).trim()
              ? String(client.estabelecimento).trim()
              : ''
          return e === est
        })
      }

      // Filtrar por termo de busca localmente
      if (searchTerm.value && searchTerm.value.trim()) {
        const term = searchTerm.value.toLowerCase().trim()

        filtered = filtered.filter(client => {
          const nome = (client.nome || '').toLowerCase()
          const numero = (client.numero || '').toLowerCase()
          const cnpj = (client.cnpj || '').replace(/\D/g, '')
          const termClean = term.replace(/\D/g, '')

          const matchNome = nome.includes(term)
          const matchNumero = numero.includes(term)
          // Só buscar no CNPJ se o termo tiver números
          const matchCnpj = termClean.length > 0 && cnpj.includes(termClean)

          return matchNome || matchNumero || matchCnpj
        })
      }

      return filtered
    })

    // Computed para filtrar clientes selecionados
    const filteredSelectedClients = computed(() => {
      let filtered = selectedClients.value

      // Aplicar o mesmo filtro de busca
      if (searchTerm.value && searchTerm.value.trim()) {
        const term = searchTerm.value.toLowerCase().trim()

        filtered = filtered.filter(client => {
          const nome = (client.nome || '').toLowerCase()
          const numero = (client.numero || '').toLowerCase()
          const cnpj = (client.cnpj || '').replace(/\D/g, '')
          const termClean = term.replace(/\D/g, '')

          const matchNome = nome.includes(term)
          const matchNumero = numero.includes(term)
          const matchCnpj = termClean.length > 0 && cnpj.includes(termClean)

          return matchNome || matchNumero || matchCnpj
        })
      }

      return filtered
    })

    // Métodos
    const isSelected = client => {
      return selectedClients.value.some(
        selected => selected.cnpj === client.cnpj
      )
    }

    const toggleClient = client => {
      const index = selectedClients.value.findIndex(
        selected => selected.cnpj === client.cnpj
      )

      if (index >= 0) {
        // Remover cliente
        selectedClients.value.splice(index, 1)
      } else {
        // Adicionar cliente
        selectedClients.value.push({ ...client })
      }
    }

    // Adicionar todos os clientes atualmente listados (filtrados) à seleção
    const addAllFilteredClients = () => {
      const toAdd = filteredClients.value.filter(
        client => !selectedClients.value.some(s => s.cnpj === client.cnpj)
      )
      toAdd.forEach(client => selectedClients.value.push({ ...client }))
    }

    const onAdminChange = event => {
      const v = event.target.value
      adminEstablishmentsFilterId.value = v === '' ? '' : String(v)
    }

    const clearSearch = () => {
      searchTerm.value = ''
    }

    const formatCNPJ = cnpj => {
      if (!cnpj) return ''
      const digits = cnpj.replace(/\D/g, '')
      if (digits.length === 14) {
        return digits.replace(
          /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
          '$1.$2.$3/$4-$5'
        )
      }
      return cnpj
    }

    const handleSave = async () => {
      saving.value = true
      try {
        await emit('save', selectedClients.value)
      } finally {
        saving.value = false
      }
    }

    const loadUserCurrentAccess = () => {
      // Carregar acessos atuais do usuário (deduplicar por CNPJ)
      if (props.user.cli_access) {
        const norm = v => (String(v || '').replace(/\D/g, '') || '').trim()
        const byCnpj = new Map()
        for (const cnpj of Object.keys(props.user.cli_access)) {
          const data = props.user.cli_access[cnpj]
          const key = norm(cnpj)
          if (key && !byCnpj.has(key)) {
            byCnpj.set(key, {
              cnpj,
              nome: data.nome,
              numero: data.numero,
              estabelecimento:
                data.estabelecimento != null
                  ? String(data.estabelecimento).trim()
                  : '',
            })
          }
        }
        selectedClients.value = Array.from(byCnpj.values())
      }
    }

    // Lifecycle
    onMounted(() => {
      loadUserCurrentAccess()
    })

    // Enriquecer selectedClients com adm quando clients carregar (clientes vindos de cli_access não têm adm)
    watch(
      () => props.clients,
      newClients => {
        if (!newClients?.length || !selectedClients.value.length) return
        const norm = v => (String(v || '').replace(/\D/g, '') || '').trim()
        const byCnpj = new Map(newClients.map(c => [norm(c.cnpj), c]))
        selectedClients.value = selectedClients.value.map(sc => {
          const full = byCnpj.get(norm(sc.cnpj))
          return full && full.adm ? { ...sc, adm: full.adm } : sc
        })
      },
      { deep: true }
    )

    // Watchers
    watch(
      () => props.user,
      u => {
        loadUserCurrentAccess()
        adminEstablishmentsFilterId.value =
          u && u.id != null ? String(u.id) : ''
      },
      { deep: true, immediate: true }
    )

    return {
      searchTerm,
      filterEstabelecimento,
      filterAdm,
      opcoesAdmDistintos,
      adminsOptions,
      estabelecimentosOptions,
      selectedClients,
      saving,
      filteredClients,
      filteredSelectedClients,
      isSelected,
      toggleClient,
      addAllFilteredClients,
      onAdminChange,
      clearSearch,
      formatCNPJ,
      handleSave,
    }
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
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 90vw;
  height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  box-sizing: border-box;
  max-width: none !important;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-bottom: 2px solid #e2e8f0;
  background: #f7fafc;
}

.header-info h2 {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 8px 0;
  color: #2d3748;
  font-size: 1.5rem;
  font-weight: 600;
}

.header-info h2 i {
  color: #667eea;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  color: #718096;
}

.user-email {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #4a5568;
}

.user-name {
  font-style: italic;
}

.close-btn {
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #c53030;
  transform: scale(1.05);
}

.search-section {
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: white;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: #4a5568;
  font-size: 0.9rem;
}

.filter-label i {
  color: #667eea;
}

.filter-select {
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  min-width: 140px;
  background: white;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

.filter-select-admin {
  min-width: 240px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input-wrapper i {
  position: absolute;
  left: 16px;
  color: #a0aec0;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 16px 16px 16px 48px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
  outline: none;
}

.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  background: #e2e8f0;
  color: #718096;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  background: #cbd5e0;
  color: #4a5568;
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 60px 20px;
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

.modal-content {
  flex: 1 1 auto;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100% !important;
  min-width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box;
}

.content-columns {
  display: flex;
  flex: 1 1 auto;
  gap: 16px;
  overflow: hidden;
  padding: 16px;
  width: 100% !important;
  min-width: 100% !important;
  box-sizing: border-box;
}

.selected-column {
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f0fff4;
  border: 2px solid #c6f6d5;
  border-radius: 12px;
  min-width: 0;
  max-width: 50%;
}

.section-header {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
}

.section-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  color: #2d3748;
  font-size: 1.125rem;
  font-weight: 600;
}

.section-header-with-action {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-header-with-action h3 {
  margin: 0;
}

.btn-add-all {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-add-all:hover {
  background: #5a67d8;
  transform: translateY(-1px);
}

.count {
  color: #718096;
  font-weight: 400;
  font-size: 0.9rem;
}

.selected-clients {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  box-sizing: border-box;
}

.selected-client-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  margin-bottom: 6px;
  background: white;
  border: 1px solid #c6f6d5;
  border-radius: 8px;
  transition: all 0.2s ease;
  min-height: 50px;
  width: calc(100% - 2px);
  box-sizing: border-box;
}

.selected-client-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.selected-client-item .client-info {
  flex: 1;
  min-width: 0;
  margin-right: 16px;
}

.selected-client-item .client-name {
  font-weight: 600;
  color: #2d3748;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-btn {
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.remove-btn:hover {
  background: #c53030;
  transform: scale(1.1);
}

.clients-column {
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  min-width: 0;
  max-width: 50%;
}

.clients-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  box-sizing: border-box;
}

.no-clients,
.no-selected {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #a0aec0;
  text-align: center;
}

.no-clients i,
.no-selected i {
  font-size: 2.5rem;
  margin-bottom: 12px;
}

.no-selected {
  color: #48bb78;
}

.no-selected i {
  color: #68d391;
}

.client-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  margin-bottom: 6px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 50px;
  width: calc(100% - 2px);
  box-sizing: border-box;
}

.client-item:hover {
  border-color: #667eea;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
}

.client-item.selected {
  border-color: #48bb78;
  background: #f0fff4;
}

.client-checkbox {
  position: relative;
}

.client-checkbox input[type='checkbox'] {
  opacity: 0;
  position: absolute;
  width: 20px;
  height: 20px;
}

.checkbox-custom {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-radius: 4px;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
}

.client-checkbox input:checked + .checkbox-custom {
  background: #48bb78;
  border-color: #48bb78;
}

.client-checkbox input:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.client-details {
  flex: 1;
  min-width: 0; /* Permite truncar texto se necessário */
  margin-right: 16px;
}

.client-name {
  font-weight: 600;
  color: #2d3748;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.client-meta-horizontal {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 0.875rem;
  color: #718096;
  flex-shrink: 0;
  min-width: 250px;
  justify-content: flex-end;
}

.client-number {
  font-weight: 500;
  background: #f7fafc;
  padding: 4px 8px;
  border-radius: 4px;
  min-width: 70px;
  text-align: center;
  font-size: 0.8rem;
}

.client-cnpj {
  font-family: 'Courier New', monospace;
  font-weight: 500;
  background: #edf2f7;
  padding: 4px 8px;
  border-radius: 4px;
  min-width: 160px;
  text-align: center;
  font-size: 0.8rem;
}

.client-estab {
  font-size: 0.75rem;
  font-weight: 600;
  background: #e6fffa;
  color: #234e52;
  padding: 2px 6px;
  border-radius: 4px;
  min-width: 32px;
  text-align: center;
}

.client-adm {
  font-size: 0.75rem;
  font-weight: 600;
  background: #edf2f7;
  color: #4a5568;
  padding: 2px 6px;
  border-radius: 4px;
  min-width: 40px;
  text-align: center;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-top: 2px solid #e2e8f0;
  background: #f7fafc;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
}

.selected-count {
  font-weight: 600;
  color: #4a5568;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
}

.btn-primary {
  background: #48bb78;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #38a169;
}

.btn-primary:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .modal-container {
    width: 95vw;
    height: 95vh;
    margin: 20px;
  }

  .modal-header {
    padding: 16px;
  }

  .header-info h2 {
    font-size: 1.25rem;
  }

  .user-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .search-section {
    padding: 16px;
  }

  .selected-clients {
    max-height: 150px;
  }

  .client-meta-horizontal {
    flex-direction: column;
    gap: 8px;
    min-width: auto;
    align-items: flex-start;
  }

  .client-details {
    flex: 1;
  }

  .client-item {
    flex-wrap: wrap;
    min-height: auto;
  }

  .selected-client-item {
    flex-wrap: wrap;
    min-height: auto;
  }

  .client-number,
  .client-cnpj {
    min-width: auto;
    text-align: left;
  }

  .content-columns {
    flex-direction: column;
    gap: 12px;
    padding: 0 12px;
  }

  .selected-column,
  .clients-column {
    min-height: 200px;
  }

  .selected-clients {
    max-height: 150px;
  }

  .modal-footer {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .footer-actions {
    justify-content: center;
  }
}
</style>
