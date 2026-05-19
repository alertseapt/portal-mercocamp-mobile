<template>
  <div v-if="showModal" class="modal-overlay" @click="handleModalClick">
    <div
      class="modal-content large schedule-edit-modal"
      ref="modal"
      tabindex="-1"
    >
      <!-- Header -->
      <div class="modal-header">
        <h3>
          <i class="fas fa-edit"></i>
          Editar Agendamento
        </h3>
        <button class="btn-close" @click="closeModal">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Errors -->
      <div v-if="errors.length > 0" class="error-container">
        <div
          v-for="(error, index) in errors"
          :key="index"
          class="error-message"
        >
          <i class="fas fa-exclamation-triangle"></i>
          {{ error }}
          <button @click="removeError(index)" class="btn-close-error">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <!-- Form -->
      <div class="modal-body">
        <form @submit.prevent="updateSchedule" class="edit-form">
          <!-- Informações Básicas -->
          <div class="form-section">
            <h4><i class="fas fa-info-circle"></i> Informações Básicas</h4>
            <div class="form-row">
              <div class="form-group">
                <label for="nfe_number">Número da NF-e</label>
                <input
                  id="nfe_number"
                  v-model="formData.number"
                  type="text"
                  class="form-control"
                  readonly
                />
              </div>
              <div class="form-group">
                <label for="nfe_key">Chave da NF-e</label>
                <input
                  id="nfe_key"
                  v-model="formData.nfe_key"
                  type="text"
                  class="form-control"
                  readonly
                />
              </div>
            </div>
          </div>

          <!-- Status e Data -->
          <div class="form-section">
            <h4><i class="fas fa-calendar-check"></i> Agendamento</h4>
            <div class="form-row">
              <div class="form-group">
                <label for="status">Status</label>
                <select
                  id="status"
                  v-model="formData.status"
                  class="form-control"
                  required
                >
                  <option value="">Selecione um status</option>
                  <option value="Solicitado">Solicitado</option>
                  <option value="Agendado">Agendado</option>
                  <option value="Conferência">Conferência</option>
                  <option value="Tratativa">Tratativa</option>
                  <option value="Em estoque">Em estoque</option>
                  <option value="Recusar">Recusar</option>
                  <option value="Recusado">Recusado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>
              <div class="form-group">
                <label for="delivery_date">Data de Entrega</label>
                <input
                  id="delivery_date"
                  v-model="formData.date"
                  type="date"
                  class="form-control"
                  :min="minScheduleDate"
                  required
                />
              </div>
            </div>
            <div class="form-row checkbox-row">
              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    v-model="formData.isPrevision"
                    class="checkbox-input"
                  />
                  <span class="checkbox-text">Previsão</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Operação -->
          <div class="form-section">
            <h4><i class="fas fa-cogs"></i> Tipo de Operação</h4>
            <div class="form-row checkbox-row">
              <div class="form-group checkbox-group">
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    v-model="formData.isCrossdock"
                    class="checkbox-input"
                  />
                  <span class="checkbox-text">Crossdock</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Estoque -->
          <div class="form-section">
            <h4><i class="fas fa-warehouse"></i> Estoque</h4>
            <div class="form-row">
              <div class="form-group">
                <label for="client">Estoque</label>
                <input
                  id="client"
                  v-model="formData.client"
                  type="text"
                  class="form-control"
                  required
                />
              </div>
              <div class="form-group">
                <label for="case_count">Quantidade de Volumes</label>
                <input
                  id="case_count"
                  v-model="formData.case_count"
                  type="number"
                  class="form-control"
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          <!-- Observações -->
          <div class="form-section">
            <h4><i class="fas fa-sticky-note"></i> Observações</h4>
            <div class="form-group">
              <label for="observations">Observações Adicionais</label>
              <textarea
                id="observations"
                v-model="formData.observations"
                class="form-control"
                rows="3"
                placeholder="Digite observações sobre este agendamento..."
              ></textarea>
            </div>
          </div>
        </form>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button
          type="button"
          @click="closeModal"
          class="btn btn-secondary"
          :disabled="loading"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="updateSchedule"
          :disabled="loading || !isFormValid"
          class="btn btn-primary"
        >
          <i v-if="loading" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-save"></i>
          {{ loading ? 'Salvando...' : 'Salvar Alterações' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ScheduleEditModal',

  props: {
    scheduleData: {
      type: Object,
      default: () => ({}),
    },
    showModal: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      formData: {
        id: null,
        number: '',
        nfe_key: '',
        status: '',
        date: '',
        client: '',
        case_count: 1,
        observations: '',
        isPrevision: false,
        isCrossdock: false,
      },
      clientCnpj: '', // Store the actual CNPJ to send to backend
      loading: false,
      errors: [],
    }
  },

  computed: {
    isFormValid() {
      return (
        this.formData.status &&
        this.formData.date &&
        this.clientCnpj && // Validate CNPJ instead of display name
        this.formData.case_count > 0
      )
    },

    minScheduleDate() {
      // Data mínima baseada no level_access do usuário:
      // - level_access = 1 (Client): amanhã + regras de final de semana e horário
      // - level_access != 1 (Dev, Admin, Manager, Lobby): hoje ou datas futuras
      const currentUser = this.getCurrentUser
        ? this.getCurrentUser()
        : window.apiClient
          ? window.apiClient.getCurrentUser()
          : null
      const userLevel = currentUser?.level_access

      if (userLevel !== 1) {
        return new Date().toISOString().split('T')[0]
      }

      // Nível 1: aplicar regras completas
      const now = new Date()
      const dayOfWeek = now.getDay() // 0=Dom, 6=Sáb
      const hour = now.getHours()

      const minDate = new Date(now)
      minDate.setHours(0, 0, 0, 0)
      minDate.setDate(minDate.getDate() + 1) // base: amanhã

      if (hour >= 17) {
        minDate.setDate(minDate.getDate() + 1) // após 17h bloqueia o dia seguinte
      }
      if ((dayOfWeek === 0 || dayOfWeek === 6) && minDate.getDay() === 1) {
        minDate.setDate(minDate.getDate() + 1) // final de semana bloqueia segunda
      }

      return minDate.toISOString().split('T')[0]
    },
  },

  watch: {
    scheduleData: {
      handler(newData) {
        if (newData && Object.keys(newData).length > 0) {
          this.populateForm(newData)
        }
      },
      immediate: true,
    },

    showModal(newVal) {
      if (newVal && this.scheduleData) {
        this.populateForm(this.scheduleData)
      }
    },
  },

  methods: {
    closeModal() {
      this.$emit('close')
      this.resetForm()
    },

    populateForm(data) {
      console.log('📝 Populando formulário com:', data)

      // Store both CNPJ (for backend) and display name (for UI)
      this.clientCnpj = data.client_cnpj || data.client || '' // Priorizar CNPJ se disponível
      const clientDisplayName =
        data.client_info?.name || data.client_name || data.client || ''

      console.log('🔍 Populando formulário:')
      console.log('   data.client:', data.client)
      console.log('   data.client_cnpj:', data.client_cnpj)
      console.log('   clientCnpj definido como:', this.clientCnpj)
      console.log('   clientDisplayName:', clientDisplayName)

      // Buscar observações de info.observacoes (campo correto no JSON)
      let observations = ''
      if (data.info && data.info.observacoes) {
        observations = data.info.observacoes
      } else if (data.observations) {
        // Fallback para campo observations direto (compatibilidade)
        observations = data.observations
      }

      console.log(`📝 Observações carregadas no formulário:`, observations)

      this.formData = {
        id: data.id,
        number: data.number || data.nfe_number || '',
        nfe_key: data.nfe_key || '',
        status: data.status || '',
        date: this.formatDateForInput(data.date),
        client: clientDisplayName, // Show friendly name in UI
        case_count: data.case_count || data.volumes || 1,
        observations: observations,
        isPrevision: data.prevision === '1' || data.prevision === 1,
        isCrossdock: data.crossdock === 1 || data.crossdock === '1',
      }

      console.log(
        `🔍 Crossdock carregado: data.crossdock=${JSON.stringify(data.crossdock)} (tipo: ${typeof data.crossdock}) -> isCrossdock=${this.formData.isCrossdock}`
      )
    },

    formatDateForInput(dateString) {
      if (!dateString) return ''

      try {
        // Para inputs de data (type="date"), precisamos apenas do formato YYYY-MM-DD
        // Evitar conversões de timezone usando new Date()

        // Se já está no formato correto, usar diretamente
        if (
          typeof dateString === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(dateString)
        ) {
          return dateString
        }

        // Se tem informação de hora (formato ISO), extrair apenas a data
        if (typeof dateString === 'string' && dateString.includes('T')) {
          return dateString.split('T')[0]
        }

        // Se é um objeto Date ou string que precisa ser parseada
        const date = new Date(dateString)
        if (isNaN(date.getTime())) {
          return ''
        }

        // Usar métodos locais para evitar problemas de timezone
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      } catch (error) {
        console.error('Erro ao formatar data:', error)
        return ''
      }
    },

    async updateSchedule() {
      if (!this.isFormValid) {
        this.addError('Por favor, preencha todos os campos obrigatórios.')
        return
      }

      this.loading = true
      this.errors = []

      try {
        // Usar o apiClient global com cache
        const apiClient = window.apiClient
        const currentUser = this.getCurrentUser()

        // Buscar dados atuais para comparação
        const currentScheduleResponse = await apiClient.request(
          `/schedules/${this.formData.id}`,
          {
            method: 'GET',
          }
        )
        const currentSchedule = currentScheduleResponse.schedule

        // Identificar alterações
        console.log('🔍 Dados atuais do agendamento:', currentSchedule)
        console.log('🔍 Novos dados do formulário:', this.formData)

        const changes = this.identifyChanges(currentSchedule, this.formData)
        console.log('🔍 Alterações identificadas:', changes)

        // Se não há alterações, não prosseguir
        if (changes.length === 0) {
          this.addError('Nenhuma alteração detectada para salvar.')
          return
        }

        // Limpar histórico atual de possíveis entradas redundantes
        const cleanHistoric = currentSchedule.historic || {}

        // Filtrar apenas entradas específicas (remover entradas genéricas "updated")
        const filteredHistoric = {}
        Object.keys(cleanHistoric).forEach(key => {
          const entry = cleanHistoric[key]
          // Manter apenas entradas que têm "changes" ou são específicas
          if (
            entry &&
            (entry.changes || entry.action?.includes('campo(s) alterado(s)'))
          ) {
            filteredHistoric[key] = entry
          } else if (
            key !== 'updated' &&
            !entry.action?.includes('Agendamento atualizado')
          ) {
            // Manter outras entradas importantes (criação, status, etc.)
            filteredHistoric[key] = entry
          }
        })

        console.log(
          '🔍 Histórico filtrado (removendo entradas redundantes):',
          filteredHistoric
        )

        // Preparar dados para envio com histórico
        const updateData = {
          number: this.formData.number,
          nfe_key: this.formData.nfe_key,
          status: this.formData.status,
          date: this.formData.date,
          client: this.clientCnpj, // Send CNPJ to backend, not display name
          case_count: parseInt(this.formData.case_count),
          qt_prod: currentSchedule.qt_prod || 0,
          observations: this.formData.observations || null,
          prevision: this.formData.isPrevision ? '1' : null,
          crossdock: this.formData.isCrossdock ? 1 : 0,
          historic: {
            ...filteredHistoric,
            [`edit_${Date.now()}`]: {
              timestamp: new Date().toISOString(),
              user: currentUser,
              action: `${changes.length} campo(s) alterado(s)`,
              changes: changes,
              comment: changes.join(', '),
            },
          },
        }

        console.log('📤 Enviando dados de atualização:', updateData)
        console.log(
          `🔍 CROSSDOCK: formData.isCrossdock=${this.formData.isCrossdock} -> enviando crossdock=${updateData.crossdock}`
        )
        console.log('🔍 Histórico sendo enviado:', updateData.historic)

        // VALIDAÇÃO: Verificar se a data do agendamento é válida (deve ser no mínimo amanhã)
        // Exceções:
        // - Previsões podem ter qualquer data
        // - Usuários com level_access !== 1 podem agendar para qualquer data
        const userLevel = currentUser?.level_access
        const requiresFutureDateValidation = userLevel === 1 // Apenas level 1 precisa validação

        if (
          updateData.date &&
          !this.formData.isPrevision &&
          requiresFutureDateValidation
        ) {
          // Parse manual da data para evitar problemas de timezone
          const [year, month, day] = updateData.date.split('-').map(Number)
          const scheduleDate = new Date(year, month - 1, day) // month é 0-indexed

          // Calcular data mínima com todas as regras
          const now = new Date()
          const dayOfWeek = now.getDay() // 0=Dom, 6=Sáb
          const hour = now.getHours()

          const minDate = new Date(now)
          minDate.setHours(0, 0, 0, 0)
          minDate.setDate(minDate.getDate() + 1) // base: amanhã

          if (hour >= 17) {
            minDate.setDate(minDate.getDate() + 1) // após 17h bloqueia o dia seguinte
          }
          if ((dayOfWeek === 0 || dayOfWeek === 6) && minDate.getDay() === 1) {
            minDate.setDate(minDate.getDate() + 1) // final de semana bloqueia segunda
          }

          console.log('📅 Validação de data (level_access = 1):')
          console.log(
            '   Data do agendamento:',
            updateData.date,
            '→',
            scheduleDate
          )
          console.log(
            '   Data mínima permitida:',
            minDate.toISOString().split('T')[0]
          )
          console.log('   Bloqueado:', scheduleDate < minDate)

          if (scheduleDate < minDate) {
            this.loading = false
            let motivo =
              'Os agendamentos devem ser feitos com antecedência mínima de 24 horas.'
            if (hour >= 17) {
              motivo = 'Após as 17h não é possível agendar para o próximo dia.'
            } else if (
              (dayOfWeek === 0 || dayOfWeek === 6) &&
              scheduleDate.getDay() === 1
            ) {
              motivo =
                'Não é possível agendar para segunda-feira durante o final de semana.'
            }
            this.addError(
              '⚠️ Data inválida!\n\n' +
                motivo +
                '\n\nPor favor, corrija a data e tente novamente.'
            )
            return
          }
        } else if (
          updateData.date &&
          !this.formData.isPrevision &&
          !requiresFutureDateValidation
        ) {
          console.log(
            `📅 Validação de data: Bypass para level_access !== 1 (level = ${userLevel})`
          )
        }

        const response = await apiClient.request(
          `/schedules/${this.formData.id}`,
          {
            method: 'PUT',
            data: updateData,
          }
        )

        console.log('✅ Agendamento atualizado com sucesso:', response)
        console.log('🔍 Esta é a única requisição de atualização sendo feita')

        // Aguardar um pouco para verificar se há outras chamadas
        setTimeout(() => {
          console.log(
            '🔍 Verificando se houve outras chamadas após 2 segundos...'
          )
        }, 2000)

        // Emitir evento de sucesso
        this.$emit('updated', response)

        // Fechar modal
        this.closeModal()

        // Notificar sucesso
        this.$emit('notification', {
          type: 'success',
          message: 'Agendamento atualizado com sucesso!',
        })
      } catch (error) {
        console.error('❌ Erro ao atualizar agendamento:', error)

        let errorMessage = 'Erro ao atualizar o agendamento.'

        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error
        } else if (error.message) {
          errorMessage = error.message
        }

        this.addError(errorMessage)
      } finally {
        this.loading = false
      }
    },

    resetForm() {
      this.formData = {
        id: null,
        number: '',
        nfe_key: '',
        status: '',
        date: '',
        client: '',
        case_count: 1,
        observations: '',
        isPrevision: false,
        isCrossdock: false,
      }
      this.clientCnpj = ''
      this.errors = []
    },

    addError(message) {
      if (!this.errors.includes(message)) {
        this.errors.push(message)
      }
    },

    removeError(index) {
      this.errors.splice(index, 1)
    },

    handleModalClick(event) {
      if (event.target.classList.contains('modal-overlay')) {
        this.closeModal()
      }
    },

    identifyChanges(currentSchedule, newData) {
      const changes = []

      if (currentSchedule.status !== newData.status) {
        changes.push(
          `Status: "${currentSchedule.status}" → "${newData.status}"`
        )
      }

      if (
        this.formatDateForComparison(currentSchedule.date) !==
        this.formatDateForComparison(newData.date)
      ) {
        changes.push(
          `Data de entrega: "${this.formatDateForDisplay(currentSchedule.date)}" → "${this.formatDateForDisplay(newData.date)}"`
        )
      }

      // Comparar cliente usando CNPJ para evitar alterações desnecessárias
      const currentClientCnpj =
        currentSchedule.client_cnpj || currentSchedule.client
      const newClientCnpj = this.clientCnpj

      console.log('🔍 Comparação de cliente:')
      console.log('   currentSchedule.client:', currentSchedule.client)
      console.log(
        '   currentSchedule.client_cnpj:',
        currentSchedule.client_cnpj
      )
      console.log('   Current CNPJ (usado para comparação):', currentClientCnpj)
      console.log('   this.clientCnpj:', this.clientCnpj)
      console.log('   New CNPJ (usado para comparação):', newClientCnpj)
      console.log('   São diferentes?', currentClientCnpj !== newClientCnpj)

      // Só adicionar como alteração se os CNPJs forem realmente diferentes
      if (currentClientCnpj !== newClientCnpj) {
        changes.push(
          `Estoque: "${currentSchedule.client}" → "${newData.client}"`
        )
      }

      if (
        parseInt(currentSchedule.case_count) !== parseInt(newData.case_count)
      ) {
        changes.push(
          `Volumes: ${currentSchedule.case_count} → ${newData.case_count}`
        )
      }

      // Buscar observações do campo correto info.observacoes
      let currentObs = ''
      if (currentSchedule.info && currentSchedule.info.observacoes) {
        currentObs = currentSchedule.info.observacoes
      } else if (currentSchedule.observations) {
        currentObs = currentSchedule.observations
      }

      const newObs = newData.observations || ''

      console.log(`🔍 Comparação de observações:`)
      console.log(`   Observação atual (info.observacoes):`, currentObs)
      console.log(`   Observação nova:`, newObs)

      if (currentObs !== newObs) {
        changes.push(`Observações: "${currentObs}" → "${newObs}"`)
      }

      // Verificar mudanças em Previsão
      const currentPrevision =
        currentSchedule.prevision === '1' || currentSchedule.prevision === 1
      const newPrevision = newData.isPrevision
      if (currentPrevision !== newPrevision) {
        changes.push(
          `Previsão: ${currentPrevision ? 'Sim' : 'Não'} → ${newPrevision ? 'Sim' : 'Não'}`
        )
      }

      // Verificar mudanças em Crossdock
      const currentCrossdock =
        currentSchedule.crossdock === 1 || currentSchedule.crossdock === '1'
      const newCrossdock = newData.isCrossdock
      console.log(
        `🔍 Comparação Crossdock: currentSchedule.crossdock=${JSON.stringify(currentSchedule.crossdock)} -> currentCrossdock=${currentCrossdock}, newData.isCrossdock=${newCrossdock}`
      )
      if (currentCrossdock !== newCrossdock) {
        changes.push(
          `Crossdock: ${currentCrossdock ? 'Sim' : 'Não'} → ${newCrossdock ? 'Sim' : 'Não'}`
        )
        console.log(`✅ Mudança em Crossdock detectada!`)
      } else {
        console.log(`ℹ️ Nenhuma mudança em Crossdock`)
      }

      return changes
    },

    formatDateForComparison(dateString) {
      if (!dateString) return ''
      try {
        return new Date(dateString).toISOString().slice(0, 16)
      } catch (error) {
        return dateString
      }
    },

    formatDateForDisplay(dateString) {
      if (!dateString) return ''

      // Para datas no formato YYYY-MM-DD, evitar conversão de timezone
      if (
        typeof dateString === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateString)
      ) {
        const [year, month, day] = dateString.split('-')
        return `${day}/${month}/${year}`
      }

      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('pt-BR')
      } catch (error) {
        return dateString
      }
    },

    getCurrentUser() {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return 'Usuário desconhecido'
        const user = JSON.parse(userData)
        return user.user || 'Usuário desconhecido'
      } catch (error) {
        console.error('Erro ao obter usuário atual:', error)
        return 'Usuário desconhecido'
      }
    },
  },

  mounted() {
    console.log(
      'ScheduleEditModal montado com scheduleData:',
      this.scheduleData
    )
    this.$nextTick(() => {
      const modal = this.$refs.modal
      if (modal) {
        modal.focus()
      }
    })
  },
}
</script>

