<template>
  <div class="modal-overlay modal-overlay-edit-user" @click="closeModal">
    <div class="modal-container edit-user-modal" @click.stop>
      <div class="modal-header">
        <div class="header-content">
          <i class="fas fa-user-edit"></i>
          <div>
            <h2>Editar Usuário</h2>
            <p>Altere os dados do usuário ou exclua-o do sistema</p>
          </div>
        </div>
        <button @click="closeModal" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="saveUser" class="user-form">
          <!-- Campo Nome -->
          <div class="form-group">
            <label for="userName">Nome Completo</label>
            <input
              id="userName"
              v-model="formData.name"
              type="text"
              class="form-input"
              placeholder="Digite o nome completo"
              required
            />
          </div>

          <!-- Campo E-mail (somente leitura) -->
          <div class="form-group">
            <label for="userEmail">E-mail</label>
            <input
              id="userEmail"
              v-model="formData.user"
              type="email"
              class="form-input readonly"
              readonly
            />
            <small class="field-note">O e-mail não pode ser alterado</small>
          </div>

          <!-- Campo Nível de Acesso -->
          <div class="form-group">
            <label for="levelAccess">Nível de Acesso</label>
            <select
              id="levelAccess"
              v-model="formData.level_access"
              class="form-select"
              required
              :disabled="!canChangeLevel"
            >
              <option value="">Selecione o nível de acesso</option>
              <option value="1">Cliente</option>
              <option value="2">Administrador</option>
              <option value="3">Gerente</option>
              <option value="7">Expedição</option>
              <option value="8">Carga e Descarga</option>
              <option value="9">Recepção</option>
              <option v-if="currentUser?.level_access === 0" value="0">
                Desenvolvedor
              </option>
            </select>
            <small v-if="!canChangeLevel" class="field-note error">
              Você não tem permissão para alterar este usuário
            </small>
          </div>

          <!-- Campo de CDs (Storage) -->
          <div class="form-group storage-section">
            <label>
              <i class="fas fa-warehouse"></i>
              CDs com Acesso
            </label>
            <small class="field-note">
              Lista de Centros de Distribuição aos quais o usuário tem acesso
            </small>

            <!-- Loading de configuração -->
            <div v-if="loadingConfig" class="storage-loading">
              <i class="fas fa-spinner fa-spin"></i>
              Carregando configurações...
            </div>

            <!-- Lista de CDs -->
            <div v-else class="storage-list">
              <div
                v-for="(cd, index) in formData.storage"
                :key="index"
                class="storage-item"
              >
                <span class="storage-code">{{ cd }}</span>
                <button
                  type="button"
                  @click="removeCD(index)"
                  class="remove-cd-btn"
                  :disabled="loading"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>

              <!-- Mensagem se não houver CDs -->
              <div v-if="formData.storage.length === 0" class="no-storage">
                <i class="fas fa-info-circle"></i>
                Nenhum CD configurado (acesso total)
              </div>
            </div>

            <!-- Dropdown para adicionar CD (apenas siglas cadastradas) -->
            <div class="add-storage">
              <select
                v-model="selectedCDToAdd"
                class="form-input cd-select"
                :disabled="loading || storageOptions.length === 0"
              >
                <option value="">
                  {{
                    storageOptions.length > 0
                      ? 'Selecione um CD para adicionar'
                      : 'Nenhum armazém cadastrado'
                  }}
                </option>
                <option
                  v-for="s in storageOptions"
                  :key="s.id"
                  :value="s.corpem"
                >
                  {{ s.corpem }}
                </option>
              </select>
              <button
                type="button"
                @click="addCDFromSelect"
                class="add-cd-btn"
                :disabled="
                  loading || !selectedCDToAdd || storageOptions.length === 0
                "
              >
                <i class="fas fa-plus"></i>
                Adicionar
              </button>
            </div>
          </div>

          <!-- Informações do usuário -->
          <div class="user-info">
            <div class="info-item">
              <strong>ID do usuário:</strong> {{ user.id }}
            </div>
            <div class="info-item">
              <strong>Nível atual:</strong>
              <span :class="getLevelClass(user.level_access)">
                {{ getLevelText(user.level_access) }}
              </span>
            </div>
          </div>
        </form>
      </div>

      <div class="modal-footer">
        <div class="footer-left">
          <button
            @click="confirmDelete"
            class="delete-user-btn"
            :disabled="loading || !canDelete"
            type="button"
          >
            <i class="fas fa-trash"></i>
            Excluir Usuário
          </button>
          <small v-if="!canDelete" class="delete-note">
            {{ deleteRestrictionReason }}
          </small>
        </div>

        <div class="footer-right">
          <button @click="closeModal" class="cancel-btn" :disabled="loading">
            Cancelar
          </button>
          <button
            @click="saveUser"
            class="save-btn"
            :disabled="loading || !canSave"
            type="submit"
          >
            <i class="fas fa-spinner fa-spin" v-if="loading"></i>
            <i class="fas fa-save" v-else></i>
            {{ loading ? 'Salvando...' : 'Salvar Alterações' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { BASE_URL } from '../config/api.js'

export default {
  name: 'EditUserModal',
  props: {
    user: {
      type: Object,
      required: true,
    },
    currentUser: {
      type: Object,
      default: null,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['close', 'save', 'delete', 'notification'],
  setup(props, { emit }) {
    const formData = ref({
      name: '',
      user: '',
      level_access: '',
      storage: [],
    })

    const selectedCDToAdd = ref('')
    const loadingConfig = ref(false)
    const storageChanged = ref(false)
    const storages = ref([])

    // CDs disponíveis para adicionar (apenas com corpem, excluir os já na lista)
    const storageOptions = computed(() => {
      const current = formData.value.storage || []
      return (storages.value || []).filter(
        s => s.corpem && !current.includes(s.corpem)
      )
    })

    // Converter para number se necessário
    const getCurrentUserLevel = () => {
      return parseInt(props.currentUser?.level_access) || 0
    }

    const getTargetUserLevel = () => {
      return parseInt(props.user?.level_access) || 0
    }

    // Verificar se pode alterar o nível do usuário
    const canChangeLevel = computed(() => {
      const currentLevel = getCurrentUserLevel()
      const targetLevel = getTargetUserLevel()

      // Desenvolvedores (0) podem alterar qualquer um, incluindo outros desenvolvedores
      if (currentLevel === 0) return true

      // Gerentes (3) podem alterar usuários de nível inferior
      if (currentLevel === 3) {
        return targetLevel > 3 // Só recepção (9) e clientes (1)
      }

      // Administradores (2) podem alterar clientes (1) e recepção (9)
      if (currentLevel === 2) {
        return targetLevel === 1 || targetLevel === 9
      }

      return false
    })

    // Verificar se pode excluir o usuário
    const canDelete = computed(() => {
      const currentLevel = getCurrentUserLevel()
      const targetLevel = getTargetUserLevel()

      // Não pode excluir próprio usuário
      if (props.user.id === props.currentUser?.id) return false

      // Desenvolvedores podem excluir qualquer um, incluindo outros desenvolvedores (exceto próprio)
      if (currentLevel === 0) return true

      // Para outros níveis, não pode excluir desenvolvedores
      if (targetLevel === 0) return false

      // Gerentes podem excluir usuários de nível inferior
      if (currentLevel === 3) {
        return targetLevel > 3
      }

      return false
    })

    // Razão da restrição de exclusão
    const deleteRestrictionReason = computed(() => {
      if (props.user.id === props.currentUser?.id) {
        return 'Você não pode excluir sua própria conta'
      }
      if (getTargetUserLevel() === 0 && getCurrentUserLevel() !== 0) {
        return 'Apenas desenvolvedores podem excluir outros desenvolvedores'
      }
      return 'Você não tem permissão para excluir este usuário'
    })

    // Verificar se pode salvar (se houve alterações)
    const canSave = computed(() => {
      return (
        (formData.value.name !== props.user.name ||
          parseInt(formData.value.level_access) !== props.user.level_access ||
          storageChanged.value) &&
        canChangeLevel.value
      )
    })

    // Carregar configurações do usuário (incluindo storage)
    const loadUserConfig = async () => {
      loadingConfig.value = true
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(
          `${BASE_URL}/user-settings/user/${props.user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.ok) {
          const data = await response.json()
          formData.value.storage = data.settings?.storage || []
        } else {
          console.warn('Erro ao carregar configurações do usuário')
          formData.value.storage = []
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
        formData.value.storage = []
      } finally {
        loadingConfig.value = false
      }
    }

    const loadStorages = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`${BASE_URL}/storage`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const data = await response.json()
          storages.value = Array.isArray(data) ? data : []
        }
      } catch (err) {
        console.warn('Erro ao carregar armazéns:', err)
        storages.value = []
      }
    }

    const addCDFromSelect = () => {
      const cd = (selectedCDToAdd.value || '').trim()
      if (!cd) return
      if (formData.value.storage.includes(cd)) return
      formData.value.storage.push(cd)
      selectedCDToAdd.value = ''
      storageChanged.value = true
    }

    // Remover CD da lista
    const removeCD = index => {
      formData.value.storage.splice(index, 1)
      storageChanged.value = true
    }

    // Salvar storage no backend
    const saveStorage = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(
          `${BASE_URL}/user-settings/user/${props.user.id}/storage`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              storage: formData.value.storage,
            }),
          }
        )

        if (!response.ok) {
          throw new Error('Erro ao salvar lista de CDs')
        }

        console.log('✅ Lista de CDs salva com sucesso')
        storageChanged.value = false
      } catch (error) {
        console.error('Erro ao salvar storage:', error)
        throw error
      }
    }

    // Inicializar dados do formulário quando o usuário muda
    watch(
      () => props.user,
      newUser => {
        if (newUser) {
          const level = newUser.level_access
          formData.value = {
            name: newUser.name || '',
            user: newUser.user || '',
            level_access: level !== undefined && level !== null ? level : '',
            storage: [],
          }
          storageChanged.value = false
          selectedCDToAdd.value = ''
          loadUserConfig()
          loadStorages()
        }
      },
      { immediate: true }
    )

    const closeModal = () => {
      emit('close')
    }

    const saveUser = async () => {
      if (!canSave.value) return

      try {
        // Salvar storage se foi alterado
        if (storageChanged.value) {
          await saveStorage()
        }

        // Emitir evento de salvamento dos outros dados (garantir level_access numérico para evitar 400)
        const levelAccess = Number(formData.value.level_access)
        const levelAccessValid =
          Number.isInteger(levelAccess) && levelAccess >= 0 && levelAccess <= 9
        emit('save', {
          name: formData.value.name ?? props.user.name,
          level_access: levelAccessValid
            ? levelAccess
            : (props.user.level_access ?? 0),
        })
      } catch (error) {
        emit(
          'notification',
          'Erro ao salvar configurações do usuário: ' + error.message,
          'error'
        )
      }
    }

    const confirmDelete = () => {
      if (!canDelete.value) return
      emit('delete', props.user)
    }

    // Utilitários para nível de acesso
    const getLevelText = level => {
      const levels = {
        0: 'Desenvolvedor',
        1: 'Cliente',
        2: 'Administrador',
        3: 'Gerente',
        7: 'Expedição',
        8: 'Carga e Descarga',
        9: 'Recepção',
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
        9: 'level-conferente',
      }
      return classes[level] || 'level-unknown'
    }

    return {
      formData,
      selectedCDToAdd,
      loadingConfig,
      storageChanged,
      storageOptions,
      canChangeLevel,
      canDelete,
      canSave,
      deleteRestrictionReason,
      closeModal,
      saveUser,
      confirmDelete,
      getLevelText,
      getLevelClass,
      addCDFromSelect,
      removeCD,
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
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1vh 20px;
  box-sizing: border-box;
}

.modal-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 500px;
  height: 98vh;
  max-height: 98vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
  background: #f7fafc;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-content i {
  font-size: 1.5rem;
  color: #718096;
}

.header-content h2 {
  margin: 0;
  color: #2d3748;
  font-size: 1.25rem;
  font-weight: 600;
}

.header-content p {
  margin: 0;
  color: #718096;
  font-size: 0.875rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #718096;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #4a5568;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.user-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-weight: 600;
  color: #2d3748;
  font-size: 0.875rem;
}

.form-input,
.form-select {
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: white;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.readonly {
  background: #f7fafc;
  color: #718096;
  cursor: not-allowed;
}

.field-note {
  font-size: 0.75rem;
  color: #718096;
}

.field-note.error {
  color: #e53e3e;
}

.user-info {
  background: #f7fafc;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 0.875rem;
}

.info-item strong {
  color: #2d3748;
}

/* Níveis de acesso */
.level-developer {
  background: #2d3748;
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.level-cliente {
  background: #e2e8f0;
  color: #4a5568;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.level-admin {
  background: #3182ce;
  color: #ffffff;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.level-manager {
  background: #c6f6d5;
  color: #2f855a;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.level-expedicao {
  background: #fed7aa;
  color: #c2410c;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.level-conferente {
  background: #bee3f8;
  color: #2c5282;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Storage Section */
.storage-section {
  background: #f7fafc;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.storage-section label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #2d3748;
  font-weight: 600;
}

.storage-section label i {
  color: #667eea;
}

.storage-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  color: #718096;
  font-size: 0.875rem;
}

.storage-loading i {
  color: #667eea;
}

.storage-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
  min-height: 40px;
}

.storage-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.storage-item:hover {
  border-color: #cbd5e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.storage-code {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #2d3748;
  font-size: 0.875rem;
}

.remove-cd-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #fed7d7;
  color: #c53030;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
}

.remove-cd-btn:hover:not(:disabled) {
  background: #fc8181;
  color: white;
}

.remove-cd-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.no-storage {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: white;
  border: 1px dashed #cbd5e0;
  border-radius: 6px;
  color: #718096;
  font-size: 0.875rem;
}

.no-storage i {
  color: #a0aec0;
}

.add-storage {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.cd-input,
.cd-select {
  flex: 1;
}

.cd-input {
  text-transform: uppercase;
}

.cd-select {
  min-width: 180px;
}

.add-cd-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: #48bb78;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  white-space: nowrap;
}

.add-cd-btn:hover:not(:disabled) {
  background: #38a169;
  transform: translateY(-1px);
}

.add-cd-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
  transform: none;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
  border-top: 1px solid #e2e8f0;
  background: #f7fafc;
}

.footer-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer-right {
  display: flex;
  gap: 12px;
}

.delete-user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.delete-user-btn:hover:not(:disabled) {
  background: #c53030;
  transform: translateY(-1px);
}

.delete-user-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

.delete-note {
  font-size: 0.75rem;
  color: #e53e3e;
  max-width: 180px;
}

.cancel-btn {
  padding: 10px 20px;
  background: #e2e8f0;
  color: #4a5568;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover:not(:disabled) {
  background: #cbd5e0;
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #48bb78;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-btn:hover:not(:disabled) {
  background: #38a169;
  transform: translateY(-1px);
}

.save-btn:disabled {
  background: #a0aec0;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .modal-container {
    margin: 10px;
    max-width: none;
  }

  .modal-footer {
    flex-direction: column;
    gap: 16px;
  }

  .footer-right {
    width: 100%;
  }

  .cancel-btn,
  .save-btn {
    flex: 1;
  }
}
</style>
