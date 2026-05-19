<template>
  <div class="management-page">
    <!-- Sistema de abas: apenas na página de Cargas (Cargas + Histórico). Na página Clientes não exibe abas. -->
    <div v-if="pageMode === 'cargas'" class="management-tabs">
      <button
        :class="['tab-button', { active: activeTab === 'loads' }]"
        @click="switchToLoadsTab"
      >
        <i class="fas fa-truck-loading"></i>
        Cargas
      </button>
      <button
        :class="['tab-button', { active: activeTab === 'history' }]"
        @click="switchToHistoryTab"
      >
        <i class="fas fa-history"></i>
        Histórico
      </button>
    </div>

    <!-- Conteúdo principal -->
    <div class="management-content">
      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <div class="loader-spinner"></div>
        <p>
          {{
            pageMode === 'clientes'
              ? 'Carregando clientes...'
              : activeTab === 'history'
                ? 'Carregando histórico...'
                : 'Carregando cargas...'
          }}
        </p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error-container">
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>{{ error }}</p>
          <button @click="retryLoad" class="retry-btn">
            <i class="fas fa-redo"></i>
            Tentar novamente
          </button>
        </div>
      </div>

      <!-- Modal: Múltiplos Resultados -->
      <div
        v-if="showMultipleResultsModal"
        class="modal-overlay"
        @click.self="handleMultipleResultsCancel"
      >
        <div class="modal-container modal-large">
          <div class="modal-header">
            <h3>
              <i class="fas fa-list"></i>
              Múltiplos Agendamentos Encontrados
            </h3>
            <button
              @click="handleMultipleResultsCancel"
              class="modal-close-btn"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-description">
              Foram encontrados {{ currentSearchResults.length }} agendamentos.
              Selecione um para adicionar à lista:
            </p>
            <div class="results-table-container">
              <table class="results-table">
                <thead>
                  <tr>
                    <th>NFe</th>
                    <th>Cliente</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="result in currentSearchResults" :key="result.id">
                    <td>{{ extractNfeNumber(result.nfe_key) }}</td>
                    <td>{{ result.client_name || result.client || '-' }}</td>
                    <td>{{ formatDate(result.date) }}</td>
                    <td>
                      <span
                        :class="['status-badge', getStatusClass(result.status)]"
                      >
                        {{ result.status }}
                      </span>
                    </td>
                    <td>
                      <button
                        @click="handleMultipleResultsSelected(result)"
                        class="btn-select"
                      >
                        <i class="fas fa-check"></i>
                        Selecionar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="handleMultipleResultsCancel" class="btn-secondary">
              <i class="fas fa-times"></i>
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <!-- Modal: CD Incompatível -->
      <div v-if="showStorageMismatchModal" class="modal-overlay">
        <div class="modal-container modal-alert">
          <div class="modal-header modal-header-warning">
            <h3>
              <i class="fas fa-exclamation-triangle"></i>
              CD Incompatível
            </h3>
          </div>
          <div class="modal-body">
            <p class="modal-alert-message">
              <strong
                >Não é possível adicionar este agendamento à lista.</strong
              >
            </p>
            <p class="modal-alert-details">
              A lista atual contém agendamentos do CD:
              <strong>{{
                storageMismatchDetails.existingStorage || 'Sem CD'
              }}</strong>
              <br />
              O agendamento que você está tentando adicionar é do CD:
              <strong>{{
                storageMismatchDetails.newStorage || 'Sem CD'
              }}</strong>
            </p>
            <p class="modal-alert-info">
              <i class="fas fa-info-circle"></i>
              Todos os agendamentos de uma carga devem pertencer ao mesmo CD
              (Centro de Distribuição).
            </p>
          </div>
          <div class="modal-footer modal-footer-center">
            <button
              @click="closeStorageMismatchModal"
              class="btn-primary btn-ok"
            >
              <i class="fas fa-check"></i>
              OK
            </button>
          </div>
        </div>
      </div>

      <!-- Modal: Aviso de CD não cadastrado para o usuário -->
      <div v-if="showUserStorageMismatchModal" class="modal-overlay">
        <div class="modal-container modal-alert">
          <div class="modal-header modal-header-warning">
            <h3>
              <i class="fas fa-exclamation-triangle"></i>
              Aviso: CD Divergente
            </h3>
          </div>
          <div class="modal-body">
            <p class="modal-alert-message">
              <strong
                >O agendamento foi adicionado à lista, mas identificamos uma
                divergência de CD.</strong
              >
            </p>
            <p class="modal-alert-details">
              <strong>CD do agendamento:</strong>
              {{ userStorageMismatchDetails.scheduleStorage || 'Sem CD' }}
              <br />
              <span v-if="userStorageMismatchDetails.clientName">
                <strong>Cliente:</strong>
                {{ userStorageMismatchDetails.clientName }}
                <br />
              </span>
              <strong>CDs cadastrados para o seu usuário:</strong>
              <span v-if="userStorageMismatchDetails.userStorages.length > 0">
                {{ userStorageMismatchDetails.userStorages.join(', ') }}
              </span>
              <span v-else>Nenhum CD específico (acesso a todos)</span>
            </p>
            <p class="modal-alert-info">
              <i class="fas fa-lightbulb"></i>
              Este agendamento pertence a um CD que não está na sua lista de CDs
              cadastrados. Se você trabalha frequentemente com este CD, entre em
              contato com o administrador do sistema para solicitar acesso.
            </p>
          </div>
          <div class="modal-footer modal-footer-center">
            <button
              @click="closeUserStorageMismatchModal"
              class="btn-primary btn-ok"
            >
              <i class="fas fa-check"></i>
              Entendi
            </button>
          </div>
        </div>
      </div>

      <!-- Modal: Observação da Carga (Criação) -->
      <div
        v-if="showObsModal"
        class="modal-overlay"
        @click.self="closeObsModal"
      >
        <div class="modal-container">
          <div class="modal-header">
            <h3>
              <i class="fas fa-comment-dots"></i>
              Observação da Carga
            </h3>
            <button @click="closeObsModal" class="modal-close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-info-text">
              <i class="fas fa-info-circle"></i>
              Adicione uma observação para esta carga (opcional, máximo 200
              caracteres)
            </p>
            <div class="form-group">
              <label>
                <i class="fas fa-edit"></i>
                Observação
              </label>
              <textarea
                v-model="loadObservation"
                maxlength="200"
                rows="4"
                placeholder="Digite uma observação sobre esta carga..."
                class="form-textarea"
              ></textarea>
              <div class="char-counter">
                {{ loadObservation.length }} / 200 caracteres
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closeObsModal" class="btn-secondary">
              <i class="fas fa-times"></i>
              Cancelar
            </button>
            <button @click="saveObservation" class="btn-primary">
              <i class="fas fa-check"></i>
              Salvar
            </button>
          </div>
        </div>
      </div>

      <!-- Conteúdo das abas: só exibir quando não estiver carregando e não houver erro -->
      <template v-if="!loading && !error">
        <!-- Aba de cargas (apenas quando página de Cargas) -->
        <div
          v-if="pageMode === 'cargas' && activeTab === 'loads'"
          class="loads-tab-container"
        >
          <!-- Seção de busca e criação de cargas -->
          <div class="search-container">
            <div class="search-input-group">
              <input
                ref="cargaSearchInput"
                type="text"
                v-model="searchInput"
                @keyup.enter="performSearch"
                :disabled="searchLoading"
                placeholder="Digite o número da NF-e ou chave de acesso para criar carga"
                class="search-input"
                autocomplete="off"
                data-lpignore="true"
                data-form-type="other"
                name="carga-search"
              />
              <button
                @click="performSearch"
                :disabled="searchLoading || !searchInput.trim()"
                class="search-button"
              >
                <i v-if="searchLoading" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-search"></i>
                <span>Buscar</span>
              </button>
              <button
                @click="openCriarCargaModal"
                class="criar-carga-button"
                title="Criar carga sem agendamentos"
              >
                <i class="fas fa-plus"></i>
                <span>Criar carga</span>
              </button>
            </div>
          </div>

          <!-- Lista de NFes Consultadas -->
          <div v-if="consultedNfes.length > 0" class="search-results">
            <div class="results-header">
              <h3>
                <i class="fas fa-list"></i>
                NFes Consultadas ({{ consultedNfes.length }})
              </h3>
              <div class="results-actions">
                <button
                  @click="openObsModal"
                  class="obs-btn"
                  title="Adicionar observação à carga"
                >
                  <i class="fas fa-comment-dots"></i>
                  Obs
                </button>
                <button
                  @click="effectiveSchedules"
                  class="effective-btn"
                  :disabled="searchLoading"
                >
                  <i v-if="searchLoading" class="fas fa-spinner fa-spin"></i>
                  <i v-else class="fas fa-check"></i>
                  Efetivar
                </button>
                <button @click="clearSearchResults" class="clear-results-btn">
                  <i class="fas fa-times"></i>
                  Limpar lista
                </button>
              </div>
            </div>

            <div class="results-table-container">
              <table class="results-table">
                <thead>
                  <tr>
                    <th>NFe</th>
                    <th>Cliente</th>
                    <th>CD</th>
                    <th>Data</th>
                    <th>Dev</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, index) in consultedNfes"
                    :key="item.id"
                    :class="{
                      'booking-row': item.is_booking === 1,
                      'not-scheduled-row': item.is_booking === 2,
                      'unscheduled-row': item._isNew,
                    }"
                  >
                    <td>
                      {{
                        item.number ||
                        item.nfeNumber ||
                        extractNfeNumber(item.nfe_key) ||
                        '-'
                      }}
                    </td>
                    <td>{{ item.client_name || item.client || '-' }}</td>
                    <td>{{ item.storage || '-' }}</td>
                    <td>{{ formatDate(item.date) }}</td>
                    <td class="dev-checkbox-cell">
                      <label class="dev-checkbox-label">
                        <input
                          type="checkbox"
                          :checked="isReturnSchedule(item.id)"
                          @change="
                            toggleReturnSchedule(item.id, $event.target.checked)
                          "
                          class="dev-checkbox"
                        />
                      </label>
                    </td>
                    <td>
                      <span
                        :class="['status-badge', getStatusClass(item.status)]"
                      >
                        {{ item.status }}
                      </span>
                    </td>
                    <td>
                      <button
                        @click="removeFromConsultedList(index)"
                        class="remove-item-btn"
                        title="Remover da lista"
                      >
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Lista de cargas -->
          <div v-if="loads.length > 0" class="loads-container">
            <div v-for="load in loads" :key="load.load_id" class="load-card">
              <div
                class="load-header"
                :class="{ 'load-header-docar': load.status === 'DOCAR' }"
              >
                <div class="load-title">
                  <i class="fas fa-box"></i>
                  <h3>CARGA {{ load.load_id }}</h3>
                  <button
                    class="btn-print-load"
                    title="Imprimir folha de controle"
                    :disabled="downloadingControlPdf"
                    @click.stop="openControlPdf(load.load_id)"
                  >
                    <i class="fas fa-print"></i>
                  </button>
                  <button
                    v-if="isAdmin"
                    class="btn-delete-load"
                    title="Excluir carga"
                    @click.stop="deleteLoad(load.load_id)"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div class="load-info">
                  <span class="load-stat">
                    <i class="fas fa-warehouse"></i>
                    CD: {{ getLoadStorageDisplay(load) }}
                  </span>
                  <span class="load-stat">
                    <i class="fas fa-truck-loading"></i>
                    Doca: {{ load.dock || 'Sem doca' }}
                  </span>
                  <span class="load-stat">
                    <i class="fas fa-cubes"></i>
                    {{ load.total_volumes }} volumes
                  </span>
                  <span class="load-stat">
                    <i class="fas fa-file-alt"></i>
                    {{ load.schedule_count }} NFes
                  </span>
                  <span class="load-stat">
                    <i class="fas fa-calendar"></i>
                    {{ formatDateTime(load.created_at) }}
                  </span>
                  <span v-if="load.return === '1'" class="load-return-badge">
                    <i class="fas fa-undo"></i>
                    Devolução
                  </span>
                  <span :class="['load-status-stat', getLoadStatusBadgeClass(load.status)]">
                    <i class="fas fa-circle"></i>
                    {{ getLoadStatusLabel(load.status) }}
                  </span>
                </div>
              </div>

              <!-- Linha única: Transportadora, Paletes e Apresentador (alinhados à esquerda) -->
              <div class="load-transport-line">
                <span v-if="load.operation" class="load-transport-item">
                  <span class="load-info-badge">
                    <i class="fas fa-clipboard-list"></i>
                    <span class="load-info-badge-value" style="text-transform: capitalize;">{{
                      load.operation
                    }}</span>
                  </span>
                </span>
                <span class="load-transport-item">
                  <span class="load-info-badge">
                    <i class="fas fa-truck"></i>
                    <span class="load-info-badge-label">Transportadora:</span>
                    <span class="load-info-badge-value">{{
                      getTransportCompanyName(load)
                    }}</span>
                  </span>
                </span>
                <span class="load-transport-item">
                  <span class="load-info-badge">
                    <i class="fas fa-pallet"></i>
                    <span class="load-info-badge-label">Paletes:</span>
                    <span class="load-info-badge-value">{{
                      getLoadPalletsDisplay(load)
                    }}</span>
                  </span>
                </span>
                <span class="load-transport-item">
                  <span class="load-info-badge">
                    <i class="fas fa-user"></i>
                    <span class="load-info-badge-label">Apresentador:</span>
                    <span class="load-info-badge-value">{{
                      formatLoadPresenter(load.transport_presenter)
                    }}</span>
                  </span>
                </span>
              </div>

              <!-- Seção de ações da carga (dock input) - Apenas para status NULL -->
              <div v-if="load.status !== 'DOCAR'" class="load-actions">
                <div class="dock-input-group">
                  <label for="dock-input">
                    <i class="fas fa-warehouse"></i>
                    Atribuir Doca:
                  </label>
                  <input
                    :id="`dock-input-${load.load_id}`"
                    v-model.number="dockInputs[load.load_id]"
                    @input="handleDockInputChange(load.load_id, $event)"
                    type="number"
                    min="1"
                    placeholder="Número da doca"
                    class="dock-input"
                  />
                  <button
                    :key="`dock-btn-${load.load_id}-${dockInputs[load.load_id]}-${(selectedLoadSchedules[load.load_id] || []).length}`"
                    @click="assignDockToLoad(load.load_id)"
                    :disabled="!isDockButtonEnabled(load.load_id)"
                    class="dock-assign-btn"
                    :title="getDockButtonTitle(load.load_id)"
                  >
                    <i class="fas fa-check"></i>
                    Confirmar
                  </button>
                  <button
                    v-if="load.obs && load.obs.trim()"
                    @click="showLoadObservation(load)"
                    class="load-obs-btn"
                    title="Ver observação da carga"
                  >
                    Obs
                  </button>
                </div>
                <div class="load-actions-right">
                  <button
                    @click="rejectLoad(load.load_id)"
                    class="load-reject-btn"
                    title="Recusar todos os agendamentos desta carga"
                  >
                    <i class="fas fa-times-circle"></i>
                  </button>
                  <button
                    @click="openLoadHistoryModal(load)"
                    class="load-history-btn"
                    title="Histórico da carga"
                  >
                    <i class="fas fa-history"></i>
                  </button>
                </div>
              </div>

              <!-- Seção de ações para carga com status DOCAR (botão de histórico oculto neste status) -->
              <div v-if="load.status === 'DOCAR'" class="load-actions">
                <button
                  @click="markLoadAsSent(load.load_id)"
                  class="load-sent-btn"
                  title="Marcar carga como enviada (motorista foi orientado)"
                >
                  <i class="fas fa-truck"></i>
                  Motorista orientado
                </button>
              </div>

              <div class="load-schedules">
                <table class="load-schedules-table">
                  <thead>
                    <tr>
                      <th class="checkbox-column">
                        <input
                          type="checkbox"
                          :checked="isAllSchedulesSelected(load)"
                          @change="toggleAllSchedulesInLoad(load.load_id)"
                          :disabled="isLoadCheckboxDisabled(load.load_id)"
                          class="checkbox-input"
                          :title="
                            isLoadCheckboxDisabled(load.load_id)
                              ? 'Desmarque os itens da outra carga primeiro'
                              : 'Selecionar/Deselecionar todos'
                          "
                        />
                      </th>
                      <th>NFe</th>
                      <th>Cliente</th>
                      <th>CD</th>
                      <th>Data</th>
                      <th>Dev</th>
                      <th class="status-column">Status</th>
                      <th>Volumes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="schedule in load.schedules"
                      :key="schedule.id"
                      :class="{
                        'disabled-row': isLoadCheckboxDisabled(load.load_id),
                        'ghost-schedule': schedule.isGhost,
                      }"
                    >
                      <td class="checkbox-column">
                        <input
                          type="checkbox"
                          :checked="
                            isScheduleSelected(load.load_id, schedule.id)
                          "
                          @change="
                            toggleScheduleSelection(load.load_id, schedule.id)
                          "
                          @click.stop
                          :disabled="
                            isLoadCheckboxDisabled(load.load_id) ||
                            schedule.isGhost
                          "
                          class="checkbox-input"
                          :title="
                            schedule.isGhost
                              ? 'Agendamento movido para outra carga - não pode ser selecionado'
                              : isLoadCheckboxDisabled(load.load_id)
                                ? 'Desmarque os itens da outra carga primeiro'
                                : 'Clique para selecionar este agendamento'
                          "
                        />
                      </td>
                      <td>
                        {{
                          schedule.number || extractNfeNumber(schedule.nfe_key)
                        }}
                      </td>
                      <td>{{ schedule.client_name || schedule.client }}</td>
                      <td>{{ schedule.storage || '-' }}</td>
                      <td>
                        {{ schedule.prevision ? '~ ' : ''
                        }}{{ formatDate(schedule.date) }}
                      </td>
                      <td class="dev-checkbox-cell">
                        <label class="dev-checkbox-label">
                          <input
                            type="checkbox"
                            :checked="schedule.isReturn || false"
                            disabled
                            class="dev-checkbox"
                          />
                        </label>
                      </td>
                      <td class="status-column">
                        <span
                          :class="[
                            'status-badge',
                            getStatusClass(schedule.status),
                          ]"
                        >
                          {{ schedule.status }}
                        </span>
                      </td>
                      <td>{{ schedule.case_count || 0 }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Estado vazio de cargas -->
          <div v-else class="empty-loads-state">
            <div class="empty-icon">
              <i class="fas fa-truck-loading"></i>
            </div>
            <h3>Nenhuma carga encontrada</h3>
            <p>
              As cargas criadas aparecerão aqui após efetivar agendamentos na
              aba de Buscar.
            </p>
          </div>

          <!-- Modal: Visualizar Observação da Carga -->
          <div
            v-if="showViewObsModal && currentLoadObs"
            class="modal-overlay"
            @click.self="closeViewObsModal"
          >
            <div class="modal-container modal-container-elevated">
              <div class="modal-header">
                <h3>
                  <i class="fas fa-eye"></i>
                  Observação da Carga {{ currentLoadObs.load_id }}
                </h3>
                <button @click="closeViewObsModal" class="modal-close-btn">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="modal-body">
                <div class="obs-view-content">
                  <p>{{ currentLoadObs.obs }}</p>
                </div>
              </div>
              <div class="modal-footer">
                <button @click="closeViewObsModal" class="btn-primary">
                  <i class="fas fa-check"></i>
                  Fechar
                </button>
              </div>
            </div>
          </div>

          <!-- Modal: Histórico da Carga -->
          <div
            v-if="showLoadHistoryModal"
            class="modal-overlay"
            @click.self="closeLoadHistoryModal"
          >
            <div
              class="modal-container modal-container-elevated modal-load-history"
            >
              <div class="modal-header">
                <h3>
                  <i class="fas fa-history"></i>
                  Histórico da Carga {{ loadHistoryLoadId || '' }}
                </h3>
                <button @click="closeLoadHistoryModal" class="modal-close-btn">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="modal-body">
                <div v-if="loadHistoryLoading" class="load-history-loading">
                  <i class="fas fa-spinner fa-spin"></i>
                  Carregando histórico...
                </div>
                <div
                  v-else-if="!loadHistoryEntries.length"
                  class="load-history-empty"
                >
                  <i class="fas fa-info-circle"></i>
                  Nenhum registro no histórico desta carga.
                </div>
                <ul v-else class="load-history-list">
                  <li
                    v-for="(entry, index) in loadHistoryEntries"
                    :key="index"
                    class="load-history-item"
                  >
                    <div class="load-history-item-header">
                      <span class="load-history-time">{{
                        formatLoadHistoryTime(entry.timestamp)
                      }}</span>
                      <span class="load-history-user">{{
                        entry.user || '—'
                      }}</span>
                    </div>
                    <div class="load-history-action">
                      {{ entry.action || '—' }}
                    </div>
                    <div v-if="entry.comment" class="load-history-comment">
                      {{ entry.comment }}
                    </div>
                  </li>
                </ul>
              </div>
              <div class="modal-footer">
                <button @click="closeLoadHistoryModal" class="btn-primary">
                  <i class="fas fa-check"></i>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Aba de histórico (apenas quando página de Cargas) -->
        <div
          v-else-if="pageMode === 'cargas' && activeTab === 'history'"
          class="loads-tab-container"
        >
          <!-- Campo de busca -->
          <div class="history-search-container">
            <div class="search-input-group">
              <i class="fas fa-search search-icon"></i>
              <input
                type="text"
                v-model="historySearchInput"
                placeholder="Busque pelo número da NF-e, chave de acesso ou carga"
                class="search-input"
                autocomplete="off"
                data-lpignore="true"
                data-form-type="other"
                name="historico-search"
              />
              <button
                v-if="historySearchInput"
                @click="historySearchInput = ''"
                class="clear-search-btn"
                title="Limpar busca"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div v-if="historySearchInput" class="search-results-info">
              <i class="fas fa-info-circle"></i>
              {{ filteredHistoryLoads.length }} carga(s) encontrada(s)
            </div>
          </div>

          <!-- Lista de cargas (histórico completo) -->
          <div v-if="filteredHistoryLoads.length > 0" class="loads-container">
            <div
              v-for="load in filteredHistoryLoads"
              :key="load.load_id"
              class="load-card"
            >
              <div
                class="load-header"
                :class="{
                  'load-header-docar': load.status === 'DOCAR',
                  'load-header-sent': load.status === 'ENVIADO',
                  'load-header-rejected': load.status === 'RECUSADO',
                  'load-header-cancelled': load.status === 'CANCELADA',
                }"
              >
                <div class="load-title">
                  <i class="fas fa-box"></i>
                  <h3>CARGA {{ load.load_id }}</h3>
                  <button
                    class="btn-print-load"
                    title="Imprimir folha de controle"
                    :disabled="downloadingControlPdf"
                    @click.stop="openControlPdf(load.load_id)"
                  >
                    <i class="fas fa-print"></i>
                  </button>
                  <button
                    v-if="isAdmin"
                    class="btn-delete-load"
                    title="Excluir carga"
                    @click.stop="deleteLoad(load.load_id)"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div class="load-info">
                  <span class="load-stat">
                    <i class="fas fa-calendar"></i>
                    {{ formatDateTime(load.created_at) }}
                  </span>
                  <span class="load-stat">
                    <i class="fas fa-cubes"></i>
                    {{ load.total_volumes }} volumes
                  </span>
                  <span v-if="load.dock" class="load-stat">
                    <i class="fas fa-warehouse"></i>
                    Doca {{ load.dock }}
                  </span>
                  <span
                    v-if="
                      load.storage_corpem || load.storage || load.storage_name
                    "
                    class="load-stat"
                  >
                    <i class="fas fa-building"></i>
                    CD: {{ getLoadStorageDisplay(load) }}
                  </span>
                  <span :class="['load-status-stat', getLoadStatusBadgeClass(load.status)]">
                    <i class="fas fa-circle"></i>
                    {{ getLoadStatusLabel(load.status) }}
                  </span>
                </div>
              </div>

              <!-- Linha única: Transportadora, Paletes e Apresentador (alinhados à esquerda) - aba Histórico -->
              <div class="load-transport-line">
                <span v-if="load.operation" class="load-transport-item">
                  <span class="load-info-badge">
                    <i class="fas fa-clipboard-list"></i>
                    <span class="load-info-badge-value" style="text-transform: capitalize;">{{
                      load.operation
                    }}</span>
                  </span>
                </span>
                <span class="load-transport-item">
                  <span class="load-info-badge">
                    <i class="fas fa-truck"></i>
                    <span class="load-info-badge-label">Transportadora:</span>
                    <span class="load-info-badge-value">{{
                      getTransportCompanyName(load)
                    }}</span>
                  </span>
                </span>
                <span class="load-transport-item">
                  <span class="load-info-badge">
                    <i class="fas fa-pallet"></i>
                    <span class="load-info-badge-label">Paletes:</span>
                    <span class="load-info-badge-value">{{
                      getLoadPalletsDisplay(load)
                    }}</span>
                  </span>
                </span>
                <span class="load-transport-item">
                  <span class="load-info-badge">
                    <i class="fas fa-user"></i>
                    <span class="load-info-badge-label">Apresentador:</span>
                    <span class="load-info-badge-value">{{
                      formatLoadPresenter(load.transport_presenter)
                    }}</span>
                  </span>
                </span>
                <span
                  class="load-transport-item load-history-action-history-tab"
                >
                  <button
                    @click="openLoadHistoryModal(load)"
                    class="load-history-btn"
                    title="Histórico da carga"
                  >
                    <i class="fas fa-history"></i>
                    Histórico da carga
                  </button>
                </span>
              </div>

              <div class="load-schedules">
                <table class="load-schedules-table">
                  <thead>
                    <tr>
                      <th>NFe</th>
                      <th>Cliente</th>
                      <th>CD</th>
                      <th>Data</th>
                      <th class="status-column">Status</th>
                      <th v-if="load.dock">Doca</th>
                      <th>Volumes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="schedule in load.schedules"
                      :key="schedule.id"
                      :class="{ 'ghost-schedule': schedule.isGhost }"
                    >
                      <td>{{ schedule.number }}</td>
                      <td>{{ schedule.client_name || schedule.client }}</td>
                      <td>{{ schedule.storage || '-' }}</td>
                      <td>
                        {{ schedule.prevision ? '~ ' : ''
                        }}{{ formatDate(schedule.date) }}
                      </td>
                      <td class="status-column">
                        <span
                          class="status-badge"
                          :class="getStatusClass(schedule.status)"
                        >
                          {{ schedule.status }}
                        </span>
                      </td>
                      <td v-if="load.dock">{{ schedule.dock || '-' }}</td>
                      <td>{{ schedule.case_count || 0 }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Estado vazio -->
          <div v-else class="empty-state">
            <div class="empty-icon">
              <i class="fas fa-history"></i>
            </div>
            <h3>Nenhuma carga no histórico</h3>
            <p>O histórico de cargas aparecerá aqui.</p>
          </div>

          <!-- Modal: Histórico da Carga (aba Histórico - mesmo componente, precisa estar no DOM quando esta aba está ativa) -->
          <div
            v-if="showLoadHistoryModal"
            class="modal-overlay"
            @click.self="closeLoadHistoryModal"
          >
            <div
              class="modal-container modal-container-elevated modal-load-history"
            >
              <div class="modal-header">
                <h3>
                  <i class="fas fa-history"></i>
                  Histórico da Carga {{ loadHistoryLoadId || '' }}
                </h3>
                <button @click="closeLoadHistoryModal" class="modal-close-btn">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <div class="modal-body">
                <div v-if="loadHistoryLoading" class="load-history-loading">
                  <i class="fas fa-spinner fa-spin"></i>
                  Carregando histórico...
                </div>
                <div
                  v-else-if="!loadHistoryEntries.length"
                  class="load-history-empty"
                >
                  <i class="fas fa-info-circle"></i>
                  Nenhum registro no histórico desta carga.
                </div>
                <ul v-else class="load-history-list">
                  <li
                    v-for="(entry, index) in loadHistoryEntries"
                    :key="index"
                    class="load-history-item"
                  >
                    <div class="load-history-item-header">
                      <span class="load-history-time">{{
                        formatLoadHistoryTime(entry.timestamp)
                      }}</span>
                      <span class="load-history-user">{{
                        entry.user || '—'
                      }}</span>
                    </div>
                    <div class="load-history-action">
                      {{ entry.action || '—' }}
                    </div>
                    <div v-if="entry.comment" class="load-history-comment">
                      {{ entry.comment }}
                    </div>
                  </li>
                </ul>
              </div>
              <div class="modal-footer">
                <button @click="closeLoadHistoryModal" class="btn-primary">
                  <i class="fas fa-check"></i>
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Conteúdo de clientes (página Clientes ou aba Clientes) -->
        <div
          v-else-if="activeTab === 'clients' || pageMode === 'clientes'"
          class="clients-tab-container"
        >
          <div class="clients-header">
            <h2>
              <i class="fas fa-building"></i>
              Gestão de Clientes
            </h2>
            <p class="clients-description">
              Visualize e gerencie comentários dos clientes cadastrados.
            </p>
          </div>

          <!-- Filtro de clientes -->
          <div class="clients-filter">
            <div class="filter-input-group">
              <input
                type="text"
                v-model="clientSearchInput"
                @input="filterClients"
                placeholder="Buscar por nome ou CNPJ..."
                class="filter-input"
                autocomplete="off"
                data-lpignore="true"
                data-form-type="other"
                name="client-management-search"
              />
              <button
                v-if="clientSearchInput"
                @click="clearClientFilter"
                class="clear-filter-btn"
                title="Limpar filtro"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <!-- Lista de clientes -->
          <div v-if="filteredClients.length > 0" class="clients-container">
            <div
              v-for="client in filteredClients"
              :key="client.cnpj"
              class="client-card clickable-client-card"
              @click="openCommentsModal(client)"
              title="Clique para ver comentários"
            >
              <div class="client-info">
                <div class="client-header-info">
                  <h3 class="client-name">{{ client.name }}</h3>
                  <span class="client-cnpj-inline">
                    <strong>CNPJ:</strong> {{ formatCNPJ(client.cnpj) }}
                  </span>
                </div>
                <div class="client-details">
                  <span class="client-detail">
                    <i class="fas fa-warehouse"></i>
                    <strong>CD:</strong>
                    {{ client.storage_corpem || client.storage || 'N/A' }}
                  </span>
                  <span class="client-detail">
                    <i class="fas fa-link"></i>
                    <strong>Integração:</strong>
                    <span
                      :class="
                        client.integration ? 'status-active' : 'status-inactive'
                      "
                    >
                      {{ client.integration ? 'Ativa' : 'Inativa' }}
                    </span>
                  </span>
                  <span class="client-detail comments-indicator">
                    <i class="fas fa-comments"></i>
                    <strong>Comentários:</strong>
                    {{ getClientComments(client).length }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Estado vazio de clientes -->
          <div v-else class="empty-clients-state">
            <div class="empty-icon">
              <i class="fas fa-building"></i>
            </div>
            <h3>Nenhum cliente encontrado</h3>
            <p v-if="clientSearchInput">
              Não foram encontrados clientes para "{{ clientSearchInput }}".
            </p>
            <p v-else>Não há clientes cadastrados no sistema.</p>
          </div>
        </div>
      </template>
    </div>

    <!-- Modal de detalhes do resultado -->
    <div
      v-if="showDetailsModal"
      class="modal-overlay"
      @click="closeDetailsModal"
    >
      <div class="modal-content details-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-info-circle"></i>
            Detalhes do Agendamento
          </h3>
          <button class="modal-close-btn" @click="closeDetailsModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div v-if="selectedResult" class="modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <label>Número NFe:</label>
              <span>{{ selectedResult.number || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>Chave de Acesso:</label>
              <span class="nfe-key">{{ selectedResult.nfe_key || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>Cliente:</label>
              <span>{{
                selectedResult.client_name || selectedResult.client || '-'
              }}</span>
            </div>
            <div class="detail-item">
              <label>Status:</label>
              <span
                :class="['status-badge', getStatusClass(selectedResult.status)]"
              >
                {{ selectedResult.status }}
              </span>
            </div>
            <div class="detail-item">
              <label>Data:</label>
              <span>{{ formatDate(selectedResult.date) }}</span>
            </div>
            <div class="detail-item">
              <label>Fornecedor:</label>
              <span>{{ selectedResult.supplier || '-' }}</span>
            </div>
            <div class="detail-item">
              <label>Quantidade de Produtos:</label>
              <span>{{ selectedResult.qt_prod || 0 }}</span>
            </div>
            <div class="detail-item">
              <label>Contagem de Caixas:</label>
              <span>{{ selectedResult.case_count || 0 }}</span>
            </div>
            <div
              v-if="selectedResult.is_booking"
              class="detail-item full-width"
            >
              <label>Tipo:</label>
              <span class="booking-badge">Agendamento Prévio</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Comentários do Cliente -->
    <div
      v-if="showCommentsModal"
      class="modal-overlay"
      @click="closeCommentsModal"
    >
      <div class="modal-content comments-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-comments"></i>
            Comentários - {{ selectedClient?.name }}
          </h3>
          <button class="modal-close-btn" @click="closeCommentsModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <!-- Informações do Cliente -->
          <div class="client-modal-info">
            <p><strong>CNPJ:</strong> {{ formatCNPJ(selectedClient?.cnpj) }}</p>
            <p>
              <strong>CD:</strong>
              {{
                selectedClient?.storage_corpem ||
                selectedClient?.storage ||
                'N/A'
              }}
            </p>
            <p>
              <strong>Integração:</strong>
              <span
                :class="
                  selectedClient?.integration
                    ? 'status-active'
                    : 'status-inactive'
                "
              >
                {{ selectedClient?.integration ? 'Ativa' : 'Inativa' }}
              </span>
            </p>
          </div>

          <!-- Comentários existentes -->
          <div class="modal-comments-list">
            <h4>
              <i class="fas fa-comment-dots"></i>
              Comentários ({{ getClientComments(selectedClient).length }})
            </h4>
            <div
              v-if="getClientComments(selectedClient).length > 0"
              class="comments-list-container"
            >
              <div
                v-for="comment in getClientComments(selectedClient)"
                :key="comment.id"
                class="comment-item-modal"
              >
                <div class="comment-header-modal">
                  <div class="comment-author-info">
                    <i class="fas fa-user-circle"></i>
                    <span class="comment-author">{{
                      comment.authorEmail
                    }}</span>
                  </div>
                  <div class="comment-actions-info">
                    <div class="comment-date-info">
                      <i class="fas fa-calendar-alt"></i>
                      <span class="comment-date">{{ comment.date }}</span>
                    </div>
                    <button
                      v-if="canDeleteComment(comment.authorEmail)"
                      @click="confirmDeleteComment(comment.authorEmail)"
                      class="delete-comment-btn"
                      title="Excluir comentário"
                    >
                      <i class="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
                <div class="comment-content-modal">{{ comment.comment }}</div>
              </div>
            </div>
            <div v-else class="no-comments-message">
              <i class="fas fa-inbox"></i>
              <p>Nenhum comentário ainda. Seja o primeiro a adicionar!</p>
            </div>
          </div>

          <!-- Formulário para novo comentário -->
          <div class="modal-new-comment-form">
            <h4>
              <i class="fas fa-plus-circle"></i>
              Adicionar novo comentário
            </h4>
            <div class="modal-comment-input-group">
              <textarea
                v-model="newCommentText[selectedClient?.cnpj]"
                placeholder="Digite seu comentário..."
                class="modal-comment-textarea"
                rows="4"
              ></textarea>
              <button
                @click="addComment(selectedClient?.cnpj)"
                :disabled="
                  !newCommentText[selectedClient?.cnpj] || commentLoading
                "
                class="modal-add-comment-btn"
              >
                <i v-if="commentLoading" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-save"></i>
                Salvar comentário
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Wizard de Efetivação (4 passos) - Teleport para body evita corte por containers pais -->
    <Teleport to="body">
      <div
        v-if="showTransportModal"
        class="modal-overlay modal-overlay-wizard"
        @click.self="closeTransportModal"
      >
        <div class="modal-container transport-wizard-modal">
          <div class="modal-header">
            <h3>
              <i class="fas fa-truck"></i>
              Efetivar Lista de Agendamentos
            </h3>
            <button
              @click="closeTransportModal"
              class="modal-close-btn"
              :disabled="transportModalLoading"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="wizard-progress">
            <div
              v-for="step in 5"
              :key="step"
              :class="[
                'wizard-step',
                {
                  active: transportWizardStep === step,
                  done: transportWizardStep > step,
                },
              ]"
            >
              <span class="step-number">{{ step }}</span>
              <span v-if="step < 5" class="step-connector"></span>
            </div>
          </div>
          <div class="modal-body wizard-body">
            <div v-if="transportModalLoading" class="wizard-loading-overlay">
              <i class="fas fa-spinner fa-spin fa-3x"></i>
              <p>Processando... Aguarde.</p>
            </div>
            <!-- Passo 1: Tipo de operação (multi-select) -->
            <div
              v-show="transportWizardStep === 1"
              class="wizard-step-content wizard-step-operation"
            >
              <p class="wizard-question">Qual o tipo de operação?</p>
              <p class="wizard-operation-subtitle">
                Selecione uma ou mais opções
              </p>
              <div class="wizard-buttons-row wizard-operation-buttons">
                <button
                  v-for="opt in wizardOperationOptions"
                  :key="opt.value"
                  type="button"
                  class="wizard-choice-btn"
                  :class="{ selected: loadWizardData.operations.includes(opt.value) }"
                  @click="toggleWizardOperation(opt.value)"
                >
                  <i :class="opt.icon"></i>
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- Passo 2: Batida ou Paletizada -->
            <div
              v-show="transportWizardStep === 2"
              class="wizard-step-content wizard-step-pallets"
            >
              <p class="wizard-question">A carga está batida ou paletizada?</p>
              <div class="wizard-buttons-row">
                <button
                  type="button"
                  class="wizard-choice-btn"
                  :class="{ selected: loadWizardData.loadType === 'batida' }"
                  @click="selectLoadType('batida')"
                >
                  <i class="fas fa-boxes-stacked"></i>
                  Batida
                </button>
                <button
                  type="button"
                  class="wizard-choice-btn"
                  :class="{
                    selected: loadWizardData.loadType === 'paletizada',
                  }"
                  @click="selectLoadType('paletizada')"
                >
                  <i class="fas fa-pallet"></i>
                  Paletizada
                </button>
              </div>
              <!-- Sub-passo 1.2: Quantidade de paletes (só se paletizada) -->
              <div
                v-if="loadWizardData.loadType === 'paletizada'"
                class="wizard-substep"
              >
                <p class="wizard-question">
                  Quantos paletes serão descarregados neste armazém?
                </p>
                <div class="wizard-input-row">
                  <input
                    v-model="loadWizardData.pallets"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength="3"
                    placeholder="Ex: 12"
                    class="form-input pallets-input"
                    @input="handlePalletsInput"
                  />
                  <button
                    type="button"
                    class="btn-primary"
                    :disabled="!loadWizardData.pallets || transportModalLoading"
                    @click="wizardNextStep"
                  >
                    <i class="fas fa-check"></i>
                    Confirmar
                  </button>
                </div>
              </div>
              <div
                v-else-if="loadWizardData.loadType === 'batida'"
                class="wizard-substep"
              >
                <!-- Botão Continuar está na barra inferior (footer) alinhado à direita -->
              </div>
            </div>

            <!-- Passo 3: Placas -->
            <div
              v-show="transportWizardStep === 3"
              class="wizard-step-content wizard-step-plates"
            >
              <p class="wizard-plates-title">
                Informe as placas do veículo (7 caracteres cada)
              </p>
              <p class="wizard-plates-subtitle">
                Caso não haja carroceria, deixe em branco
              </p>
              <div class="wizard-plates-form">
                <div class="form-group">
                  <label>Placa do veículo</label>
                  <input
                    v-model="loadWizardData.carPlate"
                    type="text"
                    maxlength="7"
                    placeholder="ABC1D23"
                    class="form-input plate-input"
                    @input="handlePlateInput($event, 'carPlate')"
                  />
                </div>
                <div class="form-group">
                  <label>Placa da carroceria</label>
                  <input
                    v-model="loadWizardData.loadPlate1"
                    type="text"
                    maxlength="7"
                    placeholder="XYZ5678 (opcional)"
                    class="form-input plate-input"
                    @input="handlePlateInput($event, 'loadPlate1')"
                  />
                </div>
                <div class="form-group">
                  <label>Placa da segunda carroceria</label>
                  <input
                    v-model="loadWizardData.loadPlate2"
                    type="text"
                    maxlength="7"
                    placeholder="DEF9012 (opcional)"
                    class="form-input plate-input"
                    @input="handlePlateInput($event, 'loadPlate2')"
                  />
                </div>
              </div>
            </div>

            <!-- Passo 4: Transportadora -->
            <div
              v-show="transportWizardStep === 4"
              class="wizard-step-content wizard-step-transport"
            >
              <p class="wizard-transport-title">
                Informe o nome da transportadora
              </p>
              <p class="wizard-transport-subtitle">
                Opções compatíveis aparecem enquanto você digita
              </p>
              <div class="wizard-transport-input-wrapper">
                <div class="form-group autocomplete-wrapper">
                  <input
                    v-model="loadWizardData.transportCompany"
                    type="text"
                    maxlength="20"
                    placeholder="Digite para buscar..."
                    class="form-input wizard-transport-input"
                    @input="handleTransportCompanyInput"
                    @focus="showTransportSuggestions = true"
                    @blur="hideTransportSuggestionsDelayed"
                  />
                  <div
                    v-if="
                      showTransportSuggestions &&
                      transportSuggestions.length > 0
                    "
                    class="autocomplete-dropdown"
                  >
                    <div
                      v-for="c in transportSuggestions"
                      :key="c.id"
                      class="autocomplete-item"
                      @mousedown.prevent="selectTransportSuggestion(c)"
                    >
                      {{ c.name }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Passo 5: Apresentador -->
            <div
              v-show="transportWizardStep === 5"
              class="wizard-step-content wizard-step-presenter"
            >
              <p class="wizard-presenter-title">
                Informe os dados do apresentador da NFe
              </p>
              <div class="wizard-presenter-form">
                <div class="form-group">
                  <label>Número de Identidade (RG)</label>
                  <input
                    v-model="loadWizardData.presenterRg"
                    type="text"
                    maxlength="13"
                    placeholder="Ex: 1234567890123"
                    class="form-input"
                    @input="handleWizardPresenterRgInput"
                  />
                </div>
                <div class="form-group">
                  <label>Nome</label>
                  <input
                    v-model="loadWizardData.presenterName"
                    type="text"
                    placeholder="Nome do apresentador"
                    class="form-input"
                    @input="handleWizardPresenterNameInput"
                  />
                </div>
                <div class="form-group">
                  <label>CNH</label>
                  <input
                    v-model="loadWizardData.presenterDriverLicense"
                    type="text"
                    maxlength="11"
                    placeholder="Número da CNH"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label>Contato</label>
                  <input
                    v-model="loadWizardData.presenterContact"
                    type="text"
                    maxlength="11"
                    placeholder="Telefone (apenas números)"
                    class="form-input"
                    @input="handleWizardPresenterPhoneInput"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer wizard-footer">
            <div class="wizard-footer-left">
              <button
                v-if="transportWizardStep > 1 && !transportModalLoading"
                type="button"
                class="btn-secondary"
                @click="transportWizardStep--"
              >
                <i class="fas fa-arrow-left"></i>
                Voltar
              </button>
              <button
                v-if="transportWizardStep < 5"
                type="button"
                class="btn-secondary"
                @click="closeTransportModal"
                :disabled="transportModalLoading"
              >
                Cancelar
              </button>
            </div>
            <div class="wizard-footer-right">
              <template v-if="transportWizardStep === 1">
                <button
                  type="button"
                  class="btn-primary"
                  :disabled="
                    loadWizardData.operations.length === 0 ||
                    transportModalLoading
                  "
                  @click="wizardNextStep"
                >
                  Continuar
                  <i class="fas fa-arrow-right"></i>
                </button>
              </template>
              <template v-else-if="transportWizardStep === 2">
                <button
                  v-if="loadWizardData.loadType === 'batida'"
                  type="button"
                  class="btn-primary"
                  :disabled="transportModalLoading"
                  @click="wizardNextStep"
                >
                  Continuar
                  <i class="fas fa-arrow-right"></i>
                </button>
              </template>
              <template v-else-if="transportWizardStep === 3">
                <button
                  type="button"
                  class="btn-secondary"
                  @click="wizardSkipAndNext"
                >
                  <i class="fas fa-forward"></i>
                  Pular
                </button>
                <button
                  type="button"
                  class="btn-primary"
                  :disabled="
                    !loadWizardData.carPlate ||
                    loadWizardData.carPlate.length !== 7 ||
                    transportModalLoading
                  "
                  @click="wizardConfirmPlates"
                >
                  <i class="fas fa-check"></i>
                  Confirmar
                </button>
              </template>
              <template v-else-if="transportWizardStep === 4">
                <button
                  type="button"
                  class="btn-secondary"
                  @click="wizardSkipAndNext"
                >
                  <i class="fas fa-forward"></i>
                  Pular
                </button>
                <button
                  type="button"
                  class="btn-primary"
                  @click="wizardConfirmTransport"
                >
                  <i class="fas fa-check"></i>
                  Confirmar
                </button>
              </template>
              <template v-else-if="transportWizardStep === 5">
                <button
                  type="button"
                  class="btn-secondary"
                  :disabled="transportModalLoading"
                  @click="wizardSkipAndNext"
                >
                  <i
                    :class="
                      transportModalLoading
                        ? 'fas fa-spinner fa-spin'
                        : 'fas fa-forward'
                    "
                  ></i>
                  {{ transportModalLoading ? 'Processando...' : 'Pular' }}
                </button>
                <button
                  type="button"
                  class="btn-primary"
                  :disabled="transportModalLoading"
                  @click="wizardConfirmPresenter"
                >
                  <i
                    :class="
                      transportModalLoading
                        ? 'fas fa-spinner fa-spin'
                        : 'fas fa-check'
                    "
                  ></i>
                  {{ transportModalLoading ? 'Processando...' : 'Confirmar' }}
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal: Criar carga vazia (sem agendamentos) -->
    <Teleport to="body">
      <div
        v-if="showCriarCargaModal"
        class="modal-overlay modal-overlay-wizard"
        @click.self="closeCriarCargaModal"
      >
        <div class="modal-container transport-wizard-modal criar-carga-wizard-modal">
          <div class="modal-header">
            <h3>
              <i class="fas fa-plus-circle" style="color: #48bb78;"></i>
              Criar carga
            </h3>
            <button
              @click="closeCriarCargaModal"
              class="modal-close-btn"
              :disabled="criarCargaLoading"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body wizard-body criar-carga-body">
            <div v-if="criarCargaLoading" class="wizard-loading-overlay">
              <i class="fas fa-spinner fa-spin fa-3x"></i>
              <p>Criando carga... Aguarde.</p>
            </div>

            <p class="criar-carga-subtitle">Crie uma carga informando os dados do veículo e transporte. Agendamentos poderão ser inseridos posteriormente.</p>

            <!-- Tipo de operação -->
            <div class="criar-carga-section">
              <h4><i class="fas fa-clipboard-list"></i> Tipo de operação <span class="required">*</span></h4>
              <div class="wizard-buttons-row">
                <button
                  type="button"
                  class="wizard-choice-btn"
                  :class="{ selected: criarCargaData.operationType === 'entrega' }"
                  @click="criarCargaData.operationType = 'entrega'"
                >
                  <i class="fas fa-truck-ramp-box"></i>
                  Entrega
                </button>
                <button
                  type="button"
                  class="wizard-choice-btn"
                  :class="{ selected: criarCargaData.operationType === 'coleta' }"
                  @click="criarCargaData.operationType = 'coleta'"
                >
                  <i class="fas fa-boxes-packing"></i>
                  Coleta
                </button>
                <button
                  type="button"
                  class="wizard-choice-btn"
                  :class="{ selected: criarCargaData.operationType === 'troca de nota' }"
                  @click="criarCargaData.operationType = 'troca de nota'"
                >
                  <i class="fas fa-file-invoice"></i>
                  Troca de nota
                </button>
                <button
                  type="button"
                  class="wizard-choice-btn"
                  :class="{ selected: criarCargaData.operationType === 'outro' }"
                  @click="criarCargaData.operationType = 'outro'"
                >
                  <i class="fas fa-ellipsis"></i>
                  Outro
                </button>
              </div>
            </div>

            <!-- CD / Armazém -->
            <div class="criar-carga-section">
              <h4><i class="fas fa-warehouse"></i> Armazém (CD)</h4>
              <div class="form-group">
                <label>Armazém</label>
                <div v-if="criarCargaStorages.length === 1" class="form-input criar-carga-fixed-storage">
                  <i class="fas fa-warehouse"></i>
                  {{ criarCargaStorages[0].corpem || criarCargaStorages[0].id }} — {{ criarCargaStorages[0].name }}
                </div>
                <select v-else v-model="criarCargaData.storageCode" class="form-input criar-carga-select">
                  <option value="">Selecione o armazém...</option>
                  <option v-for="s in criarCargaStorages" :key="s.id" :value="s.id">{{ s.corpem || s.id }} — {{ s.name }}</option>
                </select>
              </div>
            </div>

            <!-- Tipo de carga -->
            <div class="criar-carga-section">
              <h4><i class="fas fa-boxes-stacked"></i> Tipo de carga</h4>
              <div class="wizard-buttons-row">
                <button
                  type="button"
                  class="wizard-choice-btn"
                  :class="{ selected: criarCargaData.loadType === 'batida' }"
                  @click="criarCargaData.loadType = 'batida'; criarCargaData.pallets = ''"
                >
                  <i class="fas fa-boxes-stacked"></i>
                  Batida
                </button>
                <button
                  type="button"
                  class="wizard-choice-btn"
                  :class="{ selected: criarCargaData.loadType === 'paletizada' }"
                  @click="criarCargaData.loadType = 'paletizada'"
                >
                  <i class="fas fa-pallet"></i>
                  Paletizada
                </button>
              </div>
              <div class="form-group criar-carga-pallets-group" style="margin-top: 0.75rem;">
                <label>Quantidade de paletes</label>
                <input
                  ref="criarCargaPallets"
                  v-model="criarCargaData.pallets"
                  type="text"
                  inputmode="numeric"
                  maxlength="3"
                  placeholder="Disponível apenas para carga paletizada"
                  class="form-input"
                  :disabled="criarCargaData.loadType !== 'paletizada'"
                  @input="criarCargaData.pallets = $event.target.value.replace(/\D/g, '').substring(0, 3)"
                  @keyup.enter="$refs.criarCargaCarPlate?.focus()"
                />
              </div>
            </div>

            <!-- Placas -->
            <div class="criar-carga-section">
              <h4><i class="fas fa-truck"></i> Placas do veículo</h4>
              <div class="wizard-plates-form">
                <div class="form-group">
                  <label>Placa do veículo <span class="required">*</span></label>
                  <input
                    ref="criarCargaCarPlate"
                    v-model="criarCargaData.carPlate"
                    type="text"
                    maxlength="7"
                    placeholder="ABC1D23"
                    class="form-input plate-input"
                    @input="criarCargaData.carPlate = $event.target.value.replace(/[^A-Za-z0-9]/g, '').substring(0, 7).toUpperCase()"
                    @keyup.enter="$refs.criarCargaLoadPlate1?.focus()"
                  />
                </div>
                <div class="form-group">
                  <label>Placa da carroceria</label>
                  <input
                    ref="criarCargaLoadPlate1"
                    v-model="criarCargaData.loadPlate1"
                    type="text"
                    maxlength="7"
                    placeholder="XYZ5678 (opcional)"
                    class="form-input plate-input"
                    @input="criarCargaData.loadPlate1 = $event.target.value.replace(/[^A-Za-z0-9]/g, '').substring(0, 7).toUpperCase()"
                    @keyup.enter="$refs.criarCargaLoadPlate2?.focus()"
                  />
                </div>
                <div class="form-group">
                  <label>Placa da 2ª carroceria</label>
                  <input
                    ref="criarCargaLoadPlate2"
                    v-model="criarCargaData.loadPlate2"
                    type="text"
                    maxlength="7"
                    placeholder="DEF9012 (opcional)"
                    class="form-input plate-input"
                    @input="criarCargaData.loadPlate2 = $event.target.value.replace(/[^A-Za-z0-9]/g, '').substring(0, 7).toUpperCase()"
                    @keyup.enter="$refs.criarCargaTransport?.focus()"
                  />
                </div>
              </div>
            </div>

            <!-- Transportadora -->
            <div class="criar-carga-section">
              <h4><i class="fas fa-shipping-fast"></i> Transportadora</h4>
              <div class="form-group autocomplete-wrapper">
                <input
                  ref="criarCargaTransport"
                  v-model="criarCargaData.transportCompany"
                  type="text"
                  maxlength="20"
                  placeholder="Digite para buscar..."
                  class="form-input"
                  @input="handleCriarCargaTransportInput"
                  @focus="showCriarCargaTransportSuggestions = true"
                  @blur="hideCriarCargaTransportSuggestionsDelayed"
                  @keyup.enter="showCriarCargaTransportSuggestions = false; $refs.criarCargaPresenterRg?.focus()"
                />
                <div
                  v-if="showCriarCargaTransportSuggestions && criarCargaTransportSuggestions.length > 0"
                  class="autocomplete-dropdown"
                >
                  <div
                    v-for="c in criarCargaTransportSuggestions"
                    :key="c.id"
                    class="autocomplete-item"
                    @mousedown.prevent="selectCriarCargaTransportSuggestion(c)"
                  >
                    {{ c.name }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Apresentador -->
            <div class="criar-carga-section">
              <h4><i class="fas fa-id-card"></i> Apresentador</h4>
              <div class="wizard-presenter-form">
                <div class="form-group">
                  <label>RG</label>
                  <div class="presenter-rg-wrapper">
                    <input
                      ref="criarCargaPresenterRg"
                      v-model="criarCargaData.presenterRg"
                      type="text"
                      maxlength="13"
                      placeholder="Ex: 1234567890123"
                      class="form-input"
                      @input="criarCargaData.presenterRg = $event.target.value.replace(/\D/g, '').substring(0, 13); criarCargaPresenterNotFound = false"
                      @keyup.enter="searchCriarCargaPresenter"
                    />
                    <button
                      type="button"
                      class="presenter-rg-search-btn"
                      :disabled="!criarCargaData.presenterRg || criarCargaPresenterSearching"
                      @click="searchCriarCargaPresenter"
                      title="Buscar apresentador pelo RG"
                    >
                      <i :class="criarCargaPresenterSearching ? 'fas fa-spinner fa-spin' : 'fas fa-search'"></i>
                    </button>
                  </div>
                  <span v-if="criarCargaPresenterNotFound" class="presenter-rg-not-found">
                    <i class="fas fa-exclamation-circle"></i> Nenhum cadastro encontrado para este RG
                  </span>
                </div>
                <div class="form-group">
                  <label>Nome</label>
                  <input
                    ref="criarCargaPresenterName"
                    v-model="criarCargaData.presenterName"
                    type="text"
                    placeholder="Nome do apresentador"
                    class="form-input"
                    @input="criarCargaData.presenterName = $event.target.value.toUpperCase()"
                    @keyup.enter="$refs.criarCargaPresenterCnh?.focus()"
                  />
                </div>
                <div class="form-group">
                  <label>CNH</label>
                  <input
                    ref="criarCargaPresenterCnh"
                    v-model="criarCargaData.presenterDriverLicense"
                    type="text"
                    maxlength="11"
                    placeholder="Número da CNH"
                    class="form-input"
                    @keyup.enter="$refs.criarCargaPresenterContact?.focus()"
                  />
                </div>
                <div class="form-group">
                  <label>Contato</label>
                  <input
                    ref="criarCargaPresenterContact"
                    v-model="criarCargaData.presenterContact"
                    type="text"
                    maxlength="11"
                    placeholder="Telefone (apenas números)"
                    class="form-input"
                    @input="criarCargaData.presenterContact = $event.target.value.replace(/\D/g, '').substring(0, 11)"
                    @keyup.enter="$refs.criarCargaObs?.focus()"
                  />
                </div>
              </div>
            </div>

            <!-- Observações -->
            <div class="criar-carga-section">
              <h4><i class="fas fa-comment-dots"></i> Observações</h4>
              <div class="form-group">
                <textarea
                  ref="criarCargaObs"
                  v-model="criarCargaData.obs"
                  maxlength="200"
                  rows="3"
                  placeholder="Observações sobre a carga (opcional)"
                  class="form-input obs-textarea"
                ></textarea>
                <small class="char-count">{{ (criarCargaData.obs || '').length }}/200</small>
              </div>
            </div>
          </div>
          <div class="modal-footer wizard-footer">
            <div class="wizard-footer-left">
              <button
                type="button"
                class="btn-secondary"
                :disabled="criarCargaLoading"
                @click="closeCriarCargaModal"
              >
                Cancelar
              </button>
            </div>
            <div class="wizard-footer-right">
              <button
                type="button"
                class="btn-primary criar-carga-confirm-btn"
                :disabled="!canSubmitCriarCarga || criarCargaLoading"
                @click="submitCriarCarga"
              >
                <i :class="criarCargaLoading ? 'fas fa-spinner fa-spin' : 'fas fa-check'"></i>
                {{ criarCargaLoading ? 'Criando...' : 'Criar carga' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal: Resumo da efetivação -->
    <div
      v-if="showLoadResultModal"
      class="modal-overlay"
      @click.self="closeLoadResultModal"
    >
      <div class="modal-container modal-sm">
        <div class="modal-header">
          <h3>
            <i class="fas fa-check-circle"></i>
            Efetivação Concluída
          </h3>
          <button @click="closeLoadResultModal" class="modal-close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="load-result-summary">
            <p v-if="loadResultSummary.success" class="result-success">
              <i class="fas fa-check"></i>
              {{ loadResultSummary.message }}
            </p>
            <p v-else class="result-error">
              <i class="fas fa-exclamation-triangle"></i>
              {{ loadResultSummary.message }}
            </p>
            <p v-if="loadResultSummary.loadId" class="result-detail">
              Carga: <strong>{{ loadResultSummary.loadId }}</strong>
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button
            v-if="loadResultSummary.success && loadResultSummary.loadId"
            type="button"
            class="btn-secondary"
            :disabled="downloadingControlPdf"
            @click="openControlPdf(loadResultSummary.loadId)"
          >
            <i
              :class="
                downloadingControlPdf
                  ? 'fas fa-spinner fa-spin'
                  : 'fas fa-print'
              "
            ></i>
            {{ downloadingControlPdf ? 'Gerando...' : 'Imprimir Documento' }}
          </button>
          <button
            type="button"
            class="btn-primary"
            @click="closeLoadResultModal"
          >
            OK
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Seleção de Transportadora -->
    <div
      v-if="showCompanySelectionModal"
      class="modal-overlay"
      @click.self="closeCompanySelectionModal"
    >
      <div class="modal-container">
        <div class="modal-header">
          <h3>
            <i class="fas fa-building"></i>
            Selecionar Transportadora
          </h3>
          <button @click="closeCompanySelectionModal" class="modal-close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="!showNewCompanyForm">
            <input
              v-model="companySearchInput"
              type="text"
              placeholder="Buscar por nome..."
              class="form-input search-input"
              autocomplete="off"
              data-lpignore="true"
              data-form-type="other"
              name="company-search"
            />
            <div class="selection-list-container">
              <div
                v-for="company in filteredTransportCompanies"
                :key="company.id"
                @click="selectedCompanyId = company.id"
                :class="[
                  'selection-item',
                  { selected: selectedCompanyId === company.id },
                ]"
              >
                <div class="selection-item-content">
                  <div class="selection-item-name">
                    <i class="fas fa-building"></i>
                    {{ company.name }}
                  </div>
                </div>
                <i
                  v-if="selectedCompanyId === company.id"
                  class="fas fa-check selection-check"
                ></i>
              </div>
              <div
                v-if="filteredTransportCompanies.length === 0"
                class="no-results"
              >
                <i class="fas fa-search"></i>
                Nenhuma transportadora encontrada
              </div>
            </div>
            <button
              @click="showNewCompanyForm = true"
              class="btn-link"
              style="margin-top: 12px"
            >
              <i class="fas fa-plus"></i>
              Cadastrar nova transportadora
            </button>
          </div>
          <div v-else class="new-form-container">
            <h4 class="form-section-title">
              <i class="fas fa-plus-circle"></i>
              Nova Transportadora
            </h4>

            <!-- Nome da Transportadora (apenas nome, sem CNPJ) -->
            <div class="form-group-inline">
              <label>Nome da Transportadora *</label>
              <input
                v-model="newCompanyData.name"
                type="text"
                placeholder="Digite o nome da transportadora"
                class="form-input"
              />
              <small class="help-text">
                <i class="fas fa-info-circle"></i>
                Cadastro apenas pelo nome (máximo 20 caracteres na criação de
                carga).
              </small>
            </div>

            <div class="form-actions">
              <button
                @click="cancelNewCompanyForm"
                :disabled="transportModalLoading"
                class="btn-secondary btn-sm"
              >
                <i class="fas fa-times"></i>
                Cancelar
              </button>
              <button
                @click="createNewCompany"
                :disabled="
                  transportModalLoading || !newCompanyData.name?.trim()
                "
                class="btn-success btn-sm"
              >
                <i
                  v-if="transportModalLoading"
                  class="fas fa-spinner fa-spin"
                ></i>
                <i v-else class="fas fa-check"></i>
                Cadastrar Transportadora
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeCompanySelectionModal" class="btn-secondary">
            <i class="fas fa-times"></i>
            Cancelar
          </button>
          <button
            @click="confirmCompanySelection"
            :disabled="!selectedCompanyId"
            class="btn-primary"
          >
            <i class="fas fa-check"></i>
            Confirmar Seleção
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Seleção de Apresentador -->
    <div
      v-if="showPresenterSelectionModal"
      class="modal-overlay"
      @click.self="closePresenterSelectionModal"
    >
      <div class="modal-container">
        <div class="modal-header">
          <h3>
            <i class="fas fa-user"></i>
            Selecionar Apresentador / Motorista
          </h3>
          <button @click="closePresenterSelectionModal" class="modal-close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="!showNewPresenterForm">
            <input
              v-model="presenterSearchInput"
              type="text"
              placeholder="Buscar por nome ou telefone..."
              class="form-input search-input"
              autocomplete="off"
              data-lpignore="true"
              data-form-type="other"
              name="presenter-search"
            />
            <div class="selection-list-container">
              <div
                v-for="presenter in filteredTransportPresenters"
                :key="presenter.id"
                @click="selectedPresenterId = presenter.id"
                :class="[
                  'selection-item',
                  { selected: selectedPresenterId === presenter.id },
                ]"
              >
                <div class="selection-item-content">
                  <div class="selection-item-name">
                    <i class="fas fa-user"></i>
                    {{ presenter.name }}
                  </div>
                  <div class="selection-item-detail">
                    Tel: {{ presenter.phone }}
                  </div>
                </div>
                <i
                  v-if="selectedPresenterId === presenter.id"
                  class="fas fa-check selection-check"
                ></i>
              </div>
              <div
                v-if="filteredTransportPresenters.length === 0"
                class="no-results"
              >
                <i class="fas fa-search"></i>
                Nenhum apresentador encontrado
              </div>
            </div>
            <button
              @click="showNewPresenterForm = true"
              class="btn-link"
              style="margin-top: 12px"
            >
              <i class="fas fa-plus"></i>
              Cadastrar novo apresentador
            </button>
          </div>
          <div v-else class="new-form-container">
            <h4 class="form-section-title">
              <i class="fas fa-user-plus"></i>
              Novo Apresentador / Motorista
            </h4>

            <!-- Nome Field -->
            <div class="form-group-inline">
              <label>Nome Completo *</label>
              <input
                v-model="newPresenterData.name"
                type="text"
                placeholder="Digite o nome completo do apresentador"
                class="form-input"
              />
              <small class="help-text">
                <i class="fas fa-info-circle"></i>
                Nome completo do motorista ou apresentador responsável
              </small>
            </div>

            <!-- Telefone Field -->
            <div class="form-group-inline">
              <label>Telefone / Celular *</label>
              <input
                v-model="newPresenterData.phone"
                type="text"
                placeholder="(00) 00000-0000"
                class="form-input"
                maxlength="11"
                @input="handlePhoneInput"
              />
              <small class="help-text">
                <i class="fas fa-phone"></i>
                Apenas números, com DDD (10 ou 11 dígitos)
              </small>
            </div>

            <div class="form-actions">
              <button
                @click="cancelNewPresenterForm"
                :disabled="transportModalLoading"
                class="btn-secondary btn-sm"
              >
                <i class="fas fa-times"></i>
                Cancelar
              </button>
              <button
                @click="createNewPresenter"
                :disabled="
                  transportModalLoading ||
                  !newPresenterData.name ||
                  !newPresenterData.phone
                "
                class="btn-success btn-sm"
              >
                <i
                  v-if="transportModalLoading"
                  class="fas fa-spinner fa-spin"
                ></i>
                <i v-else class="fas fa-check"></i>
                Cadastrar Apresentador
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closePresenterSelectionModal" class="btn-secondary">
            <i class="fas fa-times"></i>
            Cancelar
          </button>
          <button
            @click="confirmPresenterSelection"
            :disabled="!selectedPresenterId"
            class="btn-primary"
          >
            <i class="fas fa-check"></i>
            Confirmar Seleção
          </button>
        </div>
      </div>
    </div>

    <!-- Notificações -->
    <div v-if="notifications.length > 0" class="notifications-container">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification', notification.type]"
      >
        <i
          :class="[
            'fas',
            notification.type === 'success'
              ? 'fa-check-circle'
              : notification.type === 'error'
                ? 'fa-exclamation-circle'
                : 'fa-info-circle',
          ]"
        ></i>
        <span>{{ notification.message }}</span>
        <button
          @click="removeNotification(notification.id)"
          class="notification-close"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { BASE_URL } from '../config/api.js'

export default {
  name: 'ManagementPage',
  props: {
    initialTab: {
      type: String,
      default: 'loads',
      validator: value => ['loads', 'clients', 'history'].includes(value),
    },
    /** 'cargas' = página de Cargas (abas Cargas + Histórico). 'clientes' = página dedicada só de Clientes (sem abas). */
    pageMode: {
      type: String,
      default: 'cargas',
      validator: value => ['cargas', 'clientes'].includes(value),
    },
  },
  data() {
    return {
      activeTab: this.initialTab,
      loading: false,
      error: null,

      // Busca NFe - Nova lógica
      searchInput: '',
      searchLoading: false,
      consultedNfes: [], // Lista de NFes consultadas (incluindo não agendadas)
      hasSearched: false,
      lastSearchTerm: '',

      // Modais de busca
      showNotFoundModal: false,
      showClientSelectionModal: false,
      showMultipleResultsModal: false,
      showStorageMismatchModal: false, // Modal de CD incompatível (entre agendamentos)
      showUserStorageMismatchModal: false, // Modal de CD incompatível (com usuário)
      currentSearchResults: [], // Resultados temporários da busca atual
      currentNfeData: null, // Dados da NFe atual sendo processada
      storageMismatchDetails: {
        // Detalhes do conflito de CD
        existingStorage: null,
        newStorage: null,
      },
      userStorageMismatchDetails: {
        // Detalhes do conflito de CD com usuário
        scheduleStorage: null,
        userStorages: [],
        clientName: null,
      },

      // Clientes
      clients: [], // Clientes da aba de Gestão (TODOS, sem filtro)
      selectableClients: [], // Clientes para seleção no modal (apenas permitidos)
      filteredClients: [],
      clientSearchInput: '', // Busca na aba de Clientes
      clientSelectionSearchInput: '', // Busca no modal de seleção
      volumetryInput: null, // Volumetria para NFe não agendada
      expandedComments: [],
      newCommentText: {},
      commentLoading: false,

      // Cargas
      loads: [], // Cargas agrupadas por load_id (exceto ENVIADO)
      allLoads: [], // Todas as cargas (incluindo ENVIADO) para histórico
      selectedLoadSchedules: {}, // IDs selecionados por load_id: { loadId: [scheduleId1, scheduleId2, ...] }
      dockInputs: {}, // Valores dos inputs de dock por load_id: { loadId: dockNumber }
      historySearchInput: '', // Campo de busca na aba de histórico

      // Modal de detalhes
      showDetailsModal: false,
      selectedResult: null,

      // Modal de comentários do cliente
      showCommentsModal: false,
      selectedClient: null,

      // Notificações
      notifications: [],
      notificationId: 0,

      // Modal de transporte (transportadora + apresentador)
      showTransportModal: false,
      showCompanySelectionModal: false, // Modal de seleção de transportadora
      showPresenterSelectionModal: false, // Modal de seleção de apresentador
      transportCompanies: [],
      transportPresenters: [],
      selectedCompanyId: null,
      selectedPresenterId: null,
      selectedCompany: null, // Objeto completo da transportadora selecionada
      selectedPresenter: null, // Objeto completo do apresentador selecionado
      showNewCompanyForm: false,
      showNewPresenterForm: false,
      companySearchInput: '', // Busca de transportadoras
      presenterSearchInput: '', // Busca de apresentadores
      newCompanyData: {
        name: '',
      },
      newPresenterData: {
        name: '',
        phone: '',
      },
      transportModalLoading: false,
      pendingScheduleIds: null, // IDs de agendamentos aguardando seleção de transporte
      pendingUnscheduledChaves: null, // Chaves de NFes não agendadas (criar após preencher transporte)

      // Wizard de efetivação
      transportWizardStep: 1,
      wizardOperationOptions: [
        { value: 'entrega',        label: 'Entrega',        icon: 'fas fa-truck-ramp-box' },
        { value: 'coleta',         label: 'Coleta',         icon: 'fas fa-boxes-packing' },
        { value: 'troca de nota',  label: 'Troca de nota',  icon: 'fas fa-file-invoice' },
        { value: 'outro',          label: 'Outro',          icon: 'fas fa-ellipsis' },
      ],
      loadWizardData: {
        operations: [], // multi-select: ['entrega', 'coleta', ...]
        loadType: null, // 'batida' | 'paletizada'
        pallets: '',
        carPlate: '',
        loadPlate1: '',
        loadPlate2: '',
        transportCompany: '',
        presenterRg: '',
        presenterName: '',
        presenterDriverLicense: '',
        presenterContact: '',
      },
      transportSuggestions: [],
      showTransportSuggestions: false,
      transportSuggestionsDebounce: null,

      // Modal de resumo da efetivação
      showLoadResultModal: false,
      loadResultSummary: { success: false, message: '', loadId: null },
      downloadingControlPdf: false,

      // Campos de transporte (legado - mantidos para compatibilidade)
      loadTransportCompany: '',
      loadPresenterName: '',
      loadPresenterContact: '',

      // Modal de observação da carga (criação)
      showObsModal: false,
      loadObservation: '', // Observação da carga (varchar 200)

      // Modal de visualização de observação da carga
      showViewObsModal: false,
      currentLoadObs: null, // Objeto da carga atual para visualizar observação

      // Modal de histórico da carga
      showLoadHistoryModal: false,
      loadHistoryLoadId: null,
      loadHistoryEntries: [],
      loadHistoryLoading: false,

      // Checkbox de devolução por agendamento
      returnSchedules: [], // Array de IDs de agendamentos que são devolução

      // Modal: Criar carga vazia
      showCriarCargaModal: false,
      criarCargaLoading: false,
      criarCargaStorages: [], // Array de { id, name }
      criarCargaData: {
        operationType: '',
        storageCode: '',
        loadType: 'batida',
        pallets: '',
        carPlate: '',
        loadPlate1: '',
        loadPlate2: '',
        transportCompany: '',
        presenterRg: '',
        presenterName: '',
        presenterDriverLicense: '',
        presenterContact: '',
        obs: '',
      },
      criarCargaTransportSuggestions: [],
      showCriarCargaTransportSuggestions: false,
      criarCargaTransportDebounce: null,
      criarCargaPresenterSearching: false,
      criarCargaPresenterNotFound: false,
    }
  },

  watch: {
    initialTab(newTab) {
      this.activeTab = newTab
    },
    pageMode(mode) {
      if (mode === 'clientes') {
        this.activeTab = 'clients'
        // Sempre carregar clientes ao abrir a página dedicada (lista atualizada)
        this.loadClients()
      }
    },
    // Observar mudanças nos inputs de doca para forçar atualização do botão
    dockInputs: {
      handler() {
        this.$nextTick(() => {
          this.$forceUpdate()
        })
      },
      deep: true,
    },
    // Observar mudanças nas seleções para forçar atualização do botão
    selectedLoadSchedules: {
      handler() {
        this.$nextTick(() => {
          this.$forceUpdate()
        })
      },
      deep: true,
    },
  },

  mounted() {
    // Página dedicada de Clientes: forçar aba clientes e carregar
    if (this.pageMode === 'clientes') {
      this.activeTab = 'clients'
      this.loadClients()
      return
    }
    // Página de Cargas: carregar dados da aba ativa
    if (this.activeTab === 'loads') {
      this.loadLoads()
    } else if (this.activeTab === 'clients') {
      this.loadClients()
    } else if (this.activeTab === 'history') {
      this.loadAllLoads()
    }
  },

  methods: {
    // Navegação entre abas
    switchToClientsTab() {
      this.activeTab = 'clients'
      if (this.clients.length === 0) {
        this.loadClients()
      }
    },

    switchToLoadsTab() {
      this.activeTab = 'loads'
      this.loadLoads()
    },

    switchToHistoryTab() {
      this.activeTab = 'history'
      this.loadAllLoads()
    },

    retryLoad() {
      this.error = null
      if (this.activeTab === 'clients') {
        this.loadClients()
      } else if (this.activeTab === 'loads') {
        this.loadLoads()
      } else if (this.activeTab === 'history') {
        this.loadAllLoads()
      }
    },

    // Métodos de busca NFe - Nova lógica
    async performSearch() {
      if (!this.searchInput.trim()) return

      this.searchLoading = true
      this.lastSearchTerm = this.searchInput.trim()
      this.hasSearched = true

      try {
        const apiClient = window.apiClient
        const response = await apiClient.request('/schedules/search', {
          method: 'GET',
          params: {
            query: this.lastSearchTerm,
          },
        })

        const results = response.data || []
        console.log('🔍 Resultados da busca:', results)

        // Normalizar chave: código de barras do DANFE pode vir com prefixo (ex.: "NFe" + 44 dígitos)
        const searchTerm = this.lastSearchTerm
        const digitsOnly = searchTerm.replace(/\D/g, '')
        const key44 =
          digitsOnly.length === 44
            ? digitsOnly
            : digitsOnly.length > 44
              ? digitsOnly.slice(-44)
              : null
        const isFullKey = key44 !== null
        const nfeNumber = isFullKey ? this.extractNfeNumber(key44) : searchTerm

        console.log('🔍 [DEBUG] Processando busca:')
        console.log('  - Termo digitado:', searchTerm)
        console.log('  - Apenas dígitos:', digitsOnly.length, 'chars')
        console.log(
          '  - É chave completa (44 dígitos)?',
          isFullKey,
          key44 ? '(normalizada)' : ''
        )
        console.log('  - Número extraído:', nfeNumber)

        this.currentNfeData = {
          searchTerm: searchTerm,
          nfeKey: isFullKey ? key44 : null,
          nfeNumber: nfeNumber,
        }

        if (results.length === 0) {
          // Nenhum agendamento encontrado: se for chave de 44 dígitos, criar via Meu Danfe e adicionar à lista
          if (isFullKey) {
            try {
              const createRes = await apiClient.request(
                '/meu-danfe/search-and-create',
                {
                  method: 'POST',
                  data: { chave_acesso: key44 },
                }
              )
              if (createRes.schedule && createRes.schedule.id) {
                const s = createRes.schedule
                const scheduleForList = {
                  id: s.id,
                  number: s.number,
                  nfe_key: s.nfe_key,
                  client: s.client,
                  client_name: s.client_name || 'Não identificado',
                  status: s.status || 'Não agendado',
                  case_count: s.case_count || 0,
                  date: s.date,
                  storage: s.storage ?? null,
                  storage_display: s.storage_display ?? null,
                  is_booking: s.is_booking ?? 2,
                  _isNew: false,
                }
                this.addToConsultedList(scheduleForList)
                this.addNotification(
                  createRes.created
                    ? 'Agendamento criado (Meu Danfe) e adicionado à lista.'
                    : 'Agendamento adicionado à lista.',
                  'success'
                )
              } else {
                this.addUnscheduledNfeDirectly(this.currentNfeData)
                this.addNotification(
                  'NFe adicionada à lista. Clique em Efetivar para criar o agendamento.',
                  'success'
                )
              }
            } catch (createErr) {
              const status = createErr.response?.status
              const data = createErr.response?.data || {}
              if (status === 409 && data.schedule && data.schedule.id) {
                try {
                  const fullRes = await apiClient.request(
                    `/schedules/${data.schedule.id}`
                  )
                  const s = fullRes
                  const scheduleForList = {
                    id: s.id,
                    number: s.number,
                    nfe_key: s.nfe_key,
                    client: s.client,
                    client_name: s.client_name ?? null,
                    status: s.status,
                    case_count: s.case_count || 0,
                    date: s.date,
                    storage: s.storage ?? null,
                    storage_display: s.storage_display ?? null,
                    is_booking: s.is_booking,
                    _isNew: false,
                  }
                  this.addToConsultedList(scheduleForList)
                  this.addNotification(
                    'Agendamento já existente e adicionado à lista.',
                    'success'
                  )
                } catch (fetchErr) {
                  this.addUnscheduledNfeDirectly(this.currentNfeData)
                  this.addNotification(
                    'Chave já cadastrada. NFe adicionada à lista; clique em Efetivar para vincular à carga.',
                    'warning'
                  )
                }
              } else {
                console.warn(
                  'Meu Danfe search-and-create falhou, adicionando como temp:',
                  createErr
                )
                this.addUnscheduledNfeDirectly(this.currentNfeData)
                const msg =
                  data.error ||
                  data.details ||
                  createErr.message ||
                  'Não foi possível criar pelo Meu Danfe.'
                this.addNotification(
                  `NFe adicionada à lista. ${msg} Clique em Efetivar para tentar novamente.`,
                  'warning'
                )
              }
            }
          } else {
            this.addUnscheduledNfeDirectly(this.currentNfeData)
            this.addNotification(
              'NFe adicionada à lista. Informe a chave de acesso (44 dígitos) e busque novamente para criar o agendamento, ou clique em Efetivar.',
              'success'
            )
          }
          this.searchInput = ''
        } else if (results.length === 1) {
          // Um único agendamento encontrado - adicionar diretamente à lista
          console.log('✅ Um agendamento encontrado')
          this.addToConsultedList(results[0])
          this.addNotification('Agendamento adicionado à lista', 'success')
          this.searchInput = '' // Limpar input para próxima busca
        } else {
          // Múltiplos agendamentos encontrados - abrir modal de seleção
          console.log('📋 Múltiplos agendamentos encontrados:', results.length)
          this.currentSearchResults = results
          this.showMultipleResultsModal = true
        }
      } catch (error) {
        console.error('Erro na busca:', error)
        console.error('Detalhes do erro:', error.response?.data)
        console.error('Status do erro:', error.response?.status)

        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Erro ao realizar busca. Tente novamente.'

        this.addNotification(errorMessage, 'error')
      } finally {
        this.searchLoading = false
        this.focusCargaSearchInput()
      }
    },

    // Devolve o foco à barra de busca da página de Cargas para inserir nova chave
    focusCargaSearchInput() {
      this.$nextTick(() => {
        const el = this.$refs.cargaSearchInput
        if (el && typeof el.focus === 'function') el.focus()
      })
    },

    // Adicionar agendamento à lista de consultados
    addToConsultedList(schedule) {
      // Verificar se já não está na lista
      const exists = this.consultedNfes.find(item => item.id === schedule.id)
      if (exists) {
        this.addNotification('Este agendamento já está na lista', 'warning')
        return
      }

      // VALIDAÇÃO DE CD DO USUÁRIO: Verificar se o CD do agendamento está na lista de CDs do usuário
      const currentUser = this.getCurrentUser()
      const userConfig = currentUser?.config || {}
      const userStorages = userConfig.storage || [] // Array de CDs permitidos - siglas (ex: ["CR", "ML"])
      const scheduleStorage =
        schedule.storage_display || schedule.storage || null

      console.log('🔍 [USER CD VALIDATION] Validando CD do usuário:')
      console.log(
        '  - CDs do usuário:',
        userStorages.length > 0 ? userStorages : 'Todos (array vazia)'
      )
      console.log('  - CD do agendamento:', scheduleStorage || 'Sem CD')
      console.log('  - Level do usuário:', currentUser?.level_access)

      // Se usuário tem array de CDs configurada (não vazia), validar
      // Level 0 e 1 com array vazia = acesso a todos os CDs (conforme CLAUDE.md)
      const shouldValidateCD = userStorages.length > 0
      const isLevel0or1 =
        currentUser?.level_access === 0 || currentUser?.level_access === 1

      // Armazenar flag para mostrar aviso de CD após adicionar o agendamento
      let shouldShowStorageWarning = false

      // Só mostra aviso se for o PRIMEIRO agendamento da lista (consultedNfes vazia)
      const isFirstSchedule = this.consultedNfes.length === 0

      if (
        shouldValidateCD &&
        !userStorages.includes(scheduleStorage) &&
        isFirstSchedule
      ) {
        console.log(
          '⚠️ [USER CD VALIDATION] CD do agendamento não está na lista do usuário - mostrando aviso (primeiro agendamento)'
        )

        // Buscar nome do cliente para exibição
        const clientName =
          schedule.client_name || schedule.client || 'Cliente não identificado'

        // Armazenar detalhes do conflito
        this.userStorageMismatchDetails = {
          scheduleStorage: scheduleStorage,
          userStorages: userStorages,
          clientName: clientName,
        }

        // Marcar para exibir modal após adicionar
        shouldShowStorageWarning = true
      } else if (shouldValidateCD && !userStorages.includes(scheduleStorage)) {
        console.log(
          'ℹ️ [USER CD VALIDATION] CD divergente detectado, mas não é o primeiro agendamento - aviso já foi exibido'
        )
      } else {
        console.log(
          '✅ [USER CD VALIDATION] CD do agendamento está na lista do usuário'
        )
      }

      // VALIDAÇÃO DE CD: usar como referência o primeiro agendamento COM CD cadastrado (não "Sem CD")
      if (this.consultedNfes.length > 0) {
        const existingStorage = this.getFirstDefinedStorageInConsultedList()
        const newStorage = schedule.storage_display || schedule.storage || null
        const newStorageDefined =
          newStorage != null &&
          String(newStorage).trim() !== '' &&
          String(newStorage).trim() !== '-'

        console.log('🔍 [CD VALIDATION] Validando storage:')
        console.log(
          '  - CD de referência da lista (primeiro com CD cadastrado):',
          existingStorage || 'Sem CD (nenhum na lista)'
        )
        console.log('  - Storage do novo agendamento:', newStorage || 'Sem CD')

        // Bloquear só quando há um CD de referência na lista e o novo tem outro CD definido
        if (
          existingStorage &&
          newStorageDefined &&
          existingStorage !== String(newStorage).trim()
        ) {
          console.log(
            '❌ [CD VALIDATION] Agendamento rejeitado - CD incompatível'
          )

          // Armazenar detalhes do conflito
          this.storageMismatchDetails = {
            existingStorage: existingStorage,
            newStorage: newStorage,
          }

          // Exibir modal de alerta
          this.showStorageMismatchModal = true
          return
        }

        console.log(
          '✅ [CD VALIDATION] Storage compatível - agendamento pode ser adicionado'
        )
      }

      this.consultedNfes.unshift({
        ...schedule,
        _isNew: false, // Flag para indicar que já existia
      })
      console.log('✅ Agendamento adicionado à lista:', schedule)

      // Exibir modal de aviso de CD se necessário (APÓS adicionar o agendamento)
      if (shouldShowStorageWarning) {
        console.log('⚠️ Exibindo modal de aviso de CD incompatível')
        this.showUserStorageMismatchModal = true
      }
    },

    // Adicionar NFe não agendada diretamente à lista (sem modal de volumetria/estoque)
    // Usado quando busca não encontra agendamento - lista pode conter vários itens (existentes e não agendados)
    addUnscheduledNfeDirectly(nfeData) {
      if (!nfeData) return

      const searchTerm = nfeData.searchTerm?.trim() || ''
      const digitsOnly = searchTerm.replace(/\D/g, '')
      const key44 =
        digitsOnly.length === 44
          ? digitsOnly
          : digitsOnly.length > 44
            ? digitsOnly.slice(-44)
            : null
      const isFullKey = key44 !== null
      const nfeNumber = isFullKey ? this.extractNfeNumber(key44) : searchTerm
      const nfeKey = isFullKey ? key44 : null

      const unscheduledItem = {
        id: `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        nfe_key: nfeKey,
        nfeNumber: nfeNumber,
        number: nfeNumber,
        client: null,
        client_name: null,
        storage: null,
        date: new Date().toISOString().split('T')[0],
        case_count: 0,
        status: 'Não agendado',
        is_booking: 2,
        _isNew: true,
        _tempId: true,
      }

      this.consultedNfes.unshift(unscheduledItem)
    },

    // Adicionar NFe não agendada à lista (com dados de volumetria e estoque - fluxo legado)
    addUnscheduledNfe(nfeData, client) {
      console.log('🔍 [DEBUG] addUnscheduledNfe recebeu:')
      console.log('  - nfeData:', nfeData)
      console.log('  - client:', client)
      console.log('  - volumetria:', this.volumetryInput)

      // Validar volumetria
      if (!this.volumetryInput || this.volumetryInput < 1) {
        this.addNotification(
          'Por favor, informe a volumetria antes de selecionar o estoque',
          'error'
        )
        return
      }

      // Normalizar chave (código de barras pode vir com prefixo ex.: "NFe" + 44 dígitos)
      const raw = (nfeData.searchTerm || '').trim()
      const digitsOnly = raw.replace(/\D/g, '')
      const key44 =
        digitsOnly.length === 44
          ? digitsOnly
          : digitsOnly.length > 44
            ? digitsOnly.slice(-44)
            : null

      // Criar objeto para NFe não agendada (is_booking = 2)
      const unscheduledItem = {
        id: `temp_${Date.now()}`, // ID temporário único
        nfe_key: key44 || nfeData.nfeKey || null,
        nfeNumber: nfeData.nfeNumber || nfeData.searchTerm,
        number: nfeData.nfeNumber || nfeData.searchTerm,
        client: client.cnpj,
        client_name: client.name,
        storage: client.storage,
        storage_display: client.storage_corpem || client.storage,
        date: new Date().toISOString().split('T')[0],
        case_count: this.volumetryInput, // Volumetria informada
        status: 'Não agendado',
        is_booking: 2, // Marcar como "Não agendado" (diferente de marcação = 1)
        _isNew: true, // Flag para indicar que precisa ser criado
        _tempId: true, // Flag para indicar ID temporário
      }

      console.log('🔍 [DEBUG] Item criado:', unscheduledItem)

      this.consultedNfes.unshift(unscheduledItem)
      console.log('✅ NFe adicionada como "Não agendado":', unscheduledItem)
      this.addNotification(
        `NFe ${unscheduledItem.nfeNumber} adicionada como "Não agendado" (${this.volumetryInput} volumes)`,
        'success'
      )
    },

    // Modal "Não encontrado" - Resposta SIM
    async handleNotFoundYes() {
      this.showNotFoundModal = false
      // Carregar clientes permitidos para seleção (com filtro de cli_access)
      await this.loadSelectableClients()
      this.showClientSelectionModal = true
    },

    // Modal "Não encontrado" - Resposta NÃO
    handleNotFoundNo() {
      this.showNotFoundModal = false
      this.currentNfeData = null
      this.searchInput = '' // Limpar input
    },

    // Modal de seleção de cliente - Cliente selecionado
    handleClientSelected(client) {
      console.log('🏢 Cliente selecionado:', client)
      this.addUnscheduledNfe(this.currentNfeData, client)

      // Só fechar o modal se a NFe foi adicionada com sucesso (validação passou)
      if (
        this.consultedNfes.some(
          item => item._tempId && item.client === client.cnpj
        )
      ) {
        this.showClientSelectionModal = false
        this.clientSelectionSearchInput = '' // Limpar busca do modal
        this.volumetryInput = null // Limpar volumetria
        this.currentNfeData = null
        this.searchInput = '' // Limpar input para próxima busca
      }
    },

    // Modal de seleção de cliente - Cancelar
    handleClientSelectionCancel() {
      this.showClientSelectionModal = false
      this.clientSelectionSearchInput = '' // Limpar busca do modal
      this.volumetryInput = null // Limpar volumetria
      this.currentNfeData = null
    },

    // Modal de múltiplos resultados - Agendamento selecionado
    handleMultipleResultsSelected(schedule) {
      console.log('✅ Agendamento selecionado:', schedule)
      this.addToConsultedList(schedule)
      this.showMultipleResultsModal = false
      this.currentSearchResults = []
      this.currentNfeData = null
      this.searchInput = '' // Limpar input para próxima busca
      this.addNotification('Agendamento adicionado à lista', 'success')
      this.focusCargaSearchInput()
    },

    // Modal de múltiplos resultados - Cancelar
    handleMultipleResultsCancel() {
      this.showMultipleResultsModal = false
      this.currentSearchResults = []
      this.currentNfeData = null
    },

    // Modal de CD incompatível - Fechar
    closeStorageMismatchModal() {
      this.showStorageMismatchModal = false
      this.storageMismatchDetails = {
        existingStorage: null,
        newStorage: null,
      }
    },

    // Modal de CD incompatível com usuário - Fechar
    closeUserStorageMismatchModal() {
      this.showUserStorageMismatchModal = false
      this.userStorageMismatchDetails = {
        scheduleStorage: null,
        userStorages: [],
        clientName: null,
      }
    },

    // Limpar lista de NFes consultadas
    clearSearchResults() {
      this.consultedNfes = []
      this.hasSearched = false
      this.searchInput = ''
      this.lastSearchTerm = ''
      this.loadObservation = '' // Limpar observação ao limpar lista
      this.returnSchedules = [] // Limpar checkboxes de devolução
    },

    // Toggle checkbox de devolução para um agendamento
    toggleReturnSchedule(scheduleId, isReturn) {
      if (isReturn) {
        if (!this.returnSchedules.includes(scheduleId)) {
          this.returnSchedules.push(scheduleId)
        }
      } else {
        const index = this.returnSchedules.indexOf(scheduleId)
        if (index > -1) {
          this.returnSchedules.splice(index, 1)
        }
      }
    },

    // Verificar se um agendamento é devolução
    isReturnSchedule(scheduleId) {
      return this.returnSchedules.includes(scheduleId)
    },

    // Remover item individual da lista
    removeFromConsultedList(index) {
      const item = this.consultedNfes[index]
      // Remover da lista de devoluções se estiver lá
      if (item.id) {
        const returnIndex = this.returnSchedules.indexOf(item.id)
        if (returnIndex > -1) {
          this.returnSchedules.splice(returnIndex, 1)
        }
      }
      this.consultedNfes.splice(index, 1)
      this.addNotification('Item removido da lista', 'success')
    },

    // Efetivar lista - processar agendamentos
    async effectiveSchedules() {
      const unscheduledItems = this.consultedNfes.filter(item => item._isNew)

      if (unscheduledItems.length === 0 && this.consultedNfes.length === 0) {
        this.addNotification('Nenhum item para efetivar', 'warning')
        return
      }

      if (unscheduledItems.length === 0) {
        // Todos já estão agendados, abrir modal de transporte
        await this.assignLoadToSchedules()
        return
      }

      // Itens _isNew: abrir modal de transporte primeiro; criar agendamentos após informar transportadora/apresentador
      const needsNfeInfo = unscheduledItems.filter(item => {
        if (!item.nfe_key) return true
        const digits = String(item.nfe_key).replace(/\D/g, '')
        return digits.length < 44
      })
      if (needsNfeInfo.length > 0) {
        this.addNotification(
          'Para efetivar NFe sem agendamento, é necessária a chave de acesso completa (44 dígitos). Remova o(s) item(ns) e busque novamente com a chave.',
          'error'
        )
        return
      }

      const chaves = unscheduledItems.map(item => {
        const d = String(item.nfe_key || '').replace(/\D/g, '')
        return d.length === 44
          ? d
          : d.length > 44
            ? d.slice(-44)
            : item.nfe_key || ''
      })
      const existingIds = this.consultedNfes
        .filter(item => !item._tempId && item.id)
        .map(item => item.id)

      await this.openTransportModal(existingIds, chaves)
    },

    // Atribuir load_id a todos os agendamentos da lista
    async assignLoadToSchedules() {
      console.log(
        '🔍 [DEBUG] consultedNfes antes de filtrar:',
        this.consultedNfes
      )

      // Filtrar apenas agendamentos com ID válido (permite substituir carga existente)
      const scheduleIds = this.consultedNfes
        .filter(item => {
          const hasValidId = !item._tempId && item.id
          const hasLoad = item.load && item.load !== '' && item.load !== null

          console.log(
            `  - Item ID ${item.id}: hasValidId=${hasValidId}, load="${item.load}", hasLoad=${hasLoad}`
          )

          return hasValidId // Permite agendamentos com ou sem carga
        })
        .map(item => item.id)

      console.log(
        '🔍 [DEBUG] IDs que serão enviados para assign-load:',
        scheduleIds
      )

      if (scheduleIds.length === 0) {
        this.addNotification(
          'Nenhum agendamento válido para atribuir carga',
          'warning'
        )
        return
      }

      // Abrir modal de seleção de transporte ao invés de criar carga diretamente
      await this.openTransportModal(scheduleIds, null)
    },

    // Métodos do modal de transporte (wizard)
    async openTransportModal(scheduleIds, unscheduledChaves = null) {
      this.pendingScheduleIds = scheduleIds || []
      this.pendingUnscheduledChaves = unscheduledChaves || null
      this.showTransportModal = true
      this.transportWizardStep = 1
      this.loadWizardData = {
        operations: [],
        loadType: 'batida',
        pallets: '',
        carPlate: '',
        loadPlate1: '',
        loadPlate2: '',
        transportCompany: '',
        presenterRg: '',
        presenterName: '',
        presenterDriverLicense: '',
        presenterContact: '',
      }
      this.transportSuggestions = []
      this.showTransportSuggestions = false
      this.showLoadResultModal = false
      this.loadResultSummary = { success: false, message: '', loadId: null }
      this.loadTransportCompany = ''
      this.loadPresenterName = ''
      this.loadPresenterContact = ''
    },

    // Método para formatar telefone do apresentador (apenas números)
    handlePresenterPhoneInput(event) {
      // Remove todos os caracteres não numéricos
      let value = event.target.value.replace(/\D/g, '')
      // Limita a 11 dígitos
      if (value.length > 11) {
        value = value.slice(0, 11)
      }
      this.loadPresenterContact = value
    },

    // Métodos do modal de observação (criação)
    openObsModal() {
      this.showObsModal = true
    },

    closeObsModal() {
      this.showObsModal = false
    },

    saveObservation() {
      // Apenas fecha o modal, a observação já está salva em loadObservation
      this.showObsModal = false
      if (this.loadObservation.trim()) {
        this.addNotification('Observação adicionada', 'success')
      }
    },

    // Métodos do modal de visualização de observação
    showLoadObservation(load) {
      this.currentLoadObs = load
      this.showViewObsModal = true
    },

    closeViewObsModal() {
      this.showViewObsModal = false
      this.currentLoadObs = null
    },

    async openLoadHistoryModal(load) {
      if (!load || !load.load_id) return
      this.loadHistoryLoadId = load.load_id
      this.loadHistoryEntries = []
      this.showLoadHistoryModal = true
      this.loadHistoryLoading = true
      try {
        const apiClient = window.apiClient
        const response = await apiClient.request(
          `/loads/${encodeURIComponent(load.load_id)}`
        )
        const data = response?.data?.data || response?.data
        let historic = data && data.historic ? data.historic : {}
        if (typeof historic === 'string') {
          try {
            historic = JSON.parse(historic)
          } catch (_) {
            historic = {}
          }
        }
        const entries = Object.keys(historic || {})
          .filter(key => historic[key] && typeof historic[key] === 'object')
          .map(key => ({
            timestamp: historic[key].timestamp,
            user: historic[key].user,
            action: historic[key].action,
            comment: historic[key].comment,
          }))
          .sort((a, b) => {
            const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0
            const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0
            return ta - tb
          })
        this.loadHistoryEntries = entries
      } catch (err) {
        this.addNotification('Erro ao carregar histórico da carga', 'error')
        this.loadHistoryEntries = []
      } finally {
        this.loadHistoryLoading = false
      }
    },

    closeLoadHistoryModal() {
      this.showLoadHistoryModal = false
      this.loadHistoryLoadId = null
      this.loadHistoryEntries = []
    },

    formatLoadHistoryTime(isoString) {
      if (!isoString) return '—'
      try {
        const d = new Date(isoString)
        if (isNaN(d.getTime())) return isoString
        const pad = n => String(n).padStart(2, '0')
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
      } catch (_) {
        return isoString
      }
    },

    closeTransportModal() {
      this.showTransportModal = false
      this.pendingScheduleIds = null
      this.pendingUnscheduledChaves = null
      this.transportWizardStep = 1
      this.showLoadResultModal = false
      this.selectedCompanyId = null
      this.selectedPresenterId = null
      this.selectedCompany = null
      this.selectedPresenter = null
      this.showNewCompanyForm = false
      this.showNewPresenterForm = false
      this.companySearchInput = ''
      this.presenterSearchInput = ''
      this.newCompanyData = { name: '' }
      this.newPresenterData = { name: '', phone: '' }
      this.loadTransportCompany = ''
      this.loadPresenterName = ''
      this.loadPresenterContact = ''
    },

    closeLoadResultModal() {
      this.showLoadResultModal = false
      this.closeTransportModal()
    },

    /**
     * Baixa e abre o PDF "Controle de Entrada e Saída de Veículos" da carga em nova aba.
     * Usa fetch com Authorization header (não dá para colocar o token na URL de uma <a target=_blank>)
     * e abre o blob resultante via Object URL.
     */
    async openControlPdf(loadId) {
      if (!loadId || this.downloadingControlPdf) return
      this.downloadingControlPdf = true
      let blobUrl = null
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(
          `${BASE_URL}/loads/${encodeURIComponent(loadId)}/control-pdf`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/pdf',
            },
          }
        )
        if (!res.ok) {
          let msg = 'Erro ao gerar PDF da carga'
          try {
            const errBody = await res.json()
            msg = errBody.error || errBody.details || msg
          } catch (_) {}
          this.addNotification(msg, 'error')
          return
        }
        const blob = await res.blob()
        blobUrl = URL.createObjectURL(blob)
        const win = window.open(blobUrl, '_blank')
        if (!win) {
          // popup bloqueado — força download
          const link = document.createElement('a')
          link.href = blobUrl
          link.download = `controle-entrada-${loadId}.pdf`
          link.click()
        }
        // Libera o Object URL depois de um tempo (browser já carregou o blob)
        setTimeout(() => {
          if (blobUrl) URL.revokeObjectURL(blobUrl)
        }, 30000)
      } catch (err) {
        console.error('Erro ao baixar PDF da carga:', err)
        this.addNotification('Erro ao baixar PDF da carga', 'error')
      } finally {
        this.downloadingControlPdf = false
      }
    },

    // Wizard: Passo 1 - Tipo de operação (multi-select)
    toggleWizardOperation(value) {
      const arr = this.loadWizardData.operations
      const idx = arr.indexOf(value)
      if (idx === -1) {
        arr.push(value)
      } else {
        arr.splice(idx, 1)
      }
    },

    // Wizard: Passo 2 - Tipo de carga
    selectLoadType(type) {
      this.loadWizardData.loadType = type
      if (type === 'batida') {
        this.loadWizardData.pallets = ''
      }
    },

    handlePalletsInput(e) {
      this.loadWizardData.pallets = e.target.value
        .replace(/\D/g, '')
        .substring(0, 3)
    },

    wizardNextStep() {
      if (this.transportWizardStep < 5) {
        this.transportWizardStep++
      }
    },

    wizardSkipAndNext() {
      if (this.transportModalLoading) return
      if (this.transportWizardStep === 3) {
        this.loadWizardData.carPlate = ''
        this.loadWizardData.loadPlate1 = ''
        this.loadWizardData.loadPlate2 = ''
        this.wizardNextStep()
      } else if (this.transportWizardStep === 4) {
        this.loadWizardData.transportCompany = ''
        this.wizardNextStep()
      } else if (this.transportWizardStep === 5) {
        this.loadWizardData.presenterRg = ''
        this.loadWizardData.presenterName = ''
        this.loadWizardData.presenterDriverLicense = ''
        this.loadWizardData.presenterContact = ''
        this.finalizeWizard()
      }
    },

    wizardConfirmPlates() {
      this.wizardNextStep()
    },

    handlePlateInput(e, field) {
      const v = e.target.value
        .replace(/[^A-Za-z0-9]/g, '')
        .substring(0, 7)
        .toUpperCase()
      this.loadWizardData[field] = v
    },

    async handleTransportCompanyInput() {
      this.loadWizardData.transportCompany =
        this.loadWizardData.transportCompany.toUpperCase()
      const term = this.loadWizardData.transportCompany.trim()
      if (this.transportSuggestionsDebounce)
        clearTimeout(this.transportSuggestionsDebounce)
      if (!term) {
        this.transportSuggestions = []
        return
      }
      this.transportSuggestionsDebounce = setTimeout(async () => {
        try {
          const token = localStorage.getItem('token')
          const res = await axios.get('/transport-companies', {
            headers: { Authorization: `Bearer ${token}` },
            params: { search: term },
          })
          this.transportSuggestions = res.data || []
        } catch {
          this.transportSuggestions = []
        }
      }, 200)
    },

    hideTransportSuggestionsDelayed() {
      setTimeout(() => {
        this.showTransportSuggestions = false
      }, 200)
    },

    selectTransportSuggestion(c) {
      this.loadWizardData.transportCompany = (c.name || '').toUpperCase()
      this.transportSuggestions = []
      this.showTransportSuggestions = false
    },

    wizardConfirmTransport() {
      this.wizardNextStep()
    },

    handleWizardPresenterRgInput(e) {
      this.loadWizardData.presenterRg = e.target.value
        .replace(/\D/g, '')
        .substring(0, 13)
    },

    handleWizardPresenterNameInput(e) {
      this.loadWizardData.presenterName = e.target.value.toUpperCase()
    },

    handleWizardPresenterPhoneInput(e) {
      this.loadWizardData.presenterContact = e.target.value
        .replace(/\D/g, '')
        .substring(0, 11)
    },

    wizardConfirmPresenter() {
      if (this.transportModalLoading) return
      this.finalizeWizard()
    },

    // ─── Criar carga vazia ─────────────────────────────────────────────
    async openCriarCargaModal() {
      // Buscar armazéns permitidos para o usuário (filtro feito no backend, sempre atualizado do banco)
      let storages = []
      try {
        const apiClient = window.apiClient
        const res = await apiClient.request('/loads/storages-list', { method: 'GET' })
        storages = (res.data || []).filter(s => s.id && s.name)
      } catch (err) {
        console.error('[CriarCarga] Erro ao buscar armazéns:', err)
        storages = []
      }

      this.criarCargaStorages = storages
      this.criarCargaData = {
        storageCode: storages.length === 1 ? storages[0].id : '',
        loadType: 'batida',
        pallets: '',
        carPlate: '',
        loadPlate1: '',
        loadPlate2: '',
        transportCompany: '',
        presenterRg: '',
        presenterName: '',
        presenterDriverLicense: '',
        presenterContact: '',
        obs: '',
      }
      this.criarCargaTransportSuggestions = []
      this.showCriarCargaTransportSuggestions = false
      this.criarCargaPresenterSearching = false
      this.criarCargaPresenterNotFound = false
      this.showCriarCargaModal = true
    },

    closeCriarCargaModal() {
      if (this.criarCargaLoading) return
      this.showCriarCargaModal = false
    },

    async handleCriarCargaTransportInput() {
      this.criarCargaData.transportCompany = this.criarCargaData.transportCompany.toUpperCase()
      const term = this.criarCargaData.transportCompany.trim()
      if (this.criarCargaTransportDebounce) clearTimeout(this.criarCargaTransportDebounce)
      if (!term) {
        this.criarCargaTransportSuggestions = []
        return
      }
      this.criarCargaTransportDebounce = setTimeout(async () => {
        try {
          const token = localStorage.getItem('token')
          const res = await axios.get('/transport-companies', {
            headers: { Authorization: `Bearer ${token}` },
            params: { search: term },
          })
          this.criarCargaTransportSuggestions = res.data || []
        } catch {
          this.criarCargaTransportSuggestions = []
        }
      }, 200)
    },

    hideCriarCargaTransportSuggestionsDelayed() {
      setTimeout(() => {
        this.showCriarCargaTransportSuggestions = false
      }, 200)
    },

    selectCriarCargaTransportSuggestion(c) {
      this.criarCargaData.transportCompany = (c.name || '').toUpperCase()
      this.criarCargaTransportSuggestions = []
      this.showCriarCargaTransportSuggestions = false
    },

    async searchCriarCargaPresenter() {
      const rg = this.criarCargaData.presenterRg.trim()
      if (!rg || this.criarCargaPresenterSearching) return
      this.criarCargaPresenterSearching = true
      this.criarCargaPresenterNotFound = false
      try {
        const apiClient = window.apiClient
        const res = await apiClient.request(`/transport-presenters/by-rg/${rg}`, { method: 'GET' })
        if (res && res.found !== false) {
          this.criarCargaData.presenterName = (res.name || '').toUpperCase()
          this.criarCargaData.presenterDriverLicense = res.driver_license || ''
          this.criarCargaData.presenterContact = res.phone_number || ''
          this.$nextTick(() => this.$refs.criarCargaObs?.focus())
        } else {
          this.criarCargaPresenterNotFound = true
          this.$nextTick(() => this.$refs.criarCargaPresenterName?.focus())
        }
      } catch (err) {
        if (err.response?.status === 404 || err.response?.data?.found === false) {
          this.criarCargaPresenterNotFound = true
          this.$nextTick(() => this.$refs.criarCargaPresenterName?.focus())
        } else {
          console.error('[CriarCarga] Erro ao buscar apresentador por RG:', err)
        }
      } finally {
        this.criarCargaPresenterSearching = false
      }
    },

    async submitCriarCarga() {
      if (!this.canSubmitCriarCarga || this.criarCargaLoading) return
      this.criarCargaLoading = true
      try {
        const apiClient = window.apiClient
        const d = this.criarCargaData

        const body = {
          schedule_ids: [],
          operation: d.operationType,
          storage_code: d.storageCode,
          car_plate: d.carPlate.trim().toUpperCase(),
          load_plate_1: d.loadPlate1.trim().toUpperCase() || null,
          load_plate_2: d.loadPlate2.trim().toUpperCase() || null,
          pallets: d.loadType === 'paletizada' && d.pallets ? d.pallets : null,
          obs: d.obs.trim() || null,
          transport_company_name: d.transportCompany.trim() || null,
          transport_presenter_rg: d.presenterRg.trim() || null,
          presenter_name: d.presenterName.trim() || null,
          presenter_driver_license: d.presenterDriverLicense.trim() || null,
          presenter_phone_number: d.presenterContact.trim() || null,
        }

        const response = await apiClient.request('/loads', {
          method: 'POST',
          data: body,
        })

        const loadId = response.data?.load_id || response.load_id || '—'
        this.showCriarCargaModal = false

        // Mostrar resultado no modal de resultado existente
        this.loadResultSummary = {
          success: true,
          message: `Carga ${loadId} criada com sucesso! Agendamentos poderão ser inseridos posteriormente.`,
          loadId,
        }
        this.showLoadResultModal = true

        await this.loadLoads()
        this.$emit('load-updated')
      } catch (error) {
        console.error('Erro ao criar carga:', error)
        const data = error.response?.data || {}
        let errorMessage = data.error || error.message || 'Erro ao criar carga'
        if (data.details && data.details !== errorMessage) {
          errorMessage += ` — ${data.details}`
        }
        this.loadResultSummary = {
          success: false,
          message: errorMessage,
          loadId: null,
        }
        this.showCriarCargaModal = false
        this.showLoadResultModal = true
      } finally {
        this.criarCargaLoading = false
      }
    },
    // ─── Fim criar carga vazia ─────────────────────────────────────────

    async finalizeWizard() {
      this.transportModalLoading = true
      try {
        const apiClient = window.apiClient
        let allScheduleIds = [...(this.pendingScheduleIds || [])]

        // Buscar NFes e criar agendamentos APENAS AO FINAL (se houver não agendados)
        if (this.pendingUnscheduledChaves?.length > 0) {
          const batchRes = await apiClient.request('/nfe-info/batch', {
            method: 'POST',
            data: { chaves: this.pendingUnscheduledChaves },
          })

          if (!batchRes.success || !batchRes.results) {
            this.loadResultSummary = {
              success: false,
              message: batchRes.error || 'Erro ao buscar dados das NFes',
              loadId: null,
            }
            this.showLoadResultModal = true
            return
          }

          const failed = batchRes.results.find(r => !r.success)
          if (failed) {
            this.loadResultSummary = {
              success: false,
              message: `NFe ${failed.chaveAcesso}: ${failed.error || 'Erro ao obter dados'}`,
              loadId: null,
            }
            this.showLoadResultModal = true
            return
          }

          const existingByChave = {}
          const schedulesToCreate = []

          for (const r of batchRes.results) {
            const sd = r.scheduleData
            if (sd.id) {
              existingByChave[r.chaveAcesso] = sd
              allScheduleIds.push(sd.id)
            } else {
              if (!sd.client) {
                this.loadResultSummary = {
                  success: false,
                  message: `NFe ${sd.nfe_number}: CNPJ do destinatário não encontrado no XML.`,
                  loadId: null,
                }
                this.showLoadResultModal = true
                return
              }
              if (!sd.case_count || sd.case_count <= 0) {
                this.loadResultSummary = {
                  success: false,
                  message: `NFe ${sd.nfe_number}: Volumetria não encontrada no XML.`,
                  loadId: null,
                }
                this.showLoadResultModal = true
                return
              }
              schedulesToCreate.push({
                nfe_key: sd.nfe_key,
                nfe_number: sd.nfe_number,
                number: sd.number,
                client: sd.client,
                client_name: sd.client_name || '',
                date: sd.date,
                case_count: sd.case_count,
                is_booking: 2,
                status: 'Não agendado',
                info: sd.info,
                xml: sd.xml,
              })
            }
          }

          for (const item of this.consultedNfes) {
            if (item._isNew && item.nfe_key) {
              const d = String(item.nfe_key).replace(/\D/g, '')
              const cleanKey =
                d.length === 44 ? d : d.length > 44 ? d.slice(-44) : d
              const existing = existingByChave[cleanKey]
              if (existing) {
                item.id = existing.id
                item._tempId = false
                item._isNew = false
                item.status = existing.status
                item.client = existing.client
              }
            }
          }

          if (schedulesToCreate.length > 0) {
            const bulkRes = await apiClient.request('/schedules/bulk-create', {
              method: 'POST',
              data: { schedules: schedulesToCreate },
            })

            const createdSchedules = bulkRes.schedules || []
            createdSchedules.forEach((created, idx) => {
              allScheduleIds.push(created.id)
              const tempItem = this.consultedNfes.find(item => {
                if (!item._tempId) return false
                const keyNorm = item.nfe_key
                  ? (() => {
                      const d = String(item.nfe_key).replace(/\D/g, '')
                      return d.length === 44
                        ? d
                        : d.length > 44
                          ? d.slice(-44)
                          : d
                    })()
                  : ''
                return (
                  item.nfeNumber === created.nfe_number ||
                  keyNorm === created.nfe_key
                )
              })
              if (tempItem) {
                tempItem.id = created.id
                tempItem._tempId = false
                tempItem._isNew = false
                tempItem.status = created.status
                tempItem.client = created.client
                const sd = schedulesToCreate[idx]
                if (sd)
                  tempItem.client_name = sd.client_name || tempItem.client_name
              }
            })
          }
        }

        const presenterName = this.loadWizardData.presenterName?.trim() || ''
        const presenterContact =
          this.loadWizardData.presenterContact?.trim() || ''
        const presenterRg = this.loadWizardData.presenterRg?.trim() || ''
        const transportPresenter =
          presenterName || presenterContact || presenterRg
            ? {
                transport_presenter_rg: presenterRg || undefined,
                name: presenterName,
                contact: presenterContact,
                driver_license:
                  this.loadWizardData.presenterDriverLicense?.trim() || '',
              }
            : null

        const response = await apiClient.request('/schedules/assign-load', {
          method: 'PATCH',
          data: {
            schedule_ids: allScheduleIds,
            // Operação(ões) selecionadas no passo 1 do wizard, salvas como string separada
            // por vírgula em loads.operation. Fallback 'entrega' apenas para clientes que
            // pulem o passo (não deve acontecer pelo UI, mas evita NULL em loads).
            operation: this.loadWizardData.operations.length > 0
              ? this.loadWizardData.operations.join(',')
              : 'entrega',
            transport_company:
              this.loadWizardData.transportCompany?.trim() || null,
            transport_presenter: transportPresenter,
            obs: this.loadObservation.trim() || null,
            return_schedule_ids: this.returnSchedules.filter(id =>
              allScheduleIds.includes(id)
            ),
            pallets:
              this.loadWizardData.loadType === 'paletizada' &&
              this.loadWizardData.pallets
                ? this.loadWizardData.pallets
                : null,
            car_plate: this.loadWizardData.carPlate?.trim() || null,
            load_plate_1: this.loadWizardData.loadPlate1?.trim() || null,
            load_plate_2: this.loadWizardData.loadPlate2?.trim() || null,
          },
        })

        const loadId = response.load_id
        this.consultedNfes.forEach(item => {
          if (allScheduleIds.includes(item.id)) {
            item.load = loadId
          }
        })

        await this.loadLoads()
        this.$emit('load-updated')
        this.clearSearchResults()

        this.loadResultSummary = {
          success: true,
          message: `Carga ${loadId} criada com sucesso!`,
          loadId,
        }
        this.showTransportModal = false
        this.showLoadResultModal = true
      } catch (error) {
        console.error('Erro ao atribuir carga:', error)
        const data = error.response?.data || {}
        let errorMessage =
          data.error ||
          error.message ||
          'Erro ao atribuir identificador de carga'
        if (data.details && data.details !== errorMessage) {
          errorMessage += ` — ${data.details}`
        }
        if (data.sqlMessage) {
          errorMessage += ` (SQL: ${data.sqlMessage})`
        }
        this.loadResultSummary = {
          success: false,
          message: errorMessage,
          loadId: null,
        }
        this.showTransportModal = false
        this.showLoadResultModal = true
      } finally {
        this.transportModalLoading = false
      }
    },

    // Abrir modal de seleção de transportadora
    async openCompanySelectionModal() {
      this.showCompanySelectionModal = true
      this.companySearchInput = ''
      this.showNewCompanyForm = false
      if (this.transportCompanies.length === 0) {
        await this.loadTransportCompanies()
      }
    },

    closeCompanySelectionModal() {
      this.showCompanySelectionModal = false
      this.companySearchInput = ''
      this.showNewCompanyForm = false
    },

    confirmCompanySelection() {
      if (!this.selectedCompanyId) {
        this.addNotification('Selecione uma transportadora', 'warning')
        return
      }

      // Salvar objeto completo da transportadora selecionada
      this.selectedCompany = this.transportCompanies.find(
        c => c.id === this.selectedCompanyId
      )
      this.closeCompanySelectionModal()
    },

    // Abrir modal de seleção de apresentador
    async openPresenterSelectionModal() {
      this.showPresenterSelectionModal = true
      this.presenterSearchInput = ''
      this.showNewPresenterForm = false
      if (this.transportPresenters.length === 0) {
        await this.loadTransportPresenters()
      }
    },

    closePresenterSelectionModal() {
      this.showPresenterSelectionModal = false
      this.presenterSearchInput = ''
      this.showNewPresenterForm = false
    },

    confirmPresenterSelection() {
      if (!this.selectedPresenterId) {
        this.addNotification('Selecione um apresentador', 'warning')
        return
      }

      // Salvar objeto completo do apresentador selecionado
      this.selectedPresenter = this.transportPresenters.find(
        p => p.id === this.selectedPresenterId
      )
      this.closePresenterSelectionModal()
    },

    async loadTransportCompanies() {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('/transport-companies', {
          headers: { Authorization: `Bearer ${token}` },
        })
        this.transportCompanies = response.data
      } catch (error) {
        console.error('Erro ao carregar transportadoras:', error)
        this.addNotification(
          'Erro ao carregar lista de transportadoras',
          'error'
        )
      }
    },

    async loadTransportPresenters() {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('/transport-presenters', {
          headers: { Authorization: `Bearer ${token}` },
        })
        this.transportPresenters = response.data
      } catch (error) {
        console.error('Erro ao carregar apresentadores:', error)
        this.addNotification(
          'Erro ao carregar lista de apresentadores',
          'error'
        )
      }
    },

    handlePhoneInput(event) {
      // Remove todos os caracteres não numéricos
      let value = event.target.value.replace(/\D/g, '')
      // Limita a 11 dígitos
      if (value.length > 11) {
        value = value.slice(0, 11)
      }
      this.newPresenterData.phone = value
    },

    cancelNewCompanyForm() {
      this.showNewCompanyForm = false
      this.newCompanyData = { name: '' }
    },

    cancelNewPresenterForm() {
      this.showNewPresenterForm = false
      this.newPresenterData = { name: '', phone: '' }
    },

    async createNewCompany() {
      if (!this.newCompanyData.name?.trim()) {
        this.addNotification('Preencha o nome da transportadora', 'warning')
        return
      }

      this.transportModalLoading = true
      try {
        const token = localStorage.getItem('token')
        const response = await axios.post(
          '/transport-companies',
          { name: this.newCompanyData.name.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        this.addNotification('Transportadora cadastrada com sucesso', 'success')
        this.transportCompanies.push(response.data.company)
        this.selectedCompanyId = response.data.company.id

        // Selecionar automaticamente a transportadora criada
        this.selectedCompany = response.data.company

        // Fechar formulário e resetar estado
        this.showNewCompanyForm = false
        this.newCompanyData = { name: '' }
      } catch (error) {
        console.error('Erro ao cadastrar transportadora:', error)
        const errorMsg =
          error.response?.data?.error || 'Erro ao cadastrar transportadora'
        this.addNotification(errorMsg, 'error')
      } finally {
        this.transportModalLoading = false
      }
    },

    async createNewPresenter() {
      if (!this.newPresenterData.name || !this.newPresenterData.phone) {
        this.addNotification(
          'Preencha nome e telefone do apresentador',
          'warning'
        )
        return
      }

      this.transportModalLoading = true
      try {
        const token = localStorage.getItem('token')
        const response = await axios.post(
          '/transport-presenters',
          this.newPresenterData,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        this.addNotification('Apresentador cadastrado com sucesso', 'success')
        this.transportPresenters.push(response.data.presenter)
        this.selectedPresenterId = response.data.presenter.id

        // Selecionar automaticamente o apresentador criado
        this.selectedPresenter = response.data.presenter

        // Fechar formulário e resetar estado
        this.showNewPresenterForm = false
        this.newPresenterData = { name: '', phone: '' }
      } catch (error) {
        console.error('Erro ao cadastrar apresentador:', error)
        const errorMsg =
          error.response?.data?.error || 'Erro ao cadastrar apresentador'
        this.addNotification(errorMsg, 'error')
      } finally {
        this.transportModalLoading = false
      }
    },

    showResultDetails(result) {
      this.selectedResult = result
      this.showDetailsModal = true
    },

    closeDetailsModal() {
      this.showDetailsModal = false
      this.selectedResult = null
    },

    // Métodos de modal de comentários do cliente
    openCommentsModal(client) {
      this.selectedClient = client
      this.showCommentsModal = true
      // Inicializar textarea para este cliente se necessário (Vue 3 não precisa de $set)
      if (!this.newCommentText[client.cnpj]) {
        this.newCommentText[client.cnpj] = ''
      }
    },

    closeCommentsModal() {
      this.showCommentsModal = false
      // Não limpar selectedClient imediatamente para evitar erros de renderização
      setTimeout(() => {
        this.selectedClient = null
      }, 300)
    },

    // Métodos de clientes
    async loadClients() {
      this.loading = true
      this.error = null

      try {
        const apiClient = window.apiClient
        // Parâmetro 'all=true' para carregar todos os clientes sem filtro de cli_access
        const response = await apiClient.request('/clients', {
          method: 'GET',
          params: {
            all: 'true',
          },
        })

        // Aceitar { data: [...] } (backend) ou array direto
        const raw =
          response && response.data !== undefined ? response.data : response
        this.clients = Array.isArray(raw) ? raw : []
        this.filteredClients = [...this.clients]
        console.log(
          'Clientes carregados (todos, sem filtro):',
          this.clients.length
        )
      } catch (error) {
        console.error('Erro ao carregar clientes:', error)
        this.error =
          error.response?.data?.error ||
          'Erro ao carregar clientes. Tente novamente.'
      } finally {
        this.loading = false
      }
    },

    // Carregar apenas clientes permitidos para o modal de seleção
    async loadSelectableClients() {
      try {
        const apiClient = window.apiClient
        // SEM parâmetro 'all' - carrega apenas clientes permitidos pelo cli_access
        const response = await apiClient.request('/clients', {
          method: 'GET',
        })

        let clients = response.data || []

        // Filtrar por storage só se já existir na lista um agendamento COM CD cadastrado (referência da carga)
        const existingStorage = this.getFirstDefinedStorageInConsultedList()
        if (this.consultedNfes.length > 0 && existingStorage) {
          console.log(
            `🔍 [STORAGE FILTER] Lista tem CD de referência: "${existingStorage}" - filtrando clientes`
          )

          const filteredClients = clients.filter(client => {
            const clientStorage =
              client.storage_corpem || client.storage || null
            return clientStorage === existingStorage
          })

          console.log(
            `✅ [STORAGE FILTER] Filtrados ${filteredClients.length} de ${clients.length} clientes com storage compatível`
          )

          if (filteredClients.length === 0) {
            this.addNotification(
              `Nenhum cliente disponível com CD "${existingStorage}". Todas as NFes da mesma carga devem ser do mesmo CD.`,
              'warning'
            )
          }

          clients = filteredClients
        } else if (this.consultedNfes.length > 0 && !existingStorage) {
          console.log(
            'ℹ️ [STORAGE FILTER] Lista só tem itens Sem CD - mostrando todos os clientes (primeiro com CD definirá a carga)'
          )
        } else {
          console.log(
            'ℹ️ [STORAGE FILTER] Lista vazia - mostrando todos os clientes disponíveis'
          )
        }

        this.selectableClients = clients
        console.log(
          'Clientes selecionáveis carregados:',
          this.selectableClients.length
        )
      } catch (error) {
        console.error('Erro ao carregar clientes selecionáveis:', error)
        this.addNotification('Erro ao carregar clientes disponíveis', 'error')
      }
    },

    // Carregar cargas agrupadas por load_id
    async loadLoads() {
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const user = JSON.parse(userData)
          if (Number(user.level_access) === 4) {
            console.log(
              '📦 ManagementPage: Usuário nível 4 (Manutenção) - pulando carregamento de cargas'
            )
            this.loads = []
            this.loading = false
            return
          }
        } catch (_) {}
      }
      this.loading = true
      this.error = null

      try {
        const apiClient = window.apiClient
        // Carregar apenas cargas que NÃO estão com status ENVIADO, RECUSADO ou CANCELADA
        // O backend já filtra esses status quando include_sent=false
        const response = await apiClient.request(
          '/schedules/loads?include_sent=false',
          {
            method: 'GET',
          }
        )

        this.loads = response.data || []
        console.log(
          'Cargas carregadas (exceto ENVIADO, RECUSADO e CANCELADA):',
          this.loads.length
        )

        // DEBUG: Verificar dados das cargas e created_at
        if (this.loads.length > 0) {
          console.log('📅 [DEBUG] Primeira carga completa:', this.loads[0])
          console.log(
            '📅 [DEBUG] created_at da primeira carga:',
            this.loads[0].created_at
          )
          console.log(
            '📅 [DEBUG] Tipo do created_at:',
            typeof this.loads[0].created_at
          )

          if (this.loads[0].schedules && this.loads[0].schedules.length > 0) {
            console.log(
              '📋 [DEBUG] Primeiro schedule da primeira carga:',
              this.loads[0].schedules[0]
            )
            console.log(
              '📋 [DEBUG] client_name existe?',
              this.loads[0].schedules[0].client_name
            )
          }
        }
      } catch (error) {
        console.error('Erro ao carregar cargas:', error)
        this.error =
          error.response?.data?.error ||
          'Erro ao carregar cargas. Tente novamente.'
      } finally {
        this.loading = false
      }
    },

    // Carregar TODAS as cargas (incluindo ENVIADO) para aba de Histórico
    async loadAllLoads() {
      this.loading = true
      this.error = null

      try {
        const apiClient = window.apiClient
        // Carregar TODAS as cargas incluindo status ENVIADO, RECUSADO e CANCELADA
        // Para a aba de Histórico, queremos ver todas as cargas
        const response = await apiClient.request(
          '/schedules/loads?include_sent=true',
          {
            method: 'GET',
          }
        )

        this.allLoads = response.data || []
        console.log(
          'Todas as cargas carregadas (incluindo ENVIADO, RECUSADO e CANCELADA):',
          this.allLoads.length
        )

        // DEBUG: Verificar dados das cargas e created_at
        if (this.allLoads.length > 0) {
          console.log(
            '📅 [DEBUG] Primeira carga completa do histórico:',
            this.allLoads[0]
          )
          console.log(
            '📅 [DEBUG] created_at da primeira carga:',
            this.allLoads[0].created_at
          )
          console.log(
            '📅 [DEBUG] status da primeira carga:',
            this.allLoads[0].status
          )
        }
      } catch (error) {
        console.error('Erro ao carregar histórico de cargas:', error)
        this.error =
          error.response?.data?.error ||
          'Erro ao carregar histórico de cargas. Tente novamente.'
      } finally {
        this.loading = false
      }
    },

    filterClients() {
      const query = this.clientSearchInput.toLowerCase().trim()

      if (!query) {
        this.filteredClients = [...this.clients]
        return
      }

      this.filteredClients = this.clients.filter(client => {
        const clientName = (client.name || '').toLowerCase()
        const clientCnpj = (client.cnpj || '').toString()

        // Match por nome
        const nameMatch = clientName.includes(query)

        // Match por CNPJ - apenas se a query tiver números
        const queryNumbers = query.replace(/[^\d]/g, '')
        const cnpjMatch =
          queryNumbers.length > 0 && clientCnpj.includes(queryNumbers)

        return nameMatch || cnpjMatch
      })
    },

    clearClientFilter() {
      this.clientSearchInput = ''
      this.filteredClients = [...this.clients]
    },

    getClientComments(client) {
      if (!client.comments) return []

      try {
        const commentsObj =
          typeof client.comments === 'string'
            ? JSON.parse(client.comments)
            : client.comments

        return Object.entries(commentsObj)
          .map(([author, data]) => ({
            id: `${author}_${data.date}`,
            authorEmail: author,
            date: data.date,
            comment: data.comment,
          }))
          .sort((a, b) => {
            // Ordenar por data (mais recente primeiro)
            const dateA = this.parseDate(a.date)
            const dateB = this.parseDate(b.date)
            return dateB - dateA
          })
      } catch (error) {
        console.error('Erro ao parsear comentários:', error)
        return []
      }
    },

    async addComment(clientCnpj) {
      const commentText = this.newCommentText[clientCnpj]?.trim()
      if (!commentText) return

      this.commentLoading = true

      try {
        const user = this.getCurrentUser()
        if (!user) {
          throw new Error('Usuário não autenticado')
        }

        const client = this.clients.find(c => c.cnpj === clientCnpj)
        if (!client) {
          throw new Error('Cliente não encontrado')
        }

        // Preparar comentários existentes
        let existingComments = {}
        if (client.comments) {
          try {
            existingComments =
              typeof client.comments === 'string'
                ? JSON.parse(client.comments)
                : client.comments
          } catch (error) {
            console.error('Erro ao parsear comentários existentes:', error)
            existingComments = {}
          }
        }

        // Adicionar novo comentário
        const userEmail = user.user || user.email || `user_${user.id}`
        const currentDate = this.formatDate(new Date())

        existingComments[userEmail] = {
          date: currentDate,
          comment: commentText,
        }

        // Atualizar no backend
        const apiClient = window.apiClient
        await apiClient.request(`/clients/${clientCnpj}`, {
          method: 'PUT',
          data: {
            comments: JSON.stringify(existingComments),
          },
        })

        // Atualizar localmente
        client.comments = existingComments

        // Limpar formulário
        this.newCommentText[clientCnpj] = ''

        this.addNotification('Comentário adicionado com sucesso!', 'success')
      } catch (error) {
        console.error('Erro ao adicionar comentário:', error)
        this.addNotification(
          error.response?.data?.error ||
            'Erro ao adicionar comentário. Tente novamente.',
          'error'
        )
      } finally {
        this.commentLoading = false
      }
    },

    // Métodos de exclusão de comentários
    canDeleteComment(authorEmail) {
      const user = this.getCurrentUser()
      if (!user) return false

      const userLevel = user.level_access

      // Níveis 0 (Dev) e 3 (Manager): Podem apagar qualquer comentário
      if (userLevel === 0 || userLevel === 3) {
        return true
      }

      // Níveis 2 (Admin) e 9 (Lobby): Podem apagar apenas seus próprios comentários
      if (userLevel === 2 || userLevel === 9) {
        const currentUserEmail = user.user || user.email || `user_${user.id}`
        return authorEmail === currentUserEmail
      }

      // Nível 1 (Client) não deveria ter acesso à página de gestão
      return false
    },

    async confirmDeleteComment(authorEmail) {
      if (!confirm('Tem certeza que deseja excluir este comentário?')) {
        return
      }

      await this.deleteComment(authorEmail)
    },

    async deleteComment(authorEmail) {
      if (!this.selectedClient) return

      this.commentLoading = true

      try {
        const apiClient = window.apiClient
        await apiClient.request(
          `/clients/${this.selectedClient.cnpj}/comments/${encodeURIComponent(authorEmail)}`,
          {
            method: 'DELETE',
          }
        )

        // Atualizar comentários localmente
        const client = this.clients.find(
          c => c.cnpj === this.selectedClient.cnpj
        )
        if (client && client.comments) {
          let existingComments = {}
          try {
            existingComments =
              typeof client.comments === 'string'
                ? JSON.parse(client.comments)
                : client.comments
          } catch (error) {
            console.error('Erro ao parsear comentários:', error)
            existingComments = {}
          }

          // Remover o comentário
          delete existingComments[authorEmail]

          // Atualizar localmente
          client.comments =
            Object.keys(existingComments).length > 0 ? existingComments : null

          // Atualizar também o selectedClient se for o mesmo
          if (this.selectedClient.cnpj === client.cnpj) {
            this.selectedClient.comments = client.comments
          }
        }

        this.addNotification('Comentário excluído com sucesso!', 'success')
      } catch (error) {
        console.error('Erro ao excluir comentário:', error)
        this.addNotification(
          error.response?.data?.error ||
            'Erro ao excluir comentário. Tente novamente.',
          'error'
        )
      } finally {
        this.commentLoading = false
      }
    },

    // Métodos utilitários
    getCurrentUser() {
      // Buscar dados completos do usuário do localStorage (inclui config com storage)
      const userStr = localStorage.getItem('user')
      if (!userStr) return null

      try {
        const user = JSON.parse(userStr)
        return user
      } catch (error) {
        console.error(
          'Erro ao parsear dados do usuário do localStorage:',
          error
        )
        return null
      }
    },

    getClientName(clientCnpj) {
      const client = this.clients.find(c => c.cnpj === clientCnpj)
      return client ? client.name : clientCnpj
    },

    formatCNPJ(cnpj) {
      if (!cnpj) return ''
      return cnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      )
    },

    formatDate(date) {
      if (!date) return '-'

      if (date instanceof Date) {
        return date.toLocaleDateString('pt-BR')
      }

      if (typeof date === 'string') {
        try {
          return new Date(date).toLocaleDateString('pt-BR')
        } catch (error) {
          return date
        }
      }

      return date
    },

    formatDateTime(datetime) {
      if (!datetime) return '-'

      try {
        const date = new Date(datetime)
        return date.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      } catch (error) {
        console.error('Erro ao formatar data/hora:', error)
        return datetime
      }
    },

    /** Retorna a sigla do CD para exibição no badge (prioridade: storage_corpem > storage > storage_name) */
    getLoadStorageDisplay(load) {
      const corpem = load?.storage_corpem
      if (corpem != null && String(corpem).trim() !== '')
        return String(corpem).trim()
      if (load?.storage != null && String(load.storage).trim() !== '')
        return String(load.storage).trim()
      if (load?.storage_name != null && String(load.storage_name).trim() !== '')
        return String(load.storage_name).trim()
      return 'Não informado'
    },

    /** Retorna quantidade de paletes para exibição; se null/vazio (carga batida), retorna "Carga batida" */
    getLoadPalletsDisplay(load) {
      const p = load?.pallets
      // Considera válido: número (inclusive 0) ou string não vazia após trim
      if (p === 0 || p === '0') return '0'
      if (p != null && p !== '' && String(p).trim() !== '')
        return String(p).trim()
      return 'Carga batida'
    },

    /** Retorna apenas o nome da transportadora (objeto com .name ou string legado) */
    getTransportCompanyName(load) {
      const tc = load?.transport_company
      if (!tc) return 'Não informada'
      if (typeof tc === 'object' && tc !== null && tc.name != null)
        return String(tc.name).trim() || 'Não informada'
      return String(tc).trim() || 'Não informada'
    },

    /** Formata telefone para exibição: (XX) XXXXX-XXXX (11 dígitos) ou (XX) XXXX-XXXX (10 dígitos) */
    formatPhone(phone) {
      if (!phone) return ''
      const digits = String(phone).replace(/\D/g, '')
      if (digits.length === 11)
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
      if (digits.length === 10)
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
      return phone
    },

    /** Formata apresentador da carga para exibição (nome e telefone em uma linha, telefone com máscara) */
    formatLoadPresenter(presenter) {
      if (!presenter) return 'Não informado'
      const name = presenter.name?.trim() || ''
      const rawContact =
        presenter.contact?.trim() || presenter.phone?.trim() || ''
      const contact = this.formatPhone(rawContact) || rawContact
      if (!name && !contact) return 'Não informado'
      if (name && contact) return `${name} · Tel: ${contact}`
      return name || (contact ? `Tel: ${contact}` : 'Não informado')
    },

    /** CD do primeiro agendamento na lista que tenha CD cadastrado (ignora "Sem CD" para ser referência da carga) */
    getFirstDefinedStorageInConsultedList() {
      if (!this.consultedNfes?.length) return null
      for (const item of this.consultedNfes) {
        const s = item.storage_display ?? item.storage
        if (s != null && String(s).trim() !== '' && String(s).trim() !== '-')
          return String(s).trim()
      }
      return null
    },

    extractNfeNumber(nfeKey) {
      if (!nfeKey) return '-'

      // Normalizar: apenas dígitos (código de barras pode vir com prefixo ex.: "NFe" + 44 dígitos)
      const digits = String(nfeKey).replace(/\D/g, '')
      const key44 =
        digits.length === 44
          ? digits
          : digits.length > 44
            ? digits.slice(-44)
            : digits

      if (key44.length < 34) return nfeKey

      // Extrair número da NFe (posições 26-34, índice 25-33)
      const nfeNumber = key44.substring(25, 34)

      // Remover zeros à esquerda para exibição
      return parseInt(nfeNumber, 10).toString()
    },

    parseDate(dateStr) {
      if (!dateStr) return new Date(0)

      try {
        // Tentar formato DD/MM/YYYY primeiro
        if (dateStr.includes('/')) {
          const [day, month, year] = dateStr.split('/')
          return new Date(year, month - 1, day)
        }

        // Fallback para Date parse
        return new Date(dateStr)
      } catch (error) {
        return new Date(0)
      }
    },

    getLoadStatusLabel(status) {
      const map = {
        AGUARDANDO: 'Aguardando',
        DOCAR: 'Docar',
        ENVIADO: 'Enviado',
        RECUSADO: 'Recusado',
        CANCELADA: 'Cancelada',
        Criado: 'Criado',
      }
      return map[status] || status || 'Aguardando'
    },
    getLoadStatusBadgeClass(status) {
      const map = {
        AGUARDANDO: 'load-status-aguardando',
        DOCAR: 'load-status-docar',
        ENVIADO: 'load-status-enviado',
        RECUSADO: 'load-status-recusado',
        CANCELADA: 'load-status-cancelada',
        Criado: 'load-status-criado',
      }
      return map[status] || 'load-status-aguardando'
    },
    getStatusClass(status) {
      // Usar as mesmas classes do App.vue para consistência
      const statusMap = {
        Solicitado: 'warning',
        Contestado: 'contestado',
        Agendado: 'primary',
        Conferência: 'success',
        'Em conferência': 'success',
        Recebido: 'success',
        Tratativa: 'danger',
        'Em estoque': 'success',
        Estoque: 'success',
        Recusar: 'danger',
        Cancelar: 'warning',
        Recusado: 'dark',
        Cancelado: 'secondary',
        Marcação: 'booking',
        'Não agendado': 'not-scheduled',
      }
      return statusMap[status] || 'secondary'
    },

    // Sistema de notificações
    addNotification(message, type = 'info') {
      const notification = {
        id: ++this.notificationId,
        message,
        type,
      }

      this.notifications.push(notification)

      // Auto-remover após 5 segundos
      setTimeout(() => {
        this.removeNotification(notification.id)
      }, 5000)
    },

    removeNotification(id) {
      const index = this.notifications.findIndex(n => n.id === id)
      if (index > -1) {
        this.notifications.splice(index, 1)
      }
    },

    // Métodos de gerenciamento de checkboxes nas cargas
    isScheduleSelected(loadId, scheduleId) {
      // Verifica se o schedule está na lista de selecionados desta carga
      if (!this.selectedLoadSchedules[loadId]) {
        return false
      }
      return this.selectedLoadSchedules[loadId].includes(scheduleId)
    },

    toggleScheduleSelection(loadId, scheduleId) {
      console.log(
        `🔄 [TOGGLE] Iniciando toggle para loadId: ${loadId}, scheduleId: ${scheduleId}`
      )

      // Verificar se é agendamento fantasma
      const load = this.loads.find(l => l.load_id === loadId)
      if (load) {
        const schedule = load.schedules.find(s => s.id === scheduleId)
        if (schedule && schedule.isGhost) {
          // Agendamentos fantasmas não podem ser selecionados
          console.log(
            `👻 [SELECTION] Agendamento ${scheduleId} é fantasma - seleção bloqueada`
          )
          return
        }
      }

      // Verificar se os checkboxes estão desabilitados para esta carga
      const isDisabled = this.isLoadCheckboxDisabled(loadId)
      console.log(
        `🔒 [SELECTION] Checkboxes desabilitados? ${isDisabled} - loadId: ${loadId}, activeLoadId: ${this.activeLoadId}`
      )

      if (isDisabled) {
        console.log(
          `🔒 [SELECTION] Checkboxes desabilitados para carga ${loadId} - activeLoadId: ${this.activeLoadId}`
        )
        return
      }

      // Inicializar array para este load_id se não existir (usando $set para reatividade)
      if (!this.selectedLoadSchedules[loadId]) {
        this.$set(this.selectedLoadSchedules, loadId, [])
        console.log(`📝 [SELECTION] Inicializado array para loadId: ${loadId}`)
      }

      const index = this.selectedLoadSchedules[loadId].indexOf(scheduleId)
      console.log(
        `📋 [SELECTION] Índice encontrado: ${index}, array atual:`,
        this.selectedLoadSchedules[loadId]
      )

      if (index > -1) {
        // Se já está selecionado, remover
        this.selectedLoadSchedules[loadId].splice(index, 1)
        console.log(
          `➖ [SELECTION] Removido scheduleId ${scheduleId} do loadId ${loadId}`
        )
      } else {
        // Se não está selecionado, adicionar
        this.selectedLoadSchedules[loadId].push(scheduleId)
        console.log(
          `➕ [SELECTION] Adicionado scheduleId ${scheduleId} ao loadId ${loadId}`
        )
      }

      console.log(
        `✅ [SELECTION] Estado final para loadId ${loadId}:`,
        this.selectedLoadSchedules[loadId]
      )

      // Forçar atualização da view para garantir que o botão seja atualizado
      this.$nextTick(() => {
        this.$forceUpdate()
        console.log(`🔄 [SELECTION] View atualizada após toggle`)
      })
    },

    isAllSchedulesSelected(load) {
      // Verifica se todos os schedules desta carga estão selecionados (exceto fantasmas)
      if (!load.schedules || load.schedules.length === 0) {
        return false
      }

      // Filtrar apenas agendamentos NÃO fantasmas
      const nonGhostSchedules = load.schedules.filter(
        schedule => !schedule.isGhost
      )

      if (nonGhostSchedules.length === 0) {
        return false
      }

      const selectedIds = this.selectedLoadSchedules[load.load_id] || []

      // Verificar se todos os schedules não-fantasmas estão na lista de selecionados
      return nonGhostSchedules.every(schedule =>
        selectedIds.includes(schedule.id)
      )
    },

    toggleAllSchedulesInLoad(loadId) {
      // Encontrar a carga
      const load = this.loads.find(l => l.load_id === loadId)
      if (!load || !load.schedules) {
        return
      }

      // Filtrar apenas agendamentos NÃO fantasmas
      const nonGhostSchedules = load.schedules.filter(
        schedule => !schedule.isGhost
      )

      if (nonGhostSchedules.length === 0) {
        console.log(
          `👻 [SELECTION] Carga ${loadId} só tem agendamentos fantasmas - seleção bloqueada`
        )
        return
      }

      // Verificar se todos (não-fantasmas) já estão selecionados
      const allSelected = this.isAllSchedulesSelected(load)

      if (allSelected) {
        // Se todos estão selecionados, desmarcar todos
        this.selectedLoadSchedules[loadId] = []
      } else {
        // Se nem todos estão selecionados, marcar todos (apenas não-fantasmas)
        this.selectedLoadSchedules[loadId] = nonGhostSchedules.map(
          schedule => schedule.id
        )
      }
    },

    // Atribuir dock aos agendamentos marcados e recusar os desmarcados
    async assignDockToLoad(loadId) {
      const dockNumber = this.dockInputs[loadId]

      // Validação do número da doca
      if (!dockNumber || dockNumber < 1) {
        this.addNotification(
          'Por favor, informe um número de doca válido',
          'error'
        )
        return
      }

      // Encontrar a carga
      const load = this.loads.find(l => l.load_id === loadId)
      if (!load) {
        this.addNotification('Carga não encontrada', 'error')
        return
      }

      const hasNoSchedules = !load.schedules || load.schedules.length === 0

      // Fluxo: carga sem agendamentos
      if (hasNoSchedules) {
        if (!confirm(`Confirma a atribuição da doca ${dockNumber} à carga ${loadId}?`)) {
          return
        }

        this.loading = true
        try {
          const apiClient = window.apiClient
          await apiClient.request(`/loads/${loadId}/assign-dock`, {
            method: 'PATCH',
            data: { dock: String(dockNumber) },
          })

          this.addNotification(`Doca ${dockNumber} atribuída à carga ${loadId}`, 'success')
          await this.loadLoads()
          this.$emit('load-updated')
          this.dockInputs[loadId] = null
        } catch (error) {
          console.error('Erro ao atribuir doca:', error)
          const errorMessage = error.response?.data?.error || 'Erro ao atribuir doca'
          this.addNotification(errorMessage, 'error')
        } finally {
          this.loading = false
        }
        return
      }

      // Fluxo: carga com agendamentos — exige seleção
      const selectedIds = this.selectedLoadSchedules[loadId] || []
      if (selectedIds.length === 0) {
        this.addNotification(
          'Selecione pelo menos um agendamento para atribuir a doca',
          'error'
        )
        return
      }

      // Separar IDs marcados e desmarcados (EXCLUINDO FANTASMAS)
      const nonGhostSchedules = load.schedules.filter(schedule => !schedule.isGhost)
      const allScheduleIds = nonGhostSchedules.map(schedule => schedule.id)
      const unselectedIds = allScheduleIds.filter(id => !selectedIds.includes(id))

      const ghostCount = load.schedules.filter(s => s.isGhost).length

      let confirmMsg =
        `Confirma a operação?\n\n` +
        `✅ ${selectedIds.length} agendamento(s) receberá(ão) a doca ${dockNumber}\n` +
        `❌ ${unselectedIds.length} agendamento(s) será(ão) marcado(s) como "Recusado"`

      if (ghostCount > 0) {
        confirmMsg += `\n\n👻 ${ghostCount} agendamento(s) fantasma(s) será(ão) ignorado(s)`
      }

      if (!confirm(confirmMsg)) {
        return
      }

      this.loading = true

      try {
        const apiClient = window.apiClient

        const response = await apiClient.request('/schedules/assign-dock', {
          method: 'PATCH',
          data: {
            selected_schedule_ids: selectedIds,
            unselected_schedule_ids: unselectedIds,
            dock: dockNumber,
          },
        })

        console.log('✅ Doca atribuída e agendamentos processados:', response)

        load.schedules.forEach(schedule => {
          if (selectedIds.includes(schedule.id)) {
            schedule.dock = dockNumber
          } else if (unselectedIds.includes(schedule.id)) {
            schedule.status = 'Recusado'
          }
        })

        this.addNotification(
          `✅ Doca ${dockNumber} atribuída a ${selectedIds.length} agendamento(s)\n` +
            `❌ ${unselectedIds.length} agendamento(s) recusado(s)`,
          'success'
        )

        await this.loadLoads()
        this.$emit('load-updated')
        this.dockInputs[loadId] = null
        this.selectedLoadSchedules[loadId] = []
      } catch (error) {
        console.error('Erro ao processar agendamentos:', error)
        const errorMessage =
          error.response?.data?.error || 'Erro ao processar agendamentos'
        this.addNotification(errorMessage, 'error')
      } finally {
        this.loading = false
      }
    },

    // Recusar todos os agendamentos de uma carga
    async rejectLoad(loadId) {
      // Encontrar a carga
      const load = this.loads.find(l => l.load_id === loadId)
      if (!load || !load.schedules || load.schedules.length === 0) {
        this.addNotification(
          'Carga não encontrada ou sem agendamentos',
          'error'
        )
        return
      }

      // Filtrar apenas agendamentos NÃO fantasmas
      const nonGhostSchedules = load.schedules.filter(
        schedule => !schedule.isGhost
      )
      const ghostCount = load.schedules.filter(s => s.isGhost).length

      if (nonGhostSchedules.length === 0) {
        this.addNotification(
          'Esta carga contém apenas agendamentos fantasmas (já movidos para outras cargas). A carga será automaticamente cancelada pelo sistema.',
          'info'
        )
        // Aguardar um pouco e recarregar para mostrar status atualizado
        setTimeout(() => {
          this.loadLoads()
          this.$emit('load-updated')
        }, 2000)
        return
      }

      // Confirmar ação
      let confirmMsg =
        `⚠️ ATENÇÃO: Você está prestes a RECUSAR todos os agendamentos desta carga!\n\n` +
        `🔴 ${nonGhostSchedules.length} agendamento(s) será(ão) marcado(s) como "Recusado"\n\n`

      if (ghostCount > 0) {
        confirmMsg += `👻 ${ghostCount} agendamento(s) fantasma(s) NÃO será(ão) afetado(s)\n\n`
      }

      confirmMsg +=
        `Esta ação irá alterar o status dos agendamentos da carga ${loadId}.\n\n` +
        `Confirma a operação?`

      if (!confirm(confirmMsg)) {
        return
      }

      this.loading = true

      try {
        const apiClient = window.apiClient
        const currentUser = this.getCurrentUser()

        // Atualizar cada schedule NÃO fantasma para status "Recusado"
        const updatePromises = nonGhostSchedules.map(async schedule => {
          // Parsear histórico existente
          let existingHistoric = {}
          if (schedule.historic) {
            try {
              existingHistoric =
                typeof schedule.historic === 'string'
                  ? JSON.parse(schedule.historic)
                  : schedule.historic
            } catch (error) {
              console.warn('⚠️ Erro ao parsear histórico:', error)
              existingHistoric = {}
            }
          }

          // Criar nova entrada no histórico
          const now = new Date().toISOString()
          const historyKey = `rejected_load_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

          const updatedHistoric = {
            ...existingHistoric,
            [historyKey]: {
              timestamp: now,
              user: currentUser?.user || 'Sistema',
              action: 'Carga recusada',
              old_status: schedule.status,
              new_status: 'Recusado',
              comment: `Agendamento recusado como parte da carga ${loadId}`,
              changes: [`Status: "${schedule.status}" → "Recusado"`],
            },
          }

          // Fazer requisição PUT para atualizar o schedule
          // Enviar apenas os campos aceitos pelo schema de validação
          return apiClient.request(`/schedules/${schedule.id}`, {
            method: 'PUT',
            data: {
              status: 'Recusado',
              historic: updatedHistoric,
            },
          })
        })

        // Aguardar todas as atualizações
        await Promise.all(updatePromises)

        console.log(
          `✅ Carga ${loadId} recusada: ${nonGhostSchedules.length} agendamento(s) atualizados`
        )

        if (ghostCount > 0) {
          console.log(
            `👻 ${ghostCount} agendamento(s) fantasma(s) não foram afetados`
          )
        }

        // Atualizar status da carga para RECUSADO
        try {
          await apiClient.request('/schedules/mark-load-rejected', {
            method: 'PATCH',
            data: { load_id: loadId },
          })
          console.log(`✅ Status da carga ${loadId} atualizado para RECUSADO`)
        } catch (loadError) {
          console.warn(
            `⚠️ Erro ao atualizar status da carga ${loadId}:`,
            loadError
          )
          // Não bloquear a operação se falhar ao atualizar a carga
        }

        let successMsg = `✅ Carga ${loadId} recusada com sucesso!\n${nonGhostSchedules.length} agendamento(s) marcado(s) como "Recusado"`

        if (ghostCount > 0) {
          successMsg += `\n👻 ${ghostCount} agendamento(s) fantasma(s) não foram afetados`
        }

        this.addNotification(successMsg, 'success')

        // Recarregar a lista de cargas
        await this.loadLoads()

        // Emitir evento para atualizar badges no App.vue
        this.$emit('load-updated')
      } catch (error) {
        console.error('Erro ao recusar carga:', error)
        const errorMessage =
          error.response?.data?.error || 'Erro ao recusar carga'
        this.addNotification(errorMessage, 'error')
      } finally {
        this.loading = false
      }
    },

    // Marcar carga como enviada (motorista orientado)
    async markLoadAsSent(loadId) {
      if (
        !confirm(
          'Confirma que o motorista foi orientado e a carga está sendo enviada?'
        )
      ) {
        return
      }

      this.loading = true

      try {
        const apiClient = window.apiClient

        // Fazer requisição ao backend
        const response = await apiClient.request('/schedules/mark-load-sent', {
          method: 'PATCH',
          data: {
            load_id: loadId,
          },
        })

        console.log('✅ Carga marcada como enviada:', response)

        this.addNotification(
          '✅ Carga marcada como enviada com sucesso',
          'success'
        )

        // Atualizar a aba de cargas para refletir mudanças de status
        await this.loadLoads()

        // Emitir evento para atualizar badges no App.vue
        this.$emit('load-updated')
      } catch (error) {
        console.error('Erro ao marcar carga como enviada:', error)
        const errorMessage =
          error.response?.data?.error || 'Erro ao marcar carga como enviada'
        this.addNotification(errorMessage, 'error')
      } finally {
        this.loading = false
      }
    },

    async deleteLoad(loadId) {
      if (
        !confirm(`Excluir a carga ${loadId}?\nEsta ação não pode ser desfeita.`)
      ) {
        return
      }
      try {
        const apiClient = window.apiClient
        await apiClient.request(`/schedules/loads/${loadId}`, {
          method: 'DELETE',
        })
        this.loads = this.loads.filter(l => l.load_id !== loadId)
        this.allLoads = this.allLoads.filter(l => l.load_id !== loadId)
        this.addNotification(`Carga ${loadId} excluída com sucesso`, 'success')
        this.$emit('load-updated')
      } catch (error) {
        console.error('Erro ao excluir carga:', error)
        const errorMessage =
          error.response?.data?.error || 'Erro ao excluir carga'
        this.addNotification(errorMessage, 'error')
      }
    },

    // Handler para mudanças no input de doca (forçar reatividade)
    handleDockInputChange(loadId, event) {
      const value = event.target.value
      console.log(
        `📝 [DOCK-INPUT] Mudança detectada para loadId: ${loadId}, valor: ${value}`
      )

      // Garantir que o valor seja numérico e válido
      if (value === '' || value === null || value === undefined) {
        this.$set(this.dockInputs, loadId, null)
      } else {
        const numValue = Number(value)
        if (!isNaN(numValue) && numValue >= 1) {
          this.$set(this.dockInputs, loadId, numValue)
          console.log(
            `✅ [DOCK-INPUT] Valor definido: ${numValue} para loadId: ${loadId}`
          )
        } else {
          this.$set(this.dockInputs, loadId, null)
        }
      }

      // Forçar atualização após mudança
      this.$nextTick(() => {
        this.$forceUpdate()
        const isEnabled = this.isDockButtonEnabled(loadId)
        console.log(
          `🔄 [DOCK-INPUT] Após atualização - botão habilitado: ${isEnabled}`
        )
      })
    },

    // Obter título do botão de dock (para debug)
    getDockButtonTitle(loadId) {
      const dockNumber = this.dockInputs[loadId]
      const selectedIds = this.selectedLoadSchedules[loadId]
      const hasDockNumber =
        dockNumber !== null &&
        dockNumber !== undefined &&
        dockNumber !== '' &&
        !isNaN(Number(dockNumber)) &&
        Number(dockNumber) >= 1
      const hasSelectedSchedules =
        selectedIds && Array.isArray(selectedIds) && selectedIds.length > 0

      const load = this.loads.find(l => l.load_id === loadId)
      const hasNoSchedules = !load || !load.schedules || load.schedules.length === 0

      if (hasNoSchedules) {
        return hasDockNumber
          ? 'Atribuir doca à carga'
          : 'Informe o número da doca'
      }

      if (!hasDockNumber && !hasSelectedSchedules) {
        return 'Informe a doca e selecione pelo menos um agendamento'
      } else if (!hasDockNumber) {
        return `Informe o número da doca (atual: ${dockNumber})`
      } else if (!hasSelectedSchedules) {
        return `Selecione pelo menos um agendamento (selecionados: ${selectedIds ? selectedIds.length : 0})`
      } else {
        return 'Atribuir doca aos agendamentos selecionados'
      }
    },

    // Verificar se o botão de dock deve estar habilitado
    isDockButtonEnabled(loadId) {
      // Verificar se há número de doca válido (>= 1)
      const dockNumber = this.dockInputs[loadId]
      const hasDockNumber =
        dockNumber !== null &&
        dockNumber !== undefined &&
        dockNumber !== '' &&
        !isNaN(Number(dockNumber)) &&
        Number(dockNumber) >= 1

      // Carga sem agendamentos: basta ter número de doca
      const load = this.loads.find(l => l.load_id === loadId)
      const hasNoSchedules = !load || !load.schedules || load.schedules.length === 0
      if (hasNoSchedules) {
        return hasDockNumber
      }

      // Carga com agendamentos: exige seleção
      const selectedIds = this.selectedLoadSchedules[loadId]
      const hasSelectedSchedules =
        selectedIds && Array.isArray(selectedIds) && selectedIds.length > 0

      return hasDockNumber && hasSelectedSchedules
    },

    // Verificar se os checkboxes de uma carga devem estar desabilitados
    isLoadCheckboxDisabled(loadId) {
      // Se não há nenhuma carga ativa, todos os checkboxes estão habilitados
      if (!this.activeLoadId) {
        return false
      }
      // Se há uma carga ativa, desabilitar as outras cargas
      // IMPORTANTE: Comparar como string e número para garantir compatibilidade
      const loadIdStr = String(loadId)
      const activeLoadIdStr = String(this.activeLoadId)
      const isDisabled =
        activeLoadIdStr !== loadIdStr && this.activeLoadId !== loadId

      // Debug em desenvolvimento
      if (process.env.NODE_ENV === 'development' && isDisabled) {
        console.log(
          `🔒 [CHECKBOX-DISABLED] loadId: ${loadId} (${typeof loadId}), activeLoadId: ${this.activeLoadId} (${typeof this.activeLoadId}), disabled: ${isDisabled}`
        )
      }

      return isDisabled
    },
  },

  computed: {
    isAdmin() {
      const user = this.getCurrentUser()
      return user && Number(user.level_access) === 0
    },

    canSubmitCriarCarga() {
      return (
        this.criarCargaData.operationType &&
        this.criarCargaData.storageCode &&
        this.criarCargaData.carPlate &&
        this.criarCargaData.carPlate.length === 7 &&
        this.criarCargaData.loadType &&
        !(this.criarCargaData.loadType === 'paletizada' && !this.criarCargaData.pallets)
      )
    },

    // Filtrar clientes para o modal de seleção (usa selectableClients que já vem filtrado por cli_access)
    filteredClientsForSelection() {
      if (
        !this.clientSelectionSearchInput ||
        this.clientSelectionSearchInput.trim() === ''
      ) {
        return this.selectableClients
      }

      const searchLower = this.clientSelectionSearchInput.toLowerCase()
      return this.selectableClients.filter(client => {
        const nameMatch = client.name?.toLowerCase().includes(searchLower)
        const cnpjMatch = client.cnpj?.includes(searchLower)
        const storageMatch = (client.storage_corpem || client.storage)
          ?.toLowerCase()
          .includes(searchLower)
        return nameMatch || cnpjMatch || storageMatch
      })
    },

    // Filtrar transportadoras por nome (apenas nome, sem CNPJ)
    filteredTransportCompanies() {
      if (!this.companySearchInput || this.companySearchInput.trim() === '') {
        return this.transportCompanies
      }

      const searchLower = this.companySearchInput.toLowerCase()
      return this.transportCompanies.filter(company =>
        company.name?.toLowerCase().includes(searchLower)
      )
    },

    // Filtrar apresentadores por nome ou telefone
    filteredTransportPresenters() {
      if (
        !this.presenterSearchInput ||
        this.presenterSearchInput.trim() === ''
      ) {
        return this.transportPresenters
      }

      const searchLower = this.presenterSearchInput.toLowerCase()
      return this.transportPresenters.filter(presenter => {
        const nameMatch = presenter.name?.toLowerCase().includes(searchLower)
        const phoneMatch = presenter.phone?.includes(searchLower)
        return nameMatch || phoneMatch
      })
    },

    // Filtrar cargas do histórico com base na busca
    filteredHistoryLoads() {
      if (!this.historySearchInput || this.historySearchInput.trim() === '') {
        return this.allLoads
      }

      // Remover espaços do input
      const searchTerm = this.historySearchInput
        .replace(/\s/g, '')
        .toLowerCase()

      return this.allLoads.filter(load => {
        // Buscar por código da carga
        const loadIdMatch = load.load_id.toLowerCase().includes(searchTerm)

        // Buscar por número de NFe ou chave de acesso nas schedules da carga
        const scheduleMatch =
          load.schedules &&
          load.schedules.some(schedule => {
            const numberMatch =
              schedule.number &&
              schedule.number.toString().toLowerCase().includes(searchTerm)

            const nfeKeyMatch =
              schedule.nfe_key &&
              schedule.nfe_key.toLowerCase().includes(searchTerm)

            return numberMatch || nfeKeyMatch
          })

        return loadIdMatch || scheduleMatch
      })
    },

    // Identificar qual carga tem seleções ativas
    activeLoadId() {
      const activeKey = Object.keys(this.selectedLoadSchedules).find(key => {
        return (
          this.selectedLoadSchedules[key] &&
          this.selectedLoadSchedules[key].length > 0
        )
      })
      return activeKey || null
    },
  },

  watch: {
    // Observar mudanças nos inputs de doca para forçar atualização do botão
    dockInputs: {
      handler() {
        this.$nextTick(() => {
          this.$forceUpdate()
        })
      },
      deep: true,
    },
    // Observar mudanças nas seleções para forçar atualização do botão
    selectedLoadSchedules: {
      handler() {
        this.$nextTick(() => {
          this.$forceUpdate()
        })
      },
      deep: true,
    },
  },
}
</script>

<style scoped>
.management-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Tabs */
.management-tabs {
  display: flex;
  gap: 2px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
}

.tab-button {
  flex: 1;
  padding: 12px 24px;
  border: none;
  background: #f8f9fa;
  color: #6b7280;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.tab-button:hover {
  background: #e5e7eb;
  color: #374151;
}

.tab-button.active {
  background: #3b82f6;
  color: white;
  border-bottom: 2px solid #3b82f6;
}

/* Content */
.management-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  min-height: 500px;
}

/* Loading and Error States */
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
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3b82f6;
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
  color: #dc2626;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.retry-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Search Tab */
.search-tab-container {
  width: 100%;
  margin: 0 auto;
}

.search-header {
  text-align: center;
  margin-bottom: 32px;
}

.search-header h2 {
  color: #1f2937;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.search-description {
  color: #6b7280;
  margin: 0;
}

.search-container {
  margin-bottom: 32px;
}

.search-input-group {
  display: flex;
  gap: 12px;
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-button {
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  white-space: nowrap;
}

.search-button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.criar-carga-button {
  padding: 12px 24px;
  background: #38a169;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  white-space: nowrap;
  transition: background 0.2s;
}

.criar-carga-button:hover {
  background: #2f855a;
}

/* Search Results */
.search-results {
  margin-top: 32px;
  margin-bottom: 48px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.results-header h3 {
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.clear-results-btn {
  padding: 8px 12px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.results-table-container {
  overflow-x: auto;
  overflow-y: visible;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.results-table {
  width: 100%;
  border-collapse: collapse;
}

.results-table th,
.results-table td {
  padding: 16px;
  text-align: left;
}

.results-table td {
  border-bottom: 1px solid #e5e7eb;
}

.results-table th {
  background: #f8f9fa;
  font-weight: 700;
  color: #1f2937;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: none;
  border-bottom: 2px solid #dee2e6;
}

.results-table tbody tr {
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.results-table tbody tr:hover {
  background: #f9fafb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.booking-row {
  background: #fef3c7 !important;
}

.booking-row:hover {
  background: #fde68a !important;
}

.nfe-key {
  font-family: monospace;
  font-size: 12px;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}

/* Status Badges - Estilo da página Principal replicado */
.status-badge {
  padding: 6px 8px !important;
  border-radius: 6px;
  font-weight: 700 !important;
  text-transform: uppercase;
  border: 2px solid;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  text-align: center;
  font-size: clamp(6px, 0.8vw, 10px) !important;
  line-height: 1.2;
  min-height: 20px;
  box-sizing: border-box;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.status-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Badge de status dentro da tabela de resultados - igual às badges das cargas */
.results-table td .status-badge {
  width: auto;
  margin: 0 auto;
  min-width: 140px;
  padding: 6px 8px !important;
  font-size: clamp(6px, 0.8vw, 10px) !important;
  font-weight: 700 !important;
  min-height: 20px !important;
  line-height: 1.2 !important;
}

/* Coluna de status na tabela de cargas - usa o mesmo padrão da página Principal */
.load-schedules-table .status-column {
  padding: 6px !important;
  min-width: 160px;
  width: 160px;
}

/* Badge de status na tabela de cargas - herda o estilo da página Principal */
.load-schedules-table td .status-badge {
  display: block !important;
  width: calc(100% - 6px) !important;
  max-width: none !important;
  margin: 3px !important;
  padding: 6px 8px !important;
  text-align: center !important;
  min-height: 20px !important;
  box-sizing: border-box !important;
  font-size: clamp(6px, 0.8vw, 10px) !important;
  line-height: 1.2 !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

/* Cores e bordas dos badges de status - compatível com página Principal */
/* Status badge classes - alinhadas com App.vue para consistência */
.status-badge.warning {
  background-color: #fff3cd;
  color: #856404;
  border-color: #ffeaa7;
}

.status-badge.primary {
  background-color: #cce5ff;
  color: #004085;
  border-color: #007bff;
}

.status-badge.success {
  background-color: #d4edda;
  color: #155724;
  border-color: #28a745;
}

.status-badge.danger {
  background-color: #f8d7da;
  color: #721c24;
  border-color: #dc3545;
}

.status-badge.dark {
  background-color: #d6d6d6;
  color: #1b1e21;
  border-color: #343a40;
}

.status-badge.secondary {
  background-color: #e2e3e5;
  color: #383d41;
  border-color: #6c757d;
}

/* Status badge personalizado para Contestado */
.status-badge.contestado {
  background-color: #8b1538 !important; /* Cor vinho */
  color: white !important;
  border-color: #8b1538 !important;
}

/* Status badge personalizado para Marcação */
.status-badge.booking {
  background-color: #f3e5f5 !important; /* Roxo claro */
  color: #7b1fa2 !important; /* Roxo escuro */
  border-color: #ba68c8 !important; /* Roxo médio */
  font-weight: 500 !important;
}

/* Status badge personalizado para Não agendado */
.status-badge.not-scheduled {
  background-color: #e0f7fa !important; /* Ciano claro */
  color: #006064 !important; /* Ciano escuro */
  border-color: #00bcd4 !important; /* Ciano médio */
  font-weight: 500 !important;
}

/* Empty States */
.empty-search-state,
.empty-clients-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* Clients Tab */
.clients-header {
  text-align: center;
  margin-bottom: 24px;
}

.clients-header h2 {
  color: #1f2937;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.clients-description {
  color: #6b7280;
  margin: 0;
}

.clients-filter {
  margin-bottom: 24px;
}

.filter-input-group {
  display: flex;
  align-items: center;
  max-width: 400px;
  margin: 0 auto;
  position: relative;
}

.filter-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
}

.filter-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-filter-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.clear-filter-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

/* Client Cards */
.clients-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.client-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  background: white;
  transition: all 0.2s ease;
}

.clickable-client-card {
  cursor: pointer;
}

.clickable-client-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.client-header-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.client-name {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
}

.client-cnpj-inline {
  color: #6b7280;
  font-size: 14px;
  padding: 4px 12px;
  background: #f3f4f6;
  border-radius: 6px;
}

.client-details {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.client-detail {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #374151;
}

.comments-indicator {
  color: #3b82f6;
  font-weight: 500;
}

.status-active {
  color: #059669;
  font-weight: 500;
}

.status-inactive {
  color: #dc2626;
  font-weight: 500;
}

/* Modal de Comentários */
.comments-modal {
  max-width: 95vw;
  max-height: 95vh;
  width: 700px;
  overflow-y: auto;
}

.client-modal-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.client-modal-info p {
  margin: 0;
  font-size: 14px;
  color: #374151;
}

.modal-comments-list {
  margin-bottom: 32px;
}

.modal-comments-list h4 {
  color: #1f2937;
  margin: 0 0 16px 0;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.comments-list-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-item-modal {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
}

.comment-item-modal:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.comment-header-modal {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f3f4f6;
}

.comment-author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.comment-actions-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.comment-date-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.comment-author-info i {
  color: #3b82f6;
  font-size: 16px;
}

.comment-date-info i {
  color: #6b7280;
  font-size: 12px;
}

.comment-author {
  font-weight: 600;
  color: #1f2937;
  font-size: 15px;
}

.comment-date {
  color: #6b7280;
  font-size: 13px;
}

.comment-content-modal {
  color: #374151;
  line-height: 1.6;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
}

.delete-comment-btn {
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-comment-btn:hover {
  background: #fee2e2;
  color: #b91c1c;
}

.delete-comment-btn i {
  font-size: 14px;
}

.no-comments-message {
  text-align: center;
  padding: 32px;
  color: #9ca3af;
}

.no-comments-message i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-comments-message p {
  margin: 0;
  font-size: 14px;
}

.modal-new-comment-form {
  border-top: 2px solid #f3f4f6;
  padding-top: 24px;
}

.modal-new-comment-form h4 {
  color: #1f2937;
  margin: 0 0 16px 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-comment-input-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-comment-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  resize: vertical;
  font-family: inherit;
  font-size: 14px;
}

.modal-comment-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-add-comment-btn {
  align-self: flex-start;
  padding: 10px 16px;
  background: #059669;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.modal-add-comment-btn:hover {
  background: #047857;
}

.modal-add-comment-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Modal */
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
  z-index: 1000;
}

.modal-overlay-transparent {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-close-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.modal-close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 20px;
}

/* Wizard de efetivação - !important para sobrescrever base .modal-container */
.modal-container.transport-wizard-modal {
  height: 98vh !important;
  min-height: 400px !important;
  max-height: 98vh !important;
  min-width: 70vw !important;
  width: 70vw !important;
  max-width: 95vw !important;
}

.wizard-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  gap: 0;
}

.wizard-step {
  display: flex;
  align-items: center;
}

.wizard-step .step-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}

.wizard-step.active .step-number {
  background: #2563eb;
  color: white;
}

.wizard-step.done .step-number {
  background: #10b981;
  color: white;
}

.wizard-step .step-connector {
  width: 40px;
  height: 2px;
  background: #e5e7eb;
  margin: 0 4px;
}

.wizard-step.done .step-connector {
  background: #10b981;
}

.wizard-body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.wizard-loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 10;
  color: #2563eb;
}

.wizard-loading-overlay p {
  margin: 0;
  font-weight: 500;
}

.wizard-step-content {
  padding: 8px 0;
}

.wizard-step-content.wizard-step-centered {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.wizard-step-content.wizard-step-transport {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.wizard-transport-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.wizard-transport-subtitle {
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0 0 24px 0;
}

.wizard-transport-input-wrapper {
  width: 60%;
  min-width: 60%;
}

.wizard-transport-input-wrapper .autocomplete-wrapper {
  width: 100%;
}

.wizard-transport-input {
  width: 100% !important;
  text-align: center;
}

.wizard-step-content.wizard-step-presenter {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.wizard-presenter-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 24px 0;
}

.wizard-presenter-form {
  width: 60%;
  min-width: 60%;
}

.wizard-presenter-form .form-group {
  text-align: left;
  margin-bottom: 16px;
}

.wizard-presenter-form .form-group:last-child {
  margin-bottom: 0;
}

.wizard-presenter-form .form-input {
  width: 100% !important;
}

.wizard-step-centered .wizard-question {
  max-width: 100%;
}

.wizard-step-content.wizard-step-plates {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.wizard-plates-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.wizard-plates-subtitle {
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0 0 24px 0;
}

.wizard-plates-form {
  width: 60%;
  min-width: 60%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 0;
}

.wizard-plates-form .form-group {
  width: 100%;
  margin: 0 0 16px 0;
  text-align: left;
}

.wizard-plates-form .form-group:last-child {
  margin-bottom: 0;
}

.wizard-plates-form .form-group .plate-input {
  width: 100% !important;
  font-size: 1.1rem;
  padding: 12px 16px;
  box-sizing: border-box;
}

.wizard-question {
  font-size: 15px;
  color: #374151;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.wizard-buttons-row {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.wizard-choice-btn {
  flex: 1;
  min-width: 120px;
  padding: 14px 20px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s;
}

.wizard-choice-btn:hover {
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}

.wizard-choice-btn.selected {
  border-color: #2563eb;
  background: #eff6ff;
  color: #2563eb;
}

.wizard-step-content.wizard-step-pallets {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.wizard-step-content.wizard-step-operation {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.wizard-operation-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6b7280;
}

.wizard-operation-buttons {
  margin-top: 20px;
  justify-content: center;
}

.wizard-step-pallets .wizard-substep {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wizard-substep {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.wizard-input-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.wizard-input-row .pallets-input {
  width: 120px;
  min-width: 120px;
  text-align: center;
  padding: 10px 14px;
  font-size: 1rem;
}

.wizard-step-content .plate-input {
  width: 140px;
  text-transform: uppercase;
}

.autocomplete-wrapper {
  position: relative;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
  margin-top: 4px;
}

.autocomplete-item {
  padding: 10px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #374151;
}

.autocomplete-item:hover {
  background: #f3f4f6;
}

.load-result-summary {
  text-align: center;
  padding: 16px 0;
}

.load-result-summary .result-success {
  color: #10b981;
  font-size: 16px;
  margin: 0 0 8px 0;
}

.load-result-summary .result-error {
  color: #dc2626;
  font-size: 16px;
  margin: 0 0 8px 0;
}

.load-result-summary .result-detail {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.modal-container.modal-sm {
  max-width: 400px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-item label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.detail-item span {
  color: #1f2937;
}

.booking-badge {
  background: #fbbf24;
  color: #92400e;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

/* Notifications */
.notifications-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1050;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification {
  padding: 12px 16px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 400px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification.success {
  background: #d1fae5;
  color: #047857;
}

.notification.error {
  background: #fee2e2;
  color: #dc2626;
}

.notification.info {
  background: #dbeafe;
  color: #1e40af;
}

.notification-close {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  margin-left: auto;
  padding: 2px;
  border-radius: 2px;
  opacity: 0.7;
}

.notification-close:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.1);
}

/* Responsive */
@media (max-width: 768px) {
  .management-page {
    padding: 12px;
  }

  .search-input-group {
    flex-direction: column;
  }

  .client-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .comment-input-group {
    gap: 8px;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .results-table-container {
    font-size: 14px;
  }

  .results-table th,
  .results-table td {
    padding: 8px;
  }
}

/* Novos estilos - Aba de busca melhorada */

/* Botão Efetivar */
.effective-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.effective-btn:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
}

.effective-btn:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  opacity: 0.6;
}

/* Botão Obs */
.obs-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.obs-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.results-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* Checkbox de Devolução por agendamento */
.dev-checkbox-cell {
  text-align: center;
  width: 50px;
}

.dev-checkbox-label {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.dev-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #dc2626;
  opacity: 1;
  filter: none;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  border: 2px solid #dc2626;
  border-radius: 3px;
  background-color: white;
  position: relative;
}

.dev-checkbox:checked {
  accent-color: #dc2626 !important;
  background-color: #dc2626 !important;
  border-color: #dc2626 !important;
  opacity: 1 !important;
}

.dev-checkbox:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
  line-height: 1;
}

.dev-checkbox:disabled {
  cursor: not-allowed;
  opacity: 1 !important;
  accent-color: #dc2626 !important;
  filter: none !important;
  border-color: #dc2626 !important;
}

.dev-checkbox:disabled:checked {
  accent-color: #dc2626 !important;
  background-color: #dc2626 !important;
  border-color: #dc2626 !important;
  opacity: 1 !important;
  filter: none !important;
}

.dev-checkbox:disabled:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
  line-height: 1;
}

/* Linha de item não agendado (temporário, não salvo) */
.unscheduled-row {
  background: linear-gradient(90deg, #fef3c7 0%, #fef9e7 100%) !important;
  border-left: 4px solid #f59e0b !important;
  box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.1);
}

.unscheduled-row:hover {
  background: linear-gradient(90deg, #fde68a 0%, #fef3c7 100%) !important;
  box-shadow:
    0 2px 8px rgba(245, 158, 11, 0.15),
    inset 0 0 0 1px rgba(245, 158, 11, 0.2);
}

/* Linha de agendamento "Não agendado" (is_booking = 2) - cor ciano */
.not-scheduled-row {
  background: linear-gradient(
    90deg,
    rgba(0, 229, 255, 0.15) 0%,
    rgba(0, 188, 212, 0.08) 100%
  ) !important;
  border-left: 4px solid #00bcd4 !important;
  box-shadow: inset 0 0 0 1px rgba(0, 188, 212, 0.1);
}

.not-scheduled-row:hover {
  background: linear-gradient(
    90deg,
    rgba(0, 229, 255, 0.25) 0%,
    rgba(0, 188, 212, 0.15) 100%
  ) !important;
  box-shadow:
    0 2px 8px rgba(0, 188, 212, 0.15),
    inset 0 0 0 1px rgba(0, 188, 212, 0.2);
}

/* Botão remover item */
.remove-item-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.remove-item-btn:hover {
  background: #dc2626;
  box-shadow: 0 2px 6px rgba(220, 38, 38, 0.3);
}

/* Modal overlay */
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
  z-index: 1000;
  padding: 20px;
}

.modal-overlay-wizard {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 9999 !important;
  padding: 1vh !important;
  align-items: center !important;
  justify-content: center !important;
  box-sizing: border-box !important;
}

/* Modal container */
.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-container.modal-large {
  max-width: 800px;
  height: 90vh;
  max-height: 90vh;
}

.modal-container-elevated {
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 10px 20px -5px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05);
}

.modal-confirm {
  max-width: 500px;
}

/* Modal header */
.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 10px;
}

.modal-header h3 i {
  color: #3b82f6;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

/* Modal body */
.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-description {
  margin-bottom: 20px;
  color: #4b5563;
  font-size: 15px;
}

/* Modal footer */
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

.wizard-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.wizard-footer-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wizard-footer-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-footer-confirm {
  justify-content: center;
  gap: 20px;
}

/* Botões do modal */
.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: #6b7280;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #4b5563;
  transform: translateY(-1px);
}

/* Modal de alerta */
.modal-alert {
  max-width: 500px;
}

.modal-header-warning {
  background: #fef3c7;
  border-bottom: 2px solid #f59e0b;
}

.modal-header-warning h3 {
  color: #92400e;
}

.modal-header-warning h3 i {
  color: #f59e0b;
}

.modal-header-info {
  background: #dbeafe;
  border-bottom: 2px solid #3b82f6;
}

.modal-header-info h3 {
  color: #1e3a8a;
}

.modal-header-info h3 i {
  color: #3b82f6;
}

.modal-alert-message {
  font-size: 15px;
  line-height: 1.6;
  color: #374151;
  margin-bottom: 16px;
}

.modal-alert-message strong {
  color: #1f2937;
  display: block;
  margin-bottom: 12px;
}

.modal-alert-details {
  font-size: 14px;
  line-height: 1.6;
  color: #6b7280;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 4px;
  border-left: 3px solid #d1d5db;
}

.modal-alert-details strong {
  color: #374151;
  font-weight: 600;
}

.modal-alert-info {
  background: #eff6ff;
  border: 1px solid #3b82f6;
  border-radius: 6px;
  padding: 12px;
  font-size: 14px;
  color: #1e40af;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 0;
}

.modal-alert-info i {
  color: #3b82f6;
  margin-top: 2px;
}

.modal-footer-center {
  justify-content: center;
}

.btn-ok {
  min-width: 120px;
  justify-content: center;
}

.btn-select {
  background: #10b981;
  color: white;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-select:hover {
  background: #059669;
  box-shadow: 0 2px 6px rgba(5, 150, 105, 0.3);
}

/* Informações de NFe não agendada */
/* Modal de Seleção de Estoque */
.modal-storage-selection {
  max-width: 600px;
  height: 85vh;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow-x: visible !important; /* CRÍTICO: Permitir overflow horizontal para animação */
  overflow-y: hidden; /* Manter scroll vertical controlado pelo body */
}

.modal-storage-selection .modal-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-x: visible !important; /* CRÍTICO: Permitir overflow horizontal */
  overflow-y: auto; /* Scroll vertical apenas quando necessário */
}

.modal-header-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-bottom: none;
}

.modal-header-primary h3 {
  color: #ffffff;
}

.modal-header-primary h3 i {
  color: #ffffff;
}

.modal-info-compact {
  margin-bottom: 24px;
}

/* Grupos de Formulário */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-label i {
  color: #3b82f6;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input:invalid {
  border-color: #dc2626;
}

.form-input::placeholder {
  color: #9ca3af;
}

.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 15px;
  font-family: inherit;
  transition: all 0.2s ease;
  box-sizing: border-box;
  resize: vertical;
  min-height: 100px;
}

.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea::placeholder {
  color: #9ca3af;
}

.char-counter {
  text-align: right;
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
  font-weight: 500;
}

.obs-view-content {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  min-height: 80px;
}

.obs-view-content p {
  margin: 0;
  color: #374151;
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Modal Histórico da Carga */
.modal-load-history .modal-body {
  max-height: 70vh;
  overflow-y: auto;
}

.load-history-loading,
.load-history-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  color: #6b7280;
  font-size: 15px;
}

.load-history-loading i,
.load-history-empty i {
  font-size: 20px;
}

.load-history-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.load-history-item {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 8px;
}

.load-history-item:last-child {
  margin-bottom: 0;
}

.load-history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  flex-wrap: wrap;
  gap: 8px;
}

.load-history-time {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.load-history-user {
  font-size: 13px;
  color: #374151;
  font-weight: 600;
}

.load-history-action {
  font-size: 14px;
  color: #111827;
  font-weight: 500;
  margin-bottom: 4px;
}

.load-history-comment {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
  margin-top: 4px;
  padding-left: 0;
}

/* Lista de Estoques */
.storage-list-container {
  margin-top: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: visible !important; /* CRÍTICO: Permitir overflow em todas as direções */
  position: relative;
  flex: 1; /* Ocupar todo o espaço vertical disponível */
  min-height: 0; /* Permitir que o flex funcione corretamente */
  display: flex;
  flex-direction: column;
}

.storage-list {
  flex: 1; /* Ocupar todo o espaço disponível no container */
  overflow-y: auto !important; /* Scroll vertical quando necessário */
  overflow-x: visible !important; /* CRÍTICO: Permitir overflow horizontal */
  padding-right: 0; /* Remover padding extra */
  min-height: 0; /* Permitir que o flex funcione corretamente */
}

.storage-item {
  padding: 16px;
  padding-right: 24px; /* Espaço extra para acomodar a animação */
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  position: relative;
  z-index: 1; /* Base z-index */
  margin-right: -10px; /* Compensar movimento de hover para não criar scroll */
}

.storage-item:last-child {
  border-bottom: none;
}

.storage-item:hover {
  background: #f0f9ff;
  transform: translateX(6px);
  box-shadow: -4px 0 0 0 #3b82f6;
  z-index: 10; /* Elevar no hover para ficar acima de outros itens */
  margin-right: -16px; /* Ajustar margem no hover */
}

.storage-item:active {
  transform: translateX(4px);
  background: #dbeafe;
  margin-right: -14px; /* Ajustar margem no active */
}

.storage-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.storage-name {
  color: #1f2937;
  font-size: 15px;
  font-weight: 600;
}

.storage-cd {
  color: #6b7280;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.storage-cd i {
  font-size: 12px;
  color: #9ca3af;
}

.storage-cnpj {
  color: #9ca3af;
  font-size: 13px;
  font-family: 'Courier New', monospace;
  font-weight: 500;
}

.client-cnpj {
  color: #9ca3af;
  font-size: 13px;
  font-family: 'Courier New', monospace;
}

/* Estilos da Aba de Cargas */
.loads-tab-container {
  max-width: 1200px;
  margin: 0 auto;
}

.loads-header {
  text-align: center;
  margin-bottom: 32px;
}

.loads-header h2 {
  color: #1f2937;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 24px;
}

.loads-description {
  color: #6b7280;
  margin: 0;
  font-size: 15px;
}

/* Campo de busca na aba de histórico */
.history-search-container {
  max-width: 800px;
  margin: 0 auto 32px auto;
}

.history-search-container .search-input-group {
  display: flex;
  align-items: center;
  position: relative;
  gap: 0;
}

.history-search-container .search-icon {
  position: absolute;
  left: 16px;
  color: #6b7280;
  z-index: 2;
  font-size: 16px;
}

.history-search-container .search-input {
  flex: 1;
  padding: 12px 48px 12px 48px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  background: white;
}

.history-search-container .search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.history-search-container .clear-search-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.history-search-container .clear-search-btn:hover {
  background-color: #f3f4f6;
  color: #6b7280;
}

.history-search-container .search-results-info {
  margin-top: 12px;
  padding: 10px 16px;
  background: white;
  border-left: 4px solid #3b82f6;
  border-radius: 6px;
  color: #1f2937;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.history-search-container .search-results-info i {
  color: #3b82f6;
}

.loads-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.load-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  overflow: hidden;
}

.load-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.load-header {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 3px solid #1e40af;
}

/* Cabeçalho de carga com status DOCAR - vermelho */
.load-header-docar {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
  border-bottom: 3px solid #991b1b !important;
}

.load-header-sent {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  border-bottom: 3px solid #047857 !important;
}

.load-header-rejected {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%) !important;
  border-bottom: 3px solid #374151 !important;
}

.load-header-cancelled {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%) !important;
  border-bottom: 3px solid #374151 !important;
}

/* Linha única: Transportadora, Paletes e Apresentador - alinhados à esquerda */
.load-transport-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 24px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 14px;
  color: #334155;
}

.load-transport-item {
  display: flex;
  align-items: center;
}

/* Botão Histórico da carga na aba Histórico: alinhado à direita */
.load-history-action-history-tab {
  margin-left: auto;
}

/* Badges de informação da carga (Transportadora, Paletes, Apresentador) - tamanho conforme conteúdo */
.load-info-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  font-size: 13px;
  color: #334155;
  white-space: nowrap;
  width: max-content;
  max-width: 100%;
}

.load-info-badge i {
  color: #64748b;
  font-size: 14px;
  flex-shrink: 0;
}

.load-info-badge-label {
  color: #64748b;
  font-weight: 500;
  flex-shrink: 0;
}

.load-info-badge-value {
  font-weight: 600;
  color: #1e293b;
}

.load-status-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
}

.status-docar {
  background: rgba(220, 38, 38, 0.2);
  color: #b91c1c;
  border: 1px solid rgba(220, 38, 38, 0.3);
}

.status-enviado {
  background: rgba(16, 185, 129, 0.2);
  color: #047857;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.load-status-stat {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 6px;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.load-status-stat i {
  font-size: 8px;
  opacity: 0.85;
}

.load-status-aguardando {
  background: rgba(37, 99, 235, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.load-status-docar {
  background: rgba(220, 38, 38, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.load-status-enviado {
  background: rgba(22, 163, 74, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.load-status-recusado {
  background: rgba(127, 29, 29, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.load-status-cancelada {
  background: rgba(75, 85, 99, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.load-status-criado {
  background: rgba(2, 132, 199, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.load-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.load-title i {
  font-size: 24px;
  color: #fff;
}

.load-title h3 {
  margin: 0;
  color: #fff;
  font-size: 20px;
  font-weight: 600;
}

.btn-delete-load {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 6px;
  color: #fff;
  font-size: 0.75rem;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
  flex-shrink: 0;
}

.btn-delete-load:hover {
  background: rgba(220, 38, 38, 0.55);
  border-color: rgba(220, 38, 38, 0.9);
}

.btn-print-load {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 6px;
  color: #fff;
  font-size: 0.75rem;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
  flex-shrink: 0;
}

.btn-print-load:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.55);
  border-color: rgba(59, 130, 246, 0.9);
}

.btn-print-load:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.load-info {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.load-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.15);
  padding: 6px 12px;
  border-radius: 6px;
  backdrop-filter: blur(10px);
}

.load-stat i {
  font-size: 14px;
  opacity: 0.9;
}

.load-return-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  background: #dc2626;
  padding: 6px 12px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
}

.load-return-badge i {
  font-size: 14px;
}

.load-schedules {
  padding: 24px;
}

.load-schedules-table {
  width: 100%;
  border-collapse: collapse;
  background: #f9fafb;
  border-radius: 8px;
  overflow: hidden;
}

.load-schedules-table thead {
  background: #f3f4f6;
}

.load-schedules-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e5e7eb;
}

.load-schedules-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  color: #1f2937;
}

.load-schedules-table tbody tr {
  transition: background 0.2s ease;
}

.load-schedules-table tbody tr:hover {
  background: #f3f4f6;
}

.load-schedules-table tbody tr:last-child td {
  border-bottom: none;
}

.normal-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #d1fae5;
  color: #047857;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #10b981;
}

.normal-badge i {
  font-size: 11px;
}

.booking-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #f59e0b;
}

.booking-badge i {
  font-size: 11px;
}

.empty-loads-state {
  text-align: center;
  padding: 80px 20px;
  color: #6b7280;
}

.empty-loads-state .empty-icon {
  font-size: 64px;
  margin-bottom: 24px;
  opacity: 0.3;
  color: #9ca3af;
}

.empty-loads-state h3 {
  color: #374151;
  margin: 0 0 12px 0;
  font-size: 20px;
}

.empty-loads-state p {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
}

/* Seção de Ações da Carga (Dock) */
.load-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 24px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.dock-input-group {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 500px;
}

.load-actions-right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.dock-input-group label {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.dock-input-group label i {
  color: #3b82f6;
  font-size: 16px;
}

.dock-input {
  flex: 1;
  max-width: 150px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 15px;
  transition: all 0.2s ease;
}

.dock-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dock-input:invalid {
  border-color: #dc2626;
}

.dock-assign-btn {
  padding: 8px 16px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.dock-assign-btn:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

.dock-assign-btn:disabled {
  background: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.dock-assign-btn i {
  font-size: 13px;
}

.load-reject-btn {
  padding: 8px 16px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-height: 38px;
}

.load-reject-btn:hover {
  background: #b91c1c;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
}

.load-reject-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(220, 38, 38, 0.3);
}

.load-reject-btn i {
  font-size: 13px;
}

.load-obs-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.load-obs-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.load-obs-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(59, 130, 246, 0.3);
}

.load-history-btn {
  padding: 8px 16px;
  min-height: 38px;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.load-history-btn:hover {
  background: #4b5563;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(107, 114, 128, 0.3);
}

.load-history-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(107, 114, 128, 0.3);
}

.load-history-btn i {
  font-size: 13px;
}

.load-sent-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  width: 100%;
}

.load-sent-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.load-sent-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.load-sent-btn i {
  font-size: 16px;
}

/* Checkbox Column */
.checkbox-column {
  width: 50px;
  text-align: center;
  padding: 12px 8px !important;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3b82f6;
  margin: 0;
}

.checkbox-input:hover:not(:disabled) {
  filter: brightness(1.1);
  transition: filter 0.2s ease;
}

.checkbox-input:disabled {
  cursor: not-allowed;
  opacity: 0.4;
  accent-color: #9ca3af;
}

/* Linhas desabilitadas (de cargas inativas) */
.disabled-row {
  opacity: 0.5;
  background-color: #f9fafb !important;
}

.disabled-row:hover {
  background-color: #f9fafb !important;
  transform: none !important;
}

/* Agendamentos fantasmas (movidos para outra carga) */
.ghost-schedule {
  opacity: 0.5;
  background: repeating-linear-gradient(
    45deg,
    #f9fafb,
    #f9fafb 10px,
    #f3f4f6 10px,
    #f3f4f6 20px
  ) !important;
  position: relative;
}

.ghost-schedule td {
  color: #9ca3af;
  font-style: italic;
}

.ghost-schedule:hover {
  opacity: 0.6;
  background: repeating-linear-gradient(
    45deg,
    #f3f4f6,
    #f3f4f6 10px,
    #e5e7eb 10px,
    #e5e7eb 20px
  ) !important;
}

.ghost-schedule .checkbox-input {
  pointer-events: none;
  opacity: 0.3;
}

/* Responsivo para Cargas */
@media (max-width: 768px) {
  .load-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .load-info {
    width: 100%;
    justify-content: flex-start;
  }

  .load-actions {
    padding: 12px 16px;
  }

  .load-actions-right {
    margin-left: auto;
  }

  .dock-input-group {
    flex-wrap: wrap;
    max-width: 100%;
  }

  .dock-input-group label {
    width: 100%;
    font-size: 13px;
  }

  .dock-input {
    max-width: 120px;
  }

  .dock-assign-btn {
    font-size: 13px;
    padding: 8px 12px;
  }

  .load-reject-btn {
    font-size: 13px;
    padding: 8px 12px;
  }

  .load-history-btn {
    font-size: 13px;
    padding: 8px 12px;
  }

  .load-schedules {
    padding: 16px;
    overflow-x: auto;
  }

  .load-schedules-table {
    font-size: 13px;
  }

  .load-schedules-table th,
  .load-schedules-table td {
    padding: 10px 12px;
  }

  .checkbox-column {
    width: 40px;
    padding: 8px 4px !important;
  }

  .checkbox-input {
    width: 16px;
    height: 16px;
  }
}

/* Estilos para listas de seleção com busca */
.selection-list-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 8px;
  background: white;
}

.selection-item {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.selection-item:last-child {
  border-bottom: none;
}

.selection-item:hover {
  background-color: #f8f9fa;
}

.selection-item.selected {
  background-color: #e3f2fd;
  border-left: 3px solid #2196f3;
}

.selection-item-content {
  flex: 1;
}

.selection-item-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.selection-item-name i {
  margin-right: 8px;
  color: #666;
}

.selection-item-detail {
  font-size: 0.9em;
  color: #666;
}

.selection-check {
  color: #2196f3;
  font-size: 1.2em;
}

.no-results {
  padding: 24px;
  text-align: center;
  color: #999;
}

.no-results i {
  font-size: 2em;
  display: block;
  margin-bottom: 8px;
}

.search-input {
  margin-bottom: 0;
}

.modal-info-text {
  background: #e3f2fd;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  color: #1976d2;
}

.modal-info-text i {
  margin-right: 8px;
}

.new-form-container {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 4px;
  margin-top: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.9em;
}

.btn-link {
  background: none;
  border: none;
  color: #2196f3;
  cursor: pointer;
  padding: 4px 0;
  font-size: 0.9em;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-link:hover {
  text-decoration: underline;
}

.btn-success {
  background-color: #4caf50;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #45a049;
}

/* Estilos para botão de seleção e cards de informação selecionada */
.selection-placeholder {
  margin-top: 8px;
}

.btn-selection {
  width: 100%;
  padding: 16px;
  background: #f8f9fa;
  border: 2px dashed #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 1em;
  color: #666;
}

.btn-selection:hover {
  background: #e3f2fd;
  border-color: #2196f3;
  color: #2196f3;
}

.btn-selection i {
  font-size: 1.2em;
}

.selected-info-card {
  margin-top: 8px;
  padding: 16px;
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.selected-info-content {
  flex: 1;
}

.selected-info-name {
  font-weight: 500;
  color: #1976d2;
  margin-bottom: 4px;
}

.selected-info-name i {
  margin-right: 8px;
}

.selected-info-detail {
  font-size: 0.9em;
  color: #1565c0;
}

.btn-remove {
  background: none;
  border: none;
  color: #f44336;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.btn-remove:hover {
  background: #ffebee;
}

.btn-remove i {
  font-size: 1.2em;
}

/* Estilos para formulários de cadastro inline */
.form-section-title {
  font-size: 1.1em;
  font-weight: 600;
  color: #1e3a8a;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e3f2fd;
}

.form-section-title i {
  color: #2196f3;
}

.form-group-inline {
  margin-bottom: 16px;
}

.form-group-inline label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #475569;
  font-size: 0.95em;
}

.input-with-button {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-with-button .form-input {
  flex: 1;
}

.btn-validate {
  background: #2196f3;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-validate:hover:not(:disabled) {
  background: #1976d2;
}

.btn-validate:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

.btn-validated {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: 500;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}

.text-success {
  color: #10b981;
  font-size: 0.85em;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.text-error {
  color: #dc2626;
  font-size: 0.85em;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.help-text {
  color: #64748b;
  font-size: 0.85em;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.help-text i {
  font-size: 0.9em;
}

/* API Info Box */
.api-info-box {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 16px;
  margin-top: 16px;
  margin-bottom: 16px;
}

.api-info-box h5 {
  color: #0369a1;
  font-size: 1em;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.api-data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.api-data-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.api-data-item strong {
  color: #475569;
  font-size: 0.85em;
}

.api-data-item span {
  color: #1e293b;
  font-weight: 500;
  font-size: 0.95em;
}

.api-data-item .status-active {
  color: #10b981;
}

.api-data-item .status-inactive {
  color: #dc2626;
}

/* ─── Criar carga vazia ─────────────────────────────────────────────────── */
.criar-carga-wizard-modal {
  max-width: 640px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
}

.criar-carga-body {
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.criar-carga-subtitle {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0;
  padding: 0.6rem 0.75rem;
  background: #f0fdf4;
  border-left: 3px solid #38a169;
  border-radius: 4px;
}

.criar-carga-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #e8edf4;
  border: 1px solid #c8d3e3;
  border-radius: 10px;
  padding: 1rem 1.1rem;
}

.criar-carga-section h4 {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e40af;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding-bottom: 0.6rem;
  border-bottom: 2px solid #dbeafe;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.criar-carga-section h4 i {
  color: #3b82f6;
  font-size: 0.85rem;
}

.required {
  color: #dc2626;
  font-size: 0.8rem;
}

.obs-textarea {
  resize: vertical;
  min-height: 72px;
}

.char-count {
  display: block;
  text-align: right;
  color: #9ca3af;
  font-size: 0.78rem;
  margin-top: 0.2rem;
}

.criar-carga-confirm-btn {
  min-width: 140px;
}

/* Remover margem inferior dos form-group dentro das seções (o gap da section já espaça) */
.criar-carga-section .form-group {
  margin-bottom: 0 !important;
}

/* Forçar largura total de todos os inputs/select/textarea dentro do modal criar carga */
.criar-carga-body .wizard-plates-form,
.criar-carga-body .wizard-presenter-form {
  width: 100% !important;
  min-width: 100% !important;
  align-items: stretch !important;
}

.criar-carga-body .form-group,
.criar-carga-body .form-group label,
.criar-carga-body .form-input,
.criar-carga-body .autocomplete-wrapper,
.criar-carga-body .obs-textarea,
.criar-carga-body .criar-carga-select {
  width: 100% !important;
  box-sizing: border-box;
}

.criar-carga-fixed-storage {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.8rem;
  background: #f0f4fa;
  border: 1px solid #c8d3e3;
  border-radius: 6px;
  color: #1e40af;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: default;
  width: 100%;
  box-sizing: border-box;
}

.presenter-rg-wrapper {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
}

.presenter-rg-wrapper .form-input {
  flex: 1 1 0 !important;
  width: 0 !important;
  min-width: 0;
}

.presenter-rg-search-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 12px padding-top + 12px padding-bottom + ~18px line-height + 2px border = 44px */
  width: 44px;
  height: 44px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.15s;
}

.presenter-rg-search-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.presenter-rg-search-btn:disabled {
  background: #93c5fd;
  cursor: not-allowed;
}

.presenter-rg-not-found {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: #b45309;
}

.criar-carga-body .wizard-buttons-row {
  width: 100%;
}

.criar-carga-body .wizard-choice-btn {
  flex: 1;
}

.criar-carga-pallets-group {
  margin-bottom: 0 !important;
}

.criar-carga-body .form-input:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}
</style>