<style scoped>
/* 98% da largura do display (igual ao modal de Informações do agendamento) */
.schedule-edit-modal {
  width: 98vw !important;
  max-width: 98vw !important;
  box-sizing: border-box;
}

/* Header do modal - título e botão fechar na mesma linha */
.modal-header {
  display: flex !important;
  flex-direction: row !important;
  justify-content: space-between !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
  padding: 12px 16px !important;
  gap: 10px !important;
}

.modal-header h3 {
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  font-size: 1rem !important;
  flex: 1 !important;
  white-space: nowrap !important;
}

.modal-header h3 i {
  font-size: 1rem !important;
  color: #007bff !important;
}

.btn-close {
  width: 32px !important;
  height: 32px !important;
  min-width: 32px !important;
  border-radius: 6px !important;
  border: none !important;
  background: #f1f5f9 !important;
  color: #64748b !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s !important;
  font-size: 14px !important;
  flex-shrink: 0 !important;
}

.btn-close:hover {
  background: #e2e8f0 !important;
  color: #dc3545 !important;
}

.form-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.form-section h4 {
  color: #007bff;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.checkbox-row {
  display: flex;
  gap: 2rem;
  align-items: center;
  height: auto;
}

.checkbox-row .form-group {
  margin-bottom: 0 !important;
}

.checkbox-group {
  flex: 0 0 auto;
  margin: 0 !important;
  padding: 0 !important;
  display: flex;
  align-items: center;
  height: 24px;
}

/* Sobrescrever completamente o estilo padrão de label */
.checkbox-group .checkbox-label {
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
  font-weight: 500;
  color: #495057;
  transition: color 0.3s ease;
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1 !important;
  vertical-align: baseline !important;
  height: 20px;
}

.checkbox-label:hover {
  color: #007bff;
}

.checkbox-input {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #007bff;
  transition: all 0.3s ease;
  margin: 0 !important;
  padding: 0 !important;
  vertical-align: baseline !important;
  flex-shrink: 0;
  position: relative;
  top: 0;
}

.checkbox-input:checked {
  transform: scale(1.1);
}

.checkbox-text {
  font-size: 1rem;
  transition: all 0.3s ease;
  line-height: 1 !important;
  vertical-align: baseline !important;
  display: inline-block;
  height: 20px;
  display: flex;
  align-items: center;
}

.checkbox-input:checked + .checkbox-text {
  font-weight: 600;
  color: #007bff;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.95rem;
  transition:
    border-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  outline: 0;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-control:read-only {
  background-color: #e9ecef;
  opacity: 1;
}

.form-control textarea {
  resize: vertical;
  min-height: 80px;
}

.error-container {
  margin-bottom: 1rem;
}

.error-message {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  color: #721c24;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.error-message i {
  margin-right: 0.5rem;
  color: #dc3545;
}

.btn-close-error {
  background: none;
  border: none;
  color: #721c24;
  margin-left: auto;
  cursor: pointer;
  padding: 0.25rem;
}

.btn-close-error:hover {
  color: #dc3545;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .schedule-edit-modal {
    width: 98vw !important;
    max-width: 98vw !important;
    margin: 0 !important;
  }
}
</style>
