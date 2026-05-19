<template>
  <div id="app">
    <!-- Universal Loading Overlay -->
    <div v-if="loading || bulkActionLoading" class="universal-loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <h3>{{ loadingMessage }}</h3>
        <p>{{ loadingSubtext }}</p>
      </div>
    </div>

    <!-- Mobile Menu Toggle - Fixed Position (fora do container para garantir posicionamento fixo) -->
    <button
      v-if="isMobile && !loading && !bulkActionLoading"
      class="mobile-menu-toggle-fixed"
      @click="toggleSidebar"
      :class="{ 'menu-open': isSidebarOpen }"
      :aria-label="isSidebarOpen ? 'Fechar menu' : 'Abrir menu'"
    >
      <i class="fas" :class="isSidebarOpen ? 'fa-times' : 'fa-bars'"></i>
    </button>

    <!-- Main App -->
    <div
      v-if="!loading && !bulkActionLoading"
      class="container"
      :class="{ 'sidebar-open': isSidebarOpen && isMobile }"
    >
      <!-- Mobile Overlay -->
      <div
        v-if="isMobile && isSidebarOpen"
        class="mobile-overlay"
        @click="closeSidebar"
      ></div>

      <!-- Sidebar Component -->
      <SidebarComponent
        :user="user"
        :active-menu="activeMenu"
        :collapsed="isMobile ? !isSidebarOpen : isSidebarCollapsed"
        :is-mobile="isMobile"
        @menu-click="handleMenuClick"
        @close-mobile="closeSidebar"
        @hover-expand="hoverSidebarExpanded = true"
        @hover-leave="hoverSidebarExpanded = false"
        @logout="handleLogout"
      >
      </SidebarComponent>

      <!-- Main Content -->
      <main
        class="main-content"
        :class="{
          'sidebar-collapsed': isSidebarCollapsed,
          'sidebar-open': isSidebarOpen && isMobile,
          'sidebar-hover-expanded': hoverSidebarExpanded,
        }"
      >
        <!-- Top Bar -->
        <div class="top-bar">
          <!-- User Profile (right) -->
          <div
            class="user-profile"
            @click="toggleUserDropdown"
            ref="userProfile"
          >
            <div class="user-avatar">
              {{ getUserInitial() }}
            </div>
            <span class="user-name">{{ user?.name || 'Usuário' }}</span>
            <i
              class="fas fa-chevron-down dropdown-arrow"
              :class="{ rotate: showUserDropdown }"
            ></i>

            <!-- Dropdown Menu -->
            <div v-if="showUserDropdown" class="user-dropdown">
              <div
                v-if="
                  !isBiDiretoriaPortalOnlyUser(user) &&
                  !isBiArmazensPortalOnlyUser(user)
                "
                class="dropdown-item"
                @click="handleSettingsClick"
              >
                <i class="fas fa-cog"></i>
                Configurações
              </div>
              <div class="dropdown-item" @click="handleLogout">
                <i class="fas fa-sign-out-alt"></i>
                Sair
              </div>
            </div>
          </div>
        </div>

        <!-- Dashboard Content (Lista de Agendamentos) - Mostra quando Dashboard, Solicitação de Agendamento ou quando showSchedulesList -->
        <div
          v-show="
            (showDashboardPage ||
              showRecebimentoAgendaPage ||
              showSchedulesList) &&
            !showSettingsPage &&
            !showXmlUploadPage &&
            !showProductsPage &&
            !showAdminPage &&
            !showSystemPage &&
            !showManagementPage &&
            !showHelpPage &&
            !showVersionPage &&
            !showMarketingPage &&
            !showCreateExpeditionPage &&
            !showExpeditionsPage &&
            !showExpeditionHistoryPage &&
            !showNoteExchangePage &&
            !showBIPage &&
            !showNewDashboardPage &&
            !showRecebimentoHistoricoPage &&
            !showConferenciaLotePage &&
            !showStatusPorClientesPage &&
            !showDiaristasPage &&
            !showWtjPage &&
            !showAutoStatusPage &&
            !showStatusPage &&
            !showArmazensPage &&
            !showLevantamentoCustosOperacionaisPage &&
            !showLevantamentoValoresAdminPage &&
            !showRejeicoesPage &&
            !showConfigRejeicoesPage &&
            !showConfigPedidosPage &&
            !showDevWhatsappDiretoriaPage &&
            !showGrupoOscarPage &&
            !showCargaDescargaAgendamentosPage &&
            !showFaturasListaPage &&
            !showFinanceiroSolicitacoesPage
          "
          class="content-area content-area-recebimento-agenda"
        >
          <!-- Tabela de Agendamentos (transferida de SchedulesList.vue) -->
          <div class="schedules-list">
            <!-- Header -->
            <div class="page-header">
              <div class="header-title-section">
                <h2>Lista de Agendamentos</h2>
                <div class="agendamentos-count">
                  <span class="count-badge">{{ totalItems || 0 }}</span>
                  <span class="count-label">{{
                    (totalItems || 0) === 1 ? 'agendamento' : 'agendamentos'
                  }}</span>
                  <span v-if="selectedFilterClient" class="filter-info">
                    (filtrado por: {{ selectedFilterClient.name }})
                  </span>
                </div>
              </div>
              <div class="header-actions">
                <button
                  v-if="hasCreatePermission"
                  class="btn btn-primary"
                  @click="openScheduleCreationModal"
                  :disabled="loading"
                  title="Criar novo agendamento"
                >
                  <i class="fas fa-plus"></i>
                  Criar Agendamento
                </button>
                <button
                  v-if="canCreateBooking"
                  class="btn btn-outline-primary"
                  @click="openBookingModal"
                  :disabled="loading"
                  title="Criar agendamento de agendamento prévio"
                >
                  <i class="fas fa-calendar-plus"></i>
                  Agendamento Prévio
                </button>
                <button
                  v-if="canCreateRejection"
                  class="btn btn-outline-danger"
                  @click="openRejectionModal"
                  :disabled="loading"
                  title="Criar agendamento de recusa"
                >
                  <i class="fas fa-ban"></i>
                  Recusar NF
                </button>
                <button
                  class="btn btn-outline-primary btn-refresh-icon"
                  @click="refresh"
                  :disabled="loading"
                  title="Atualizar dados"
                >
                  <i
                    :class="
                      loading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'
                    "
                  ></i>
                </button>
              </div>
            </div>

            <!-- Filtros e Busca -->
            <div class="filters-container">
              <!-- Header de filtros para mobile (toggle) -->
              <div class="filters-mobile-header" @click="toggleMobileFilters">
                <div class="filters-mobile-title">
                  <i class="fas fa-filter"></i>
                  <span>Filtros</span>
                </div>
                <i
                  class="fas filters-mobile-chevron"
                  :class="
                    mobileFiltersOpen ? 'fa-chevron-up' : 'fa-chevron-down'
                  "
                ></i>
              </div>

              <!-- Container colapsável para mobile -->
              <div
                class="filters-collapsible"
                :class="{ 'filters-collapsed': !mobileFiltersOpen }"
              >
                <!-- Search Bar com Exportar -->
                <div class="search-row">
                  <div class="search-input-group">
                    <input
                      type="text"
                      v-model="mainSearchInput"
                      @keyup.enter="handleMainSearch"
                      :disabled="loading"
                      placeholder="Digite o número da NF-e, OC, ou chave de acesso (44 dígitos)"
                      class="search-input"
                      autocomplete="off"
                      data-lpignore="true"
                      data-form-type="other"
                      name="nfe-search"
                    />
                    <button
                      @click="handleMainSearch"
                      :disabled="loading || !mainSearchInput.trim()"
                      class="search-button"
                    >
                      <i v-if="loading" class="fas fa-spinner fa-spin"></i>
                      <i v-else class="fas fa-search"></i>
                      Buscar
                    </button>
                  </div>

                  <!-- Botão de Exportar Excel (alinhado à direita) -->
                  <!-- Para usuários level 1: botão simples -->
                  <button
                    v-if="userLevel === 1"
                    class="btn btn-sm btn-outline-success export-btn-header"
                    @click="exportToExcel('cliente')"
                    :disabled="exportingExcel"
                    title="Exportar para Excel"
                  >
                    <i v-if="exportingExcel" class="fas fa-spinner fa-spin"></i>
                    <i v-else class="fas fa-file-excel"></i>
                    Exportar
                  </button>
                  <!-- Para outros usuários: dropdown com opções -->
                  <div v-else class="export-dropdown export-dropdown-header">
                    <button
                      class="btn btn-sm btn-outline-success dropdown-toggle"
                      @click="toggleExportDropdown"
                      :disabled="exportingExcel"
                      title="Exportar para Excel"
                    >
                      <i
                        v-if="exportingExcel"
                        class="fas fa-spinner fa-spin"
                      ></i>
                      <i v-else class="fas fa-file-excel"></i>
                      Exportar
                      <i class="fas fa-caret-down ms-1"></i>
                    </button>
                    <div v-if="showExportDropdown" class="export-dropdown-menu">
                      <button
                        class="export-option"
                        @click="exportToExcel('mercocamp')"
                      >
                        <i class="fas fa-building"></i>
                        Formato Mercocamp
                      </button>
                      <button
                        class="export-option"
                        @click="exportToExcel('cliente')"
                      >
                        <i class="fas fa-user-tie"></i>
                        Formato Cliente
                      </button>
                    </div>
                  </div>
                </div>

                <div class="filter-row">
                  <div class="filters-header">
                    <i class="fas fa-filter"></i>
                    <span>Filtros</span>
                  </div>
                  <div class="filter-group">
                    <label for="status">Status:</label>
                    <select
                      id="status"
                      v-model="currentFilters.status"
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
                      v-model="currentFilters.date_from"
                      @blur="handleDateFilterChange"
                      @change="handleDateFilterChange"
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
                      v-model="currentFilters.date_to"
                      @blur="handleDateFilterChange"
                      @change="handleDateFilterChange"
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
                    :key="`client-filter-${user?.id || 'none'}-${user?.cli_access && typeof user.cli_access === 'object' ? Object.keys(user.cli_access).length : 0}`"
                  >
                    <label for="client-filter">Estoque:</label>
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
                            : 'Selecionar Estoque'
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
                    <label>&nbsp;</label>
                    <div class="filter-buttons-row">
                      <!-- Botão "Hoje" - apenas para níveis !== 1 e apenas na página Agenda -->
                      <button
                        v-if="!showSchedulesList && userLevel !== 1"
                        class="btn"
                        :class="
                          todayFilterActive
                            ? 'btn-primary'
                            : 'btn-outline-primary'
                        "
                        @click="toggleTodayFilter"
                        title="Filtrar agendamentos de hoje"
                      >
                        <i class="fas fa-calendar-day"></i>
                        Hoje
                      </button>

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
              </div>
              <!-- Fim do filters-collapsible -->
            </div>

            <!-- Indicador de Busca Ativa -->
            <div v-if="isSearchActive" class="search-indicator mb-3">
              <div class="search-active-card">
                <div class="search-content">
                  <div class="search-header">
                    <div class="search-details">
                      <div class="search-type">
                        {{
                          currentSearchInfo.type === 'nfe_key'
                            ? 'Chave de Acesso'
                            : 'Número da NF-e'
                        }}
                      </div>
                      <div class="search-value">
                        {{ currentSearchInfo.value }}
                      </div>
                    </div>
                  </div>
                </div>
                <div class="search-actions">
                  <div class="search-results">
                    <div class="results-count">
                      <span class="count-number">{{
                        currentSearchInfo.count
                      }}</span>
                      <span class="count-label">{{
                        currentSearchInfo.count === 1
                          ? 'resultado'
                          : 'resultados'
                      }}</span>
                    </div>
                  </div>
                  <button
                    class="clear-search-btn"
                    @click="clearSearch"
                    title="Limpar busca"
                  >
                    <i class="fas fa-times"></i>
                    <span>Limpar</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Bulk Actions Bar -->
            <div v-if="canBulkManage" class="bulk-actions-bar">
              <div class="selected-info">
                <button
                  class="btn btn-outline-secondary action-btn selection-btn"
                  @click="toggleSelection"
                >
                  <i
                    :class="
                      selectedSchedules.length === 0
                        ? 'fas fa-check-square'
                        : 'fas fa-times'
                    "
                  ></i>
                  {{
                    selectedSchedules.length === 0
                      ? 'Selecionar Tudo'
                      : 'Limpar seleção'
                  }}
                  <span
                    v-if="selectedSchedules.length > 0"
                    class="selection-badge"
                    >{{ selectedSchedules.length }}</span
                  >
                </button>
              </div>

              <div class="bulk-actions">
                <!-- Actions for Contestado status -->
                <div
                  v-if="
                    !selectionHasCustomStatus &&
                    selectedScheduleStatuses[0] === 'Contestado'
                  "
                  class="contestado-actions"
                >
                  <div v-if="userLevel === 1" class="level-1-actions">
                    <button
                      class="btn btn-success action-btn"
                      @click="acceptNewDate"
                      :disabled="bulkActionLoading"
                    >
                      <i class="fas fa-check"></i> Aceitar Nova Data
                    </button>
                    <span class="contact-text"
                      >Ou entre em contato com nossa equipe</span
                    >
                  </div>
                  <div v-else class="non-level-1-actions">
                    <button
                      class="btn btn-success action-btn"
                      @click="confirmContestado"
                      :disabled="bulkActionLoading"
                    >
                      <i class="fas fa-check"></i> Confirmar
                    </button>
                    <div class="date-change-group">
                      <input
                        type="date"
                        v-model="newDate"
                        class="form-control"
                        :min="today"
                      />
                      <button
                        class="btn btn-success action-btn"
                        @click="changeContestadoToAgendado"
                        :disabled="!newDate || bulkActionLoading"
                      >
                        <i class="fas fa-calendar-alt"></i> Agendar
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Actions for Solicitado status -->
                <div
                  v-if="
                    !selectionHasCustomStatus &&
                    selectedScheduleStatuses[0] === 'Solicitado' &&
                    (userLevel === 0 || userLevel === 2)
                  "
                  class="solicitado-actions"
                >
                  <button
                    class="btn btn-success action-btn"
                    @click="acceptSchedules"
                    :disabled="bulkActionLoading"
                  >
                    <i class="fas fa-check"></i> Aceitar Agendamento
                  </button>
                  <!-- Ocultar opção de alterar data para agendamentos crossdocking -->
                  <div
                    v-if="!areAllSelectedCrossdock"
                    class="date-change-group"
                  >
                    <input
                      type="date"
                      v-model="newDate"
                      class="form-control"
                      :min="today"
                    />
                    <button
                      class="btn btn-warning action-btn"
                      @click="changeDateToContestado"
                      :disabled="!newDate || bulkActionLoading"
                    >
                      <i class="fas fa-calendar-alt"></i> Alterar Data
                    </button>
                  </div>
                </div>

                <!-- Actions for Solicitado status - Integrar e alterar para em conferência (apenas crossdock) -->
                <div
                  v-if="
                    !selectionHasCustomStatus &&
                    selectedScheduleStatuses[0] === 'Solicitado' &&
                    userLevel !== 1 &&
                    selectedSchedules.length > 0 &&
                    areAllSelectedSolicitado &&
                    areAllSelectedCrossdock
                  "
                  class="solicitado-integrate-actions"
                >
                  <button
                    class="btn btn-info action-btn"
                    @click="integrateAndMarkAsConferencia"
                    :disabled="bulkActionLoading"
                  >
                    <i class="fas fa-sync-alt"></i> Integrar e alterar para em
                    conferência
                  </button>
                </div>

                <!-- Actions for Agendado status -->
                <div
                  v-if="
                    !selectionHasCustomStatus &&
                    selectedScheduleStatuses[0] === 'Agendado' &&
                    (userLevel === 0 || userLevel === 2)
                  "
                  class="agendado-actions"
                >
                  <button
                    class="btn btn-success action-btn"
                    @click="markAsReceived"
                    :disabled="bulkActionLoading"
                  >
                    <i class="fas fa-check-circle"></i> Marcar como Em
                    conferência
                  </button>
                </div>

                <!-- Actions for Conferência status -->
                <div
                  v-if="
                    !selectionHasCustomStatus &&
                    (selectedScheduleStatuses[0] === 'Conferência' ||
                      selectedScheduleStatuses[0] === 'Recebido') &&
                    (userLevel === 0 || userLevel === 2)
                  "
                  class="conferencia-actions"
                >
                  <button
                    class="btn btn-info action-btn"
                    @click="markAsEmEstoque"
                    :disabled="bulkActionLoading"
                  >
                    <i class="fas fa-warehouse"></i> Marcar como Em estoque
                  </button>
                </div>

                <!-- Actions for Cancelar status -->
                <div
                  v-if="
                    !selectionHasCustomStatus &&
                    selectedScheduleStatuses[0] === 'Cancelar' &&
                    userLevel !== 1
                  "
                  class="cancelar-actions"
                >
                  <button
                    class="btn btn-danger action-btn btn-accept-cancel"
                    @click="acceptCancellation"
                    :disabled="bulkActionLoading"
                  >
                    <i class="fas fa-times-circle"></i> Aceitar Cancelamento
                  </button>
                  <span class="text-muted" style="font-size: 0.85em"
                    >Solicitado por {{ cancelRequestedBy }}</span
                  >
                </div>

                <!-- Actions for Recusar status -->
                <div
                  v-if="
                    !selectionHasCustomStatus &&
                    selectedScheduleStatuses[0] === 'Recusar'
                  "
                  class="recusar-actions"
                >
                  <button
                    class="btn btn-primary action-btn"
                    @click="markAsRecusado('Recusado')"
                    :disabled="bulkActionLoading"
                  >
                    <i class="fas fa-times-circle"></i> Confirmar Recusa
                  </button>
                  <button
                    class="btn btn-danger action-btn"
                    @click="markAsRecusado('Cancelado')"
                    :disabled="bulkActionLoading"
                    style="margin-left: 10px"
                  >
                    <i class="fas fa-ban"></i> Cancelar Recusa
                  </button>
                </div>

                <!-- Effectivate Booking Button (single booking selected) -->
                <div v-if="canEffectivateBooking" class="effectivate-actions">
                  <button
                    class="btn btn-success action-btn"
                    @click="effectivateBooking"
                    :disabled="bulkActionLoading"
                  >
                    <i class="fas fa-check-circle"></i>
                    Efetivar Agendamento
                  </button>
                </div>

                <!-- Generate TXT Button (Corpem integration) -->
                <CorpemTxtGenerator
                  :selected-schedules="selectedSchedules"
                  :schedules="schedules"
                  :user="user"
                  :loading="bulkActionLoading"
                  @loading-changed="handleTxtLoadingChange"
                  @notification="addNotification"
                />

                <!-- Botão Status (alteração em lote) - visível para nível diferente de 1 -->
                <div
                  v-if="userLevel !== 1 && selectedSchedules.length > 0"
                  class="status-bulk-actions"
                >
                  <button
                    class="btn btn-outline-primary action-btn"
                    type="button"
                    :disabled="bulkActionLoading"
                    @click="openStatusModal"
                  >
                    <i class="fas fa-tags"></i> Status
                  </button>
                </div>

                <!-- Cancel Button for Level 1 users (Solicitado and Agendado status) -->
                <div
                  v-if="
                    !selectionHasCustomStatus &&
                    userLevel === 1 &&
                    selectedSchedules.length > 0 &&
                    ['Solicitado', 'Agendado'].includes(
                      selectedScheduleStatuses[0]
                    )
                  "
                  class="level1-cancel-actions"
                >
                  <button
                    class="btn btn-outline-danger action-btn"
                    @click="cancelSchedules"
                    :disabled="bulkActionLoading"
                  >
                    <i class="fas fa-ban"></i>
                    {{
                      selectedScheduleStatuses[0] === 'Solicitado'
                        ? 'Cancelar Solicitação'
                        : 'Cancelar Agendamento'
                    }}
                  </button>
                </div>

                <!-- Reagendar (nível 1, status Solicitado ou Agendado) -->
                <div
                  v-if="
                    !selectionHasCustomStatus &&
                    userLevel === 1 &&
                    selectedSchedules.length > 0 &&
                    ['Solicitado', 'Agendado'].includes(
                      selectedScheduleStatuses[0]
                    )
                  "
                  class="level1-reschedule-actions"
                >
                  <div class="date-change-group">
                    <input
                      type="date"
                      v-model="rescheduleDate"
                      class="form-control"
                      :min="minRescheduleDate"
                      :title="
                        rescheduleHourBlocked
                          ? 'Após as 17h, o reagendamento só pode ser feito a partir de depois de amanhã'
                          : 'Selecione a nova data do agendamento'
                      "
                    />
                    <button
                      class="btn btn-primary action-btn"
                      @click="rescheduleSchedules"
                      :disabled="!rescheduleDate || bulkActionLoading"
                    >
                      <i class="fas fa-calendar-alt"></i> Reagendar
                    </button>
                  </div>
                </div>

                <!-- Universal Cancel Button (for level 0 and 2 users) -->
                <div
                  v-if="
                    !selectionHasCustomStatus &&
                    (userLevel === 0 || userLevel === 2) &&
                    selectedSchedules.length > 0 &&
                    ![
                      'Cancelar',
                      'Cancelado',
                      'Recusado',
                      'Em estoque',
                      'Estoque',
                    ].includes(selectedScheduleStatuses[0])
                  "
                  class="universal-actions"
                >
                  <button
                    class="btn btn-outline-danger action-btn"
                    @click="cancelSchedules"
                    :disabled="bulkActionLoading"
                  >
                    <i class="fas fa-ban"></i>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>

            <!-- Modal Alterar status (lote) -->
            <div
              v-if="showStatusModal"
              class="status-modal-overlay"
              @click.self="closeStatusModal"
            >
              <div class="status-modal-box">
                <div class="status-modal-header">
                  <h3>Alterar status</h3>
                  <button
                    type="button"
                    class="btn-close-modal"
                    aria-label="Fechar"
                    @click="closeStatusModal"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div class="status-modal-body">
                  <p class="status-modal-hint">
                    Selecione o status para os
                    {{ selectedSchedules.length }} agendamento(s)
                    selecionado(s).
                  </p>
                  <div v-if="statusConfigLoading" class="status-modal-loading">
                    <i class="fas fa-spinner fa-spin"></i> Carregando status...
                  </div>
                  <div v-else class="status-badges-grid">
                    <button
                      v-for="item in statusConfigList"
                      :key="item.id !== null ? item.id : 'native-' + item.name"
                      type="button"
                      class="status-badge-option"
                      :style="statusBadgeOptionStyle(item)"
                      @click="applyStatusFromModal(item)"
                    >
                      {{ item.name }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="loading-container">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Carregando agendamentos...</p>
            </div>

            <!-- Filter Loading State - navegação programática com filtros pré-aplicados -->
            <div v-else-if="filterLoading" class="loading-container">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Carregando agendamentos...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="schedules.length === 0" class="empty-state">
              <i class="fas fa-inbox"></i>
              <h3>Nenhum agendamento encontrado</h3>
              <p>Não há agendamentos que correspondam aos filtros aplicados.</p>
            </div>

            <!-- Table - Renderiza quando loading terminou e schedules foram carregados -->
            <div
              v-else
              class="table-container"
              :class="{ 'filter-loading': filterLoading }"
            >
              <!-- Overlay de loading para filtros -->
              <div v-if="filterLoading" class="filter-loading-overlay">
                <div class="filter-loading-spinner">
                  <i class="fas fa-spinner fa-spin"></i>
                </div>
              </div>

              <!-- Mobile Cards View -->
              <div class="mobile-cards-view">
                <div
                  v-for="schedule in paginatedSchedules"
                  :key="schedule.id"
                  class="schedule-card-mobile"
                  :class="{
                    'booking-row': Number(schedule.is_booking) === 1,
                    'not-scheduled-row': Number(schedule.is_booking) === 2,
                    'selected-row': selectedSchedules.includes(schedule.id),
                    'clickable-row': canSelectSchedule(schedule),
                    'delayed-row': isScheduleDelayed(
                      schedule.date,
                      schedule.status,
                      schedule.prevision
                    ),
                  }"
                  @click="toggleRowSelection(schedule.id, $event)"
                >
                  <!-- Linha 1: Checkbox, NF-e, Status | Botão Info (ocupa 2 linhas) -->
                  <!-- Linha 2: Nome cliente/estoque -->
                  <div class="card-header-mobile card-header-mobile-grid">
                    <div class="card-checkbox-mobile" @click.stop>
                      <input
                        type="checkbox"
                        :value="schedule.id"
                        v-model="selectedSchedules"
                        @change="onScheduleSelect"
                        :disabled="!canSelectSchedule(schedule)"
                      />
                    </div>
                    <div class="card-nfe-mobile">{{ schedule.number }}</div>
                    <div class="card-status-mobile">
                      <span
                        :class="[
                          'status-badge-mobile',
                          getStatusDisplayFor(schedule).useClass,
                        ]"
                        :style="getStatusDisplayFor(schedule).style"
                      >
                        {{ getStatusDisplayFor(schedule).label }}
                      </span>
                    </div>
                    <div
                      class="card-actions-mobile card-actions-mobile-span-2"
                      @click.stop
                    >
                      <button
                        class="btn btn-sm btn-outline-primary btn-nfe-info"
                        @click="openInfoModal(schedule)"
                        title="Informações da NF-e"
                      >
                        <i class="fas fa-info-circle"></i>
                      </button>
                    </div>
                    <div class="card-client-mobile" v-if="userLevel !== 1">
                      {{ schedule.client }}
                    </div>
                    <div class="card-client-mobile" v-if="userLevel === 1">
                      {{ getSupplierLabel(schedule) }}
                    </div>
                  </div>

                  <!-- Linha 3 (condicional): OC -->
                  <div
                    v-if="hasOcColumn && schedule.oc"
                    class="card-row-oc-mobile"
                  >
                    OC: {{ schedule.oc }}
                  </div>

                  <!-- Demais informações: Solicitação, Entrega, Volumes (3 containers iguais) -->
                  <div class="card-second-row-mobile">
                    <div class="card-info-box-mobile" v-if="userLevel !== 1">
                      <div class="card-info-item-mobile">
                        <span class="card-info-label-mobile">Solicitado:</span>
                        <span class="card-info-value-mobile">{{
                          formatDateShort(getRequestDate(schedule))
                        }}</span>
                      </div>
                    </div>
                    <div
                      class="card-info-box-mobile card-info-box-mobile--empty"
                      v-if="userLevel === 1"
                    ></div>
                    <div class="card-info-box-mobile">
                      <div class="card-info-item-mobile">
                        <span class="card-info-label-mobile">Entrega:</span>
                        <span class="card-info-value-mobile">
                          {{ schedule.prevision ? '~ ' : ''
                          }}{{ formatDateShort(schedule.date) }}
                          <i
                            v-if="
                              isScheduleDelayed(
                                schedule.date,
                                schedule.status,
                                schedule.prevision
                              )
                            "
                            class="fas fa-clock delayed-icon-mobile"
                            title="Agendamento atrasado"
                          ></i>
                        </span>
                      </div>
                    </div>
                    <div class="card-info-box-mobile">
                      <div class="card-info-item-mobile">
                        <span class="card-info-label-mobile">Volumes:</span>
                        <span class="card-info-value-mobile">{{
                          schedule.case_count
                        }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Demais informações (Transportadora para nível 1) -->
                  <div class="card-body-mobile" v-if="userLevel === 1">
                    <div class="card-row-mobile">
                      <span class="card-label-mobile">Transportadora:</span>
                      <span class="card-value-mobile">{{
                        getTransportadoraName(schedule) || '-'
                      }}</span>
                    </div>
                  </div>
                </div>

                <!-- Mensagem quando não há agendamentos visíveis -->
                <div
                  v-if="paginatedSchedules.length === 0"
                  class="mobile-empty-message"
                >
                  <i class="fas fa-filter"></i>
                  <p>Todos os agendamentos foram filtrados por status.</p>
                  <p>
                    Use o botão "Buscar" para mostrar agendamentos em outros
                    status.
                  </p>
                </div>
              </div>

              <!-- Desktop Table View -->
              <div class="table-wrapper desktop-table-view" ref="tableWrapper">
                <table class="schedules-table desktop-table">
                  <thead>
                    <tr>
                      <th style="width: 50px">
                        <input
                          type="checkbox"
                          @change="toggleSelectAll"
                          :checked="isAllSelected"
                          :indeterminate="isSomeSelected"
                          title="Selecionar todos"
                        />
                      </th>
                      <th>N° NF-e</th>
                      <th v-if="hasOcColumn" class="col-oc">OC</th>
                      <!-- Colunas para usuários que NÃO são nível 1 -->
                      <th
                        v-if="userLevel !== 1"
                        class="sortable-column"
                        @click="sortByColumn('client')"
                        :class="{
                          'sorted-asc':
                            sortColumn === 'client' && sortDirection === 'asc',
                          'sorted-desc':
                            sortColumn === 'client' && sortDirection === 'desc',
                        }"
                        title="Clique para ordenar por cliente"
                      >
                        Cliente
                        <i
                          v-if="sortColumn === 'client'"
                          class="fas"
                          :class="
                            sortDirection === 'asc'
                              ? 'fa-sort-up'
                              : 'fa-sort-down'
                          "
                        ></i>
                        <i v-else class="fas fa-sort sort-icon-inactive"></i>
                      </th>
                      <th v-if="userLevel !== 1" style="text-align: center">
                        Solicitação
                      </th>
                      <!-- Novas colunas para usuários nível 1 -->
                      <th v-if="userLevel === 1">Fornecedor</th>
                      <th v-if="userLevel === 1">Transportadora</th>
                      <th
                        class="sortable-column"
                        style="text-align: center"
                        @click="sortByColumn('date')"
                        :class="{
                          'sorted-asc':
                            sortColumn === 'date' && sortDirection === 'asc',
                          'sorted-desc':
                            sortColumn === 'date' && sortDirection === 'desc',
                        }"
                        title="Clique para ordenar por data de entrega"
                      >
                        Entrega
                        <i
                          v-if="sortColumn === 'date'"
                          class="fas"
                          :class="
                            sortDirection === 'asc'
                              ? 'fa-sort-up'
                              : 'fa-sort-down'
                          "
                        ></i>
                        <i v-else class="fas fa-sort sort-icon-inactive"></i>
                      </th>
                      <th class="col-vols" style="text-align: center">Vols</th>
                      <th class="col-status" style="text-align: center">
                        Status
                      </th>
                      <th class="actions-column-header"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- Mensagem quando não há agendamentos visíveis (todos filtrados) -->
                    <tr v-if="paginatedSchedules.length === 0">
                      <td
                        :colspan="
                          (userLevel === 1 ? 9 : 14) + (hasOcColumn ? 1 : 0)
                        "
                        style="text-align: center; padding: 40px; color: #666"
                      >
                        <i
                          class="fas fa-filter"
                          style="
                            font-size: 2em;
                            margin-bottom: 10px;
                            display: block;
                          "
                        ></i>
                        <p style="margin: 0; font-size: 1.1em">
                          Todos os agendamentos foram filtrados por status.
                        </p>
                        <p style="margin: 10px 0 0 0; font-size: 0.9em">
                          Use o botão "Buscar" para mostrar agendamentos em
                          outros status.
                        </p>
                      </td>
                    </tr>
                    <tr
                      v-for="schedule in paginatedSchedules"
                      :key="schedule.id"
                      :class="{
                        'booking-row': Number(schedule.is_booking) === 1,
                        'not-scheduled-row': Number(schedule.is_booking) === 2,
                        'selected-row': selectedSchedules.includes(schedule.id),
                        'clickable-row': canSelectSchedule(schedule),
                        'has-supplier-tooltip': schedule.supplier,
                        'delayed-row': isScheduleDelayed(
                          schedule.date,
                          schedule.status,
                          schedule.prevision
                        ),
                      }"
                      @click="toggleRowSelection(schedule.id, $event)"
                      @mouseenter="showSupplierTooltip(schedule.id, $event)"
                      @mouseleave="hideSupplierTooltip"
                    >
                      <td class="checkbox-column" @click.stop>
                        <input
                          type="checkbox"
                          :value="schedule.id"
                          v-model="selectedSchedules"
                          @change="onScheduleSelect"
                          :disabled="!canSelectSchedule(schedule)"
                        />
                      </td>
                      <td>{{ schedule.number }}</td>
                      <td v-if="hasOcColumn" class="col-oc">
                        {{ schedule.oc || '-' }}
                      </td>
                      <!-- Colunas para usuários que NÃO são nível 1 -->
                      <td v-if="userLevel !== 1">{{ schedule.client }}</td>
                      <td v-if="userLevel !== 1" style="text-align: center">
                        {{ formatDateShort(getRequestDate(schedule)) }}
                      </td>
                      <!-- Novas colunas para usuários nível 1 -->
                      <td v-if="userLevel === 1">
                        {{ getSupplierLabel(schedule) }}
                      </td>
                      <td v-if="userLevel === 1">
                        {{ getTransportadoraName(schedule) || '-' }}
                      </td>
                      <td style="text-align: center">
                        {{ schedule.prevision ? '~ ' : ''
                        }}{{ formatDateShort(schedule.date) }}
                      </td>
                      <td class="col-vols" style="text-align: center">
                        {{ schedule.case_count }}
                      </td>
                      <td class="col-status" style="text-align: center">
                        <span
                          :class="[
                            'status-badge',
                            getStatusDisplayFor(schedule).useClass,
                          ]"
                          :style="getStatusDisplayFor(schedule).style"
                        >
                          {{ getStatusDisplayFor(schedule).label }}
                        </span>
                      </td>
                      <td @click.stop class="actions-column">
                        <div class="action-buttons">
                          <div class="action-icons-left">
                            <i
                              v-if="
                                isScheduleDelayed(
                                  schedule.date,
                                  schedule.status,
                                  schedule.prevision
                                )
                              "
                              class="fas fa-clock delayed-icon"
                              title="Agendamento atrasado"
                            ></i>
                          </div>
                          <div class="action-icons-right">
                            <button
                              class="btn btn-sm btn-outline-primary btn-nfe-info"
                              @click="openInfoModal(schedule)"
                              title="Informações da NF-e"
                            >
                              <i class="fas fa-info-circle"></i>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- Controles de Paginação (sempre visíveis) -->
                <div class="pagination-controls" v-if="totalItems > 0">
                  <div class="pagination-info">
                    <i class="fas fa-list"></i>
                    Mostrando {{ (currentPage - 1) * itemsPerPage + 1 }} -
                    {{ Math.min(currentPage * itemsPerPage, totalItems) }} de
                    {{ totalItems }} agendamentos
                  </div>

                  <div class="pagination-controls-wrapper">
                    <div
                      class="pagination-buttons"
                      :class="{ 'single-page': totalPages <= 1 }"
                    >
                      <!-- Botão primeira página -->
                      <button
                        @click="goToFirstPage"
                        :disabled="currentPage === 1 || totalPages <= 1"
                        class="pagination-btn pagination-arrow"
                        title="Primeira página"
                      >
                        <i class="fas fa-angle-double-left"></i>
                      </button>

                      <!-- Botão anterior -->
                      <button
                        @click="previousPage"
                        :disabled="currentPage === 1 || totalPages <= 1"
                        class="pagination-btn pagination-arrow"
                        title="Página anterior"
                      >
                        <i class="fas fa-chevron-left"></i>
                      </button>

                      <!-- Reticências à esquerda -->
                      <span
                        v-if="showLeftEllipsis && totalPages > 1"
                        class="pagination-ellipsis"
                      >
                        ...
                      </span>

                      <!-- Botões de páginas visíveis -->
                      <button
                        v-for="page in visiblePages"
                        :key="page"
                        @click="goToPage(page)"
                        :disabled="totalPages <= 1"
                        :class="{
                          'pagination-btn': true,
                          'pagination-page': true,
                          active: page === currentPage,
                        }"
                        :title="`Ir para página ${page}`"
                      >
                        {{ page }}
                      </button>

                      <!-- Reticências à direita -->
                      <span
                        v-if="showRightEllipsis && totalPages > 1"
                        class="pagination-ellipsis"
                      >
                        ...
                      </span>

                      <!-- Botão próxima -->
                      <button
                        @click="nextPage"
                        :disabled="
                          currentPage === totalPages || totalPages <= 1
                        "
                        class="pagination-btn pagination-arrow"
                        title="Próxima página"
                      >
                        <i class="fas fa-chevron-right"></i>
                      </button>

                      <!-- Botão última página -->
                      <button
                        @click="goToLastPage"
                        :disabled="
                          currentPage === totalPages || totalPages <= 1
                        "
                        class="pagination-btn pagination-arrow"
                        title="Última página"
                      >
                        <i class="fas fa-angle-double-right"></i>
                      </button>
                    </div>

                    <!-- Seletor de itens por página -->
                    <div class="items-per-page-selector">
                      <label for="itemsPerPageMain">
                        <i class="fas fa-th-list"></i>
                        Itens por página:
                      </label>
                      <select
                        id="itemsPerPageMain"
                        :value="getSelectedItemsPerPage()"
                        @change="changeItemsPerPage($event.target.value)"
                        class="items-per-page-select"
                      >
                        <option
                          v-for="option in itemsPerPageOptions"
                          :key="option"
                          :value="option"
                        >
                          {{ option }}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                <!-- Loading indicator for infinite scroll -->
                <div v-if="loadingMore" class="loading-more">
                  <i class="fas fa-spinner fa-spin"></i>
                  <p>Carregando mais agendamentos...</p>
                </div>
              </div>
            </div>

            <!-- Supplier Tooltip -->
            <div
              v-if="supplierTooltip.visible"
              class="supplier-tooltip"
              :class="{ 'delayed-tooltip': supplierTooltip.isDelayed }"
              :style="{
                top: supplierTooltip.top + 'px',
                left: supplierTooltip.left + 'px',
              }"
            >
              <!-- Tooltip para agendamentos atrasados -->
              <div
                v-if="supplierTooltip.isDelayed"
                class="supplier-tooltip-content"
              >
                <div class="supplier-tooltip-warning">
                  <i class="fas fa-exclamation-triangle"></i>
                  <strong>AGENDAMENTO EM ATRASO</strong>
                </div>
              </div>

              <!-- Tooltip normal -->
              <div v-else class="supplier-tooltip-content">
                <!-- Tooltip para usuários nível 1: mostrar Estoque -->
                <template v-if="supplierTooltip.isLevel1">
                  <div class="supplier-tooltip-item">
                    <div class="supplier-tooltip-label">
                      <i class="fas fa-warehouse"></i>
                      <strong>Estoque:</strong>
                    </div>
                    <div class="supplier-tooltip-value">
                      {{ supplierTooltip.storageName || '-' }}
                    </div>
                  </div>
                  <div class="supplier-tooltip-divider"></div>
                  <div class="supplier-tooltip-item">
                    <div class="supplier-tooltip-label">
                      <i class="fas fa-id-card"></i>
                      <strong>CNPJ:</strong>
                    </div>
                    <div class="supplier-tooltip-value">
                      {{ supplierTooltip.storageCnpj || '-' }}
                    </div>
                  </div>
                </template>

                <!-- Tooltip para outros níveis: mostrar Fornecedor e Transportadora -->
                <template v-else>
                  <div class="supplier-tooltip-item">
                    <div class="supplier-tooltip-label">
                      <i class="fas fa-truck"></i>
                      <strong>Fornecedor:</strong>
                    </div>
                    <div class="supplier-tooltip-value">
                      {{ supplierTooltip.supplier || '-' }}
                    </div>
                  </div>
                  <div class="supplier-tooltip-divider"></div>
                  <div class="supplier-tooltip-item">
                    <div class="supplier-tooltip-label">
                      <i class="fas fa-shipping-fast"></i>
                      <strong>Transportadora:</strong>
                    </div>
                    <div class="supplier-tooltip-value">
                      {{ supplierTooltip.carrier || '-' }}
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- Modals -->
            <ScheduleEditModal
              :schedule-data="scheduleToEdit"
              :show-modal="showEditModal"
              @close="closeEditModal"
              @updated="handleScheduleUpdated"
              @notification="addNotification"
            />
            <ScheduleBookingModal
              :show-modal="showBookingModal"
              @close="closeBookingModal"
              @created="handleBookingCreated"
            />
            <ScheduleRejectionModal
              :show-modal="showRejectionModal"
              @close="closeRejectionModal"
              @created="handleRejectionCreated"
            />
            <ScheduleCreationModal
              :show-modal="showEffectivateModal"
              :booking-to-effectivate="bookingToEffectivate"
              @close="closeEffectivateModal"
              @created="handleBookingEffectivated"
            />

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
                  <button
                    class="modal-close-btn"
                    @click="closeClientFilterModal"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>

                <div class="modal-body">
                  <!-- Search input -->
                  <div v-if="!loadingFilterClients" class="search-container">
                    <div class="search-input-wrapper">
                      <input
                        type="text"
                        v-model="clientFilterSearchQuery"
                        placeholder="Pesquisar por nome, CNPJ ou número Corpem..."
                        class="search-input"
                        @input="filterFilterClients"
                        autocomplete="off"
                        data-lpignore="true"
                        data-form-type="other"
                        name="client-filter-search"
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
                    <div
                      class="search-results-info"
                      v-if="clientFilterSearchQuery"
                    >
                      <span
                        >{{ filteredFilterClients.length }} de
                        {{ availableFilterClients.length }} clientes
                        encontrados</span
                      >
                    </div>
                  </div>

                  <!-- Loading state for clients -->
                  <div
                    v-if="loadingFilterClients"
                    class="loading-clients-container"
                  >
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
                        <span class="estoque-nome">{{
                          formatEntityDisplayName(client.name)
                        }}</span>
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
        </div>

        <!-- Schedules List -->
        <div v-if="showSchedulesList" class="content-area">
          <SchedulesList
            ref="schedulesListRef"
            @notification="addNotification"
            @schedules-loaded="handleSchedulesFromList"
            @page-ready="onPageReady"
          >
          </SchedulesList>
        </div>

        <!-- Settings Page -->
        <div v-if="showSettingsPage" class="content-area">
          <SettingsPage ref="settingsPageRef" @notification="addNotification">
          </SettingsPage>
        </div>

        <!-- XML Upload Page -->
        <div v-if="showXmlUploadPage" class="content-area">
          <XmlUploadPage
            ref="xmlUploadPageRef"
            :booking-to-effectivate="bookingToEffectivate"
            @notification="addNotification"
            @schedules-created="handleSchedulesCreated"
            @effectivation-completed="handleBookingEffectivated"
            @page-ready="onPageReady"
          >
          </XmlUploadPage>
        </div>

        <!-- Products Page -->
        <div v-if="showProductsPage" class="content-area content-area-products">
          <ProductsPage ref="productsPageRef" @notification="addNotification">
          </ProductsPage>
        </div>

        <!-- Admin Page -->
        <div v-if="showAdminPage" class="content-area">
          <AdminPage
            ref="adminPageRef"
            :initial-tab="adminTabToShow"
            @notification="addNotification"
          />
        </div>

        <!-- System Page -->
        <div v-if="showSystemPage" class="content-area">
          <SystemPage @show-notification="addNotification" />
        </div>

        <!-- Management Page (Cargas / Clientes) - Wrapper para 98% da largura no desktop -->
        <div v-if="showManagementPage" class="cargas-view-wrapper">
          <div class="content-area content-area-cargas">
            <ManagementPage
              ref="managementPageRef"
              :initial-tab="managementTabToShow"
              :page-mode="
                managementTabToShow === 'clients' ? 'clientes' : 'cargas'
              "
              @notification="addNotification"
              @load-updated="handleLoadUpdated"
            />
          </div>
        </div>

        <!-- Create Expedition Page -->
        <div v-if="showCreateExpeditionPage" class="content-area">
          <CreateExpeditionPage
            ref="createExpeditionPageRef"
            @notification="addNotification"
            @pedido-criado="handleMenuClick('pedidos-expedicao')"
          />
        </div>

        <!-- Expeditions Page -->
        <div
          v-if="showExpeditionsPage"
          class="content-area content-area-expeditions"
        >
          <ExpeditionsPage
            ref="expeditionsPageRef"
            @notification="addNotification"
            @criar-pedido="handleMenuClick('criar-pedido-expedicao')"
            @page-ready="onPageReady"
          />
        </div>

        <!-- Expedition History Page -->
        <div
          v-if="showExpeditionHistoryPage"
          class="content-area content-area-expedition-history"
        >
          <ExpeditionHistoryPage
            ref="expeditionHistoryPageRef"
            @notification="addNotification"
          />
        </div>

        <!-- Note Exchange Page -->
        <div v-if="showNoteExchangePage" class="content-area">
          <NoteExchangePage
            ref="noteExchangePageRef"
            @notification="addNotification"
            @pedido-criado="handleMenuClick('pedidos-expedicao')"
          />
        </div>

        <!-- Help Page -->
        <div v-if="showHelpPage" class="content-area">
          <HelpPage ref="helpPageRef" @notification="addNotification" />
        </div>

        <!-- Version Page -->
        <div v-if="showVersionPage" class="content-area">
          <VersionPage ref="versionPageRef" @notification="addNotification" />
        </div>

        <!-- Diaristas: só montar para nível 0 ou 4 (evita 403 ao montar para outros níveis) -->
        <div
          v-if="
            showDiaristasPage &&
            user &&
            (Number(user.level_access) === 0 || Number(user.level_access) === 4)
          "
          class="content-area content-area-diaristas"
        >
          <DiaristasPage @notification="addNotification" />
        </div>

        <!-- Marketing Page -->
        <div v-if="showMarketingPage" class="content-area">
          <MarketingPage
            ref="marketingPageRef"
            @notification="addNotification"
          />
        </div>

        <!-- Armazéns: só montar para nível 0 (evita 403 ao montar para outros níveis) -->
        <div
          v-if="showArmazensPage && user && Number(user.level_access) === 0"
          class="content-area"
        >
          <ArmazensPage ref="armazensPageRef" @notification="addNotification" />
        </div>

        <div
          v-if="
            showLevantamentoCustosOperacionaisPage &&
            user &&
            Number(user.level_access) === 0
          "
          class="content-area"
        >
          <LevantamentoCustosOperacionaisPage @notification="addNotification" />
        </div>

        <div
          v-if="
            showLevantamentoValoresAdminPage &&
            user &&
            Number(user.level_access) === 0
          "
          class="content-area"
        >
          <LevantamentoValoresAdminPage @notification="addNotification" />
        </div>

        <!-- BI Page (v-show + keep-alive preserva dados ao navegar; só carrega SLA na primeira vez) -->
        <div class="content-area content-area-bi" v-show="showBIPage">
          <keep-alive>
            <BIPainelPage
              v-if="
                showBIPage &&
                activeMenu === 'bi-painel' &&
                user &&
                Number(user.level_access) === 0
              "
              key="bi-painel"
              @notification="addNotification"
              @page-ready="onPageReady"
            />
            <BIDiretoriaPage
              v-else-if="showBIPage && activeMenu === 'bi-diretoria'"
              key="bi-diretoria"
              @notification="addNotification"
              @page-ready="onPageReady"
            />
            <BIAgendamentosPage
              v-else-if="
                showBIPage &&
                activeMenu === 'bi-agendamentos' &&
                user &&
                ![1, 2].includes(Number(user.level_access))
              "
              key="bi-agendamentos"
              @notification="addNotification"
              @page-ready="onPageReady"
            />
            <BIMovimentacaoClientesPage
              v-else-if="
                showBIPage &&
                activeMenu === 'bi-movimentacao-clientes' &&
                user &&
                Number(user.level_access) === 0
              "
              key="bi-movimentacao-clientes"
              @notification="addNotification"
              @page-ready="onPageReady"
            />
            <BIAdministradoresPage
              v-else-if="
                showBIPage &&
                activeMenu === 'bi-administradores' &&
                user &&
                canAccessBiAdministradores(user)
              "
              :user="user"
              key="bi-administradores"
              @notification="addNotification"
              @page-ready="onPageReady"
            />
            <BIGroupLinkGerencialPage
              v-else-if="
                showBIPage &&
                activeMenu === 'bi-grouplink-gerencial' &&
                user &&
                canAccessBiGroupLinkGerencial(user)
              "
              key="bi-grouplink-gerencial"
              @notification="addNotification"
              @page-ready="onPageReady"
            />
            <BIPage
              v-else-if="showBIPage"
              key="bi-sla-rejeicao-armazens"
              ref="biPageComponentRef"
              :bi-sub-tab="biPageSubTab"
              @notification="addNotification"
              @page-ready="onPageReady"
            />
          </keep-alive>
        </div>

        <!-- Dashboard Page (Nova View) - Wrapper para alinhar banner e conteúdo em 98% no desktop -->
        <div v-if="showNewDashboardPage" class="dashboard-view-wrapper">
          <NewsCarousel />
          <div class="content-area content-area-dashboard">
            <DashboardPage
              :user="user"
              @navigate="handleDashboardNavigate"
              @notification="addNotification"
            />
          </div>
        </div>

        <!-- Recebimento - Agenda -->
        <!-- Solicitação de Agendamento mostra a lista de agendamentos -->

        <!-- Recebimento - Histórico -->
        <div
          v-if="showRecebimentoHistoricoPage"
          class="content-area content-area-recebimento-historico"
        >
          <RecebimentoHistoricoPage
            ref="recebimentoHistoricoRef"
            @notification="addNotification"
            @page-ready="onPageReady"
          />
        </div>

        <!-- Recebimento - Reagendamento em massa -->
        <div
          v-if="showReagendamentoMassaPage"
          class="content-area content-area-reagendamento-massa"
        >
          <ReagendamentoMassaPage @notification="addNotification" />
        </div>

        <!-- Recebimento - Conferência em lote (oculto para level 1 e 4) -->
        <div
          v-if="
            showConferenciaLotePage &&
            user &&
            Number(user.level_access) !== 1 &&
            Number(user.level_access) !== 4
          "
          class="content-area content-area-conferencia-lote"
        >
          <ConferenciaLotePage @notification="addNotification" />
        </div>
        <!-- Recebimento - Status por clientes (oculto para level 1) -->
        <div
          v-if="
            showStatusPorClientesPage && user && Number(user.level_access) !== 1
          "
          class="content-area content-area-status-por-clientes"
        >
          <StatusPorClientesPage
            ref="statusPorClientesRef"
            @notification="addNotification"
            @navigate-to-agenda="handleNavigateToAgenda"
          />
        </div>
        <!-- Recebimento - API (nível 0 ou cli_access com CNPJ 62941819000100) - v-if evita 403 ao montar para usuários sem acesso -->
        <div
          v-if="showApiPage && user && canAccessApiPage"
          class="content-area content-area-api"
        >
          <ApiPage />
        </div>
        <!-- WTJ e Auto-status: só montar para nível 0 (evita 403 ao montar para outros níveis) -->
        <div
          v-if="showWtjPage && user && Number(user.level_access) === 0"
          class="content-area content-area-wtj"
        >
          <WtjPage />
        </div>
        <div
          v-if="showAutoStatusPage && user && Number(user.level_access) === 0"
          class="content-area content-area-auto-status"
        >
          <AutoStatusPage />
        </div>
        <div
          v-if="showStatusPage && user && Number(user.level_access) === 0"
          class="content-area content-area-status"
        >
          <StatusPage />
        </div>
        <!-- Rejeições - dev, clientes (nível 1: API filtra por cli_access) e gerentes -->
        <div
          v-if="
            showRejeicoesPage &&
            user &&
            [0, 1, 2, 3].includes(Number(user.level_access))
          "
          class="content-area content-area-rejeicoes"
        >
          <RejeicoesPage />
        </div>
        <div
          v-if="
            showConfigRejeicoesPage && user && Number(user.level_access) === 0
          "
          class="content-area content-area-config-rejeicoes"
        >
          <ConfigRejeicoesPage @notification="addNotification" />
        </div>
        <div
          v-if="
            showConfigPedidosPage && user && Number(user.level_access) === 0
          "
          class="content-area content-area-config-pedidos"
          style="min-height: 500px; background: #f1f5f9"
        >
          <ConfigPedidosPage @notification="addNotification" />
        </div>
        <div
          v-if="
            showDevWhatsappDiretoriaPage &&
            user &&
            Number(user.level_access) === 0
          "
          class="content-area content-area-dev-whatsapp-diretoria"
          style="background: #f1f5f9"
        >
          <DevWhatsappDiretoriaPage @notification="addNotification" />
        </div>
        <!-- Grupo Oscar - nível 0 ou cli_access com CNPJ 62941819000100 - v-if evita requisição 403 ao montar para usuários sem acesso -->
        <div
          v-if="showGrupoOscarPage && user && canAccessApiPage"
          class="content-area content-area-grupo-oscar"
        >
          <GrupoOscarPage :user="user" @notification="addNotification" />
        </div>

        <div v-if="showCargaDescargaInformacoesGeraisPage" class="content-area">
          <CargaDescargaInformacoesGeraisPage
            :user="user"
            @notification="addNotification"
          />
        </div>

        <div v-if="showCargaDescargaAgendamentosPage" class="content-area">
          <CargaDescargaAgendamentosPage
            :user="user"
            @notification="addNotification"
          />
        </div>
        <div
          v-if="showFaturasListaPage && user && canAccessFaturasPage"
          class="content-area"
        >
          <FaturasLista :user="user" />
        </div>
        <div
          v-if="
            showFinanceiroSolicitacoesPage &&
            user &&
            canAccessFinanceiroSolicitacoesPage
          "
          class="content-area"
        >
          <FinanceiroSolicitacoes />
        </div>
      </main>
    </div>

    <!-- Preloading Indicator -->
    <div
      v-if="preloadingProgress > 0 && preloadingProgress < 100"
      class="preloading-indicator"
    >
      <div class="preload-content">
        <div class="preload-icon">
          <i class="fas fa-rocket"></i>
        </div>
        <div class="preload-text">Preparando páginas...</div>
        <div class="preload-progress">
          <div
            class="progress-bar"
            :style="{ width: preloadingProgress + '%' }"
          ></div>
        </div>
        <div class="preload-percentage">{{ preloadingProgress }}%</div>
      </div>
    </div>

    <!-- Global Notifications -->
    <NotificationsComponent
      :notifications="notifications"
      @close="removeNotification"
    >
    </NotificationsComponent>

    <!-- Modal de informações da NF-e - instância única global (aberto via store de qualquer página) -->
    <NfeInfoModal
      :nfe-data="nfeInfoModalSchedule"
      :show-modal="nfeInfoModalShow"
      :user="user"
      @close="closeInfoModal"
      @edit="openEditModal"
      @mark-tratativa="handleMarkSingleAsTratativa"
      @change-status="handleChangeStatusFromTratativa"
      @reprocess-success="handleReprocessSuccess"
      @reprocess-toast="handleReprocessToast"
      @show-success-toast="addNotification"
      @show-error-toast="addNotification"
      @schedule-updated="handleScheduleDataUpdated"
      @refresh-nfe="handleRefreshNfeForDev"
    />

    <!-- Diálogos do sistema (confirm/alert) - centralizados no layout -->
    <SystemDialog />
  </div>
</template>

<script>
import SidebarComponent from './components/SidebarComponent.vue'
import NewsCarousel from './components/NewsCarousel.vue'
import RecentActivities from './components/RecentActivities.vue'
import PendingDeliveries from './components/PendingDeliveries.vue'
import NotificationsComponent from './components/NotificationsComponent.vue'
import SchedulesList from './components/SchedulesList.vue'
import NfeInfoModal from './components/NfeInfoModal.vue'
import ScheduleEditModal from './components/ScheduleEditModal.vue'
import ScheduleBookingModal from './components/ScheduleBookingModal.vue'
import ScheduleRejectionModal from './components/ScheduleRejectionModal.vue'
import ScheduleCreationModal from './components/ScheduleCreationModal.vue'
import CorpemTxtGenerator from './components/CorpemTxtGenerator.vue'
import SettingsPage from './views/SettingsPage.vue'
import XmlUploadPage from './views/XmlUploadPage.vue'
import ProductsPage from './views/ProductsPage.vue'
import AdminPage from './views/AdminPage.vue'
import SystemPage from './views/SystemPage.vue'
import ManagementPage from './views/ManagementPage.vue'
import HelpPage from './views/HelpPage.vue'
import VersionPage from './views/VersionPage.vue'
import CreateExpeditionPage from './views/CreateExpeditionPage.vue'
import ExpeditionsPage from './views/ExpeditionsPage.vue'
import ExpeditionHistoryPage from './views/ExpeditionHistoryPage.vue'
import NoteExchangePage from './views/NoteExchangePage.vue'
import BIPage from './views/BIPage.vue'
import BIDiretoriaPage from './views/BIDiretoriaPage.vue'
import BIPainelPage from './views/BIPainelPage.vue'
import BIAgendamentosPage from './views/BIAgendamentosPage.vue'
import BIMovimentacaoClientesPage from './views/BIMovimentacaoClientesPage.vue'
import BIAdministradoresPage from './views/BIAdministradoresPage.vue'
import BIGroupLinkGerencialPage from './views/BIGroupLinkGerencialPage.vue'
import { scheduleMovimentacaoWarmPrefetch } from './services/biMovimentacaoWarmCache.js'
import { canAccessBiGroupLinkGerencial } from './utils/biGroupLinkAccess.js'
import { canAccessBiAdministradores } from './utils/biAdministradoresAccess.js'
import {
  isBiDiretoriaPortalOnlyUser,
  isBiArmazensPortalOnlyUser,
  canAccessBiArmazensAnalise,
} from './utils/biDiretoriaPortalAccess.js'
import DashboardPage from './views/DashboardPage.vue'
import RecebimentoAgendaPage from './views/RecebimentoAgendaPage.vue'
import RecebimentoHistoricoPage from './views/RecebimentoHistoricoPage.vue'
import ReagendamentoMassaPage from './views/ReagendamentoMassaPage.vue'
import ConferenciaLotePage from './views/ConferenciaLotePage.vue'
import StatusPorClientesPage from './views/StatusPorClientesPage.vue'
import {
  ensureStatusConfigCache,
  getStatusDisplayInfo,
  getStatusFromCache,
} from './utils/statusConfigCache.js'
import { formatEntityDisplayName } from './utils/formatDisplayName.js'
import { useNfeInfoModalStore } from './stores/nfeInfoModal.js'

// Status nativos que podem ser selecionados; status criados na página Status são permitidos via cache
const ALLOWED_SELECTABLE_STATUSES = [
  'Solicitado',
  'Contestado',
  'Cancelar',
  'Recusar',
  'Agendado',
  'Conferência',
  'Recebido',
  'Tratativa',
  'Em estoque',
  'Estoque',
  'Marcação',
  'Não agendado',
]
import ApiPage from './views/ApiPage.vue'
import MarketingPage from './views/MarketingPage.vue'
import ArmazensPage from './views/ArmazensPage.vue'
import LevantamentoCustosOperacionaisPage from './views/LevantamentoCustosOperacionaisPage.vue'
import LevantamentoValoresAdminPage from './views/LevantamentoValoresAdminPage.vue'
import DiaristasPage from './views/DiaristasPage.vue'
import WtjPage from './views/WtjPage.vue'
import AutoStatusPage from './views/AutoStatusPage.vue'
import StatusPage from './views/StatusPage.vue'
import RejeicoesPage from './views/RejeicoesPage.vue'
import ConfigRejeicoesPage from './views/ConfigRejeicoesPage.vue'
import ConfigPedidosPage from './views/ConfigPedidosPage.vue'
import DevWhatsappDiretoriaPage from './views/DevWhatsappDiretoriaPage.vue'
import GrupoOscarPage from './views/GrupoOscarPage.vue'
import CargaDescargaAgendamentosPage from './views/CargaDescargaAgendamentosPage.vue'
import CargaDescargaInformacoesGeraisPage from './views/CargaDescargaInformacoesGeraisPage.vue'
import FaturasLista from './views/FaturasLista.vue'
import FinanceiroSolicitacoes from './views/FinanceiroSolicitacoes.vue'
import SystemDialog from './components/SystemDialog.vue'
import { checkPermission, checkUserLevel } from './utils/permissions.js'
import { BASE_URL } from './config/api.js'
import apiService from './services/api.js'
import axios from 'axios'
import ExcelJS from 'exceljs'

// Função que inicializa o sistema de permissões
function initializePermissions() {
  // Sistema de permissões inicializado silenciosamente
}

// Usar o apiClient global já otimizado com cache (importado de main.js)
const apiClient =
  window.apiClient ||
  new (class VueApiClientFallback {
    constructor() {
      this.baseURL = BASE_URL
      this.token = localStorage.getItem('token')
    }

    async request(endpoint, options = {}) {
      const token = localStorage.getItem('token')

      const config = {
        baseURL: this.baseURL,
        timeout: options.timeout ?? 60000,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      }

      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
      }

      try {
        const response = await axios({
          ...config,
          url: endpoint,
        })
        return response.data
      } catch (error) {
        if (error.response?.status === 401) {
          console.warn(
            '🔐 [APICLIENT] Token inválido ou expirado detectado - Status 401'
          )

          // Limpar completamente os dados de autenticação
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('userPermissions')
          localStorage.removeItem('userLevel')
          // localStorage.removeItem('rememberedUser'); // Removido - funcionalidade descontinuada
          sessionStorage.clear()

          console.log('🧹 [APICLIENT] Dados de autenticação limpos')

          // Redirecionar para login apenas se não estivermos já na página de login
          if (
            !window.location.pathname.includes('/login.html') &&
            !window.location.pathname.includes('/login')
          ) {
            console.log('🔄 [APICLIENT] Redirecionando para página de login...')

            // Adicionar delay mínimo para garantir que os dados foram limpos
            setTimeout(() => {
              window.location.href = '/login.html'
            }, 100)

            return // Evitar que o erro seja propagado após redirecionamento
          }

          throw new Error(
            'Token inválido ou expirado - Redirecionando para login'
          )
        }
        throw error
      }
    }

    async getDashboardStats() {
      return {
        pendingDeliveries: 7,
        processing: 23,
        completedToday: 156,
        divergences: 2,
      }
    }

    async getRecentActivities() {
      return [
        {
          id: 1,
          type: 'received',
          title: 'Produto em Conferência',
          description: 'Smartphone Samsung Galaxy - Código: 4587956321',
          time: '15 minutos atrás',
          status: 'success',
        },
        {
          id: 2,
          type: 'pending',
          title: 'Aguardando Conferência',
          description: 'Lote de Notebooks Dell - Pedido: PED-789654',
          time: '1 hora atrás',
          status: 'warning',
        },
        {
          id: 3,
          type: 'divergence',
          title: 'Divergência Detectada',
          description: 'Diferença na quantidade - Produto: MON-4578123',
          time: '2 horas atrás',
          status: 'danger',
        },
      ]
    }

    async getPendingDeliveries() {
      return [
        {
          id: 1,
          nfe: '35240414200166000182550010000134151123456789',
          supplier: 'TechCorp Ltda',
          volumes: '15 volumes',
          scheduledDate: '14/07/2025',
          warehouse: 'Estoque Principal',
          status: 'scheduled',
        },
        {
          id: 2,
          nfe: '35240414200166000182550010000134152234567890',
          supplier: 'SmartPhone Inc',
          volumes: '8 volumes',
          scheduledDate: '14/07/2025',
          warehouse: 'Estoque Eletrônicos',
          status: 'on_way',
        },
        {
          id: 3,
          nfe: '35240414200166000182550010000134153345678901',
          supplier: 'Office Solutions',
          volumes: '20 volumes',
          scheduledDate: '15/07/2025',
          warehouse: 'Estoque Periféricos',
          status: 'scheduled',
        },
        {
          id: 4,
          nfe: '35240414200166000182550010000134154456789012',
          supplier: 'Industrial Corp',
          volumes: '5 volumes',
          scheduledDate: '15/07/2025',
          warehouse: 'Estoque Industrial',
          status: 'processing',
        },
      ]
    }

    async getSchedules(params = {}) {
      return this.request('/schedules', { params })
    }

    async createSchedule(data) {
      return this.request('/schedules', {
        method: 'POST',
        data,
      })
    }

    async updateScheduleStatus(id, status, comment) {
      return this.request(`/schedules/${id}/status`, {
        method: 'PATCH',
        data: {
          status,
          historic_entry: {
            user: this.getCurrentUser()?.user || 'system',
            action: `Status alterado para ${status}`,
            comment,
          },
        },
      })
    }

    async createScheduleWithProducts(nfe_data) {
      return this.request('/schedules/create-with-products', {
        method: 'POST',
        data: { nfe_data },
      })
    }

    // User Settings endpoints
    async getUserSettings() {
      return this.request('/user-settings')
    }

    async updateUserSettings(settings) {
      return this.request('/user-settings', {
        method: 'PUT',
        data: settings,
      })
    }

    async updateEmailSettings(emailSettings) {
      return this.request('/user-settings/email', {
        method: 'PATCH',
        data: { emailSettings },
      })
    }

    async updateUISettings(uiSettings) {
      return this.request('/user-settings/ui', {
        method: 'PATCH',
        data: { uiSettings },
      })
    }

    async testEmailSettings() {
      return this.request('/user-settings/test-email', {
        method: 'POST',
      })
    }

    async resetUserSettings() {
      return this.request('/user-settings', {
        method: 'DELETE',
      })
    }

    // User Profile endpoints
    async updateProfile(profileData) {
      return this.request('/user/profile', {
        method: 'PUT',
        data: profileData,
      })
    }

    async changePassword(passwordData) {
      console.log('🔐 Tentando alterar senha:', passwordData)
      const token =
        localStorage.getItem('token') || localStorage.getItem('authToken')

      return this.request('/users/profile/me', {
        method: 'PUT',
        data: passwordData,
      })
    }

    getCurrentUser() {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    }

    // Buscar dados atualizados do usuário do banco de dados
    async fetchCurrentUser() {
      try {
        const response = await this.request('/users/profile/me', {
          method: 'GET',
        })
        if (response && response.user) {
          // Atualizar localStorage com dados atualizados
          localStorage.setItem('user', JSON.stringify(response.user))
          console.log(
            '✅ [fetchCurrentUser] Dados do usuário atualizados do banco de dados'
          )
          return response.user
        }
        return null
      } catch (error) {
        const isAborted =
          error?.code === 'ERR_CANCELED' ||
          error?.message?.toLowerCase?.().includes('aborted')
        if (!isAborted) {
          console.error(
            '❌ [fetchCurrentUser] Erro ao buscar dados do usuário:',
            error
          )
        }
        return null
      }
    }
  })()

// Manter compatibilidade para componentes filhos
if (!window.apiClient) {
  window.apiClient = apiClient
}

export default {
  name: 'App',
  components: {
    SidebarComponent,
    NewsCarousel,
    RecentActivities,
    PendingDeliveries,
    NotificationsComponent,
    SchedulesList,
    NfeInfoModal,
    ScheduleEditModal,
    ScheduleBookingModal,
    ScheduleRejectionModal,
    ScheduleCreationModal,
    CorpemTxtGenerator,
    SettingsPage,
    XmlUploadPage,
    ProductsPage,
    AdminPage,
    SystemPage,
    ManagementPage,
    HelpPage,
    VersionPage,
    CreateExpeditionPage,
    ExpeditionsPage,
    ExpeditionHistoryPage,
    NoteExchangePage,
    BIPage,
    BIDiretoriaPage,
    BIPainelPage,
    BIAgendamentosPage,
    BIMovimentacaoClientesPage,
    BIAdministradoresPage,
    BIGroupLinkGerencialPage,
    DashboardPage,
    RecebimentoAgendaPage,
    RecebimentoHistoricoPage,
    ReagendamentoMassaPage,
    ConferenciaLotePage,
    StatusPorClientesPage,
    ApiPage,
    MarketingPage,
    ArmazensPage,
    LevantamentoCustosOperacionaisPage,
    LevantamentoValoresAdminPage,
    DiaristasPage,
    WtjPage,
    AutoStatusPage,
    StatusPage,
    RejeicoesPage,
    ConfigRejeicoesPage,
    ConfigPedidosPage,
    DevWhatsappDiretoriaPage,
    GrupoOscarPage,
    CargaDescargaAgendamentosPage,
    CargaDescargaInformacoesGeraisPage,
    FaturasLista,
    FinanceiroSolicitacoes,
    SystemDialog,
  },

  data() {
    return {
      loading: true,
      loadingMessage: 'Carregando...',
      loadingSubtext: 'Por favor, aguarde um momento',
      filterLoading: false, // Loading específico para filtros
      pendingFilterNavigation: false, // Flag para navegação programática com filtros pré-aplicados
      isNavigating: false, // Trava de navegação: impede trocas rápidas enquanto uma página carrega
      navigationTimeout: null, // Timeout de segurança para liberar a trava de navegação
      user: null,
      userCliAccessCount: 0, // Propriedade reativa para forçar reavaliação de shouldShowClientFilter
      activeMenu: 'dashboard',

      // Controle de responsividade mobile
      isMobile: false,
      windowWidth: 0,
      isSidebarOpen: false,
      isSidebarCollapsed: false,
      hoverSidebarExpanded: false, // sidebar expandida ao passar o mouse (desktop recolhida)
      mobileFiltersOpen: false, // Controle para dropdown de filtros em mobile
      // Posição de scroll salva ao travar o body em mobile (para evitar "pulo" ao abrir/fechar sidebar)
      scrollLockPosition: null,

      showDashboardPage: false, // Usado apenas para Solicitação de Agendamento (lista de agendamentos)
      showSchedulesList: false, // Usado apenas para Histórico de Agendamentos
      showExportDropdown: false, // Dropdown de opções de exportação Excel
      exportingExcel: false, // Loading durante requisição de exportação
      showSettingsPage: false,
      showXmlUploadPage: false,
      showProductsPage: false,
      showAdminPage: false,
      adminTabToShow: 'users', // Controla qual aba do AdminPage mostrar
      showSystemPage: false,
      showManagementPage: false,
      managementTabToShow: 'loads', // Controla qual aba do ManagementPage mostrar
      showHelpPage: false,
      showVersionPage: false,
      showMarketingPage: false,
      showArmazensPage: false,
      showLevantamentoCustosOperacionaisPage: false,
      showLevantamentoValoresAdminPage: false,
      showCreateExpeditionPage: false,
      showExpeditionsPage: false,
      showExpeditionHistoryPage: false,
      showNoteExchangePage: false,
      showBIPage: false,
      showNewDashboardPage: true, // Nova view de Dashboard (página inicial)
      showRecebimentoAgendaPage: false,
      showRecebimentoHistoricoPage: false,
      showReagendamentoMassaPage: false,
      showConferenciaLotePage: false,
      showStatusPorClientesPage: false,
      showApiPage: false,
      showDiaristasPage: false,
      showWtjPage: false,
      showAutoStatusPage: false,
      showStatusPage: false,
      showRejeicoesPage: false,
      showConfigRejeicoesPage: false,
      showConfigPedidosPage: false,
      showDevWhatsappDiretoriaPage: false,
      showGrupoOscarPage: false,
      showCargaDescargaAgendamentosPage: false,
      showCargaDescargaInformacoesGeraisPage: false,
      showFaturasListaPage: false,
      showFinanceiroSolicitacoesPage: false,

      // Modal de alteração de status em lote (Solicitação de agendamentos)
      showStatusModal: false,
      statusConfigList: [],
      statusConfigLoading: false,

      // Contagem de cargas para badge
      userRefreshInterval: null,

      // Supplier tooltip
      supplierTooltip: {
        visible: false,
        supplier: '',
        carrier: '',
        top: 0,
        left: 0,
        isDelayed: false,
      },

      // Pre-loading control
      pagesPreloaded: false,
      preloadingProgress: 0,

      dashboardStats: {
        pendingDeliveries: 0,
        processing: 0,
        completedToday: 0,
        divergences: 0,
      },
      statsLoading: false,

      recentActivities: [],
      activitiesLoading: false,

      pendingDeliveries: [],
      deliveriesLoading: false,

      notifications: [],
      schedules: [],
      selectedSchedules: [],
      newDate: '',
      rescheduleDate: '',
      bulkActionLoading: false,

      // Top bar properties
      showUserDropdown: false,

      // Search
      mainSearchInput: '',

      // Filtros
      todayFilterActive: false, // Flag para controlar o filtro "Hoje"
      currentFilters: {
        status: '',
        date_from: '',
        date_to: '',
      },
      showEditModal: false,
      showBookingModal: false,
      showRejectionModal: false,
      showEffectivateModal: false,
      bookingToEffectivate: null,
      scheduleToEdit: null,

      // Filtro de cliente
      showClientFilterModal: false,
      selectedFilterClient: null,
      availableFilterClients: [],
      filteredFilterClients: [],
      loadingFilterClients: false,
      clientFilterSearchQuery: '',
      // Paginação removida - carregar todos os dados de uma vez
      loadingMore: false, // Manter para compatibilidade com template

      // Dados de clientes carregados globalmente
      availableClientsGlobal: [],

      // Ordenação de colunas
      sortColumn: null, // 'client' ou 'date'
      sortDirection: 'asc', // 'asc' ou 'desc'
      clientsLoadingGlobal: false,

      // Controle de busca
      isSearchActive: false,
      currentSearchInfo: null,
      originalSchedules: [],

      // Paginação da página Principal
      currentPage: 1,
      itemsPerPage: 50,
      itemsPerPageOptions: [50, 100, 200, 300, 'Todos'],
      totalItems: 0,
    }
  },
  computed: {
    nfeInfoModalShow() {
      return useNfeInfoModalStore().show
    },
    nfeInfoModalSchedule() {
      return useNfeInfoModalStore().schedule
    },
    // Total de páginas
    totalPages() {
      return Math.ceil(this.totalItems / this.itemsPerPage)
    },

    /**
     * Calcula as páginas visíveis para exibição na paginação
     * Padrão: 5 páginas visíveis com reticências quando necessário
     * Exemplos:
     * - Página 1:  [<]{1}[2][3][4][5][...][>]
     * - Página 7:  [<][...][5][6]{7}[8][9][...][>]
     * - Página 10 (última): [<][...][6][7][8][9]{10}[>]
     */
    visiblePages() {
      const current = this.currentPage
      const total = this.totalPages
      const maxVisible = 5

      // Se total de páginas <= 5, mostrar todas
      if (total <= maxVisible) {
        return Array.from({ length: total }, (_, i) => i + 1)
      }

      // Calcular range de páginas visíveis
      let start, end

      if (current <= 3) {
        // Páginas iniciais: 1 2 3 4 5 ... última
        start = 1
        end = maxVisible
      } else if (current >= total - 2) {
        // Páginas finais: primeira ... (total-4) (total-3) (total-2) (total-1) total
        start = total - maxVisible + 1
        end = total
      } else {
        // Páginas do meio: primeira ... (current-1) current (current+1) ... última
        start = current - 2
        end = current + 2
      }

      const pages = []
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      return pages
    },

    /**
     * Verifica se deve mostrar reticências à esquerda
     */
    showLeftEllipsis() {
      return this.totalPages > 5 && this.currentPage > 3
    },

    /**
     * Verifica se deve mostrar reticências à direita
     */
    showRightEllipsis() {
      return this.totalPages > 5 && this.currentPage < this.totalPages - 2
    },

    // Para página Principal, não usar paginação visual - já vem do backend
    paginatedSchedules() {
      // Retornar a lista já filtrada diretamente (backend já pagina)
      return this.displayedSchedules
    },

    // Verifica se há algum agendamento com valor na coluna 'oc'
    hasOcColumn() {
      if (!Array.isArray(this.paginatedSchedules)) return false
      return this.paginatedSchedules.some(
        schedule => schedule.oc && schedule.oc.trim() !== ''
      )
    },

    /** Faturas (hub cobrancas): apenas nível 0 (dev) — não liberado para clientes */
    canAccessFaturasPage() {
      if (!this.user) return false
      return Number(this.user.level_access) === 0
    },

    /** Solicitações financeiras: apenas nível 0. */
    canAccessFinanceiroSolicitacoesPage() {
      if (!this.user) return false
      return Number(this.user.level_access) === 0
    },

    // Página API: nível 0 ou usuário com CNPJ 62941819000100 no cli_access
    canAccessApiPage() {
      if (!this.user) return false
      if (Number(this.user.level_access) === 0) return true
      let cli = this.user.cli_access
      if (!cli) return false
      if (typeof cli === 'string') {
        try {
          const t = cli.trim()
          if (!t || t === '{}' || t === 'null') return false
          cli = JSON.parse(t)
        } catch (e) {
          return false
        }
      }
      if (!cli || typeof cli !== 'object') return false
      const cnpjApi = '62941819000100'
      return Object.keys(cli).some(
        key => String(key).replace(/\D/g, '') === cnpjApi
      )
    },

    displayedSchedules() {
      if (!Array.isArray(this.schedules)) return []

      // 🔍 LOG DIAGNÓSTICO: Estado inicial
      console.log('🔍 [CONTADOR] === INÍCIO displayedSchedules ===')
      console.log(
        `🔍 [CONTADOR] Total de agendamentos brutos: ${this.schedules.length}`
      )
      console.log(`🔍 [CONTADOR] Modo de busca ativo: ${this.isSearchActive}`)

      let filtered = [...this.schedules]

      // Se não estivermos em modo de busca ativa, filtrar status ocultos
      if (!this.isSearchActive) {
        const hiddenStatuses = [
          'Em estoque',
          'Estoque',
          'Recusado',
          'Cancelado',
        ]
        const beforeHiddenFilter = filtered.length
        filtered = filtered.filter(
          schedule => !hiddenStatuses.includes(schedule.status)
        )
        const removedByHidden = beforeHiddenFilter - filtered.length
        console.log(
          `🔍 [CONTADOR] Filtrados por status oculto: ${removedByHidden} agendamentos`
        )
        console.log(
          `🔍 [CONTADOR] Após filtro de status oculto: ${filtered.length} agendamentos`
        )
      }

      // IMPORTANTE: Não aplicar filtros do usuário durante busca ativa
      // Isso garante que todos os resultados da busca sejam exibidos
      if (!this.isSearchActive) {
        // Aplicar filtros do usuário apenas quando não estiver em modo de busca
        if (this.currentFilters.status) {
          filtered = filtered.filter(
            schedule => schedule.status === this.currentFilters.status
          )
        }

        if (this.currentFilters.date_from) {
          filtered = filtered.filter(schedule => {
            if (!schedule.date) return false

            // Normalizar datas para comparação apenas por dia (sem considerar horário)
            const scheduleDate = new Date(schedule.date)
            const fromDate = new Date(this.currentFilters.date_from)

            // Zerar horário para comparação apenas de data
            scheduleDate.setHours(0, 0, 0, 0)
            fromDate.setHours(0, 0, 0, 0)

            return scheduleDate >= fromDate
          })
        }

        if (this.currentFilters.date_to) {
          filtered = filtered.filter(schedule => {
            if (!schedule.date) return false

            // Normalizar datas para comparação apenas por dia (sem considerar horário)
            const scheduleDate = new Date(schedule.date)
            const toDate = new Date(this.currentFilters.date_to)

            // Zerar horário para comparação apenas de data
            scheduleDate.setHours(0, 0, 0, 0)
            toDate.setHours(23, 59, 59, 999) // Final do dia para 'date_to'

            return scheduleDate <= toDate
          })
        }

        // Filtro por cliente agora é feito no backend - não precisa filtrar localmente
        // O backend já retorna apenas os agendamentos do cliente selecionado
      }

      // Aplicar ordenação se houver coluna selecionada
      if (this.sortColumn) {
        filtered = [...filtered].sort((a, b) => {
          let compareResult = 0

          if (this.sortColumn === 'client') {
            // Ordenação por nome do cliente (alfabética)
            const clientA = (a.client || '').toLowerCase()
            const clientB = (b.client || '').toLowerCase()
            compareResult = clientA.localeCompare(clientB)
          } else if (this.sortColumn === 'date') {
            // Ordenação por data de entrega
            const dateA = new Date(a.date || 0)
            const dateB = new Date(b.date || 0)
            compareResult = dateA - dateB
          }

          // Inverter resultado se ordem for descendente
          return this.sortDirection === 'asc' ? compareResult : -compareResult
        })
      }

      // 🔍 LOG DIAGNÓSTICO: Resultado final
      console.log(`🔍 [CONTADOR] === FIM displayedSchedules ===`)
      console.log(
        `🔍 [CONTADOR] Total FINAL de agendamentos exibidos: ${filtered.length}`
      )
      console.log(`🔍 [CONTADOR] Filtros ativos:`, {
        status: this.currentFilters.status || 'nenhum',
        date_from: this.currentFilters.date_from || 'nenhuma',
        date_to: this.currentFilters.date_to || 'nenhuma',
        cliente: this.selectedFilterClient
          ? this.selectedFilterClient.name
          : 'nenhum',
        ordenacao: this.sortColumn || 'nenhuma',
      })

      return filtered
    },
    selectedScheduleStatuses() {
      const selected = (this.schedules || []).filter(s =>
        (this.selectedSchedules || []).includes(s.id)
      )
      return [...new Set(selected.map(s => s.status))]
    },

    // true quando a seleção inclui algum status criado na página Status (apenas botão Status deve aparecer)
    selectionHasCustomStatus() {
      if (
        !this.selectedScheduleStatuses ||
        this.selectedScheduleStatuses.length === 0
      )
        return false
      return this.selectedScheduleStatuses.some(
        status =>
          getStatusFromCache(status) &&
          !ALLOWED_SELECTABLE_STATUSES.includes(status)
      )
    },

    areAllSelectedSolicitado() {
      if (this.selectedSchedules.length === 0) return false
      const selected = (this.schedules || []).filter(s =>
        (this.selectedSchedules || []).includes(s.id)
      )
      return selected.every(s => s.status === 'Solicitado')
    },

    areAllSelectedCrossdock() {
      if (this.selectedSchedules.length === 0) return false
      const selected = (this.schedules || []).filter(s =>
        (this.selectedSchedules || []).includes(s.id)
      )
      // Verificar se todos são crossdock (crossdock === 1 ou crossdock === '1')
      return selected.every(s => {
        const crossdockValue = s.crossdock
        return (
          crossdockValue === 1 ||
          crossdockValue === '1' ||
          crossdockValue === true
        )
      })
    },

    // Propriedades para seleção de checkbox master
    isAllSelected() {
      const selectableSchedules = this.displayedSchedules.filter(schedule =>
        this.canSelectSchedule(schedule)
      )
      return (
        selectableSchedules.length > 0 &&
        selectableSchedules.every(schedule =>
          this.selectedSchedules.includes(schedule.id)
        )
      )
    },

    isSomeSelected() {
      const selectableSchedules = this.displayedSchedules.filter(schedule =>
        this.canSelectSchedule(schedule)
      )
      const selectedCount = selectableSchedules.filter(schedule =>
        this.selectedSchedules.includes(schedule.id)
      ).length
      return selectedCount > 0 && selectedCount < selectableSchedules.length
    },
    cancelRequestedBy() {
      if (this.selectedSchedules.length === 0) return 'administrador'

      const selected = (this.schedules || []).filter(s =>
        (this.selectedSchedules || []).includes(s.id)
      )
      if (selected.length === 0) return 'administrador'

      const schedule = selected[0]
      if (!schedule.historic) return 'administrador'

      // Procurar no histórico por uma entrada de cancelamento
      const historicEntries = Object.values(schedule.historic)
      const cancelEntry = historicEntries.find(
        entry =>
          (entry.action && entry.action.includes('Cancelar')) ||
          (entry.action && entry.action.includes('cancelamento'))
      )

      return cancelEntry && cancelEntry.user
        ? cancelEntry.user
        : 'administrador'
    },
    canBulkManage() {
      return (
        (this.selectedSchedules || []).length > 0 &&
        this.selectedScheduleStatuses.length === 1
      )
    },

    userLevel() {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return null
        const user = JSON.parse(userData)
        return user.level_access
      } catch (error) {
        return null
      }
    },

    /** SLA / Rejeições / Análise Armazéns. Diretoria usa `BIDiretoriaPage`. */
    biPageSubTab() {
      if (this.activeMenu === 'bi-rejeicao') return 'rejeicao'
      if (this.activeMenu === 'bi-armazens' && this.user) {
        if (canAccessBiArmazensAnalise(this.user)) {
          return 'armazens'
        }
      }
      return 'sla'
    },
    today() {
      return new Date().toISOString().split('T')[0]
    },

    /**
     * Bloqueia janela noturna: entre 17:00 e 23:59 não é possível reagendar para amanhã.
     */
    rescheduleHourBlocked() {
      return new Date().getHours() >= 17
    },

    /**
     * Mínimo aceitável no input de reagendamento:
     *  - amanhã (offset 1) se hora atual < 17h
     *  - depois de amanhã (offset 2) se hora atual >= 17h
     * Usa componentes locais para evitar deslocamento de fuso ao formatar.
     */
    minRescheduleDate() {
      const now = new Date()
      const offset = this.rescheduleHourBlocked ? 2 : 1
      const target = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + offset
      )
      const yyyy = target.getFullYear()
      const mm = String(target.getMonth() + 1).padStart(2, '0')
      const dd = String(target.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    },

    statusOptions() {
      return [
        { value: '', label: 'Todos os status' },
        { value: 'Solicitado', label: 'Solicitado' },
        { value: 'Contestado', label: 'Contestado' },
        { value: 'Agendado', label: 'Agendado' },
        { value: 'Conferência', label: 'Em conferência' },
        { value: 'Tratativa', label: 'Em tratativa' },
        { value: 'Em estoque', label: 'Em estoque' },
        { value: 'Cancelar', label: 'Cancelar' },
        { value: 'Cancelado', label: 'Cancelado' },
        { value: 'Recusado', label: 'Recusado' },
        { value: 'Marcação', label: 'Marcação' },
      ]
    },

    hasActiveFilters() {
      return (
        Object.values(this.currentFilters).some(
          value => value && value.toString().trim() !== ''
        ) || this.selectedFilterClient
      )
    },

    shouldShowClientFilter() {
      try {
        // IMPORTANTE: Acessar this.user diretamente para garantir que o Vue rastreie a dependência
        // O Vue detectará automaticamente mudanças em this.user e reavaliará esta computed property
        const user = this.user

        // Debug: Logar o valor atual para verificar se está sendo chamado
        console.log(
          '🔍 [shouldShowClientFilter] Computed property chamada - user:',
          {
            exists: !!user,
            id: user?.id,
            level_access: user?.level_access,
            cli_access_keys:
              user?.cli_access && typeof user.cli_access === 'object'
                ? Object.keys(user.cli_access)
                : null,
            cli_access_count:
              user?.cli_access && typeof user.cli_access === 'object'
                ? Object.keys(user.cli_access).length
                : 0,
          }
        )

        // Se this.user não estiver disponível, buscar do localStorage como fallback
        if (!user) {
          const userDataFromStorage = localStorage.getItem('user')
          if (userDataFromStorage) {
            try {
              const parsedUser = JSON.parse(userDataFromStorage)
              // Parse cli_access se for string
              if (
                parsedUser.cli_access &&
                typeof parsedUser.cli_access === 'string'
              ) {
                const trimmed = parsedUser.cli_access.trim()
                if (
                  trimmed &&
                  trimmed !== '{}' &&
                  trimmed !== 'null' &&
                  trimmed !== 'undefined'
                ) {
                  try {
                    parsedUser.cli_access = JSON.parse(trimmed)
                  } catch (e) {
                    console.warn(
                      '⚠️ [shouldShowClientFilter] Erro ao parsear cli_access do storage:',
                      e
                    )
                  }
                }
              }
              // Usar o usuário do storage temporariamente
              const finalUser = parsedUser

              console.log(
                '🔍 [shouldShowClientFilter] Usando usuário do storage (this.user não disponível):',
                {
                  level_access: finalUser?.level_access,
                  cliAccessCount:
                    finalUser?.cli_access &&
                    typeof finalUser.cli_access === 'object'
                      ? Object.keys(finalUser.cli_access).length
                      : 0,
                }
              )

              // Usuários nível 0 sempre veem o filtro
              if (finalUser && finalUser.level_access === 0) {
                return true
              }

              // Verificar quantos estoques
              if (
                !finalUser ||
                !finalUser.cli_access ||
                typeof finalUser.cli_access !== 'object' ||
                Object.keys(finalUser.cli_access).length === 0
              ) {
                return true // Sem cli_access ou vazio = acesso total
              }

              const estoquesCount = Object.keys(finalUser.cli_access).length
              return estoquesCount > 1
            } catch (e) {
              console.error(
                '❌ [shouldShowClientFilter] Erro ao parsear user do storage:',
                e
              )
              return false
            }
          }
          return false
        }

        console.log(
          '🔍 [shouldShowClientFilter] Verificando visibilidade do filtro:',
          {
            hasUser: !!user,
            level_access: user?.level_access,
            hasCliAccess: !!user?.cli_access,
            cliAccessType: typeof user?.cli_access,
            cliAccessKeys:
              user?.cli_access && typeof user.cli_access === 'object'
                ? Object.keys(user.cli_access)
                : null,
            cliAccessCount:
              user?.cli_access && typeof user.cli_access === 'object'
                ? Object.keys(user.cli_access).length
                : typeof user?.cli_access === 'string'
                  ? 'string'
                  : 0,
          }
        )

        // Usuários nível 0 sempre veem o filtro (podem ter múltiplos estoques)
        if (user && user.level_access === 0) {
          console.log(
            '✅ [shouldShowClientFilter] Usuário nível 0 - mostrando filtro'
          )
          return true
        }

        // Se não tem usuário, não mostrar
        if (!user) {
          console.log(
            '❌ [shouldShowClientFilter] Sem usuário - ocultando filtro'
          )
          return false
        }

        // Verificar quantos estoques o usuário tem acesso
        if (
          !user.cli_access ||
          user.cli_access === '' ||
          user.cli_access === '{}' ||
          user.cli_access === null ||
          user.cli_access === undefined
        ) {
          // Sem cli_access significa acesso total, então pode ter múltiplos estoques
          console.log(
            '✅ [shouldShowClientFilter] Sem cli_access ou vazio - mostrando filtro (acesso total)'
          )
          return true
        }

        let cliAccess = user.cli_access

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
              '✅ [shouldShowClientFilter] cli_access é string vazia/inválida - mostrando filtro'
            )
            return true
          }
          try {
            cliAccess = JSON.parse(trimmed)
            console.log(
              '📦 [shouldShowClientFilter] cli_access parseado:',
              cliAccess
            )
          } catch (e) {
            console.warn(
              '⚠️ [shouldShowClientFilter] Erro ao parsear cli_access:',
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
            '✅ [shouldShowClientFilter] cli_access vazio/inválido após parse - mostrando filtro'
          )
          return true
        }

        // Se tem apenas 1 estoque no cli_access, ocultar o filtro
        const estoquesCount = Object.keys(cliAccess).length
        console.log(
          `🔢 [shouldShowClientFilter] Estoque(s) no cli_access: ${estoquesCount}`,
          Object.keys(cliAccess)
        )
        const shouldShow = estoquesCount > 1

        // Atualizar propriedade reativa para garantir que o Vue detecte a mudança
        if (this.userCliAccessCount !== estoquesCount) {
          this.userCliAccessCount = estoquesCount
        }

        console.log(
          `${shouldShow ? '✅' : '❌'} [shouldShowClientFilter] ${shouldShow ? 'Mostrando' : 'Ocultando'} filtro (${estoquesCount} estoque(s))`
        )
        return shouldShow
      } catch (error) {
        console.error(
          '❌ [shouldShowClientFilter] Erro ao verificar filtro:',
          error
        )
        return true // Em caso de erro, mostrar o filtro por segurança
      }
    },

    hasCreatePermission() {
      const currentUser = this.user
      return (
        currentUser &&
        currentUser.level_access !== undefined &&
        currentUser.level_access >= 0
      )
    },

    canCreateBooking() {
      const currentUser = this.user
      return (
        currentUser &&
        currentUser.level_access !== undefined &&
        currentUser.level_access >= 0
      )
    },

    canCreateRejection() {
      const currentUser = this.user
      return (
        currentUser &&
        currentUser.level_access !== undefined &&
        currentUser.level_access >= 0
      )
    },

    // Verificar se pode efetivar marcação ou não agendado (fazer upgrade)
    canEffectivateBooking() {
      // Só mostrar quando exatamente 1 agendamento está selecionado
      if (this.selectedSchedules.length !== 1) {
        return false
      }

      // Buscar o agendamento selecionado
      const selectedId = this.selectedSchedules[0]
      const schedule = this.schedules.find(s => s.id === selectedId)

      if (!schedule) {
        return false
      }

      // Converter para número; fallback quando is_booking não vem da API (ex.: busca schedule-verification)
      const isBookingNum = Number(schedule.is_booking)
      const isBookingByInfo = schedule.info?.type === 'booking'
      const isNotScheduledByInfo =
        schedule.info?.type === 'not_scheduled' ||
        schedule.supplier === 'NFe sem agendamento prévio'
      const effectiveIsBooking = !Number.isNaN(isBookingNum)
        ? isBookingNum
        : isBookingByInfo
          ? 1
          : isNotScheduledByInfo
            ? 2
            : 0

      console.log('🔍 [canEffectivateBooking] Debug:', {
        id: schedule.id,
        status: schedule.status,
        is_booking: schedule.is_booking,
        effectiveIsBooking,
      })

      // Só para agendamentos de marcação (is_booking = 1) ou não agendados (is_booking = 2)
      if (effectiveIsBooking !== 1 && effectiveIsBooking !== 2) {
        console.log(
          '❌ [canEffectivateBooking] effectiveIsBooking não é 1 nem 2:',
          effectiveIsBooking
        )
        return false
      }

      // Todos os usuários autenticados podem efetivar marcações e não agendados
      if (!this.user) {
        return false
      }

      console.log('✅ [canEffectivateBooking] Pode efetivar!')
      return true
    },
  },
  watch: {
    // Watcher para garantir que shouldShowClientFilter seja reavaliado quando user mudar
    user: {
      handler(newUser, oldUser) {
        if (
          newUser &&
          isBiDiretoriaPortalOnlyUser(newUser) &&
          this.activeMenu !== 'bi-diretoria'
        ) {
          this.$nextTick(() => {
            this.handleMenuClick('bi-diretoria')
          })
          return
        }
        if (
          newUser &&
          isBiArmazensPortalOnlyUser(newUser) &&
          this.activeMenu !== 'bi-armazens'
        ) {
          this.$nextTick(() => {
            this.handleMenuClick('bi-armazens')
          })
          return
        }
        if (
          newUser &&
          this.activeMenu === 'bi-painel' &&
          Number(newUser.level_access) !== 0
        ) {
          this.$nextTick(() => {
            this.handleMenuClick('bi')
          })
        }
        if (
          newUser &&
          this.activeMenu === 'bi-agendamentos' &&
          [1, 2].includes(Number(newUser.level_access))
        ) {
          this.$nextTick(() => {
            this.handleMenuClick('bi')
          })
        }
        if (
          newUser &&
          this.activeMenu === 'bi-movimentacao-clientes' &&
          Number(newUser.level_access) !== 0
        ) {
          this.$nextTick(() => {
            this.handleMenuClick('bi')
          })
        }
        if (
          newUser &&
          this.activeMenu === 'bi-administradores' &&
          !canAccessBiAdministradores(newUser)
        ) {
          this.$nextTick(() => {
            this.handleMenuClick('bi')
          })
        }
        if (
          newUser &&
          this.activeMenu === 'bi-grouplink-gerencial' &&
          !canAccessBiGroupLinkGerencial(newUser)
        ) {
          this.$nextTick(() => {
            this.handleMenuClick('bi')
          })
        }
        if (
          newUser &&
          oldUser &&
          JSON.stringify(newUser.cli_access) !==
            JSON.stringify(oldUser.cli_access)
        ) {
          console.log(
            '🔄 [WATCHER] user.cli_access mudou - forçando reavaliação de shouldShowClientFilter'
          )
          this.$nextTick(() => {
            this.$forceUpdate()
          })
        }
      },
      deep: true,
      immediate: false,
    },
    // Watcher para validar e limpar datas inválidas automaticamente
    'currentFilters.date_from': {
      handler(newValue) {
        if (newValue && !this.isValidDate(newValue)) {
          console.log(
            '⚠️ [WATCHER] Data "de" inválida detectada - limpando:',
            newValue
          )
          this.$nextTick(() => {
            this.currentFilters.date_from = ''
          })
        }
      },
      immediate: false,
    },
    'currentFilters.date_to': {
      handler(newValue) {
        if (newValue && !this.isValidDate(newValue)) {
          console.log(
            '⚠️ [WATCHER] Data "até" inválida detectada - limpando:',
            newValue
          )
          this.$nextTick(() => {
            this.currentFilters.date_to = ''
          })
        }
      },
      immediate: false,
    },
  },

  methods: {
    isBiDiretoriaPortalOnlyUser,
    isBiArmazensPortalOnlyUser,
    canAccessBiArmazensAnalise,
    canAccessBiGroupLinkGerencial,
    canAccessBiAdministradores,
    // ============= MÉTODOS DE PAGINAÇÃO =============
    async goToPage(page) {
      if (page < 1 || page > this.totalPages) return
      this.currentPage = page
      console.log(`📄 Navegando para página ${page} de ${this.totalPages}`)

      // Recarregar dados da nova página
      await this.loadSchedules()

      // Scroll para o topo da lista
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.goToPage(this.currentPage + 1)
      }
    },

    previousPage() {
      if (this.currentPage > 1) {
        this.goToPage(this.currentPage - 1)
      }
    },

    goToFirstPage() {
      this.goToPage(1)
    },

    goToLastPage() {
      this.goToPage(this.totalPages)
    },

    // Alterar quantidade de itens por página
    async changeItemsPerPage(value) {
      const newValue = value === 'Todos' ? 99999 : parseInt(value, 10)

      if (this.itemsPerPage === newValue) {
        return // Sem alteração
      }

      console.log(
        `📊 Alterando itens por página: ${this.itemsPerPage} → ${newValue}`
      )

      this.itemsPerPage = newValue
      this.currentPage = 1 // Resetar para primeira página

      // Salvar preferência no localStorage (apenas se diferente de 50)
      if (newValue !== 50) {
        localStorage.setItem(
          'agenda_itemsPerPage',
          value === 'Todos' ? 'Todos' : newValue.toString()
        )
        console.log(
          '💾 Preferência de itens por página salva no localStorage:',
          value
        )
      } else {
        // Se voltar para 50, remover do localStorage
        localStorage.removeItem('agenda_itemsPerPage')
        console.log(
          '🗑️ Preferência de itens por página removida do localStorage (valor padrão)'
        )
      }

      // Recarregar dados com nova quantidade
      await this.loadSchedules()
    },

    // Carregar preferência de itens por página do localStorage
    loadItemsPerPagePreference() {
      const savedValue = localStorage.getItem('agenda_itemsPerPage')
      if (savedValue) {
        if (savedValue === 'Todos') {
          this.itemsPerPage = 99999
          console.log(
            '📂 Preferência carregada do localStorage: Todos os itens'
          )
        } else {
          const numValue = parseInt(savedValue, 10)
          if (this.itemsPerPageOptions.includes(numValue)) {
            this.itemsPerPage = numValue
            console.log(
              `📂 Preferência carregada do localStorage: ${numValue} itens por página`
            )
          }
        }
      }
    },

    // Obter o valor selecionado para o dropdown
    getSelectedItemsPerPage() {
      if (this.itemsPerPage === 99999) {
        return 'Todos'
      }
      return this.itemsPerPage
    },

    // ============= EXPORTAÇÃO EXCEL =============
    toggleExportDropdown(event) {
      event.stopPropagation()
      this.showExportDropdown = !this.showExportDropdown
    },

    closeExportDropdown() {
      this.showExportDropdown = false
    },

    handleClickOutsideExportDropdown(event) {
      const dropdown = document.querySelector('.export-dropdown')
      if (dropdown && !dropdown.contains(event.target)) {
        this.showExportDropdown = false
      }
    },

    async exportToExcel(formato = 'mercocamp') {
      // Fechar dropdown se estiver aberto
      this.showExportDropdown = false
      this.exportingExcel = true
      try {
        // Usar filtros da lista quando estamos na página de agendamentos (SchedulesList visível),
        // para que a exportação use exatamente os filtros ativos na tela
        const listRef = this.showSchedulesList && this.$refs.schedulesListRef
        const filters = listRef
          ? {
              status: listRef.currentFilters?.status ?? '',
              date_from: listRef.currentFilters?.date_from ?? '',
              date_to: listRef.currentFilters?.date_to ?? '',
              show_all: 'true', // Exportação sempre inclui todos os status
              selectedClient: listRef.selectedFilterClient,
              searchActive: listRef.isSearchActive,
              searchInput: listRef.searchInput,
              searchInfo: listRef.currentSearchInfo,
            }
          : {
              status: this.currentFilters.status || '',
              date_from: this.currentFilters.date_from || '',
              date_to: this.currentFilters.date_to || '',
              show_all: 'true', // Exportação sempre inclui todos os status
              selectedClient: this.selectedFilterClient,
              searchActive: this.isSearchActive,
              searchInput: this.mainSearchInput,
              searchInfo: this.currentSearchInfo,
            }

        const params = {
          status: filters.status || '',
          date_from: filters.date_from || '',
          date_to: filters.date_to || '',
          show_all: filters.show_all,
        }
        if (filters.selectedClient && filters.selectedClient.cnpj) {
          params.client = String(filters.selectedClient.cnpj).replace(
            /[^\d]/g,
            ''
          )
        }
        if (
          filters.searchActive &&
          filters.searchInput &&
          filters.searchInput.trim()
        ) {
          params.query = filters.searchInput.trim()
        }

        this.addNotification(
          'Exportando todos os agendamentos (conforme filtros)...',
          'info'
        )
        const response = await window.apiClient.request('/schedules/export', {
          method: 'GET',
          params,
        })
        const schedules = response?.schedules || []

        if (!schedules.length) {
          this.addNotification('Não há agendamentos para exportar', 'warning')
          return
        }

        console.log(
          `📊 Exportando ${schedules.length} agendamentos para Excel (formato: ${formato})...`
        )

        // Mapeamento de cores de status (cores de fundo e texto)
        const statusColors = {
          Solicitado: { bg: 'FFFFF3CD', text: 'FF856404' },
          Cancelar: { bg: 'FFFFF3CD', text: 'FF856404' },
          Agendado: { bg: 'FFCCE5FF', text: 'FF004085' },
          Conferência: { bg: 'FFD4EDDA', text: 'FF155724' },
          'Em conferência': { bg: 'FFD4EDDA', text: 'FF155724' },
          Recebido: { bg: 'FFD4EDDA', text: 'FF155724' },
          'Em estoque': { bg: 'FFD4EDDA', text: 'FF155724' },
          Estoque: { bg: 'FFD4EDDA', text: 'FF155724' },
          Tratativa: { bg: 'FFF8D7DA', text: 'FF721C24' },
          'Em tratativa': { bg: 'FFF8D7DA', text: 'FF721C24' },
          Recusar: { bg: 'FFF8D7DA', text: 'FF721C24' },
          Recusado: { bg: 'FFD6D6D6', text: 'FF1B1E21' },
          Cancelado: { bg: 'FFE2E3E5', text: 'FF383D41' },
          Contestado: { bg: 'FF8B1538', text: 'FFFFFFFF' },
          Marcação: { bg: 'FFF3E5F5', text: 'FF7B1FA2' },
          'Não agendado': { bg: 'FFE0F7FA', text: 'FF006064' },
        }

        // Obter e-mail do usuário (prioridade: config.emailSettings.primaryEmail > username)
        let userEmail = 'E-mail não identificado'
        if (this.user) {
          // Tentar obter email de config.emailSettings.primaryEmail
          if (this.user.config) {
            try {
              const config =
                typeof this.user.config === 'string'
                  ? JSON.parse(this.user.config)
                  : this.user.config
              if (config?.emailSettings?.primaryEmail) {
                userEmail = config.emailSettings.primaryEmail
              }
            } catch (e) {
              console.warn('Erro ao parsear config do usuário:', e)
            }
          }
          // Fallback para username se não encontrou email
          if (userEmail === 'E-mail não identificado') {
            userEmail =
              this.user.user ||
              this.user.username ||
              this.user.name ||
              'E-mail não identificado'
          }
        }

        // Obter data e hora atual formatada
        const now = new Date()
        const dataHoraCriacao = now.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })

        // Determinar se usa formato cliente (Fornecedor/Transportadora) ou mercocamp (Cliente/Solicitação)
        const useClienteFormat = formato === 'cliente' || this.userLevel === 1

        // Obter informações de filtros aplicados (valores usados na exportação = filtros na planilha)
        const filtrosAplicados = []

        filtrosAplicados.push(`Status: ${filters.status || 'Todos'}`)
        filtrosAplicados.push(
          `Data de: ${filters.date_from ? this.formatDateShort(filters.date_from) : 'Início'}`
        )
        filtrosAplicados.push(
          `Data até: ${filters.date_to ? this.formatDateShort(filters.date_to) : 'Sempre'}`
        )

        let clienteEstoqueValue = 'Todos'
        if (filters.selectedClient) {
          clienteEstoqueValue = filters.selectedClient.name
        } else if (
          this.user?.cli_access &&
          typeof this.user.cli_access === 'object'
        ) {
          const cliAccessKeys = Object.keys(this.user.cli_access)
          if (cliAccessKeys.length === 1) {
            const unicoCliente = this.user.cli_access[cliAccessKeys[0]]
            clienteEstoqueValue =
              unicoCliente?.nome || unicoCliente?.name || cliAccessKeys[0]
          }
        }

        if (useClienteFormat) {
          filtrosAplicados.push(`Estoque: ${clienteEstoqueValue}`)
        } else {
          filtrosAplicados.push(`Cliente: ${clienteEstoqueValue}`)
        }

        // Filtros opcionais (só aparecem quando ativos)
        if (this.todayFilterActive) {
          filtrosAplicados.push('Apenas hoje')
        }
        if (filters.searchActive && filters.searchInfo) {
          filtrosAplicados.push(`Busca: ${filters.searchInfo.value}`)
        }

        // Coluna OC: exibir se algum agendamento exportado tiver OC
        const hasOcInExport = schedules.some(
          s => s.oc && String(s.oc).trim() !== ''
        )

        // Definir cabeçalhos das colunas da tabela baseado no formato
        const tableHeaders = ['N° NF-e', 'Chave NF']
        if (hasOcInExport) {
          tableHeaders.push('OC')
        }
        if (useClienteFormat) {
          tableHeaders.push('Fornecedor', 'Transportadora')
        } else {
          tableHeaders.push('Cliente', 'Solicitação')
        }
        tableHeaders.push('Entrega', 'Volumes', 'Status')

        // Índice da coluna de status (última coluna)
        const statusColIndex = tableHeaders.length

        // Preparar dados para exportação (incluindo status original)
        const dataRows = schedules.map(schedule => {
          const row = [schedule.number || '', schedule.nfe_key || '']

          if (hasOcInExport) {
            row.push(schedule.oc || '-')
          }

          if (useClienteFormat) {
            row.push(this.getSupplierLabel(schedule))
            row.push(this.getTransportadoraName(schedule) || '-')
          } else {
            row.push(schedule.client || '')
            row.push(this.formatDateShort(this.getRequestDate(schedule)))
          }

          row.push(
            (schedule.prevision ? '~ ' : '') +
              this.formatDateShort(schedule.date)
          )
          row.push(schedule.case_count || 0)
          row.push(this.getStatusBadge(schedule.status).label)

          return { data: row, status: schedule.status }
        })

        const numCols = tableHeaders.length

        // Criar workbook e worksheet com ExcelJS
        const workbook = new ExcelJS.Workbook()
        workbook.creator = 'Portal Mercocamp'
        workbook.created = now

        const worksheet = workbook.addWorksheet('Agendamentos', {
          properties: { defaultRowHeight: 18 },
        })

        // Estilo de borda padrão
        const thinBorder = { style: 'thin', color: { argb: 'FF1565C0' } }
        const mediumBorder = { style: 'medium', color: { argb: 'FF0D47A1' } }

        // ===== LINHA 1: TÍTULO =====
        worksheet.mergeCells(1, 1, 1, numCols)
        const titleCell = worksheet.getCell('A1')
        titleCell.value = 'RELATÓRIO DE AGENDAMENTOS'
        titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } }
        titleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0D47A1' },
        } // Azul escuro
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
        titleCell.border = {
          top: mediumBorder,
          left: mediumBorder,
          right: mediumBorder,
        }
        worksheet.getRow(1).height = 28

        // ===== LINHA 2: SUBTÍTULO =====
        worksheet.mergeCells(2, 1, 2, numCols)
        const subtitleCell = worksheet.getCell('A2')
        subtitleCell.value = 'Portal de Agendamento - Grupo Mercocamp'
        subtitleCell.font = {
          bold: true,
          size: 11,
          color: { argb: 'FFFFFFFF' },
        }
        subtitleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1976D2' },
        } // Azul médio
        subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
        subtitleCell.border = {
          left: mediumBorder,
          right: mediumBorder,
          bottom: thinBorder,
        }
        worksheet.getRow(2).height = 22

        // ===== LINHA 3: VAZIA =====
        worksheet.getRow(3).height = 10

        // Estilo de fundo azul claro para informações
        const lightBlueFill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE3F2FD' },
        }

        // ===== LINHA 4: FILTROS (cada filtro em uma célula separada) =====
        const row4 = worksheet.getRow(4)
        row4.getCell(1).value = 'Filtros:'
        row4.getCell(1).font = { bold: true, size: 10 }
        row4.getCell(1).fill = lightBlueFill
        row4.getCell(1).border = {
          left: thinBorder,
          top: thinBorder,
          bottom: thinBorder,
        }

        // Preencher cada filtro em uma célula separada (começando da coluna 2)
        if (filtrosAplicados.length > 0) {
          filtrosAplicados.forEach((filtro, index) => {
            const colIndex = index + 2 // Começa na coluna 2
            if (colIndex <= numCols) {
              row4.getCell(colIndex).value = filtro
              row4.getCell(colIndex).font = { size: 10 }
              row4.getCell(colIndex).fill = lightBlueFill
              row4.getCell(colIndex).border = {
                top: thinBorder,
                bottom: thinBorder,
                right: colIndex === numCols ? thinBorder : undefined,
              }
            }
          })
          // Preencher células vazias restantes com fundo e borda
          for (let i = filtrosAplicados.length + 2; i <= numCols; i++) {
            row4.getCell(i).fill = lightBlueFill
            row4.getCell(i).border = {
              top: thinBorder,
              bottom: thinBorder,
              right: i === numCols ? thinBorder : undefined,
            }
          }
        } else {
          row4.getCell(2).value = 'Nenhum'
          row4.getCell(2).font = { size: 10 }
          row4.getCell(2).fill = lightBlueFill
          row4.getCell(2).border = { top: thinBorder, bottom: thinBorder }
          // Preencher células vazias restantes
          for (let i = 3; i <= numCols; i++) {
            row4.getCell(i).fill = lightBlueFill
            row4.getCell(i).border = {
              top: thinBorder,
              bottom: thinBorder,
              right: i === numCols ? thinBorder : undefined,
            }
          }
        }

        // ===== LINHA 5: VAZIA =====
        worksheet.getRow(5).height = 10

        // ===== LINHA 6: CABEÇALHOS DA TABELA =====
        const headerRow = worksheet.getRow(6)
        tableHeaders.forEach((header, index) => {
          const cell = headerRow.getCell(index + 1)
          cell.value = header
          cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1976D2' },
          }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          cell.border = {
            top: mediumBorder,
            bottom: mediumBorder,
            left: thinBorder,
            right: thinBorder,
          }
        })
        headerRow.height = 22

        // Identificar colunas que devem ficar alinhadas à esquerda
        const leftAlignColumns = []
        tableHeaders.forEach((header, index) => {
          if (
            ['Fornecedor', 'Transportadora', 'Cliente', 'Solicitação'].includes(
              header
            )
          ) {
            leftAlignColumns.push(index)
          }
        })

        // ===== DADOS DA TABELA =====
        let currentRow = 7
        const lastDataRow = 7 + dataRows.length - 1
        dataRows.forEach((rowObj, rowIndex) => {
          const row = worksheet.getRow(currentRow)
          const isFirstRow = rowIndex === 0
          const isLastRow = rowIndex === dataRows.length - 1

          rowObj.data.forEach((value, colIndex) => {
            const cell = row.getCell(colIndex + 1)
            cell.value = value
            cell.font = { size: 10 }
            // Colunas de texto descritivo (Fornecedor, Transportadora, Cliente, Solicitação) ficam à esquerda
            const horizontalAlign = leftAlignColumns.includes(colIndex)
              ? 'left'
              : 'center'
            cell.alignment = { horizontal: horizontalAlign, vertical: 'middle' }

            // Bordas com contorno externo completo
            cell.border = {
              top: isFirstRow
                ? { style: 'hair', color: { argb: 'FFE0E0E0' } }
                : undefined,
              left:
                colIndex === 0
                  ? thinBorder
                  : { style: 'hair', color: { argb: 'FFE0E0E0' } },
              right:
                colIndex === numCols - 1
                  ? thinBorder
                  : { style: 'hair', color: { argb: 'FFE0E0E0' } },
              bottom: isLastRow
                ? mediumBorder
                : { style: 'hair', color: { argb: 'FFE0E0E0' } },
            }

            // Aplicar cor de status na célula de status
            if (colIndex + 1 === statusColIndex) {
              const statusColor = statusColors[rowObj.status] ||
                statusColors[value] || { bg: 'FFE2E3E5', text: 'FF383D41' }
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: statusColor.bg },
              }
              cell.font = {
                size: 10,
                color: { argb: statusColor.text },
                bold: true,
              }
            }
          })
          row.height = 18
          currentRow++
        })

        // ===== LINHA VAZIA ANTES DO RODAPÉ =====
        currentRow++

        // ===== RODAPÉ =====
        const footerStartRow = currentRow

        // Linha com texto do portal incluindo usuário e data
        worksheet.mergeCells(currentRow, 1, currentRow, numCols)
        const footerCell1 = worksheet.getCell(currentRow, 1)
        footerCell1.value = `Arquivo gerado pelo usuário ${userEmail} no dia ${dataHoraCriacao} pelo Portal de Agendamento do Grupo Mercocamp`
        footerCell1.font = {
          italic: true,
          size: 9,
          color: { argb: 'FF757575' },
        }
        footerCell1.alignment = { horizontal: 'center', vertical: 'middle' }
        footerCell1.border = {
          top: thinBorder,
          left: thinBorder,
          right: thinBorder,
        }
        worksheet.getRow(currentRow).height = 18
        currentRow++

        // Linha com link
        worksheet.mergeCells(currentRow, 1, currentRow, numCols)
        const footerCell2 = worksheet.getCell(currentRow, 1)
        footerCell2.value = {
          text: 'https://recebimento.mercocamptech.com.br/',
          hyperlink: 'https://recebimento.mercocamptech.com.br/',
        }
        footerCell2.font = {
          italic: true,
          size: 9,
          color: { argb: 'FF1976D2' },
          underline: true,
        }
        footerCell2.alignment = { horizontal: 'center', vertical: 'middle' }
        footerCell2.border = {
          left: thinBorder,
          right: thinBorder,
          bottom: thinBorder,
        }
        worksheet.getRow(currentRow).height = 18

        // ===== AJUSTAR LARGURA DAS COLUNAS =====
        tableHeaders.forEach((header, index) => {
          let maxLength = header.length
          dataRows.forEach(rowObj => {
            const cellValue = String(rowObj.data[index] || '')
            if (cellValue.length > maxLength) {
              maxLength = cellValue.length
            }
          })
          // Larguras mínimas (Chave NF = 44 dígitos)
          if (index === 0) maxLength = Math.max(maxLength, 15)
          if (index === 1) maxLength = Math.max(maxLength, 48) // Chave NF

          worksheet.getColumn(index + 1).width = Math.min(
            maxLength + 3,
            index === 1 ? 52 : 40
          )
        })

        // Colunas com larguras específicas
        if (numCols >= 3) {
          worksheet.getColumn(3).width = 28.44 // Coluna C
        }
        if (numCols >= 4) {
          worksheet.getColumn(4).width = 28.44 // Coluna D
        }
        if (numCols >= 5) {
          worksheet.getColumn(5).width = 13.56 // Coluna E
        }

        // ===== GERAR E BAIXAR ARQUIVO =====
        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })

        const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-')
        const fileName = `Agendamentos_portal_mercocamp_${dateStr}.xlsx`

        // Download usando link temporário
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.click()
        window.URL.revokeObjectURL(url)

        this.addNotification(
          `Exportados ${schedules.length} agendamentos (todos conforme filtros) para ${fileName}`,
          'success'
        )
        console.log(`✅ Exportação concluída: ${fileName}`)
      } catch (error) {
        console.error('❌ Erro ao exportar para Excel:', error)
        this.addNotification('Erro ao exportar para Excel', 'danger')
      } finally {
        this.exportingExcel = false
      }
    },

    // Buscar contagem de cargas para badge da sidebar
    // Métodos de ordenação de colunas
    sortByColumn(column) {
      // Se clicar na mesma coluna, inverter direção
      if (this.sortColumn === column) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
      } else {
        // Nova coluna, começar com ascendente
        this.sortColumn = column
        this.sortDirection = 'asc'
      }

      console.log(`📊 Ordenando por ${column} (${this.sortDirection})`)
    },

    /**
     * App nativo (Capacitor): WebView serve a página de uma origem local
     * (capacitor://localhost no iOS, https://localhost sem porta no Android).
     * Mesma heurística usada em src/config/api.js.
     */
    isCapacitorNative() {
      try {
        if (
          window.Capacitor &&
          typeof window.Capacitor.isNativePlatform === 'function' &&
          window.Capacitor.isNativePlatform()
        ) {
          return true
        }
        const { protocol, hostname, port } = window.location
        if (protocol === 'capacitor:') return true
        if (
          protocol === 'https:' &&
          (hostname === 'localhost' || hostname === '127.0.0.1') &&
          !port
        ) {
          return true
        }
        return false
      } catch (_) {
        return false
      }
    },

    // Métodos de responsividade móvel
    setupResizeListener() {
      const handleResize = () => {
        const wasMobile = this.isMobile

        this.windowWidth = window.innerWidth
        // No app nativo (Capacitor) força UX mobile independente do tamanho:
        // hamburger sempre visível + sidebar em overlay com texto+ícone.
        // Evita o ramo "tablet" que colapsa a sidebar a ícones em ~768-991px
        // (tela do Tab A8 caía exatamente nesse intervalo).
        const newIsMobile = this.isCapacitorNative() || this.windowWidth < 768
        this.isMobile = newIsMobile

        // Auto-configurar estado da sidebar baseado no tamanho da tela
        if (newIsMobile) {
          // Só forçar estado padrão quando estamos migrando de desktop/tablet para mobile
          if (!wasMobile) {
            this.isSidebarCollapsed = false // Em mobile, usa sistema de overlay
            this.isSidebarOpen = false // Fechada por padrão em mobile
          }

          // Em mobile, apenas garantir que o scroll do body está coerente com o estado atual
          this.updateBodyScroll()
        } else {
          this.isSidebarCollapsed = this.windowWidth < 992 // Colapsada em tablet
          this.isSidebarOpen = true // Sempre "aberta" em desktop/tablet
          // Restaurar scroll em desktop
          document.body.style.overflow = ''
          document.body.style.position = ''
          document.body.style.width = ''
          document.body.style.top = ''
        }
      }

      // Executar imediatamente
      handleResize()

      // Adicionar listener para mudanças
      window.addEventListener('resize', handleResize)

      // Retornar função de cleanup
      return () => window.removeEventListener('resize', handleResize)
    },

    toggleSidebar() {
      if (this.isMobile) {
        this.isSidebarOpen = !this.isSidebarOpen
        // Prevenir scroll do body quando sidebar estiver aberta em mobile
        this.updateBodyScroll()
      } else {
        // Em desktop/tablet, apenas alterna o collapse
        this.isSidebarCollapsed = !this.isSidebarCollapsed
      }
    },

    /**
     * Toggle do dropdown de filtros em mobile
     */
    toggleMobileFilters() {
      this.mobileFiltersOpen = !this.mobileFiltersOpen
    },

    closeSidebar() {
      if (this.isMobile) {
        this.isSidebarOpen = false
        this.updateBodyScroll()
      }
    },

    updateBodyScroll() {
      // Prevenir scroll do body quando sidebar estiver aberta em mobile
      if (this.isMobile && this.isSidebarOpen) {
        // Salvar posição atual de scroll apenas na primeira vez que travar
        if (this.scrollLockPosition === null) {
          const scrollY =
            window.pageYOffset ||
            document.documentElement.scrollTop ||
            document.body.scrollTop ||
            0
          this.scrollLockPosition = scrollY
          document.body.style.top = `-${scrollY}px`
        }

        document.body.style.overflow = 'hidden'
        // Prevenir scroll em iOS também
        document.body.style.position = 'fixed'
        document.body.style.width = '100%'
      } else {
        // GARANTIR ABSOLUTAMENTE que o scroll esteja habilitado quando não estiver em mobile com sidebar aberta
        // Remover TODOS os estilos inline que podem bloquear scroll
        document.body.style.overflow = ''
        document.body.style.overflowY = 'auto'
        document.body.style.overflowX = 'hidden'
        document.body.style.position = 'relative' // Usar relative ao invés de vazio
        document.body.style.width = ''
        document.body.style.top = ''
        document.body.style.height = ''
        // Garantir que o HTML também permita scroll
        document.documentElement.style.overflowY = 'auto'
        document.documentElement.style.overflowX = 'hidden'
        document.documentElement.style.position = ''
        // Restaurar posição de scroll quando destravar
        if (this.scrollLockPosition !== null) {
          const y = this.scrollLockPosition
          this.scrollLockPosition = null
          window.scrollTo(0, y)
        }
      }
    },

    // ANTI-DUPLICAÇÃO: Função para remover agendamentos duplicados baseado no ID único
    removeDuplicateSchedules(schedules, context = 'desconhecido') {
      if (!Array.isArray(schedules)) {
        console.warn(
          `⚠️ removeDuplicateSchedules [${context}]: entrada não é um array`
        )
        return []
      }

      // 🔍 LOG DIAGNÓSTICO: Contexto da deduplicação
      console.log(
        `🔍 [DEDUP] === INÍCIO removeDuplicateSchedules [${context}] ===`
      )
      console.log(
        `🔍 [DEDUP] Total de agendamentos recebidos: ${schedules.length}`
      )

      const seenIds = new Set()
      const uniqueSchedules = []
      const duplicateIds = []

      for (const schedule of schedules) {
        if (!schedule || !schedule.id) {
          console.warn(
            `⚠️ removeDuplicateSchedules [${context}]: agendamento sem ID encontrado`,
            schedule
          )
          continue
        }

        if (!seenIds.has(schedule.id)) {
          seenIds.add(schedule.id)
          uniqueSchedules.push(schedule)
        } else {
          duplicateIds.push(schedule.id)
          console.warn(
            `🔧 Duplicata removida [${context}]: Agendamento ID ${schedule.id} já existe`
          )
        }
      }

      const removedCount = schedules.length - uniqueSchedules.length
      if (removedCount > 0) {
        console.log(
          `✅ Deduplicação concluída [${context}]: ${removedCount} duplicata(s) removida(s)`
        )
        console.log(`🔍 [DEDUP] IDs duplicados removidos:`, duplicateIds)
      } else {
        console.log(
          `✅ Deduplicação concluída [${context}]: Nenhuma duplicata encontrada`
        )
      }

      console.log(
        `🔍 [DEDUP] Total de agendamentos únicos: ${uniqueSchedules.length}`
      )
      console.log(
        `🔍 [DEDUP] === FIM removeDuplicateSchedules [${context}] ===`
      )

      return uniqueSchedules
    },

    // Status Badge Auto-resize methods
    initStatusBadgeAutoResize() {
      // Observador para redimensionar automaticamente status badges
      const observerCallback = entries => {
        entries.forEach(entry => {
          const badge = entry.target
          const width = entry.contentRect.width
          const textLength = badge.textContent.trim().length

          // Remove classes existentes
          badge.classList.remove('auto-resize-small', 'auto-resize-tiny')

          // Lógica mais agressiva baseada na largura e texto
          const charWidth = width / textLength // Largura média por caractere

          if (charWidth < 6 || textLength > 15) {
            badge.classList.add('auto-resize-tiny')
          } else if (charWidth < 8 || textLength > 10) {
            badge.classList.add('auto-resize-small')
          }
        })
      }

      // Criar ResizeObserver para monitorar largura das badges
      const resizeObserver = new ResizeObserver(observerCallback)

      // Observar badges existentes
      const observeBadges = () => {
        document.querySelectorAll('.status-badge').forEach(badge => {
          resizeObserver.observe(badge)
        })
      }

      // Observar imediatamente
      observeBadges()

      // Observar novas badges que podem ser adicionadas dinamicamente
      const mutationObserver = new MutationObserver(() => {
        observeBadges()
      })

      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      })

      // Armazenar observers para limpeza
      this._badgeResizeObserver = resizeObserver
      this._badgeMutationObserver = mutationObserver
    },

    // Pre-loading methods
    async preloadPages() {
      if (this.pagesPreloaded) return

      console.log('🚀 Iniciando pré-carregamento das páginas...')
      this.preloadingProgress = 10

      try {
        // Aguardar um frame para garantir que os componentes foram montados
        await this.$nextTick()
        this.preloadingProgress = 30

        // Simular carregamento inicial das páginas
        await new Promise(resolve => setTimeout(resolve, 500))
        this.preloadingProgress = 60

        // Pré-carregar dados se necessário
        await new Promise(resolve => setTimeout(resolve, 300))
        this.preloadingProgress = 80

        await new Promise(resolve => setTimeout(resolve, 200))
        this.preloadingProgress = 100
        this.pagesPreloaded = true

        console.log('✅ Pré-carregamento concluído!')

        // Limpar progress após 1 segundo
        setTimeout(() => {
          this.preloadingProgress = 0
        }, 1000)
      } catch (error) {
        console.error('❌ Erro no pré-carregamento:', error)
        this.preloadingProgress = 0
      }
    },

    // Métodos de Loading Unificado
    setLoading(
      isLoading,
      message = 'Carregando...',
      subtext = 'Por favor, aguarde um momento'
    ) {
      this.loading = isLoading
      this.loadingMessage = message
      this.loadingSubtext = subtext
    },

    setBulkActionLoading(
      isLoading,
      message = 'Processando...',
      subtext = 'Aguarde enquanto processamos sua solicitação'
    ) {
      this.bulkActionLoading = isLoading
      this.loadingMessage = message
      this.loadingSubtext = subtext
    },

    // Método para lidar com loading do componente TXT
    handleTxtLoadingChange(loadingData) {
      console.log('App.vue - handleTxtLoadingChange called:', loadingData)
      this.setBulkActionLoading(
        loadingData.loading,
        loadingData.message,
        loadingData.detail
      )
    },

    // Top Bar Methods
    async handleMainSearch() {
      const input = this.mainSearchInput.trim()

      if (!input) {
        return
      }

      this.setLoading(true, 'Buscando...', 'Procurando agendamento')

      try {
        console.log(
          '🔍 Iniciando busca na página principal por NFe/chave:',
          input
        )

        const response = await apiService.post(
          '/schedule-verification/search',
          {
            input: input,
          }
        )

        console.log('✅ Resultados da busca:', response)

        if (response && response.success) {
          this.handleSearchResults({
            results: response.results,
            searchType: response.searchType,
            searchValue: response.searchValue,
          })

          // Limpar campo após busca bem-sucedida
          this.mainSearchInput = ''
          this.addNotification(
            `Encontrados ${response.results.length} agendamento(s)`,
            'success'
          )
        } else {
          const errorMsg = response?.message || 'Erro na busca'
          this.addNotification(errorMsg, 'error')
        }
      } catch (error) {
        console.error('❌ Erro na busca por NFe/chave:', error)

        let errorMessage = 'Erro ao buscar agendamento'
        if (error.response?.error) {
          errorMessage = error.response.error
        } else if (error.message) {
          errorMessage = error.message
        }

        this.addNotification(errorMessage, 'error')
      } finally {
        this.setLoading(false)
      }
    },

    toggleUserDropdown() {
      this.showUserDropdown = !this.showUserDropdown
    },

    handleClickOutside(event) {
      if (
        this.showUserDropdown &&
        this.$refs.userProfile &&
        !this.$refs.userProfile.contains(event.target)
      ) {
        this.showUserDropdown = false
      }
    },

    getUserInitial() {
      if (!this.user?.name) {
        return 'U'
      }
      return this.user.name.charAt(0).toUpperCase()
    },

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

      // Se o clique foi na área de texto, prevenir o comportamento padrão mas abrir calendário
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

    // Validação de data completa (formato YYYY-MM-DD)
    isValidDate(dateString) {
      if (!dateString) return false

      // Verificar se a data está no formato YYYY-MM-DD completo
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(dateString)) {
        return false
      }

      // Extrair o ano e verificar se tem 4 dígitos válidos (não apenas zeros à esquerda)
      const year = parseInt(dateString.substring(0, 4), 10)
      if (isNaN(year) || year < 1900 || year > 2100) {
        console.log('📅 Data rejeitada - ano inválido:', year)
        return false
      }

      // Verificar se é uma data válida
      const date = new Date(dateString)
      if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.log('📅 Data rejeitada - data inválida:', dateString)
        return false
      }

      // Verificar se o ano da data criada corresponde ao ano digitado
      // Isso previne casos como '0002-01-01' que seria interpretado como ano 2
      const dateYear = date.getFullYear()
      if (dateYear !== year) {
        console.log('📅 Data rejeitada - ano não corresponde:', {
          digitado: year,
          interpretado: dateYear,
        })
        return false
      }

      return true
    },

    // Handler específico para filtros de data
    async handleDateFilterChange() {
      console.log('📅 Filtro de data alterado:', {
        date_from: this.currentFilters.date_from,
        date_to: this.currentFilters.date_to,
        date_from_raw: this.currentFilters.date_from,
        date_to_raw: this.currentFilters.date_to,
      })

      // Limpar datas inválidas automaticamente
      if (
        this.currentFilters.date_from &&
        !this.isValidDate(this.currentFilters.date_from)
      ) {
        console.log(
          '⚠️ Data "de" inválida detectada - limpando:',
          this.currentFilters.date_from
        )
        this.currentFilters.date_from = ''
        return // Não fazer busca se a data foi limpa
      }

      if (
        this.currentFilters.date_to &&
        !this.isValidDate(this.currentFilters.date_to)
      ) {
        console.log(
          '⚠️ Data "até" inválida detectada - limpando:',
          this.currentFilters.date_to
        )
        this.currentFilters.date_to = ''
        return // Não fazer busca se a data foi limpa
      }

      // Validar se as datas estão completas antes de buscar
      const dateFromValid =
        !this.currentFilters.date_from ||
        this.isValidDate(this.currentFilters.date_from)
      const dateToValid =
        !this.currentFilters.date_to ||
        this.isValidDate(this.currentFilters.date_to)

      // Se alguma data foi preenchida mas não está completa, não fazer busca
      if (
        (this.currentFilters.date_from && !dateFromValid) ||
        (this.currentFilters.date_to && !dateToValid)
      ) {
        console.log(
          '⏸️ Data incompleta ou inválida detectada - aguardando preenchimento completo'
        )
        return
      }

      // Se ambas as datas estão vazias, não fazer busca
      if (!this.currentFilters.date_from && !this.currentFilters.date_to) {
        console.log('⏸️ Nenhuma data preenchida - não buscando')
        return
      }

      // Se chegou aqui, as datas estão válidas - fazer busca
      console.log('🔄 Datas válidas - recarregando dados do servidor')
      // Ativar loading de filtros
      this.filterLoading = true
      try {
        // Atualizar apenas a lista sem mostrar loading global
        await this.loadSchedules(false)
      } finally {
        // Desativar loading de filtros após um pequeno delay para suavizar a transição
        setTimeout(() => {
          this.filterLoading = false
        }, 300)
      }
    },

    // Filter methods
    async handleFilterChange() {
      console.log('Filtros alterados:', this.currentFilters)

      // Se houver filtros de data ou status, recarregar do servidor para garantir dados corretos
      const hasDateFilter =
        this.currentFilters.date_from || this.currentFilters.date_to
      const hasStatusFilter = this.currentFilters.status

      // Validar datas antes de buscar
      if (hasDateFilter) {
        const dateFromValid =
          !this.currentFilters.date_from ||
          this.isValidDate(this.currentFilters.date_from)
        const dateToValid =
          !this.currentFilters.date_to ||
          this.isValidDate(this.currentFilters.date_to)

        // Se alguma data foi preenchida mas não está completa, não fazer busca
        if (
          (this.currentFilters.date_from && !dateFromValid) ||
          (this.currentFilters.date_to && !dateToValid)
        ) {
          console.log(
            '⏸️ Data incompleta detectada - aguardando preenchimento completo'
          )
          return
        }
      }

      // Se houver filtro de cliente, também precisa recarregar do servidor
      const hasClientFilter =
        this.selectedFilterClient && this.selectedFilterClient.cnpj

      if (hasDateFilter || hasStatusFilter || hasClientFilter) {
        console.log('🔄 Filtro detectado - recarregando dados do servidor', {
          dateFilter: hasDateFilter,
          statusFilter: hasStatusFilter,
          clientFilter: hasClientFilter,
        })
        // Ativar loading de filtros
        this.filterLoading = true
        try {
          // Atualizar apenas a lista sem mostrar loading global
          await this.loadSchedules(false)
        } finally {
          // Desativar loading de filtros após um pequeno delay para suavizar a transição
          setTimeout(() => {
            this.filterLoading = false
          }, 300)
        }
      } else {
        // Sem filtros que requerem recarregamento do servidor
        this.$nextTick(() => {
          console.log('🔄 Sem filtros que requerem recarregamento do servidor')
        })
      }
    },

    // NOVA FUNCIONALIDADE: Função para limpar filtros sem recarregar dados
    clearAllFilters() {
      console.log('🧹 Limpando todos os filtros silenciosamente...')
      this.currentFilters = {
        status: '',
        date_from: '',
        date_to: '',
      }
      this.selectedFilterClient = null
      console.log('✅ Filtros limpos:', this.currentFilters)
    },

    async resetFilters() {
      console.log('🔄 Limpando filtros e atualizando lista...')

      // Desativar filtro "Hoje" se estiver ativo
      this.todayFilterActive = false

      // Resetar os filtros primeiro
      this.currentFilters = {
        status: '',
        date_from: '',
        date_to: '',
      }
      this.selectedFilterClient = null

      // Limpar o cache para forçar atualização completa
      if (window.apiClient && window.apiClient.clearCache) {
        window.apiClient.clearCache('/schedules')
        console.log('🗑️ Cache de agendamentos limpo')
      }

      // Ativar loading de filtros
      this.filterLoading = true

      try {
        // Se está na página de agendamentos, atualizar diretamente o SchedulesList
        if (this.showSchedulesList && this.$refs.schedulesListRef) {
          console.log('📄 Atualizando SchedulesList diretamente')
          this.$refs.schedulesListRef.resetData()
          await this.$refs.schedulesListRef.loadSchedules()
          this.addNotification('Filtros limpos e lista atualizada', 'success')
          return
        }

        // Para dashboard, atualizar apenas a lista sem mostrar loading global
        console.log('📊 Atualizando lista de agendamentos...')
        // Usar loadSchedules(false) para atualizar apenas a lista sem recarregar a página
        await this.loadSchedules(false)
        this.addNotification('Filtros limpos e lista atualizada', 'success')
      } finally {
        // Desativar loading de filtros após um pequeno delay para suavizar a transição
        setTimeout(() => {
          this.filterLoading = false
        }, 300)
      }
    },

    // Método para alternar o filtro "Hoje"
    async toggleTodayFilter() {
      if (this.todayFilterActive) {
        // Desativar filtro "Hoje" e limpar todos os filtros
        console.log('📅 Desativando filtro "Hoje" e limpando filtros...')
        this.todayFilterActive = false
        // resetFilters já atualiza apenas a lista
        await this.resetFilters()
      } else {
        // Ativar filtro "Hoje"
        console.log('📅 Ativando filtro "Hoje"...')
        this.todayFilterActive = true

        // Obter data atual no formato YYYY-MM-DD
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]

        // Limpar filtros existentes e aplicar filtro de hoje
        this.currentFilters = {
          status: '',
          date_from: todayStr,
          date_to: todayStr,
        }
        this.selectedFilterClient = null

        // Recarregar dados com o novo filtro (já atualiza apenas a lista)
        this.handleFilterChange()
      }
    },

    // FUNÇÃO SIMPLES - APENAS CARREGA DO LOCALSTORAGE
    loadUserFromStorage() {
      const userData = localStorage.getItem('user')
      if (!userData || userData === 'null' || userData === '{}') {
        this.user = this._getMinimalSafeUser()
        this.userCliAccessCount = 0
        return
      }
      try {
        let parsedUser = JSON.parse(userData)
        if (!parsedUser || typeof parsedUser !== 'object') {
          this.user = this._getMinimalSafeUser()
          this.userCliAccessCount = 0
          return
        }
        // Normalizar level_access (pode vir como string do backend)
        if (
          parsedUser.level_access != null &&
          typeof parsedUser.level_access !== 'number'
        ) {
          parsedUser.level_access = Number(parsedUser.level_access)
        }
        // Garantir cli_access sempre é objeto seguro
        if (
          !parsedUser.cli_access ||
          typeof parsedUser.cli_access !== 'object'
        ) {
          if (typeof parsedUser.cli_access === 'string') {
            try {
              parsedUser.cli_access = JSON.parse(parsedUser.cli_access) || {}
            } catch (_) {
              parsedUser.cli_access = {}
            }
          } else {
            parsedUser.cli_access = {}
          }
        }
        this.user = parsedUser
        this.userCliAccessCount = Object.keys(parsedUser.cli_access).length
      } catch (error) {
        console.error(
          '[loadUserFromStorage] Erro ao parsear dados do usuário:',
          error
        )
        this.user = this._getMinimalSafeUser()
        this.userCliAccessCount = 0
      }
    },
    _getMinimalSafeUser() {
      return {
        id: 0,
        name: 'Usuário',
        level_access: 1,
        cli_access: {},
      }
    },

    // Buscar dados atualizados do usuário do banco de dados
    async refreshUserFromDatabase() {
      if (this.user && Number(this.user.level_access) === 4) {
        console.log(
          '🔄 [refreshUserFromDatabase] Usuário nível 4 (Manutenção) - pulando atualização via API'
        )
        return null
      }
      try {
        console.log(
          '🔄 [refreshUserFromDatabase] Buscando dados atualizados do usuário...'
        )
        const response = await Promise.race([
          apiClient.request('/users/profile/me', {
            method: 'GET',
            timeout: 35000,
          }),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Timeout ao buscar dados do usuário')),
              35000
            )
          ),
        ])
        if (response && response.user) {
          let userData = { ...response.user }
          // Normalizar level_access (pode vir como string do backend)
          if (
            userData.level_access != null &&
            typeof userData.level_access !== 'number'
          ) {
            userData.level_access = Number(userData.level_access)
          }
          // Garantir cli_access sempre é objeto
          if (!userData.cli_access || typeof userData.cli_access !== 'object') {
            if (typeof userData.cli_access === 'string') {
              try {
                userData.cli_access = JSON.parse(userData.cli_access) || {}
              } catch (e) {
                console.warn(
                  '⚠️ [refreshUserFromDatabase] Erro ao parsear cli_access:',
                  e
                )
                userData.cli_access = {}
              }
            } else {
              userData.cli_access = {}
            }
          }

          // Atualizar localStorage com dados atualizados
          localStorage.setItem('user', JSON.stringify(userData))

          // Atualizar this.user de forma reativa
          // No Vue 3, precisamos garantir que a propriedade seja totalmente substituída
          // para que as computed properties sejam reavaliadas
          this.user = { ...userData }

          // Atualizar contador de cli_access para forçar reavaliação da computed property
          if (userData.cli_access && typeof userData.cli_access === 'object') {
            this.userCliAccessCount = Object.keys(userData.cli_access).length
          } else {
            this.userCliAccessCount = 0
          }

          // Forçar reavaliação das computed properties que dependem de this.user
          this.$nextTick(() => {
            // Garantir que o Vue detecte a mudança
            if (this.user && this.user.cli_access) {
              // Acessar a propriedade para garantir que o Vue rastreie a dependência
              const _ = this.user.cli_access
            }
          })

          console.log(
            '✅ [refreshUserFromDatabase] Dados do usuário atualizados:',
            {
              id: userData.id,
              level_access: userData.level_access,
              cli_access_count: userData.cli_access
                ? Object.keys(userData.cli_access).length
                : 0,
              cli_access_type: typeof userData.cli_access,
            }
          )
          return userData
        }
        return null
      } catch (error) {
        const isAborted =
          error?.code === 'ERR_CANCELED' ||
          error?.message?.toLowerCase?.().includes('aborted')
        if (!isAborted) {
          console.error(
            '❌ [refreshUserFromDatabase] Erro ao buscar dados do usuário:',
            error
          )
          if (error?.message?.includes('Timeout')) {
            console.warn(
              '⚠️ [refreshUserFromDatabase] Usando dados do localStorage devido ao timeout'
            )
          }
        }
        return null
      }
    },

    // Handler para quando a janela recebe foco (usuário volta para a aba)
    async handleWindowFocus() {
      const MIN_INTERVAL_MS = 5 * 60 * 1000 // 5 minutos entre refreshes por foco
      const now = Date.now()
      if (
        this._lastFocusRefreshTime &&
        now - this._lastFocusRefreshTime < MIN_INTERVAL_MS
      ) {
        return
      }
      this._lastFocusRefreshTime = now

      // Se o loading ainda está ativo há mais de 15s ao receber foco, algo travou
      if (this.loading && this._mountedStartTime && now - this._mountedStartTime > 15000) {
        console.warn('⚠️ [handleWindowFocus] Loading travado há mais de 15s — forçando limpeza e recarregamento')
        this.setLoading(false)
        this.loadInitialDataSimple()
        return
      }

      console.log(
        '🔄 [handleWindowFocus] Janela recebeu foco - atualizando dados do usuário...'
      )
      await this.refreshUserFromDatabase()
    },

    // Detecta quando a página fica visível novamente após estar em background
    _handleVisibilityForLoading() {
      if (document.visibilityState !== 'visible') return
      if (!this.loading || !this._mountedStartTime) return
      if (Date.now() - this._mountedStartTime > 15000) {
        console.warn('👁️ [visibilitychange] Página visível com loading travado (>15s) — forçando limpeza e recarregamento')
        this.setLoading(false)
        if (!this._mountedComplete) {
          this.loadInitialDataSimple()
        }
      }
    },

    async loadDashboardData() {
      console.log('🔄 Iniciando loadDashboardData...')
      console.log('📊 Estado antes de carregar:', {
        schedulesCount: this.schedules.length,
        showSchedulesList: this.showSchedulesList,
        // paginação removida
      })

      const promises = [
        this.loadStats(),
        this.loadRecentActivities(),
        this.loadPendingDeliveries(),
        this.loadSchedules(), // Adicionar carregamento dos agendamentos para a página principal
      ]
      try {
        await Promise.all(promises)
        console.log('✅ Dashboard carregado com sucesso!')
        console.log('📊 Estado após carregar dashboard:', {
          schedulesCount: this.schedules.length,
          showSchedulesList: this.showSchedulesList,
          // paginação removida
        })
      } catch (error) {
        console.error('❌ Erro ao carregar dashboard:', error)
        this.addNotification('Erro ao carregar dashboard', 'error')
      }
    },

    async loadStats() {
      this.statsLoading = true
      try {
        console.log('Buscando estatísticas...')
        // Usar os agendamentos já carregados em vez de fazer nova requisição
        const schedules = this.schedules || []

        this.dashboardStats = {
          solicitacoes: schedules.filter(s => s.status === 'Solicitado').length,
          agendamentos: schedules.filter(s => s.status === 'Agendado').length,
          conferencia: schedules.filter(
            s => s.status === 'Conferência' || s.status === 'Recebido'
          ).length,
          tratativa: schedules.filter(s => s.status === 'Tratativa').length,
        }
        console.log('Estatísticas carregadas:', this.dashboardStats)
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
        this.addNotification('Erro ao carregar estatísticas', 'error')
      } finally {
        this.statsLoading = false
      }
    },

    async loadRecentActivities() {
      this.activitiesLoading = true
      try {
        console.log('Buscando atividades recentes...')
        this.recentActivities = await apiClient.getRecentActivities()
        console.log('Atividades recentes carregadas:', this.recentActivities)
      } catch (error) {
        console.error('Erro ao carregar atividades:', error)
        this.addNotification('Erro ao carregar atividades recentes', 'error')
      } finally {
        this.activitiesLoading = false
      }
    },

    async loadPendingDeliveries() {
      this.deliveriesLoading = true
      try {
        console.log('Buscando entregas pendentes...')
        this.pendingDeliveries = await apiClient.getPendingDeliveries()
        console.log('Entregas pendentes carregadas:', this.pendingDeliveries)
      } catch (error) {
        console.error('Erro ao carregar entregas:', error)
        this.addNotification('Erro ao carregar entregas agendadas', 'error')
      } finally {
        this.deliveriesLoading = false
      }
    },

    async handleMenuClick(menuId, shouldScroll = false) {
      console.log('🔄 Menu clicado:', menuId, '- Saindo de:', this.activeMenu)

      if (!this.user) {
        console.warn('[handleMenuClick] Usuário ainda não carregado')
        return
      }

      // Trava de navegação: aguarda a página atual terminar de carregar
      if (this.isNavigating && menuId !== this.activeMenu) {
        console.warn(
          '[handleMenuClick] Navegação bloqueada: aguardando página atual carregar'
        )
        return
      }

      // Marcar início de navegação e configurar timeout de segurança (5s)
      this.isNavigating = true
      if (this.navigationTimeout) clearTimeout(this.navigationTimeout)
      this.navigationTimeout = setTimeout(() => {
        console.warn(
          '[handleMenuClick] Timeout de segurança: liberando trava de navegação'
        )
        this.isNavigating = false
      }, 5000)

      // Usuário nível 4 (Manutenção): apenas a página Diaristas é permitida
      if (
        Number(this.user.level_access) === 4 &&
        !isBiDiretoriaPortalOnlyUser(this.user) &&
        !isBiArmazensPortalOnlyUser(this.user) &&
        menuId !== 'diaristas'
      ) {
        this.addNotification(
          'Acesso restrito à área de Manutenção (Diaristas).',
          'info'
        )
        menuId = 'diaristas'
      }

      if (
        isBiDiretoriaPortalOnlyUser(this.user) &&
        menuId !== 'bi-diretoria'
      ) {
        this.addNotification(
          'Seu acesso é restrito ao BI Diretoria.',
          'error'
        )
        if (this.navigationTimeout) clearTimeout(this.navigationTimeout)
        this.navigationTimeout = null
        this.isNavigating = false
        return
      }

      if (
        isBiArmazensPortalOnlyUser(this.user) &&
        menuId !== 'bi-armazens'
      ) {
        this.addNotification(
          'Seu acesso é restrito à Análise Armazéns (BI).',
          'error'
        )
        if (this.navigationTimeout) clearTimeout(this.navigationTimeout)
        this.navigationTimeout = null
        this.isNavigating = false
        return
      }

      // Painel BI: apenas nível 0 (antes de alterar activeMenu, evita estado inconsistente)
      if (
        menuId === 'bi-painel' &&
        (!this.user || Number(this.user.level_access) !== 0)
      ) {
        this.addNotification(
          'Acesso restrito a desenvolvedores (nível 0).',
          'error'
        )
        if (this.navigationTimeout) clearTimeout(this.navigationTimeout)
        this.navigationTimeout = null
        this.isNavigating = false
        return
      }

      if (
        menuId === 'bi-grouplink-gerencial' &&
        (!this.user || !canAccessBiGroupLinkGerencial(this.user))
      ) {
        this.addNotification('Acesso restrito a este painel.', 'error')
        if (this.navigationTimeout) clearTimeout(this.navigationTimeout)
        this.navigationTimeout = null
        this.isNavigating = false
        return
      }

      // Movimentação de clientes (BI): apenas nível 0
      if (
        menuId === 'bi-movimentacao-clientes' &&
        (!this.user || Number(this.user.level_access) !== 0)
      ) {
        this.addNotification(
          'Acesso restrito a desenvolvedores (nível 0).',
          'error'
        )
        if (this.navigationTimeout) clearTimeout(this.navigationTimeout)
        this.navigationTimeout = null
        this.isNavigating = false
        return
      }

      // BI Administradores: níveis 0, 2 e 3 (escopo por cli_access no back-end)
      if (
        menuId === 'bi-administradores' &&
        (!this.user || !canAccessBiAdministradores(this.user))
      ) {
        this.addNotification(
          'Acesso não disponível para o seu perfil.',
          'error'
        )
        if (this.navigationTimeout) clearTimeout(this.navigationTimeout)
        this.navigationTimeout = null
        this.isNavigating = false
        return
      }

      // Fechar sidebar em mobile após seleção
      if (this.isMobile) {
        this.closeSidebar()
      }

      try {
        // Limpar bookingToEffectivate ao sair da página de criação de agendamentos
        if (
          this.activeMenu === 'agendamento-lote' &&
          menuId !== 'agendamento-lote' &&
          this.bookingToEffectivate
        ) {
          console.log(
            '🧹 Limpando bookingToEffectivate ao sair da página de criação'
          )
          this.bookingToEffectivate = null
        }

        // NOVA FUNCIONALIDADE: Limpar filtros ao sair das páginas 'Agendamentos' e 'Principal'
        if (
          this.activeMenu === 'dashboard' ||
          this.activeMenu === 'agendamento'
        ) {
          console.log('🧹 Limpando filtros ao sair da página:', this.activeMenu)
          console.log(
            '🧹 Filtros antes da limpeza:',
            JSON.stringify(this.currentFilters)
          )

          this.clearAllFilters()

          // Também limpar filtros do SchedulesList se existir
          if (
            this.$refs.schedulesListRef &&
            typeof this.$refs.schedulesListRef.clearFilters === 'function'
          ) {
            console.log('🧹 Limpando filtros do SchedulesList')
            this.$refs.schedulesListRef.clearFilters()
          } else {
            console.log(
              '⚠️ SchedulesList ref não encontrada ou função clearFilters não existe'
            )
          }

          console.log(
            '🧹 Filtros após limpeza:',
            JSON.stringify(this.currentFilters)
          )
        } else {
          console.log(
            'ℹ️ Menu anterior não requer limpeza de filtros:',
            this.activeMenu
          )
        }

        this.activeMenu = menuId
        this.showDashboardPage = false
        this.showSchedulesList = false
        this.showSettingsPage = false
        this.showXmlUploadPage = false
        this.showProductsPage = false
        this.showAdminPage = false
        this.showSystemPage = false
        this.showManagementPage = false
        this.showHelpPage = false
        this.showVersionPage = false
        this.showDiaristasPage = false
        this.showMarketingPage = false
        this.showArmazensPage = false
        this.showLevantamentoCustosOperacionaisPage = false
        this.showLevantamentoValoresAdminPage = false
        this.showCreateExpeditionPage = false
        this.showExpeditionsPage = false
        this.showExpeditionHistoryPage = false
        this.showNoteExchangePage = false
        this.showBIPage = false
        this.showNewDashboardPage = false
        this.showRecebimentoAgendaPage = false
        this.showRecebimentoHistoricoPage = false
        this.showReagendamentoMassaPage = false
        this.showConferenciaLotePage = false
        this.showStatusPorClientesPage = false
        this.showApiPage = false
        this.showWtjPage = false
        this.showAutoStatusPage = false
        this.showStatusPage = false
        this.showRejeicoesPage = false
        this.showConfigRejeicoesPage = false
        this.showConfigPedidosPage = false
        this.showDevWhatsappDiretoriaPage = false
        this.showGrupoOscarPage = false
        this.showCargaDescargaAgendamentosPage = false
        this.showCargaDescargaInformacoesGeraisPage = false
        this.showFaturasListaPage = false
        this.showFinanceiroSolicitacoesPage = false

        switch (menuId) {
          case 'bi':
            // Níveis 0, 1, 2 e 3 têm acesso ao BI (SLA)
            if (
              this.user &&
              [0, 1, 2, 3].includes(Number(this.user.level_access))
            ) {
              this.showBIPage = true
            } else {
              this.addNotification(
                'Você não tem permissão para acessar esta página.',
                'error'
              )
              return
            }
            break
          case 'bi-movimentacao-clientes':
            if (this.user && Number(this.user.level_access) === 0) {
              this.showBIPage = true
            } else {
              this.addNotification(
                'Acesso restrito a desenvolvedores (nível 0).',
                'error'
              )
              return
            }
            break
          case 'bi-rejeicao':
            // Apenas nível 0 (desenvolvedor) tem acesso ao dashboard de Rejeições no BI
            if (this.user && Number(this.user.level_access) === 0) {
              this.showBIPage = true
            } else {
              this.addNotification(
                'Acesso restrito a desenvolvedores (nível 0).',
                'error'
              )
              return
            }
            break
          case 'bi-armazens':
            if (this.user && canAccessBiArmazensAnalise(this.user)) {
              this.showBIPage = true
            } else {
              this.addNotification(
                'Acesso à Análise Armazéns não disponível para o seu perfil.',
                'error'
              )
              return
            }
            break
          case 'bi-diretoria':
            if (
              this.user &&
              (Number(this.user.level_access) === 0 ||
                isBiDiretoriaPortalOnlyUser(this.user))
            ) {
              this.showBIPage = true
            } else {
              this.addNotification(
                'Acesso restrito a desenvolvedores (nível 0).',
                'error'
              )
              return
            }
            break
          case 'bi-agendamentos':
            if (
              this.user &&
              ![1, 2].includes(Number(this.user.level_access))
            ) {
              this.showBIPage = true
            } else {
              this.addNotification(
                'Acesso não disponível para o seu perfil.',
                'error'
              )
              return
            }
            break
          case 'bi-administradores':
            if (this.user && canAccessBiAdministradores(this.user)) {
              this.showBIPage = true
            } else {
              this.addNotification(
                'Acesso não disponível para o seu perfil.',
                'error'
              )
              return
            }
            break
          case 'bi-painel':
            // SLA + Diretoria no mesmo lugar (alternância em tela cheia) — nível 0
            if (this.user && Number(this.user.level_access) === 0) {
              this.showBIPage = true
            } else {
              this.addNotification(
                'Acesso restrito a desenvolvedores (nível 0).',
                'error'
              )
              return
            }
            break
          case 'bi-grouplink-gerencial':
            if (this.user && canAccessBiGroupLinkGerencial(this.user)) {
              this.showBIPage = true
            } else {
              this.addNotification('Acesso restrito a este painel.', 'error')
              return
            }
            break
          case 'dashboard':
            // Dashboard mostra a nova view DashboardPage
            this.showNewDashboardPage = true
            this.showDashboardPage = false
            this.showSchedulesList = false
            break
          case 'agendamento':
          case 'schedules-list':
            // Atualizar dados do usuário do banco de dados antes de mostrar a lista
            await this.refreshUserFromDatabase()

            // Forçar reavaliação da computed property shouldShowClientFilter
            this.$nextTick(() => {
              this.$forceUpdate()
            })

            this.showDashboardPage = false
            this.showSchedulesList = true

            // CORREÇÃO: Garantir que SchedulesList carregue dados ao ser exibido
            this.$nextTick(() => {
              if (this.$refs.schedulesListRef) {
                console.log('🔄 Forçando carregamento inicial do SchedulesList')
                this.$refs.schedulesListRef.resetData()
                this.$refs.schedulesListRef.loadSchedules()
              }
            })

            // Se ainda não pré-carregou, mostrar indicação
            if (!this.pagesPreloaded) {
              this.addNotification(
                '🚀 Primeira vez acessando - preparando página...',
                'info'
              )
            }
            break
          case 'agendamento-lote':
            this.showXmlUploadPage = true
            if (!this.pagesPreloaded) {
              this.addNotification(
                '🚀 Primeira vez acessando - preparando página...',
                'info'
              )
            }
            // Scroll para a parte inferior da página apenas quando solicitado
            if (shouldScroll) {
              console.log(
                '🔻 EXECUTANDO SCROLL - menuId:',
                menuId,
                'shouldScroll:',
                shouldScroll
              )
              this.$nextTick(() => {
                setTimeout(() => {
                  console.log('🔻 SCROLLING TO BOTTOM NOW')
                  window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth',
                  })
                }, 100)
              })
            } else {
              console.log(
                '❌ NÃO FAZENDO SCROLL - menuId:',
                menuId,
                'shouldScroll:',
                shouldScroll
              )
            }
            break
          case 'produtos':
            this.showProductsPage = true
            if (!this.pagesPreloaded) {
              this.addNotification(
                '🚀 Primeira vez acessando - preparando página...',
                'info'
              )
            }
            // Carregar produtos quando a página for ativada
            this.$nextTick(() => {
              if (this.$refs.productsPageRef) {
                this.$refs.productsPageRef.loadProducts()
              }
            })
            break
          case 'admin-usuarios':
            // Verificar se o usuário tem permissão (apenas nível 0)
            if (this.user.level_access !== 0) {
              this.addNotification(
                '❌ Acesso negado. Apenas desenvolvedores (nível 0) podem acessar a Administração.',
                'error'
              )
              return
            }
            this.adminTabToShow = 'users'
            this.showAdminPage = true
            if (!this.pagesPreloaded) {
              this.addNotification(
                '🚀 Primeira vez acessando - preparando página...',
                'info'
              )
            }
            break
          case 'admin-clientes':
            // Verificar se o usuário tem permissão (apenas nível 0)
            if (this.user.level_access !== 0) {
              this.addNotification(
                '❌ Acesso negado. Apenas desenvolvedores (nível 0) podem acessar a Administração.',
                'error'
              )
              return
            }
            this.adminTabToShow = 'clients'
            this.showAdminPage = true
            if (!this.pagesPreloaded) {
              this.addNotification(
                '🚀 Primeira vez acessando - preparando página...',
                'info'
              )
            }
            break
          case 'admin-sistema':
            // Verificar se o usuário tem permissão (apenas nível 0 e 1)
            if (this.user.level_access > 1) {
              this.addNotification(
                '❌ Acesso negado. Apenas administradores podem acessar o Sistema.',
                'error'
              )
              return
            }
            this.showSystemPage = true
            if (!this.pagesPreloaded) {
              this.addNotification(
                '🚀 Primeira vez acessando - preparando página...',
                'info'
              )
            }
            break
          case 'admin-versao':
            // Verificar se o usuário tem permissão (apenas nível 0)
            if (this.user.level_access !== 0) {
              this.addNotification(
                '❌ Acesso negado. Apenas desenvolvedores (nível 0) podem acessar a página de Versão.',
                'error'
              )
              return
            }
            this.showVersionPage = true
            if (!this.pagesPreloaded) {
              this.addNotification(
                '🚀 Primeira vez acessando - preparando página...',
                'info'
              )
            }
            break
          case 'admin-marketing':
            // Verificar se o usuário tem permissão (apenas nível 0)
            if (this.user.level_access !== 0) {
              this.addNotification(
                '❌ Acesso negado. Apenas desenvolvedores (nível 0) podem acessar a página de Marketing.',
                'error'
              )
              return
            }
            this.showMarketingPage = true
            if (!this.pagesPreloaded) {
              this.addNotification(
                '🚀 Primeira vez acessando - preparando página...',
                'info'
              )
            }
            break
          case 'admin-armazens':
            // Verificar se o usuário tem permissão (apenas nível 0)
            if (this.user.level_access !== 0) {
              this.addNotification(
                '❌ Acesso negado. Apenas desenvolvedores (nível 0) podem acessar a página de Armazéns.',
                'error'
              )
              return
            }
            this.showArmazensPage = true
            if (!this.pagesPreloaded) {
              this.addNotification(
                '🚀 Primeira vez acessando - preparando página...',
                'info'
              )
            }
            break
          case 'admin-importacao-despesas-armazens':
          case 'admin-levantamento-custos-operacionais':
            if (this.user.level_access !== 0) {
              this.addNotification(
                '❌ Acesso negado. Apenas desenvolvedores (nível 0) podem acessar Importação despesas armazéns.',
                'error'
              )
              return
            }
            this.showLevantamentoCustosOperacionaisPage = true
            if (!this.pagesPreloaded) {
              this.addNotification(
                '🚀 Primeira vez acessando - preparando página...',
                'info'
              )
            }
            break
          case 'admin-levantamento-valores-tabela':
            if (this.user.level_access !== 0) {
              this.addNotification(
                '❌ Acesso negado. Apenas desenvolvedores (nível 0) podem acessar esta página.',
                'error'
              )
              return
            }
            this.showLevantamentoValoresAdminPage = true
            if (!this.pagesPreloaded) {
              this.addNotification(
                '🚀 Primeira vez acessando - preparando página...',
                'info'
              )
            }
            break
          case 'diaristas':
            // Verificar se o usuário tem permissão (apenas níveis 0 e 4)
            if (this.user.level_access !== 0 && this.user.level_access !== 4) {
              this.addNotification(
                '❌ Acesso negado. Apenas desenvolvedores (nível 0) e manutenção (nível 4) podem acessar Diaristas.',
                'error'
              )
              return
            }
            this.showDiaristasPage = true
            if (!this.pagesPreloaded) {
              this.addNotification(
                '🚀 Primeira vez acessando - preparando página...',
                'info'
              )
            }
            break
          case 'gestao':
          case 'cargas':
            // Verificar permissão: todos exceto nível 1 (Client)
            if (this.user.level_access === 1) {
              this.addNotification(
                '⚠️ Você não tem permissão para acessar esta página',
                'error'
              )
              return
            }
            this.managementTabToShow = 'loads'
            this.showManagementPage = true
            if (!this.pagesPreloaded) {
              this.addNotification(
                '🚀 Primeira vez acessando - preparando página...',
                'info'
              )
            }
            break
          case 'recepcao-clientes':
            // Verificar permissão: todos exceto nível 1 (Client)
            if (this.user.level_access === 1) {
              this.addNotification(
                '⚠️ Você não tem permissão para acessar esta página',
                'error'
              )
              return
            }
            this.managementTabToShow = 'clients'
            this.showManagementPage = true
            if (!this.pagesPreloaded) {
              this.addNotification(
                '🚀 Primeira vez acessando - preparando página...',
                'info'
              )
            }
            break
          case 'criar-pedido-expedicao':
            // Verificar permissão: apenas nível 0
            if (this.user.level_access !== 0) {
              this.addNotification(
                '⚠️ Você não tem permissão para acessar esta página',
                'error'
              )
              return
            }
            this.showCreateExpeditionPage = true
            break
          case 'pedidos-expedicao':
            // Verificar permissão: níveis 0, 1, 2 e 3
            if (![0, 1, 2, 3].includes(this.user.level_access)) {
              this.addNotification(
                '⚠️ Você não tem permissão para acessar esta página',
                'error'
              )
              return
            }
            this.showExpeditionsPage = true

            // Recarregar lista de pedidos quando a página é exibida
            this.$nextTick(() => {
              if (
                this.$refs.expeditionsPageRef &&
                typeof this.$refs.expeditionsPageRef.loadExpeditions ===
                  'function'
              ) {
                console.log('🔄 Recarregando lista de expedições')
                this.$refs.expeditionsPageRef.loadExpeditions()
              }
            })
            break
          case 'historico-expedicao':
            // Verificar permissão: níveis 0, 1, 2 e 3
            if (![0, 1, 2, 3].includes(this.user.level_access)) {
              this.addNotification(
                '⚠️ Você não tem permissão para acessar esta página',
                'error'
              )
              return
            }
            this.showExpeditionHistoryPage = true
            break
          case 'troca-nota':
            // Verificar permissão: níveis 0, 1, 2 e 3
            if (![0, 1, 2, 3].includes(this.user.level_access)) {
              this.addNotification(
                '⚠️ Você não tem permissão para acessar esta página',
                'error'
              )
              return
            }
            this.showNoteExchangePage = true
            break
          case 'recebimento-agenda':
            // Solicitação de Agendamento mostra a lista de agendamentos (agendamentos ativos)
            this.showRecebimentoAgendaPage = true
            this.showNewDashboardPage = false
            this.showDashboardPage = false
            this.showSchedulesList = false

            if (this.pendingFilterNavigation) {
              // Navegação programática com filtros pré-aplicados (ex.: StatusPorClientesPage)
              // Pular refreshes custosos — ir direto para loadSchedules com filterLoading já ativo
              this.pendingFilterNavigation = false
              try {
                await this.loadSchedules(false)
              } finally {
                setTimeout(() => {
                  this.filterLoading = false
                }, 300)
              }
            } else {
              // Navegação manual pelo menu — comportamento padrão
              // Atualizar dados do usuário do banco de dados antes de atualizar a lista
              await this.refreshUserFromDatabase()

              // Forçar reavaliação da computed property shouldShowClientFilter
              this.$nextTick(() => {
                this.$forceUpdate()
              })

              // Limpar apenas o cache de schedules para atualizar a lista
              if (window.apiClient && window.apiClient.clearCache) {
                window.apiClient.clearCache('/schedules')
                console.log('🗑️ Cache de schedules limpo')
              }

              // Buscar/atualizar status_config da tabela ao abrir Solicitação de Agendamento
              await ensureStatusConfigCache(true)

              // Atualizar apenas a lista de schedules (mostrando apenas ativos)
              await this.loadSchedules(false) // false = não mostrar loading global
            }
            break
          case 'recebimento-historico':
            this.showRecebimentoHistoricoPage = true
            this.showSchedulesList = false
            // Buscar/atualizar status_config da tabela ao abrir Histórico de Agendamentos
            ensureStatusConfigCache(true).then(() => {
              this.$nextTick(() => {
                const historicoList =
                  this.$refs.recebimentoHistoricoRef?.$refs?.schedulesListRef
                if (historicoList) {
                  historicoList.resetData?.()
                  historicoList.loadSchedules?.()
                }
              })
            })
            break
          case 'reagendamento-massa':
            this.showReagendamentoMassaPage = true
            this.showSchedulesList = false
            break
          case 'status-por-clientes':
            if (this.user && Number(this.user.level_access) !== 1) {
              this.showStatusPorClientesPage = true
              this.showSchedulesList = false
            } else {
              this.addNotification(
                'Você não tem permissão para acessar esta página.',
                'error'
              )
              return
            }
            break
          case 'conferencia-lote':
            if (
              this.user &&
              Number(this.user.level_access) !== 1 &&
              Number(this.user.level_access) !== 4
            ) {
              this.showConferenciaLotePage = true
              this.showSchedulesList = false
            }
            break
          case 'api':
            if (this.user && this.canAccessApiPage) {
              this.showApiPage = true
              this.showSchedulesList = false
            } else {
              // Bloqueio silencioso: usuários sem acesso não devem ser informados dos critérios
              return
            }
            break
          case 'grupo-oscar':
            if (this.user && this.canAccessApiPage) {
              this.showGrupoOscarPage = true
              this.showSchedulesList = false
            } else {
              // Bloqueio silencioso: usuários sem acesso não devem ser informados dos critérios
              return
            }
            break
          case 'financeiro-faturas':
            if (this.user && this.canAccessFaturasPage) {
              this.showFaturasListaPage = true
              this.showSchedulesList = false
            } else {
              this.addNotification(
                'Você não tem permissão para acessar faturas.',
                'error'
              )
              return
            }
            break
          case 'financeiro-solicitacoes':
            if (this.user && this.canAccessFinanceiroSolicitacoesPage) {
              this.showFinanceiroSolicitacoesPage = true
              this.showSchedulesList = false
            } else {
              this.addNotification(
                'Você não tem permissão para acessar esta página.',
                'error'
              )
              return
            }
            break
          case 'carga-descarga-informacoes-gerais':
            if (this.user && this.user.level_access === 0) {
              this.showCargaDescargaInformacoesGeraisPage = true
              this.showSchedulesList = false
            } else {
              this.addNotification(
                '⚠️ Você não tem permissão para acessar esta página',
                'error'
              )
              return
            }
            break
          case 'carga-descarga-agendamentos':
            if (this.user && this.user.level_access === 0) {
              this.showCargaDescargaAgendamentosPage = true
              this.showSchedulesList = false
            } else {
              this.addNotification(
                '⚠️ Você não tem permissão para acessar esta página',
                'error'
              )
              return
            }
            break
          case 'wtj':
            if (this.user && this.user.level_access === 0) {
              this.showWtjPage = true
              this.showSchedulesList = false
            } else {
              this.addNotification(
                'Acesso restrito a desenvolvedores (nível 0).',
                'error'
              )
              return
            }
            break
          case 'auto-status':
            if (this.user && this.user.level_access === 0) {
              this.showAutoStatusPage = true
              this.showSchedulesList = false
            } else {
              this.addNotification(
                'Acesso restrito a desenvolvedores (nível 0).',
                'error'
              )
              return
            }
            break
          case 'status':
            if (this.user && this.user.level_access === 0) {
              this.showStatusPage = true
              this.showSchedulesList = false
            } else {
              this.addNotification(
                'Acesso restrito a desenvolvedores (nível 0).',
                'error'
              )
              return
            }
            break
          case 'rejeicoes':
            if (
              this.user &&
              ![0, 1, 2, 3].includes(Number(this.user.level_access))
            ) {
              this.addNotification('Acesso restrito a esta área.', 'error')
              return
            }
            this.showRejeicoesPage = true
            break
          case 'config-rejeicoes':
            if (this.user && Number(this.user.level_access) !== 0) {
              this.addNotification(
                'Acesso restrito a desenvolvedores (nível 0).',
                'error'
              )
              return
            }
            this.showConfigRejeicoesPage = true
            break
          case 'config-pedidos':
            if (this.user && Number(this.user.level_access) !== 0) {
              this.addNotification(
                'Acesso restrito a desenvolvedores (nível 0).',
                'error'
              )
              return
            }
            this.showConfigPedidosPage = true
            break
          case 'dev-whatsapp-diretoria':
            if (this.user && Number(this.user.level_access) !== 0) {
              this.addNotification(
                'Acesso restrito a desenvolvedores (nível 0).',
                'error'
              )
              return
            }
            this.showDevWhatsappDiretoriaPage = true
            break
          case 'configuracoes':
            this.showSettingsPage = true
            if (!this.pagesPreloaded) {
              this.addNotification(
                '🚀 Primeira vez acessando - preparando página...',
                'info'
              )
            }
            break
          case 'ajuda':
            this.showHelpPage = true
            if (!this.pagesPreloaded) {
              this.addNotification(
                '🚀 Primeira vez acessando - preparando página...',
                'info'
              )
            }
            break
          default:
            console.log('Menu não implementado:', menuId)
        }
      } finally {
        this.maybeWarmPrefetchBiMovimentacao(menuId)
        // Libera a trava de navegação para qualquer rota; filhos que emitem
        // `page-ready` depois apenas repetem a liberação (idempotente).
        this.$nextTick(() => this.onPageReady())
      }
    },

    /** Nível 0: pré-carrega consultas típicas de Movimentação enquanto está em outro BI. */
    maybeWarmPrefetchBiMovimentacao(menuId) {
      if (
        !this.showBIPage ||
        !this.user ||
        Number(this.user.level_access) !== 0
      )
        return
      if (menuId === 'bi-movimentacao-clientes') return
      const menus = new Set([
        'bi',
        'bi-painel',
        'bi-diretoria',
        'bi-grouplink-gerencial',
        'bi-agendamentos',
        'bi-rejeicao',
        'bi-armazens',
        'bi-administradores',
      ])
      if (!menus.has(menuId)) return
      scheduleMovimentacaoWarmPrefetch()
    },

    onPageReady() {
      // Chamado via @page-ready pelas views quando terminam de carregar
      if (this.navigationTimeout) clearTimeout(this.navigationTimeout)
      this.navigationTimeout = null
      this.isNavigating = false
      console.log(
        '✅ [handleMenuClick] Página pronta, trava de navegação liberada'
      )
    },

    handleDashboardNavigate(page, tab = null) {
      // Navegação a partir do DashboardPage
      if (page === 'schedules-list') {
        // Navegar para Solicitação de Agendamento (lista de agendamentos)
        this.handleMenuClick('recebimento-agenda')
      } else if (page === 'management' && tab === 'loads') {
        this.handleMenuClick('gestao')
      } else if (page === 'produtos') {
        this.handleMenuClick('produtos')
      } else if (page === 'administracao') {
        this.handleMenuClick('administracao')
      }
    },

    async handleNavigateToAgenda({ client, status }) {
      // Navegar para Solicitação de Agendamento com filtros pré-aplicados (vindo de StatusPorClientesPage)
      if (client) {
        this.selectedFilterClient = { cnpj: client.cnpj, name: client.name }
      } else {
        this.selectedFilterClient = null
      }
      this.currentFilters = {
        ...this.currentFilters,
        status: status || '',
      }
      this.currentPage = 1
      // Sinaliza navegação programática para pular refreshes desnecessários
      this.pendingFilterNavigation = true
      // Mostra spinner imediatamente para evitar tabela vazia durante carregamento
      this.filterLoading = true
      await this.handleMenuClick('recebimento-agenda')
    },

    handleSettingsClick() {
      this.showUserDropdown = false // Fechar dropdown
      if (
        isBiDiretoriaPortalOnlyUser(this.user) ||
        isBiArmazensPortalOnlyUser(this.user)
      ) {
        this.addNotification('Configurações não disponíveis para seu perfil.', 'info')
        return
      }
      this.handleMenuClick('configuracoes') // Navegar para configurações
    },

    async handleLogout() {
      const { useSystemDialogStore } = await import('@/stores/systemDialog')
      const dialogStore = useSystemDialogStore()
      const confirmed = await dialogStore.showConfirm(
        'Tem certeza que deseja sair do sistema?',
        'Sair do Sistema',
        { primaryLabel: 'Sair' }
      )
      if (confirmed) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        const loginUrl = '/login.html'
        window.location.href = loginUrl
      }
    },

    async handleDeliveryAction(action, deliveryId) {
      console.log('Ação na entrega:', action, deliveryId)

      switch (action) {
        case 'start':
          try {
            await apiClient.updateScheduleStatus(
              deliveryId,
              'processing',
              'Recebimento iniciado'
            )
            this.addNotification('Recebimento iniciado', 'success')
            await this.loadPendingDeliveries()
          } catch (error) {
            this.addNotification('Erro ao iniciar recebimento', 'error')
          }
          break
        case 'track':
          this.addNotification('Abrindo rastreamento...', 'info')
          break
        case 'view':
          this.addNotification('Abrindo detalhes...', 'info')
          break
        default:
          this.addNotification('Ação não reconhecida', 'warning')
      }
    },

    addNotification(message, type = 'info') {
      const notification = {
        id: Date.now(),
        message,
        type,
        timestamp: new Date(),
      }

      this.notifications.push(notification)

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

    async refresh() {
      console.log('🔄 Iniciando atualização manual dos dados...')

      // Limpar o cache para forçar atualização completa
      if (window.apiClient && window.apiClient.clearCache) {
        window.apiClient.clearCache('/schedules')
        console.log('🗑️ Cache de agendamentos limpo')
      }

      // Se está na página de agendamentos, atualizar diretamente o SchedulesList
      if (this.showSchedulesList && this.$refs.schedulesListRef) {
        console.log('📄 Atualizando SchedulesList diretamente')
        this.$refs.schedulesListRef.resetData()
        await this.$refs.schedulesListRef.loadSchedules()
        this.addNotification('Lista de agendamentos atualizada', 'success')
        return
      }

      // CORREÇÃO: Para dashboard, usar mesma lógica de carregamento da inicialização
      console.log('📊 Atualizando dados do dashboard...')

      // Reset para primeira página e recarregar
      this.currentPage = 1
      await this.loadSchedules()

      this.addNotification('Dados atualizados com sucesso', 'success')
    },

    // CORREÇÃO: Handler para sincronizar dados do SchedulesList com App.vue
    handleSchedulesFromList(data) {
      console.log('🔍 [LOAD] === INÍCIO handleSchedulesFromList() ===')
      console.log('🔍 [LOAD] Estado atual antes da sincronização:', {
        schedulesCount: this.schedules.length,
        isSearchActive: this.isSearchActive,
      })
      console.log('🔄 Sincronizando dados do SchedulesList com App.vue:', {
        schedulesCount: data.schedules.length,
        currentAppSchedules: this.schedules.length,
        isLoading: this.loading,
        schedulesListVisible: this.showSchedulesList,
      })

      // Só sincronizar quando SchedulesList estiver visível (não no dashboard)
      if (!this.showSchedulesList) {
        console.log('📄 SchedulesList não visível - ignorando sincronização')
        return
      }

      // ANTI-DUPLICAÇÃO: Aplicar deduplicação aos dados recebidos do SchedulesList
      const uniqueSchedules = this.removeDuplicateSchedules(
        data.schedules,
        'syncWithSchedulesList'
      )
      console.log(
        `🔧 SchedulesList - Após deduplicação: ${uniqueSchedules.length} agendamentos únicos`
      )

      // Atualizar a lista do App.vue com os dados do SchedulesList
      console.log('📄 Substituindo schedules do App.vue com dados completos')
      this.schedules = uniqueSchedules

      // Atualizar totalItems com o total recebido do SchedulesList
      if (data.total !== undefined) {
        this.totalItems = data.total
        console.log(
          '📊 Total de agendamentos atualizado do SchedulesList:',
          this.totalItems
        )
      }

      // Recalcular estatísticas com dados atualizados
      this.calculateStatsFromData(this.schedules)

      console.log('✅ App.vue sincronizado com SchedulesList:', {
        totalSchedules: this.schedules.length,
        totalItems: this.totalItems,
      })
      console.log('🔍 [LOAD] === FIM handleSchedulesFromList() ===')
    },
    async loadSchedules(showGlobalLoading = true) {
      console.log('🔍 [LOAD] === INÍCIO loadSchedules() ===')
      console.log('🔍 [LOAD] Estado atual:', {
        schedulesCount: this.schedules.length,
        isSearchActive: this.isSearchActive,
        showSchedulesList: this.showSchedulesList,
      })

      // Cache de status_config é atualizado ao abrir Solicitação/Histórico; aqui garante que existe
      await ensureStatusConfigCache()

      if (showGlobalLoading) {
        this.setLoading(
          true,
          'Carregando agendamentos...',
          'Buscando dados atualizados'
        )
      }

      try {
        console.log('Buscando agendamentos...')

        // Dashboard e Solicitação de Agendamento mostram apenas ativos (show_all=false)
        // Histórico mostra todos (show_all=true)
        const isDashboardPage =
          !this.showSchedulesList ||
          this.showRecebimentoAgendaPage ||
          this.showDashboardPage

        console.log(
          `📊 Carregando para: ${isDashboardPage ? 'Dashboard/Agenda (Principal - apenas ativos)' : 'SchedulesList (Histórico - todos)'}`
        )

        // CORREÇÃO: Carregar apenas UMA página por vez (50 itens)
        const requestParams = {
          page: this.currentPage,
          limit: this.itemsPerPage, // 50 agendamentos
          ...this.currentFilters,
          show_all: !isDashboardPage, // false para Principal/Agenda (filtra inativos), true para Histórico
        }

        // Adicionar filtro de cliente se houver um selecionado (usar CNPJ normalizado)
        if (this.selectedFilterClient && this.selectedFilterClient.cnpj) {
          // Normalizar CNPJ removendo formatação (pontos, barras, hífens)
          const normalizedCnpj = this.selectedFilterClient.cnpj.replace(
            /[^\d]/g,
            ''
          )
          requestParams.client = normalizedCnpj
          console.log('🏢 Filtro de cliente adicionado aos parâmetros:', {
            original: this.selectedFilterClient.cnpj,
            normalized: normalizedCnpj,
            clientName: this.selectedFilterClient.name,
          })
        }

        console.log('🔍 Parâmetros da requisição:', requestParams)

        const response = await apiClient.request('/schedules', {
          method: 'GET',
          params: requestParams,
        })

        console.log('📋 Resposta da API:', {
          responseExists: !!response,
          schedulesArray: response?.schedules?.length || 0,
          pagination: response?.pagination,
          totalResponse: response?.pagination?.total || 0,
        })

        const newSchedules = response.schedules || []
        console.log(`📊 Agendamentos recebidos: ${newSchedules.length}`)

        // ANTI-DUPLICAÇÃO
        const uniqueSchedules = this.removeDuplicateSchedules(
          newSchedules,
          'loadSchedules'
        )
        console.log(
          `🔧 Após deduplicação: ${uniqueSchedules.length} agendamentos únicos`
        )

        this.schedules = uniqueSchedules

        // Atualizar totalItems com base na resposta do backend
        if (response?.pagination?.total !== undefined) {
          this.totalItems = response.pagination.total
          console.log('📊 Total de agendamentos do backend:', this.totalItems)
          console.log('📊 Paginação do backend:', {
            page: response.pagination.page,
            limit: response.pagination.limit,
            total: response.pagination.total,
            pages: response.pagination.pages,
            currentPage: this.currentPage,
            calculatedTotalPages: Math.ceil(
              response.pagination.total / this.itemsPerPage
            ),
          })
        } else {
          // Fallback: estimar total
          this.totalItems = uniqueSchedules.length
          if (uniqueSchedules.length === this.itemsPerPage) {
            // Se recebeu página cheia, provavelmente há mais
            this.totalItems = this.itemsPerPage * (this.currentPage + 1)
          }
          console.log('⚠️ Total estimado (fallback):', this.totalItems)
        }

        console.log('✅ Estado final após loadSchedules:', {
          schedulesCount: this.schedules.length,
          totalItems: this.totalItems,
          totalPages: this.totalPages,
          currentPage: this.currentPage,
          isDashboard: isDashboardPage,
        })

        console.log('🔍 [LOAD] === FIM loadSchedules() ===')
      } catch (error) {
        this.schedules = []
        console.error('Erro ao carregar agendamentos:', error)
        this.addNotification('Erro ao carregar agendamentos', 'error')
      } finally {
        if (showGlobalLoading) {
          this.setLoading(false)
        }
        console.log('Finalizou loading dos agendamentos')
      }
    },

    async loadSchedulesInBackground() {
      try {
        console.log('🔍 [LOAD] === INÍCIO loadSchedulesInBackground() ===')
        console.log('🔍 [LOAD] Estado atual antes do background load:', {
          schedulesCount: this.schedules.length,
          isSearchActive: this.isSearchActive,
        })
        console.log('Carregando agendamentos em background...')
        // Usar o apiClient global com cache
        const response = await apiClient.getSchedules()
        const newSchedules = response.schedules || []

        // ANTI-DUPLICAÇÃO: Remover duplicatas baseado no ID único como camada de segurança adicional
        const uniqueSchedules = this.removeDuplicateSchedules(
          newSchedules,
          'loadSchedulesInBackground'
        )
        console.log(
          `🔧 Background - Após deduplicação: ${uniqueSchedules.length} agendamentos únicos`
        )

        this.schedules = uniqueSchedules
        // paginação removida.total = response.pagination?.total || this.schedules.length
        // paginação removida - cálculo de páginas não é mais necessário
        console.log(
          'Agendamentos carregados em background:',
          this.schedules.length
        )
        console.log('🔍 [LOAD] === FIM loadSchedulesInBackground() ===')
      } catch (error) {
        this.schedules = []
        console.error('Erro ao carregar agendamentos em background:', error)
        this.addNotification('Erro ao carregar agendamentos', 'error')
        console.log(
          '🔍 [LOAD] === FIM loadSchedulesInBackground() (com erro) ==='
        )
      }
    },

    async loadDashboardDataInBackground() {
      try {
        console.log('Carregando dados do dashboard em background...')
        // Executar todas as requisições em paralelo
        const promises = [
          this.loadStatsInBackground(),
          this.loadRecentActivitiesInBackground(),
          this.loadPendingDeliveriesInBackground(),
        ]

        await Promise.allSettled(promises)
        console.log('Dashboard carregado em background!')
      } catch (error) {
        console.error('Erro ao carregar dashboard em background:', error)
      }
    },

    async loadStatsInBackground() {
      try {
        // Aguardar os agendamentos serem carregados ou usar dados existentes
        await new Promise(resolve => {
          const checkSchedules = () => {
            if (this.schedules && this.schedules.length >= 0) {
              resolve()
            } else {
              setTimeout(checkSchedules, 100)
            }
          }
          checkSchedules()
        })

        console.log('Calculando estatísticas...')
        const schedules = this.schedules || []

        this.dashboardStats = {
          solicitacoes: schedules.filter(s => s.status === 'Solicitado').length,
          agendamentos: schedules.filter(s => s.status === 'Agendado').length,
          conferencia: schedules.filter(
            s => s.status === 'Conferência' || s.status === 'Recebido'
          ).length,
          tratativa: schedules.filter(s => s.status === 'Tratativa').length,
        }

        console.log('Estatísticas calculadas:', this.dashboardStats)
      } catch (error) {
        console.error('Erro ao calcular estatísticas:', error)
      }
    },

    // MÉTODO OTIMIZADO: Carrega apenas dados essenciais
    async loadEssentialDataOptimized() {
      this.statsLoading = true
      try {
        // Verificar token mais uma vez antes da requisição crítica
        const token = localStorage.getItem('token')
        // Carregando dados essenciais

        if (!token) {
          console.log('Token não disponível - cancelando requisição')
          throw new Error('Token não disponível para requisição')
        }

        // UMA ÚNICA REQUISIÇÃO para obter todos os dados necessários COM TIMEOUT
        // Fazendo requisição para obter dados
        const response = await Promise.race([
          apiClient.request('/schedules', {
            method: 'GET',
            params: {
              page: 1, // Sempre página 1 - carregamento completo feito via loop
              limit: 100, // Limite fixo
              ...this.currentFilters, // Aplicar filtros
            },
          }),
          new Promise(
            (_, reject) =>
              setTimeout(
                () => reject(new Error('Timeout na consulta de agendamentos')),
                45000
              ) // 45 segundos
          ),
        ])

        if (response && response.schedules) {
          // Usar os dados para multiple propósitos
          this.schedules = response.schedules
          // paginação removida = response.pagination || {}

          // Definir hasMore corretamente baseado na quantidade retornada
          // paginação removida.hasMore = response.schedules.length === // paginação removida.limit && response.schedules.length > 0

          // Calcular estatísticas a partir dos dados já carregados
          this.calculateStatsFromData(response.schedules)

          console.log(
            `💡 Dados carregados: ${response.schedules.length} agendamentos, stats calculados!`
          )
        } else {
          console.warn('⚠️ Resposta vazia ou inválida da API')
          // Definir dados padrão para evitar interface quebrada
          this.schedules = []
          // paginação removida = { page: 1, limit: 50, total: 0, hasMore: false }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados essenciais:', error)

        // Definir dados padrão para manter interface funcional
        this.schedules = []
        // paginação removida = { page: 1, limit: 50, total: 0, hasMore: false }

        if (error.message === 'Timeout na consulta de agendamentos') {
          console.warn('⏱️ Timeout detectado - requisição muito lenta')
          this.addNotification(
            'Sistema carregado - dados podem demorar para aparecer devido à lentidão da conexão',
            'warning'
          )
        } else {
          this.addNotification(
            `Erro ao carregar dados: ${error.message}`,
            'error'
          )
        }
      } finally {
        this.statsLoading = false
      }
    },

    // Calcular stats a partir dos dados já carregados (sem nova requisição)
    calculateStatsFromData(schedules) {
      const stats = {
        solicitacoes: 0,
        agendamentos: 0,
        conferencia: 0,
        tratativa: 0,
      }

      schedules.forEach(schedule => {
        const status = schedule.status?.toLowerCase()
        switch (status) {
          case 'solicitado':
            stats.solicitacoes++
            break
          case 'agendado':
            stats.agendamentos++
            break
          case 'conferência': // COM acento
          case 'conferencia': // SEM acento (compatibilidade)
          case 'recebido': // Compatibilidade com dados antigos
          case 'estoque':
            stats.conferencia++
            break
          case 'tratativa':
            stats.tratativa++
            break
        }
      })

      this.dashboardStats = stats
    },

    // Carregar dados secundários apenas quando necessário
    async loadSecondaryDataLazy() {
      console.log('⏳ Carregando dados secundários...')

      // Carregar apenas se os componentes estiverem visíveis/sendo usados
      const promises = []

      // Carregamento completo já é feito de uma vez - não há necessidade de carregar mais

      // Carregar outras atividades se necessário
      promises.push(this.loadRecentActivitiesIfNeeded())

      if (promises.length > 0) {
        await Promise.allSettled(promises)
        console.log('🎉 Dados secundários carregados!')
      }
    },

    // loadRemainingSchedules removido - carregamento completo é feito de uma vez

    async loadRecentActivitiesIfNeeded() {
      // Carregar apenas se o usuário estiver visualizando essa seção
      // Implementação futura conforme necessidade
    },

    async loadStatsImmediately() {
      try {
        console.log('Carregando estatísticas imediatamente...')
        // Usar o apiClient global com cache
        const response = await apiClient.getSchedules()
        const schedules = response.schedules || []

        this.dashboardStats = {
          solicitacoes: schedules.filter(s => s.status === 'Solicitado').length,
          agendamentos: schedules.filter(s => s.status === 'Agendado').length,
          conferencia: schedules.filter(
            s => s.status === 'Conferência' || s.status === 'Recebido'
          ).length,
          tratativa: schedules.filter(s => s.status === 'Tratativa').length,
        }

        console.log(
          'Estatísticas carregadas imediatamente:',
          this.dashboardStats
        )
      } catch (error) {
        console.error('Erro ao carregar estatísticas imediatamente:', error)
        // Fallback para estatísticas zeradas
        this.dashboardStats = {
          solicitacoes: 0,
          agendamentos: 0,
          conferencia: 0,
          tratativa: 0,
        }
      }
    },

    async loadRecentActivitiesInBackground() {
      try {
        console.log('Carregando atividades recentes...')
        // Usar o apiClient global com cache
        this.recentActivities = await apiClient.getRecentActivities()
        console.log(
          'Atividades recentes carregadas:',
          this.recentActivities.length
        )
      } catch (error) {
        console.error('Erro ao carregar atividades:', error)
        this.recentActivities = []
      }
    },

    async loadPendingDeliveriesInBackground() {
      try {
        console.log('Carregando entregas pendentes...')
        // Usar o apiClient global com cache
        this.pendingDeliveries = await apiClient.getPendingDeliveries()
        console.log(
          'Entregas pendentes carregadas:',
          this.pendingDeliveries.length
        )
      } catch (error) {
        console.error('Erro ao carregar entregas:', error)
        this.pendingDeliveries = []
      }
    },
    canSelectSchedule(schedule) {
      // Permitir seleção para status nativos da lista ou status criados na página Status (presentes no cache)
      const allowedByList = ALLOWED_SELECTABLE_STATUSES.includes(
        schedule.status
      )
      const allowedByCache = !!getStatusFromCache(schedule.status)
      if (!allowedByList && !allowedByCache) return false

      // Se já tem agendamentos selecionados, só pode selecionar do mesmo status
      if ((this.selectedSchedules || []).length > 0) {
        const selectedStatuses = this.selectedScheduleStatuses
        if (
          selectedStatuses.length === 1 &&
          !selectedStatuses.includes(schedule.status)
        ) {
          return false
        }
      }
      return true
    },
    getStatusDisplayFor(schedule) {
      return getStatusDisplayInfo(
        schedule && schedule.status,
        this.getStatusBadge
      )
    },
    getStatusBadge(status) {
      const statusConfig = {
        Solicitado: { class: 'warning', label: 'Solicitado' },
        Contestado: { class: 'contestado', label: 'Contestado' },
        Agendado: { class: 'primary', label: 'Agendado' },
        Conferência: { class: 'success', label: 'Em conferência' },
        Recebido: { class: 'success', label: 'Em conferência' }, // Compatibilidade com dados antigos
        Tratativa: { class: 'danger', label: 'Em tratativa' },
        'Em estoque': { class: 'success', label: 'Em estoque' },
        Estoque: { class: 'success', label: 'Em estoque' }, // Compatibilidade com dados antigos
        Recusar: { class: 'danger', label: 'Recusar' },
        Cancelar: { class: 'warning', label: 'Cancelar' },
        Recusado: { class: 'dark', label: 'Recusado' },
        Cancelado: { class: 'secondary', label: 'Cancelado' },
        Marcação: { class: 'booking', label: 'Marcação' },
        'Não agendado': { class: 'not-scheduled', label: 'Não agendado' },
      }
      return (
        statusConfig[status] || { class: 'secondary', label: 'Desconhecido' }
      )
    },
    onScheduleSelect() {
      // Verificar se todos os agendamentos selecionáveis estão selecionados
      const selectableSchedules = (this.displayedSchedules || []).filter(
        schedule => this.canSelectSchedule(schedule)
      )
      // Checkbox select all removido - apenas seleção individual
      // Verificar se os agendamentos selecionados têm o mesmo status
      const selectedStatuses = this.selectedScheduleStatuses
      if (selectedStatuses.length > 1) {
        // Se tiver status diferentes, manter apenas o último selecionado
        const lastSelected =
          this.selectedSchedules[this.selectedSchedules.length - 1]
        const lastSelectedSchedule = (this.schedules || []).find(
          s => s.id === lastSelected
        )
        if (lastSelectedSchedule) {
          this.selectedSchedules = this.selectedSchedules.filter(id => {
            const schedule = (this.schedules || []).find(s => s.id === id)
            return schedule && schedule.status === lastSelectedSchedule.status
          })
        }
      }
    },
    formatDate(date) {
      if (!date) return ''

      // Evitar problemas de timezone para datas no formato YYYY-MM-DD
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-')
        return `${day}/${month}/${year}`
      }

      // Fallback para outros formatos
      try {
        const d = new Date(date)
        if (isNaN(d)) return date
        return d.toLocaleDateString('pt-BR')
      } catch (error) {
        return date
      }
    },

    formatDateShort(date) {
      if (!date) return ''

      // Evitar problemas de timezone para datas no formato YYYY-MM-DD
      if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split('-')
        const shortYear = year.slice(-2) // Pega apenas os 2 últimos dígitos do ano
        return `${day}/${month}/${shortYear}`
      }

      // Fallback para outros formatos
      try {
        const d = new Date(date)
        if (isNaN(d)) return date
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const shortYear = String(d.getFullYear()).slice(-2)
        return `${day}/${month}/${shortYear}`
      } catch (error) {
        return date
      }
    },

    getRequestDate(schedule) {
      // Extrair data de criação do histórico
      if (
        schedule.historic &&
        schedule.historic.created &&
        schedule.historic.created.timestamp
      ) {
        return schedule.historic.created.timestamp
      }

      // Fallback para timestamp ou created_at se disponível
      return schedule.timestamp || schedule.created_at || ''
    },

    isScheduleDelayed(scheduleDate, status, prevision = 0) {
      if (!scheduleDate) return false

      // Verificar se o status permite alerta de atraso
      const delayAlertStatuses = ['Contestado', 'Solicitado', 'Agendado']
      if (!status || !delayAlertStatuses.includes(status)) {
        return false
      }

      // Converter a data do agendamento para Date object
      let scheduleDateTime
      if (
        typeof scheduleDate === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(scheduleDate)
      ) {
        // Formato YYYY-MM-DD
        const [year, month, day] = scheduleDate.split('-')
        scheduleDateTime = new Date(year, month - 1, day)
      } else {
        scheduleDateTime = new Date(scheduleDate)
      }

      // Obter a data atual (sem hora, minutos, segundos)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      scheduleDateTime.setHours(0, 0, 0, 0)

      // Para agendamentos com previsão (prevision = 1):
      // Exibir alerta apenas se a data for inferior a 7 dias antes de hoje
      if (prevision === 1) {
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        return scheduleDateTime < sevenDaysAgo
      }

      // Para agendamentos normais (prevision != 1):
      // Exibir alerta se a data for inferior a hoje
      return scheduleDateTime < today
    },

    getTransportadoraName(schedule) {
      if (!schedule.info) return null

      try {
        const info =
          typeof schedule.info === 'string'
            ? JSON.parse(schedule.info)
            : schedule.info
        return info.transporta?.xNome || info.carrier || null
      } catch (e) {
        return null
      }
    },

    getSupplierLabel(schedule) {
      if (schedule.is_booking === 1) {
        return 'Agendamento prévio'
      } else if (schedule.is_booking === 2) {
        return 'Agendamento não agendado'
      }
      return schedule.supplier || '-'
    },

    formatDateForDisplay(dateString) {
      if (!dateString) return ''

      // Se já está no formato YYYY-MM-DD, converter para DD/MM/YYYY
      if (
        typeof dateString === 'string' &&
        dateString.match(/^\d{4}-\d{2}-\d{2}$/)
      ) {
        const [year, month, day] = dateString.split('-')
        return `${day}/${month}/${year}`
      }

      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) {
          return dateString
        }
        return date.toLocaleDateString('pt-BR')
      } catch (error) {
        return dateString
      }
    },
    async openInfoModal(schedule) {
      console.log('🔍 openInfoModal chamado')
      if (!schedule?.id) return
      try {
        // Buscar agendamento completo (inclui corpem_* e xml) para modal de informações
        const response = await apiClient.request(`/schedules/${schedule.id}`, {
          method: 'GET',
        })
        const fullSchedule =
          response?.schedule ?? response?.data?.schedule ?? response
        const src = fullSchedule || schedule
        const processedSchedule = Object.assign(
          {},
          {
            id: src.id,
            number: src.number,
            nfe_key: src.nfe_key,
            client: src.client,
            client_cnpj: src.client_cnpj,
            client_cnpj_original: src.client_cnpj_original,
            supplier: src.supplier,
            case_count: src.case_count,
            status: src.status,
            date: src.date,
            qt_prod: src.qt_prod,
            total_value: src.total_value,
            no_dp: src.no_dp,
            NUMPEDCLI: src.NUMPEDCLI ?? null,
            is_booking: src.is_booking,
            prevision: src.prevision,
            crossdock: src.crossdock,
            client_info: src.client_info,
            xml: src.xml || null,
            req: src.req || null,
            corpem_products_integration:
              src.corpem_products_integration ?? null,
            corpem_nf_integration: src.corpem_nf_integration ?? null,
            info: this.processInfoField(src.info),
            historic: this.processHistoricField(src.historic),
          }
        )
        useNfeInfoModalStore().openWithSchedule(processedSchedule)
      } catch (err) {
        console.error('❌ Erro ao carregar detalhes do agendamento:', err)
        this.addNotification(
          'Erro ao carregar informações do agendamento',
          'error'
        )
      }
    },

    // Método auxiliar para processar campo info
    processInfoField(info) {
      if (!info) return null

      // Se já é objeto, retornar como está
      if (typeof info === 'object' && info !== null) {
        console.log('✅ Info já é objeto')
        return info
      }

      // Se é string, tentar parsear
      if (typeof info === 'string') {
        try {
          console.log('⚠️ Info veio como string, parseando no frontend...')
          const parsed = JSON.parse(info)
          console.log('✅ Info parseado com sucesso')
          return parsed
        } catch (e) {
          console.error('❌ Erro ao parsear info no frontend:', e)
          console.error('❌ Info original:', info.substring(0, 200))
          return null
        }
      }

      console.warn('⚠️ Info em formato não reconhecido:', typeof info)
      return null
    },

    // Método auxiliar para processar campo historic
    processHistoricField(historic) {
      if (!historic) return null

      // Se já é objeto, retornar como está
      if (typeof historic === 'object' && historic !== null) {
        return historic
      }

      // Se é string, tentar parsear
      if (typeof historic === 'string') {
        try {
          console.log('⚠️ Historic veio como string, parseando no frontend...')
          return JSON.parse(historic)
        } catch (e) {
          console.error('❌ Erro ao parsear historic no frontend:', e)
          return null
        }
      }

      return null
    },
    closeInfoModal() {
      useNfeInfoModalStore().close()
    },
    openEditModal(schedule) {
      console.log('openEditModal chamado com:', schedule)
      this.scheduleToEdit = schedule || useNfeInfoModalStore().schedule
      this.showEditModal = true
      setTimeout(() => {
        console.log(
          'showEditModal:',
          this.showEditModal,
          'scheduleToEdit:',
          this.scheduleToEdit
        )
      }, 100)
    },
    closeEditModal() {
      this.showEditModal = false
      this.scheduleToEdit = null
      // Fechar também o modal de informações da NF-e se estiver aberto
      this.closeInfoModal()
    },

    openScheduleCreationModal() {
      // Navegar para página de Agendamento em Lote com scroll
      this.handleMenuClick('agendamento-lote', true)
    },

    // Métodos para agendamento de marcação
    openBookingModal() {
      this.showBookingModal = true
    },

    closeBookingModal() {
      this.showBookingModal = false
    },

    async handleBookingCreated(createdBooking) {
      console.log('Agendamento de marcação criado:', createdBooking)
      this.addNotification(
        'Agendamento de marcação criado com sucesso!',
        'success'
      )
      this.closeBookingModal()

      // Recarregar a lista de agendamentos
      await this.refreshPageAfterAction(
        'Lista atualizada com novo agendamento de marcação'
      )

      // Atualizar badges de cargas
    },

    // Métodos para agendamento de recusa
    openRejectionModal() {
      this.showRejectionModal = true
    },

    closeRejectionModal() {
      this.showRejectionModal = false
    },

    async handleRejectionCreated(createdRejection) {
      console.log('Agendamento de recusa criado:', createdRejection)
      this.addNotification(
        'Agendamento de recusa criado com sucesso!',
        'success'
      )
      this.closeRejectionModal()

      // Recarregar a lista de agendamentos
      await this.refreshPageAfterAction(
        'Lista atualizada com novo agendamento de recusa'
      )
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

        // Primeiro tentar carregar clientes da API se ainda não estão carregados
        await this.loadClientsFromAPI()

        // Usar os dados de availableClientsGlobal que já foram carregados e filtrados
        if (
          this.availableClientsGlobal &&
          this.availableClientsGlobal.length > 0
        ) {
          console.log(
            `📦 Usando clientes já carregados globalmente: ${this.availableClientsGlobal.length}`
          )

          this.availableFilterClients = this.availableClientsGlobal.map(c => ({
            cnpj: c.cnpj,
            name: c.name || c.supplier,
            corpem_code: c.corpem_code || c.numero || '',
            storage: c.storage || c.cd || '',
            integration: c.integration || 0,
          }))
          this.filteredFilterClients = [...this.availableFilterClients]
          console.log(
            `✅ ${this.availableFilterClients.length} clientes carregados para filtro`
          )
        } else {
          console.log('⚠️ Nenhum cliente disponível em availableClientsGlobal')

          // Fallback: usar dados de agendamentos se os clientes globais não estiverem disponíveis
          const uniqueClients = {}
          this.schedules.forEach(schedule => {
            if (schedule.cnpj && schedule.supplier) {
              const key = schedule.cnpj
              if (!uniqueClients[key]) {
                uniqueClients[key] = {
                  cnpj: schedule.cnpj,
                  name: schedule.supplier,
                  corpem_code: schedule.numero || '',
                  storage: schedule.cd || '',
                  integration: schedule.integration || 0,
                }
              }
            }
          })

          const clientsFromSchedules = Object.values(uniqueClients)
          console.log(
            `📦 Fallback: extraídos ${clientsFromSchedules.length} clientes dos agendamentos`
          )

          if (clientsFromSchedules.length > 0) {
            this.availableFilterClients = clientsFromSchedules
            this.filteredFilterClients = [...this.availableFilterClients]
            console.log(
              `✅ ${this.availableFilterClients.length} clientes carregados para filtro (fallback)`
            )
          } else {
            this.availableFilterClients = []
            this.filteredFilterClients = []
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar clientes para filtro:', error)
        this.availableFilterClients = []
        this.filteredFilterClients = []
      } finally {
        this.loadingFilterClients = false
      }
    },

    selectFilterClient(client) {
      console.log(
        '🎯 Cliente selecionado para filtro:',
        client.name,
        'CNPJ:',
        client.cnpj
      )
      this.selectedFilterClient = client
      this.closeClientFilterModal()

      // Resetar para primeira página ao aplicar filtro de cliente
      this.currentPage = 1

      // Aplicar filtro imediatamente - vai recarregar do backend com o filtro de cliente
      this.handleFilterChange()
    },

    clearClientFilter() {
      console.log('🧹 Limpando filtro de cliente')
      this.selectedFilterClient = null
      // Resetar para primeira página ao limpar filtro
      this.currentPage = 1
      this.handleFilterChange()
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

    formatCNPJ(cnpj) {
      if (!cnpj) return ''
      return cnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      )
    },

    formatEntityDisplayName,

    // Métodos para upgrade de marcação
    effectivateBooking() {
      if (!this.canEffectivateBooking) return

      const selectedId = this.selectedSchedules[0]
      const schedule = this.schedules.find(s => s.id === selectedId)

      if (!schedule) {
        this.addNotification('Agendamento não encontrado', 'error')
        return
      }

      console.log('⬆️ Iniciando efetivação para:', schedule)

      // NOVA FUNCIONALIDADE: Abrir página de criação de agendamentos em vez do modal
      // Isso permite ao usuário fazer múltiplos agendamentos, onde o primeiro reutilizará o ID do prévio
      this.bookingToEffectivate = schedule

      // Navegar para a página usando o sistema de navegação
      this.handleMenuClick('agendamento-lote', false)

      // Adicionar notificação informativa
      this.addNotification(
        `Efetivando agendamento ${schedule.is_booking === 1 ? 'prévio' : 'não agendado'} #${schedule.id}. O primeiro XML enviado substituirá este agendamento.`,
        'info'
      )
    },

    closeEffectivateModal() {
      this.showEffectivateModal = false
      this.bookingToEffectivate = null
    },

    async handleSchedulesCreated() {
      console.log('✅ Agendamento(s) criado(s) com sucesso')

      // Recarregar a lista de agendamentos imediatamente
      await this.refreshPageAfterAction(
        'Lista atualizada - novos agendamentos criados'
      )
    },

    async handleLoadUpdated() {
      console.log('✅ Carga atualizada com sucesso')

      // Recarregar a lista de agendamentos imediatamente
      await this.refreshPageAfterAction('Lista atualizada - carga modificada')
    },

    async handleBookingEffectivated(response) {
      console.log('✅ Efetivação concluída:', response)
      this.addNotification('Agendamento efetivado com sucesso!', 'success')
      this.closeEffectivateModal()

      // Limpar seleção atual antes de recarregar
      this.clearSelection()

      // Recarregar a lista de agendamentos
      await this.refreshPageAfterAction('Lista atualizada após efetivação')
    },
    handleScheduleDataUpdated(updatedSchedule) {
      console.log(
        '🔄 Atualizando dados do agendamento no modal:',
        updatedSchedule
      )

      if (!updatedSchedule || !updatedSchedule.id) {
        console.warn('⚠️ Dados do agendamento inválidos:', updatedSchedule)
        return
      }

      // Processar os dados atualizados da mesma forma que em showNfeInfoModal
      const processedSchedule = Object.assign(
        {},
        {
          id: updatedSchedule.id,
          number: updatedSchedule.number,
          nfe_key: updatedSchedule.nfe_key,
          client: updatedSchedule.client,
          client_cnpj: updatedSchedule.client_cnpj,
          client_cnpj_original: updatedSchedule.client_cnpj_original,
          supplier: updatedSchedule.supplier,
          case_count: updatedSchedule.case_count,
          status: updatedSchedule.status,
          date: updatedSchedule.date,
          qt_prod: updatedSchedule.qt_prod,
          total_value: updatedSchedule.total_value,
          no_dp: updatedSchedule.no_dp,
          NUMPEDCLI: updatedSchedule.NUMPEDCLI ?? null,
          is_booking: updatedSchedule.is_booking,
          prevision: updatedSchedule.prevision,
          crossdock: updatedSchedule.crossdock,
          client_info: updatedSchedule.client_info,
          xml: updatedSchedule.xml || null,
          req: updatedSchedule.req || null,
          corpem_products_integration:
            updatedSchedule.corpem_products_integration || null,
          corpem_nf_integration: updatedSchedule.corpem_nf_integration || null,
          info: this.processInfoField(updatedSchedule.info),
          historic: this.processHistoricField(updatedSchedule.historic),
        }
      )

      console.log('✅ Dados atualizados processados:', {
        id: processedSchedule.id,
        hasReq: !!processedSchedule.req,
        reqType: typeof processedSchedule.req,
      })

      // Atualizar schedule no store (isso atualizará automaticamente a prop nfeData do modal)
      useNfeInfoModalStore().setSchedule(processedSchedule)

      // Também atualizar na lista se o agendamento estiver lá
      this.updateScheduleInList(processedSchedule)
    },

    /** Refetch do agendamento para a aba Dev do NfeInfoModal (carregamento inicial + polling). */
    async handleRefreshNfeForDev() {
      const modalSchedule = useNfeInfoModalStore().schedule
      if (!modalSchedule?.id) return
      try {
        const response = await apiService.get(`/schedules/${modalSchedule.id}`)
        const schedule = response?.schedule ?? response?.data?.schedule
        if (schedule) this.handleScheduleDataUpdated(schedule)
      } catch (err) {
        console.error('Erro ao atualizar dados do agendamento (aba Dev):', err)
      }
    },

    async handleScheduleUpdated(updatedSchedule) {
      console.log('✅ Agendamento atualizado:', updatedSchedule)

      // ATUALIZAÇÃO INSTANTÂNEA: Atualizar os dados na lista local imediatamente
      if (updatedSchedule && updatedSchedule.schedule) {
        const schedule = updatedSchedule.schedule
        this.updateScheduleInList(schedule)
      }

      // Fechar modais
      this.closeEditModal()
      this.closeInfoModal()

      // Mostrar notificação de sucesso
      this.addNotification('Agendamento atualizado com sucesso', 'success')

      // Recarregar lista completa para garantir sincronização
      await this.refreshPageAfterAction(null) // null para não duplicar notificação

      // Limpar cache em background para próximas consultas
      if (window.apiClient && window.apiClient.clearCache) {
        window.apiClient.clearCache('/schedules')
      }

      console.log('⚡ Agendamento atualizado e lista recarregada')
    },

    // Método auxiliar para atualização completa após ações
    async refreshPageAfterAction(successMessage) {
      console.log('🔄 Atualizando dados após alteração de status')

      try {
        // Exibir mensagem de sucesso
        if (successMessage) {
          this.addNotification(successMessage, 'success')
        }

        // Atualizar dados sem reload da página
        await this.loadRealDataInBackground()

        console.log('✅ Dados atualizados com sucesso após alteração de status')
      } catch (error) {
        console.error('❌ Erro ao atualizar dados após alteração:', error)
        // Fallback para reload se a atualização falhar
        if (successMessage) {
          localStorage.setItem('reloadSuccessMessage', successMessage)
        }
        window.location.reload()
      }
    },

    clearSelection() {
      this.selectedSchedules = []
      this.newDate = ''
      this.rescheduleDate = ''
    },

    // Método para atualizar status instantaneamente na lista local
    updateScheduleStatusInList(scheduleId, newStatus) {
      console.log(
        `⚡ Atualizando status do agendamento ${scheduleId} para "${newStatus}" na lista local`
      )

      // Verificar se o status antigo estava oculto e o novo está visível
      const schedule = this.schedules.find(s => s.id === scheduleId)
      const hiddenStatuses = ['Em estoque', 'Estoque', 'Recusado', 'Cancelado']

      let oldStatusWasHidden = false
      let newStatusIsVisible = true

      if (schedule) {
        oldStatusWasHidden = hiddenStatuses.includes(schedule.status)
        newStatusIsVisible = !hiddenStatuses.includes(newStatus)

        console.log(
          `🔍 Status antigo: "${schedule.status}" (oculto: ${oldStatusWasHidden}), novo: "${newStatus}" (visível: ${newStatusIsVisible})`
        )
      }

      // Atualizar no array principal de schedules (dashboard)
      const scheduleIndex = this.schedules.findIndex(
        schedule => schedule.id === scheduleId
      )
      if (scheduleIndex !== -1) {
        // Usar spread operator para garantir reatividade completa no Vue 3
        this.schedules[scheduleIndex] = {
          ...this.schedules[scheduleIndex],
          status: newStatus,
        }
        console.log(
          `⚡ Status atualizado no dashboard para agendamento ${scheduleId} - Badge deve atualizar instantaneamente`
        )
      }

      // Se estiver na página SchedulesList ou Histórico, atualizar também na lista
      const schedulesListRef =
        this.showSchedulesList && this.$refs.schedulesListRef
          ? this.$refs.schedulesListRef
          : this.showRecebimentoHistoricoPage &&
              this.$refs.recebimentoHistoricoRef?.$refs?.schedulesListRef
            ? this.$refs.recebimentoHistoricoRef.$refs.schedulesListRef
            : null
      if (
        schedulesListRef &&
        typeof schedulesListRef.updateScheduleStatus === 'function'
      ) {
        schedulesListRef.updateScheduleStatus(scheduleId, newStatus)
        console.log(
          `⚡ Status atualizado na lista para agendamento ${scheduleId}`
        )
      }

      // Atualizar também o schedule no store se for o mesmo que está sendo visualizado
      const modalStore = useNfeInfoModalStore()
      if (modalStore.schedule && modalStore.schedule.id === scheduleId) {
        modalStore.setSchedule({ ...modalStore.schedule, status: newStatus })
        console.log(
          `⚡ Status atualizado no modal para agendamento ${scheduleId}`
        )
      }

      // CORREÇÃO DO BUG: Se o agendamento estava oculto e agora deve ser visível,
      // recarregar os dados para garantir que apareça na página principal
      if (oldStatusWasHidden && newStatusIsVisible && !this.showSchedulesList) {
        console.log(
          '🔄 Agendamento reativado de status oculto para visível - recarregando dados'
        )
        this.$nextTick(() => {
          this.loadSchedules()
        })
      }
    },

    // Método para atualizar agendamento completo instantaneamente na lista local
    updateScheduleInList(updatedSchedule) {
      console.log(
        `⚡ Atualizando agendamento ${updatedSchedule.id} completo na lista local`
      )

      // Atualizar no array principal de schedules (dashboard)
      const scheduleIndex = this.schedules.findIndex(
        schedule => schedule.id === updatedSchedule.id
      )
      if (scheduleIndex !== -1) {
        // Atualizar todos os campos do agendamento
        Object.assign(this.schedules[scheduleIndex], updatedSchedule)
        console.log(
          `⚡ Agendamento ${updatedSchedule.id} atualizado completamente no dashboard`
        )
      }

      // Se estiver na página SchedulesList ou Histórico, atualizar também na lista
      const schedulesListRef =
        this.showSchedulesList && this.$refs.schedulesListRef
          ? this.$refs.schedulesListRef
          : this.showRecebimentoHistoricoPage &&
              this.$refs.recebimentoHistoricoRef?.$refs?.schedulesListRef
            ? this.$refs.recebimentoHistoricoRef.$refs.schedulesListRef
            : null
      if (
        schedulesListRef &&
        typeof schedulesListRef.updateSchedule === 'function'
      ) {
        schedulesListRef.updateSchedule(updatedSchedule)
        console.log(
          `⚡ Agendamento ${updatedSchedule.id} atualizado completamente na lista`
        )
      }

      // Atualizar também o schedule no store se for o mesmo que está sendo visualizado
      const modalStore = useNfeInfoModalStore()
      if (
        modalStore.schedule &&
        modalStore.schedule.id === updatedSchedule.id
      ) {
        modalStore.setSchedule({ ...modalStore.schedule, ...updatedSchedule })
        console.log(
          `⚡ Agendamento ${updatedSchedule.id} atualizado completamente no modal`
        )
      }
    },

    selectAll() {
      // Seleciona todos os agendamentos visíveis que podem ser selecionados
      const selectableSchedules = (this.displayedSchedules || []).filter(
        schedule => this.canSelectSchedule(schedule)
      )
      this.selectedSchedules = selectableSchedules.map(schedule => schedule.id)
    },

    toggleSelection() {
      if (this.selectedSchedules.length === 0) {
        this.selectAll()
      } else {
        this.clearSelection()
      }
    },

    // Métodos para seleção de linha inteira
    toggleRowSelection(scheduleId, event) {
      // Evitar seleção se clicar em elementos interativos
      if (
        event.target.closest('button') ||
        event.target.closest('.action-buttons') ||
        event.target.closest('input[type="checkbox"]')
      ) {
        return
      }

      const schedule = this.displayedSchedules.find(s => s.id === scheduleId)
      if (!schedule || !this.canSelectSchedule(schedule)) {
        return
      }

      // Toggle da seleção
      const index = this.selectedSchedules.indexOf(scheduleId)
      if (index > -1) {
        this.selectedSchedules.splice(index, 1)
      } else {
        this.selectedSchedules.push(scheduleId)
      }

      // Executar a lógica de verificação de status
      this.onScheduleSelect()
    },

    // Supplier Tooltip Methods
    showSupplierTooltip(scheduleId, event) {
      const schedule = this.displayedSchedules.find(s => s.id === scheduleId)
      if (!schedule) {
        return
      }

      // Calcular posição do tooltip
      const rect = event.currentTarget.getBoundingClientRect()
      const tooltipLeft = rect.left + rect.width / 2
      const tooltipTop = rect.top - 10 // 10px acima da linha

      // Para usuários nível 1: mostrar dados de Estoque
      if (this.userLevel === 1) {
        this.supplierTooltip = {
          visible: true,
          storageName: schedule.client || null,
          storageCnpj:
            schedule.client_cnpj || schedule.client_cnpj_original || null,
          top: tooltipTop,
          left: tooltipLeft,
          isDelayed: this.isScheduleDelayed(
            schedule.date,
            schedule.status,
            schedule.prevision
          ),
          isLevel1: true,
        }
      } else {
        // Para outros níveis: mostrar Fornecedor e Transportadora
        let carrier = null
        if (schedule.info) {
          try {
            let info = schedule.info
            if (typeof info === 'string') {
              info = JSON.parse(info)
            }
            carrier = info.transporta?.xNome || info.carrier || null
          } catch (e) {
            console.warn('Erro ao parsear info do agendamento:', e)
          }
        }

        this.supplierTooltip = {
          visible: true,
          supplier: schedule.supplier || null,
          carrier: carrier,
          top: tooltipTop,
          left: tooltipLeft,
          isDelayed: this.isScheduleDelayed(
            schedule.date,
            schedule.status,
            schedule.prevision
          ),
          isLevel1: false,
        }
      }
    },

    hideSupplierTooltip() {
      this.supplierTooltip.visible = false
    },

    // Método para selecionar todos via checkbox master
    toggleSelectAll() {
      if (this.isAllSelected) {
        // Desmarcar todos os selecionáveis
        const selectableIds = this.displayedSchedules
          .filter(schedule => this.canSelectSchedule(schedule))
          .map(schedule => schedule.id)

        this.selectedSchedules = this.selectedSchedules.filter(
          id => !selectableIds.includes(id)
        )
      } else {
        // Marcar todos os selecionáveis que não estão marcados
        const selectableIds = this.displayedSchedules
          .filter(schedule => this.canSelectSchedule(schedule))
          .map(schedule => schedule.id)

        selectableIds.forEach(id => {
          if (!this.selectedSchedules.includes(id)) {
            this.selectedSchedules.push(id)
          }
        })
      }

      this.onScheduleSelect()
    },
    // loadMoreSchedules removido - não há mais paginação

    // CORREÇÃO: Método handleScroll removido - sem scroll infinito na página principal
    async acceptSchedules() {
      if (this.selectedSchedules.length === 0) return
      const selectedCount = this.selectedSchedules.length
      this.setBulkActionLoading(
        true,
        'Aceitando Agendamentos...',
        'Processando solicitações selecionadas'
      )
      try {
        await this.bulkUpdateStatus('Agendado', 'Agendamento aceito')
        this.clearSelection()

        // Mostrar notificação de sucesso (status já foi atualizado instantaneamente no bulkUpdateStatus)
        this.addNotification(
          `${selectedCount} agendamento(s) aceito(s) com sucesso`,
          'success'
        )

        // Limpar cache em background
        if (window.apiClient && window.apiClient.clearCache) {
          window.apiClient.clearCache('/schedules')
        }
      } catch (error) {
        console.error('Erro ao aceitar agendamentos:', error)
        this.addNotification('Erro ao aceitar agendamentos', 'error')
      } finally {
        this.setBulkActionLoading(false)
      }
    },
    async changeDateToContestado() {
      if (this.selectedSchedules.length === 0 || !this.newDate) return
      const selectedCount = this.selectedSchedules.length
      this.setBulkActionLoading(
        true,
        'Alterando Data...',
        'Contestando agendamentos com nova data'
      )
      try {
        await this.bulkUpdateStatusWithDateAndComment(
          'Contestado',
          this.newDate
        )
        this.clearSelection()
        await this.refreshPageAfterAction(
          `Data alterada para ${selectedCount} agendamento(s)`
        )
      } catch (error) {
        console.error('Erro ao alterar data:', error)
        this.addNotification('Erro ao alterar data dos agendamentos', 'error')
      } finally {
        this.setBulkActionLoading(false)
      }
    },
    async acceptNewDate() {
      if (this.selectedSchedules.length === 0) return
      const selectedCount = this.selectedSchedules.length
      this.setBulkActionLoading(
        true,
        'Aceitando Nova Data...',
        'Confirmando data contestada'
      )
      try {
        await this.bulkUpdateStatus('Agendado', 'Nova data aceita')
        this.clearSelection()
        await this.refreshPageAfterAction(
          `Nova data aceita para ${selectedCount} agendamento(s)`
        )
      } catch (error) {
        console.error('Erro ao aceitar nova data:', error)
        this.addNotification('Erro ao aceitar nova data', 'error')
      } finally {
        this.setBulkActionLoading(false)
      }
    },
    async confirmContestado() {
      if (this.selectedSchedules.length === 0) return
      const selectedCount = this.selectedSchedules.length
      this.setBulkActionLoading(
        true,
        'Confirmando Status...',
        'Alterando status para contestado'
      )
      try {
        await this.bulkUpdateStatus('Agendado', 'Data contestada confirmada')
        this.clearSelection()
        await this.refreshPageAfterAction(
          `${selectedCount} agendamento(s) confirmado(s)`
        )
      } catch (error) {
        console.error('Erro ao confirmar agendamentos:', error)
        this.addNotification('Erro ao confirmar agendamentos', 'error')
      } finally {
        this.setBulkActionLoading(false)
      }
    },
    async changeContestadoToAgendado() {
      if (this.selectedSchedules.length === 0 || !this.newDate) return
      const selectedCount = this.selectedSchedules.length
      this.setBulkActionLoading(
        true,
        'Reagendando...',
        'Alterando status contestado para agendado'
      )
      try {
        await this.bulkUpdateStatusWithDate(
          'Agendado',
          this.newDate,
          'Data contestada reagendada'
        )
        this.clearSelection()
        await this.refreshPageAfterAction(
          `${selectedCount} agendamento(s) reagendado(s)`
        )
      } catch (error) {
        console.error('Erro ao reagendar:', error)
        this.addNotification('Erro ao reagendar agendamentos', 'error')
      } finally {
        this.setBulkActionLoading(false)
      }
    },

    /**
     * Reagendamento em massa (nível 1) para selecionados em Solicitado ou Agendado.
     * - Atualiza a data com nova entrada no histórico ("Reagendado de X para Y").
     * - Se status for Agendado, transiciona para Solicitado para nova aprovação.
     * - Revalida a regra de data no submit (defesa contra mudança da janela 17h durante a sessão).
     */
    async rescheduleSchedules() {
      if (this.selectedSchedules.length === 0 || !this.rescheduleDate) return

      // Revalidação no clique: cobre o caso da hora ter avançado para >= 17h depois de o usuário abrir a tela
      if (this.rescheduleDate < this.minRescheduleDate) {
        const message = this.rescheduleHourBlocked
          ? 'Após as 17h, o reagendamento deve ser feito a partir de depois de amanhã.'
          : 'O reagendamento deve ser para uma data futura (a partir de amanhã).'
        this.addNotification(message, 'warning')
        return
      }

      const selectedCount = this.selectedSchedules.length
      const oldStatus = this.selectedScheduleStatuses[0]
      const willChangeStatus = oldStatus === 'Agendado'

      this.setBulkActionLoading(
        true,
        'Reagendando...',
        willChangeStatus
          ? 'Alterando data e revertendo status para Solicitado'
          : 'Alterando data dos agendamentos'
      )

      try {
        await this.bulkRescheduleAction(this.rescheduleDate, oldStatus)
        this.rescheduleDate = ''
        this.clearSelection()
        await this.refreshPageAfterAction(
          `${selectedCount} agendamento(s) reagendado(s)`
        )
      } catch (error) {
        console.error('Erro ao reagendar:', error)
        this.addNotification('Erro ao reagendar agendamentos', 'error')
      } finally {
        this.setBulkActionLoading(false)
      }
    },

    /**
     * Aplica reagendamento em cada agendamento selecionado:
     * 1) PUT /schedules/:id atualizando `date` + entrada `reschedule_<ts>` no histórico.
     * 2) Se o status original era Agendado, PATCH /:id/status para Solicitado (nova entrada de status).
     */
    async bulkRescheduleAction(newDate, oldStatus) {
      const formattedDate = this.formatDateForBackend(newDate)
      const userName =
        this.getCurrentUser().user ||
        this.getCurrentUser().name ||
        'Usuário'

      for (const scheduleId of this.selectedSchedules) {
        const scheduleResponse = await apiClient.request(
          `/schedules/${scheduleId}`,
          { method: 'GET' }
        )
        const currentSchedule = scheduleResponse.schedule
        const previousDate = currentSchedule.date
        const previousStatus = currentSchedule.status || oldStatus

        const willChangeStatus = previousStatus === 'Agendado'

        const updatePayload = {
          number: currentSchedule.number,
          nfe_key: currentSchedule.nfe_key,
          client: currentSchedule.client_cnpj || currentSchedule.client,
          case_count: currentSchedule.case_count,
          date: formattedDate,
          qt_prod: currentSchedule.qt_prod,
          historic: {
            ...currentSchedule.historic,
            [`reschedule_${Date.now()}_${scheduleId}`]: {
              timestamp: new Date().toISOString(),
              user: userName,
              action: `Reagendado de ${this.formatDateForDisplay(previousDate)} para ${this.formatDateForDisplay(formattedDate)}`,
              comment: willChangeStatus
                ? 'Reagendamento solicitado — status alterado de Agendado para Solicitado'
                : 'Reagendamento solicitado',
              previous_date: previousDate,
              new_date: formattedDate,
              previous_status: previousStatus,
              new_status: willChangeStatus ? 'Solicitado' : previousStatus,
            },
          },
        }

        await apiClient.request(`/schedules/${scheduleId}`, {
          method: 'PUT',
          data: updatePayload,
        })

        if (willChangeStatus) {
          await apiClient.request(`/schedules/${scheduleId}/status`, {
            method: 'PATCH',
            data: {
              status: 'Solicitado',
              historic_entry: {
                user: userName,
                action: 'Status alterado para Solicitado',
                comment: 'Reagendamento solicitado pelo cliente',
              },
            },
          })
        }
      }
    },

    async cancelSchedules() {
      if (this.selectedSchedules.length === 0) return
      const selectedCount = this.selectedSchedules.length

      if (
        !confirm(
          `Tem certeza que deseja cancelar ${selectedCount} agendamento(s)?`
        )
      ) {
        return
      }

      this.setBulkActionLoading(
        true,
        'Cancelando Agendamentos...',
        'Processando solicitações de cancelamento'
      )
      try {
        // Usuário nível 1 (admin) -> status "Cancelar" (precisa aprovação)
        // Outros usuários -> status "Cancelado" (cancelamento direto)
        const newStatus = this.userLevel === 1 ? 'Cancelar' : 'Cancelado'
        const comment =
          this.userLevel === 1
            ? 'Agendamento solicitado para cancelamento'
            : 'Agendamento cancelado diretamente'

        await this.bulkUpdateStatus(newStatus, comment)

        const message =
          this.userLevel === 1
            ? `${selectedCount} agendamento(s) marcado(s) para cancelamento`
            : `${selectedCount} agendamento(s) cancelado(s) com sucesso`

        this.clearSelection()
        await this.refreshPageAfterAction(message)
      } catch (error) {
        console.error('Erro ao cancelar agendamentos:', error)
        this.addNotification('Erro ao cancelar agendamentos', 'error')
      } finally {
        this.setBulkActionLoading(false)
      }
    },

    async markAsReceived() {
      if (this.selectedSchedules.length === 0) return
      const selectedCount = this.selectedSchedules.length

      if (
        !confirm(
          `Tem certeza que deseja marcar ${selectedCount} agendamento(s) como em conferência?`
        )
      ) {
        return
      }

      this.setBulkActionLoading(
        true,
        'Marcando como Em Conferência...',
        'Atualizando status para conferência'
      )
      try {
        await this.bulkUpdateStatus(
          'Conferência',
          'Agendamento marcado como em conferência'
        )
        this.clearSelection()
        await this.refreshPageAfterAction(
          `${selectedCount} agendamento(s) marcado(s) como em conferência`
        )
      } catch (error) {
        console.error('Erro ao marcar como em conferência:', error)
        this.addNotification(
          'Erro ao marcar agendamentos como em conferência',
          'error'
        )
      } finally {
        this.setBulkActionLoading(false)
      }
    },

    async integrateAndMarkAsConferencia() {
      if (this.selectedSchedules.length === 0) return

      // Verificar se todos os agendamentos selecionados têm status "Solicitado"
      const selected = (this.schedules || []).filter(s =>
        (this.selectedSchedules || []).includes(s.id)
      )
      const nonSolicitado = selected.filter(s => s.status !== 'Solicitado')

      if (nonSolicitado.length > 0) {
        this.addNotification(
          'Apenas agendamentos com status "Solicitado" podem ser integrados e alterados para em conferência',
          'error'
        )
        return
      }

      // Verificar se todos os agendamentos selecionados são crossdock
      const nonCrossdock = selected.filter(s => {
        const crossdockValue = s.crossdock
        return !(
          crossdockValue === 1 ||
          crossdockValue === '1' ||
          crossdockValue === true
        )
      })

      if (nonCrossdock.length > 0) {
        this.addNotification(
          'Apenas agendamentos do tipo crossdocking podem ser integrados e alterados para em conferência',
          'error'
        )
        return
      }

      const selectedCount = this.selectedSchedules.length

      if (
        !confirm(
          `Tem certeza que deseja integrar e alterar ${selectedCount} agendamento(s) crossdocking com status "Solicitado" para "Em conferência"?`
        )
      ) {
        return
      }

      this.setBulkActionLoading(
        true,
        'Integrando e alterando para Em Conferência...',
        'Integrando agendamentos crossdocking e atualizando status para conferência'
      )
      try {
        await this.bulkUpdateStatus(
          'Conferência',
          'Agendamento crossdocking integrado e alterado para em conferência'
        )
        this.clearSelection()
        await this.refreshPageAfterAction(
          `${selectedCount} agendamento(s) crossdocking integrado(s) e marcado(s) como em conferência`
        )
      } catch (error) {
        console.error('Erro ao integrar e marcar como em conferência:', error)
        this.addNotification(
          'Erro ao integrar e marcar agendamentos como em conferência',
          'error'
        )
      } finally {
        this.setBulkActionLoading(false)
      }
    },

    async markAsEmEstoque() {
      if (this.selectedSchedules.length === 0) return
      const selectedCount = this.selectedSchedules.length

      if (
        !confirm(
          `Tem certeza que deseja marcar ${selectedCount} agendamento(s) como em estoque?`
        )
      ) {
        return
      }

      this.setBulkActionLoading(
        true,
        'Marcando como Em Estoque...',
        'Atualizando status para estoque'
      )
      try {
        await this.bulkUpdateStatus(
          'Em estoque',
          'Agendamento marcado como em estoque'
        )
        this.clearSelection()

        // Mostrar notificação de sucesso (status já foi atualizado instantaneamente no bulkUpdateStatus)
        this.addNotification(
          `${selectedCount} agendamento(s) marcado(s) como em estoque`,
          'success'
        )

        // Limpar cache em background
        if (window.apiClient && window.apiClient.clearCache) {
          window.apiClient.clearCache('/schedules')
        }
      } catch (error) {
        console.error('Erro ao marcar como em estoque:', error)
        this.addNotification(
          'Erro ao marcar agendamentos como em estoque',
          'error'
        )
      } finally {
        this.setBulkActionLoading(false)
      }
    },

    async markAsTratativa() {
      if (this.selectedSchedules.length === 0) return
      const selectedCount = this.selectedSchedules.length

      if (
        !confirm(
          `Tem certeza que deseja marcar ${selectedCount} agendamento(s) como em tratativa?`
        )
      ) {
        return
      }

      this.setBulkActionLoading(
        true,
        'Marcando como Em Tratativa...',
        'Atualizando para status de tratativa'
      )
      try {
        await this.bulkUpdateStatus(
          'Tratativa',
          'Agendamento marcado como em tratativa devido a problemas identificados'
        )
        this.clearSelection()

        // Mostrar notificação de sucesso (status já foi atualizado instantaneamente no bulkUpdateStatus)
        this.addNotification(
          `${selectedCount} agendamento(s) marcado(s) como em tratativa`,
          'success'
        )

        // Limpar cache em background
        if (window.apiClient && window.apiClient.clearCache) {
          window.apiClient.clearCache('/schedules')
        }
      } catch (error) {
        console.error('Erro ao marcar como tratativa:', error)
        this.addNotification(
          'Erro ao marcar agendamentos como em tratativa',
          'error'
        )
      } finally {
        this.setBulkActionLoading(false)
      }
    },

    async handleMarkSingleAsTratativa(scheduleData) {
      console.log(
        '🔄 Marcando agendamento individual como tratativa:',
        scheduleData
      )

      if (!scheduleData || !scheduleData.id) {
        this.addNotification(
          'Erro: dados do agendamento não encontrados',
          'error'
        )
        return
      }

      if (
        !confirm(
          `Tem certeza que deseja marcar o agendamento "${scheduleData.number || scheduleData.id}" como em tratativa?`
        )
      ) {
        return
      }

      this.loading = true
      try {
        // Usar o apiClient para atualizar status individual
        const apiClient = window.apiClient

        await apiClient.updateScheduleStatus(
          scheduleData.id,
          'Tratativa',
          'Agendamento marcado como em tratativa devido a problemas identificados'
        )

        console.log('✅ Status alterado para Tratativa com sucesso')

        // ATUALIZAÇÃO INSTANTÂNEA: Atualizar o status na lista local imediatamente
        this.updateScheduleStatusInList(scheduleData.id, 'Tratativa')

        // Fechar modal de informações
        this.closeInfoModal()

        // Mostrar notificação de sucesso
        this.addNotification(
          'Status alterado para Tratativa com sucesso!',
          'success'
        )

        // Limpar cache em background para próximas consultas
        if (window.apiClient && window.apiClient.clearCache) {
          window.apiClient.clearCache('/schedules')
        }

        console.log('⚡ Status atualizado instantaneamente na interface')
      } catch (error) {
        console.error('Erro ao marcar agendamento como tratativa:', error)
        this.addNotification(
          'Erro ao marcar agendamento como em tratativa',
          'error'
        )
      } finally {
        this.loading = false
      }
    },

    async handleChangeStatusFromTratativa({ scheduleData, newStatus }) {
      console.log(
        '🔄 Alterando status de tratativa para:',
        newStatus,
        'agendamento:',
        scheduleData
      )

      if (!scheduleData || !scheduleData.id) {
        this.addNotification(
          'Erro: dados do agendamento não encontrados',
          'error'
        )
        return
      }

      if (!newStatus) {
        this.addNotification('Erro: novo status não informado', 'error')
        return
      }

      const statusLabels = {
        Solicitado: 'Solicitado',
        Contestado: 'Contestado',
        Agendado: 'Agendado',
        Conferência: 'Em conferência',
        Recebido: 'Em conferência',
        'Em estoque': 'Em estoque',
        Estoque: 'Em estoque', // Compatibilidade com dados antigos
        Tratativa: 'Em tratativa',
        Cancelar: 'Cancelar',
        Cancelado: 'Cancelado',
        Recusado: 'Recusado',
      }

      const statusLabel = statusLabels[newStatus] || newStatus

      if (
        !confirm(
          `Tem certeza que deseja alterar o agendamento "${scheduleData.number || scheduleData.id}" de "Em tratativa" para "${statusLabel}"?`
        )
      ) {
        return
      }

      this.loading = true
      try {
        // Usar o apiClient para atualizar status individual
        const apiClient = window.apiClient

        await apiClient.updateScheduleStatus(
          scheduleData.id,
          newStatus,
          `Status alterado de "Em tratativa" para "${statusLabel}" pelo usuário`
        )

        console.log(`✅ Status alterado para ${statusLabel} com sucesso`)

        // ATUALIZAÇÃO INSTANTÂNEA: Atualizar o status na lista local imediatamente
        this.updateScheduleStatusInList(scheduleData.id, newStatus)

        // Fechar modal de informações
        this.closeInfoModal()

        // Mostrar notificação de sucesso
        this.addNotification(
          `Status alterado para "${statusLabel}" com sucesso!`,
          'success'
        )

        // Limpar cache em background para próximas consultas
        if (window.apiClient && window.apiClient.clearCache) {
          window.apiClient.clearCache('/schedules')
        }

        console.log(`⚡ Status atualizado instantaneamente para ${statusLabel}`)
      } catch (error) {
        console.error('Erro ao alterar status do agendamento:', error)
        this.addNotification(
          `Erro ao alterar status para "${statusLabel}"`,
          'error'
        )
      } finally {
        this.loading = false
      }
    },

    async acceptCancellation() {
      if (this.selectedSchedules.length === 0) return
      const selectedCount = this.selectedSchedules.length

      if (
        !confirm(
          `Tem certeza que deseja aceitar o cancelamento de ${selectedCount} agendamento(s)?`
        )
      ) {
        return
      }

      this.setBulkActionLoading(
        true,
        'Aceitando Cancelamento...',
        'Processando solicitações de cancelamento'
      )
      try {
        await this.bulkUpdateStatus('Cancelado', 'Cancelamento aceito')
        this.clearSelection()
        await this.refreshPageAfterAction(
          `${selectedCount} cancelamento(s) aceito(s)`
        )
      } catch (error) {
        console.error('Erro ao aceitar cancelamento:', error)
        this.addNotification('Erro ao aceitar cancelamento', 'error')
      } finally {
        this.setBulkActionLoading(false)
      }
    },

    async markAsRecusado(newStatus) {
      if (this.selectedSchedules.length === 0) return
      const selectedCount = this.selectedSchedules.length

      const statusLabel = newStatus === 'Recusado' ? 'recusado' : 'cancelado'
      const actionLabel = newStatus === 'Recusado' ? 'recusar' : 'cancelar'

      if (
        !confirm(
          `Tem certeza que deseja ${actionLabel} ${selectedCount} agendamento(s)?`
        )
      ) {
        return
      }

      this.setBulkActionLoading(
        true,
        `Marcando como ${statusLabel}...`,
        `Atualizando status dos agendamentos para ${statusLabel}`
      )
      try {
        const comment =
          newStatus === 'Recusado'
            ? 'Agendamento de recusa finalizado - Carga recusada'
            : 'Agendamento de recusa cancelado'

        await this.bulkUpdateStatus(newStatus, comment)
        this.clearSelection()
        await this.refreshPageAfterAction(
          `${selectedCount} agendamento(s) marcado(s) como ${statusLabel}`
        )
      } catch (error) {
        console.error(`Erro ao marcar como ${statusLabel}:`, error)
        this.addNotification(
          `Erro ao marcar agendamentos como ${statusLabel}`,
          'error'
        )
      } finally {
        this.setBulkActionLoading(false)
      }
    },

    async bulkUpdateStatus(newStatus, comment) {
      // Usar o apiClient global com cache
      for (const scheduleId of this.selectedSchedules) {
        const currentUser = this.getCurrentUser()
        const payload = {
          status: newStatus,
          historic_entry: {
            user: currentUser.user || currentUser.name || 'Usuário',
            action: `Status alterado para ${newStatus}`,
            comment: comment || '',
          },
        }
        await apiClient.request(`/schedules/${scheduleId}/status`, {
          method: 'PATCH',
          data: payload,
        })

        // ATUALIZAÇÃO INSTANTÂNEA: Atualizar o status na lista local imediatamente
        this.updateScheduleStatusInList(scheduleId, newStatus)
      }
    },

    openStatusModal() {
      this.showStatusModal = true
      this.statusConfigList = []
      this.statusConfigLoading = true
      const token = localStorage.getItem('token')
      const base = (
        apiClient.defaults?.baseURL ||
        apiClient.baseURL ||
        BASE_URL ||
        '/api'
      ).replace(/\/$/, '')
      fetch(`${base}/status-config`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(res => {
          if (!res.ok) throw new Error(res.statusText)
          return res.json()
        })
        .then(data => {
          this.statusConfigList = (data.list || []).map(
            ({ id, name, badge_color, text_color }) => ({
              id,
              name,
              badge_color,
              text_color,
            })
          )
        })
        .catch(err => {
          console.error('Erro ao carregar status:', err)
          this.addNotification('Erro ao carregar lista de status', 'error')
          this.closeStatusModal()
        })
        .finally(() => {
          this.statusConfigLoading = false
        })
    },

    closeStatusModal() {
      this.showStatusModal = false
      this.statusConfigList = []
    },

    statusBadgeOptionStyle(item) {
      const bg = item.badge_color || '#6c757d'
      const text = item.text_color || '#ffffff'
      const borderColor = this.darkenHexForBadge(bg, 0.25)
      return {
        backgroundColor: bg,
        color: text,
        border: `2px solid ${borderColor}`,
      }
    },

    darkenHexForBadge(hex, amount = 0.2) {
      if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return hex
      const num = parseInt(hex.slice(1), 16)
      const r = Math.max(0, ((num >> 16) & 0xff) * (1 - amount))
      const g = Math.max(0, ((num >> 8) & 0xff) * (1 - amount))
      const b = Math.max(0, (num & 0xff) * (1 - amount))
      return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`
    },

    async applyStatusFromModal(item) {
      if (!item || !item.name || this.selectedSchedules.length === 0) return
      this.closeStatusModal()
      const count = this.selectedSchedules.length
      // No banco (schedule_list) usa-se "Conferência"; a badge exibida é "Em conferência"
      const statusToSend =
        item.name === 'Em conferência' ? 'Conferência' : item.name
      this.setBulkActionLoading(
        true,
        'Alterando status...',
        `Atualizando ${count} agendamento(s) para "${item.name}"`
      )
      try {
        await this.bulkUpdateStatus(statusToSend, 'Alteração em lote')
        this.clearSelection()
        // Badge já foi atualizada em bulkUpdateStatus (updateScheduleStatusInList); não recarregar lista para preservar filtros
        this.addNotification(
          `${count} agendamento(s) alterado(s) para "${item.name}"`,
          'success'
        )
      } catch (error) {
        console.error(
          'Erro ao alterar status em lote:',
          error?.response?.data || error
        )
        const msg =
          error?.response?.data?.details ||
          error?.response?.data?.error ||
          error?.message ||
          'Erro ao alterar status'
        this.addNotification(msg, 'error')
      } finally {
        this.setBulkActionLoading(false)
      }
    },
    async bulkUpdateStatusWithDate(newStatus, newDate, comment) {
      // Usar o apiClient global com cache
      const formattedDate = this.formatDateForBackend(newDate)
      for (const scheduleId of this.selectedSchedules) {
        const scheduleResponse = await apiClient.request(
          `/schedules/${scheduleId}`,
          {
            method: 'GET',
          }
        )
        const currentSchedule = scheduleResponse.schedule
        const updatePayload = {
          number: currentSchedule.number,
          nfe_key: currentSchedule.nfe_key,
          client: currentSchedule.client_cnpj || currentSchedule.client,
          case_count: currentSchedule.case_count,
          date: formattedDate,
          qt_prod: currentSchedule.qt_prod,
          historic: {
            ...currentSchedule.historic,
            [`date_change_${Date.now()}`]: {
              timestamp: new Date().toISOString(),
              user:
                this.getCurrentUser().user ||
                this.getCurrentUser().name ||
                'Usuário',
              action: `Data alterada de ${this.formatDateForDisplay(currentSchedule.date)} para ${this.formatDateForDisplay(formattedDate)}`,
              comment: 'Data alterada via bulk action',
              previous_date: currentSchedule.date,
              new_date: formattedDate,
            },
          },
        }
        await apiClient.request(`/schedules/${scheduleId}`, {
          method: 'PUT',
          data: updatePayload,
        })
        const statusPayload = {
          status: newStatus,
          historic_entry: {
            user:
              this.getCurrentUser().user ||
              this.getCurrentUser().name ||
              'Usuário',
            action: `Status alterado para ${newStatus} com nova data ${this.formatDateForDisplay(formattedDate)}`,
            comment: comment,
          },
        }
        await apiClient.request(`/schedules/${scheduleId}/status`, {
          method: 'PATCH',
          data: statusPayload,
        })
      }
    },

    async bulkUpdateStatusWithDateAndComment(newStatus, newDate) {
      // Usar o apiClient global com cache
      const formattedDate = this.formatDateForBackend(newDate)
      for (const scheduleId of this.selectedSchedules) {
        const scheduleResponse = await apiClient.request(
          `/schedules/${scheduleId}`,
          {
            method: 'GET',
          }
        )
        const currentSchedule = scheduleResponse.schedule

        // Gerar comentário personalizado para contestação
        const oldDateFormatted = this.formatDateForDisplay(currentSchedule.date)
        const newDateFormatted = this.formatDateForDisplay(formattedDate)
        const customComment = `A data escolhida (${oldDateFormatted}) está indisponível, a data escolhida pela nossa equipe é ${newDateFormatted}. Por gentileza confirmar em nossa plataforma.`

        const updatePayload = {
          number: currentSchedule.number,
          nfe_key: currentSchedule.nfe_key,
          client: currentSchedule.client_cnpj || currentSchedule.client,
          case_count: currentSchedule.case_count,
          date: formattedDate,
          qt_prod: currentSchedule.qt_prod,
          historic: {
            ...currentSchedule.historic,
            [`date_change_${Date.now()}`]: {
              timestamp: new Date().toISOString(),
              user:
                this.getCurrentUser().user ||
                this.getCurrentUser().name ||
                'Usuário',
              action: `Data alterada de ${oldDateFormatted} para ${newDateFormatted}`,
              comment: customComment,
              previous_date: currentSchedule.date,
              new_date: formattedDate,
            },
          },
        }
        await apiClient.request(`/schedules/${scheduleId}`, {
          method: 'PUT',
          data: updatePayload,
        })
        const statusPayload = {
          status: newStatus,
          historic_entry: {
            user:
              this.getCurrentUser().user ||
              this.getCurrentUser().name ||
              'Usuário',
            action: `Status alterado para ${newStatus} com nova data ${newDateFormatted}`,
            comment: customComment,
          },
        }
        await apiClient.request(`/schedules/${scheduleId}/status`, {
          method: 'PATCH',
          data: statusPayload,
        })
      }
    },

    getCurrentUser() {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return 'Usuário desconhecido'
        const user = JSON.parse(userData)
        return user.user || 'Usuário desconhecido'
      } catch (error) {
        return 'Usuário desconhecido'
      }
    },
    formatDateForBackend(dateString) {
      if (!dateString) return null
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateString
      }
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },

    // Métodos de filtros
    handleFiltersChanged(newFilters) {
      this.currentFilters = { ...newFilters }
      // paginação removida.page = 1
      // paginação removida.hasMore = true
      this.schedules = [] // Limpar lista atual
      this.loadSchedules()
    },

    handleResetFilters() {
      console.log('🔄 Resetando filtros')
      this.currentFilters = {
        status: '',
        date_from: '',
        date_to: '',
      }
      // paginação removida.page = 1
      // paginação removida.hasMore = true
      this.schedules = [] // Limpar lista atual
      // Atualizar apenas a lista sem recarregar a página
      this.loadSchedules(false)
    },

    handleReprocessSuccess(scheduleData) {
      console.log(
        '✅ Reprocessamento bem-sucedido para agendamento:',
        scheduleData.id
      )
      // Recarregar dados do dashboard se necessário
      this.loadEssentialDataOptimized()
    },

    handleReprocessToast(message) {
      this.addNotification(message, 'info')
    },

    async loadInitialData() {
      try {
        console.log('📊 Carregando dados iniciais...')

        // Definir mensagem de carregamento inicial
        this.setLoading(
          true,
          'Carregando Dashboard...',
          'Iniciando sistema e carregando dados'
        )

        // Carregar dados essenciais
        await this.loadEssentialDataOptimized()

        // Liberar interface
        this.setLoading(false)
        console.log('✅ Dados iniciais carregados!')
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error)
        this.addNotification('Erro ao carregar dados iniciais', 'error')
        this.setLoading(false)
      }
    },

    // CARREGAMENTO SIMPLES DE DADOS INICIAIS
    async loadInitialDataSimple() {
      console.log('📊 LOAD_INITIAL: === CARREGANDO DADOS INICIAIS ===')

      try {
        console.log('📊 LOAD_INITIAL: Iniciando statsLoading...')
        this.statsLoading = true

        // Carregar dados mockados primeiro para interface responder
        console.log('📊 LOAD_INITIAL: Carregando dados mockados...')
        this.loadMockData()

        // Atualizar mensagem de loading (sem chamar setLoading novamente)
        console.log('📊 LOAD_INITIAL: Atualizando mensagens de loading...')
        this.loadingMessage = 'Carregando Agendamentos...'
        this.loadingSubtext = 'Buscando dados mais recentes'

        // Carregar dados reais (aguardar conclusão) — nível 4 (Manutenção) não acessa agendamentos
        console.log('📊 LOAD_INITIAL: Iniciando carregamento de dados reais...')
        if (this.user && Number(this.user.level_access) === 4) {
          console.log(
            '📊 LOAD_INITIAL: Usuário nível 4 (Manutenção) - pulando carregamento de agendamentos'
          )
        } else {
          await this.loadRealDataInBackground()
          console.log('📊 LOAD_INITIAL: Dados reais carregados!')
        }
      } catch (error) {
        console.error(
          '❌ LOAD_INITIAL: Erro ao carregar dados iniciais:',
          error
        )
        this.addNotification(
          'Interface carregada - dados sendo obtidos...',
          'info'
        )
      } finally {
        console.log('📊 LOAD_INITIAL: Entrando no bloco finally...')
        this.statsLoading = false
        console.log('📊 LOAD_INITIAL: statsLoading = false')
        console.log('✅ LOAD_INITIAL: Finalizando loadInitialDataSimple!')
      }
    },

    // CARREGAR DADOS MOCKADOS PARA INTERFACE RESPONDER
    loadMockData() {
      console.log('Carregando dados mockados...')

      this.dashboardStats = {
        solicitacoes: 0,
        agendamentos: 0,
        conferencia: 0,
        tratativa: 0,
      }

      this.schedules = []

      console.log('Dados mockados carregados')
    },

    // CARREGAR DADOS REAIS EM BACKGROUND (SEM BLOQUEAR)
    async loadRealDataInBackground() {
      console.log('🚀 LOAD_REAL: === CARREGANDO DADOS REAIS ===')

      /** Declarado fora do try para o catch poder dar await e limpar clientsLoadingGlobal */
      let clientsPromise = null
      try {
        console.log('🚀 LOAD_REAL: Verificando pré-requisitos...')
        console.log('🚀 LOAD_REAL: apiClient disponível:', !!apiClient)
        console.log(
          '🚀 LOAD_REAL: Token presente:',
          !!localStorage.getItem('token')
        )

        console.log(
          '🚀 LOAD_REAL: Iniciando /schedules + /clients em paralelo...'
        )

        // 🔧 OTIMIZAÇÃO: Carregar apenas a PRIMEIRA página (50 agendamentos)
        // 🔧 Paralelo com clientes: antes aguardava schedules e só depois /clients (soma dos tempos).
        const schedulesPromise = Promise.race([
          apiClient.request('/schedules', {
            method: 'GET',
            params: {
              page: 1,
              limit: 50,
              skip_count: 1,
            },
            timeout: 60000,
          }),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Timeout na requisição de agendamentos')),
              60000
            )
          ),
        ])
        clientsPromise = this.loadClientsFromAPI()

        let response
        try {
          response = await schedulesPromise
        } catch (schedErr) {
          await clientsPromise.catch(() => {})
          throw schedErr
        }

        console.log(
          '✅ LOAD_REAL: Primeira página carregada:',
          response?.schedules?.length || 0,
          'agendamentos'
        )

        if (response && response.schedules && response.schedules.length > 0) {
          // 🔍 ANTI-DUPLICAÇÃO: Aplicar deduplicação aos dados carregados
          console.log(
            '🔍 [LOAD_REAL] Aplicando deduplicação aos dados carregados...'
          )
          const uniqueSchedules = this.removeDuplicateSchedules(
            response.schedules,
            'loadRealDataInBackground'
          )

          console.log(
            '🔍 [LOAD_REAL] Atribuindo agendamentos únicos a this.schedules'
          )
          console.log(
            '🔍 [LOAD_REAL] Antes:',
            this.schedules.length,
            '| Depois:',
            uniqueSchedules.length
          )
          this.schedules = uniqueSchedules

          // 🔧 Atualizar totalItems com base na resposta do backend
          // Isso garante que a paginação funcione corretamente no primeiro acesso
          if (response?.pagination?.total !== undefined) {
            this.totalItems = response.pagination.total
            console.log(
              '✅ LOAD_REAL: totalItems atualizado do servidor:',
              this.totalItems
            )
          } else {
            // Fallback: estimar total baseado nos agendamentos carregados
            this.totalItems = uniqueSchedules.length
            console.log(
              '⚠️ LOAD_REAL: totalItems estimado (fallback):',
              this.totalItems
            )
          }

          console.log('✅ LOAD_REAL: Estado de paginação:', {
            totalItems: this.totalItems,
            itemsPerPage: this.itemsPerPage,
            totalPages: this.totalPages,
            currentPage: this.currentPage,
          })

          console.log('✅ LOAD_REAL: Calculando stats...')
          this.calculateStatsFromData(this.schedules)
          console.log('✅ LOAD_REAL: Stats calculados!')
        } else {
          console.warn('⚠️ LOAD_REAL: Nenhum agendamento encontrado')
          this.totalItems = 0
        }

        // Forçar atualização da interface para garantir que a lista seja renderizada
        console.log('🔄 LOAD_REAL: Atualizando interface...')
        this.$nextTick(() => {
          console.log('🔄 LOAD_REAL: Interface atualizada com novos dados')
        })

        await clientsPromise
        console.log('📋 LOAD_REAL: Clientes (paralelo) concluídos')

        console.log('🎉 LOAD_REAL: Carregamento completo!')
      } catch (error) {
        if (clientsPromise) {
          await clientsPromise.catch(() => {})
        }
        const isAborted =
          error?.code === 'ERR_CANCELED' ||
          error?.message?.toLowerCase?.().includes('aborted')
        if (!isAborted) {
          console.error('❌ LOAD_REAL: Erro ao carregar dados reais:', error)
          this.addNotification(
            'Erro ao carregar dados - usando dados locais',
            'warning'
          )
        }
        // Manter dados mockados em caso de erro
      }

      console.log('🏁 LOAD_REAL: Finalizando loadRealDataInBackground')
    },

    async loadClientsFromAPI() {
      if (this.clientsLoadingGlobal || this.availableClientsGlobal.length > 0) {
        console.log('🔄 Clientes já carregados ou carregamento em andamento')
        return
      }

      console.log('📋 Carregando lista de clientes...')

      this.clientsLoadingGlobal = true

      try {
        console.log('🏢 Carregando clientes da API...')

        const apiClient = window.apiClient
        const response = await Promise.race([
          apiClient.request('/clients', {
            method: 'GET',
          }),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Timeout ao carregar clientes')),
              60000
            )
          ),
        ])

        let allClients = response.data || []
        allClients = allClients.filter(client => client.cnpj)

        // Garantir que todos os clientes tenham o campo crossdocking
        allClients = allClients.map(client => ({
          ...client,
          crossdocking: client.crossdocking || '0', // Garantir que crossdocking tenha valor padrão
        }))

        console.log('🔍 [CLIENTS LOAD] Primeiro cliente após normalização:', {
          cnpj: allClients[0]?.cnpj,
          name: allClients[0]?.name,
          crossdocking: allClients[0]?.crossdocking,
          crossdockingType: typeof allClients[0]?.crossdocking,
        })

        const currentUser = this.getCurrentUser()

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

        this.availableClientsGlobal = allClients
        console.log(
          `✅ ${allClients.length} clientes carregados e armazenados globalmente`
        )

        // Disponibilizar globalmente para os modais
        window.globalClientsCache = {
          clients: allClients,
          loadedAt: Date.now(),
        }
      } catch (error) {
        console.error('❌ Erro ao carregar clientes da API:', error)

        if (error.message === 'Timeout ao carregar clientes') {
          console.warn('⏱️ Timeout no carregamento de clientes')
        }

        // Não mostrar notificação para não poluir a interface
        // Os modais terão fallback para carregar individualmente se necessário
      } finally {
        this.clientsLoadingGlobal = false
      }
    },

    getCurrentUser() {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    },

    // Métodos para busca por NFe/Chave
    handleSearchResults(searchData) {
      console.log('🔍 Resultados recebidos:', searchData)

      const results = searchData.results || []

      // Salvar agendamentos originais se ainda não estão salvos
      if (!this.isSearchActive) {
        this.originalSchedules = [...this.schedules]
      }

      if (results.length > 0) {
        // ANTI-DUPLICAÇÃO: Aplicar deduplicação aos resultados da busca
        const uniqueResults = this.removeDuplicateSchedules(
          results,
          'handleSearchResults'
        )
        console.log(
          `🔧 Busca - Após deduplicação: ${uniqueResults.length} resultados únicos`
        )

        // Substituir a lista de agendamentos pelos resultados da busca
        this.schedules = uniqueResults
        this.isSearchActive = true
        this.currentSearchInfo = {
          type: searchData.searchType,
          value: searchData.searchValue,
          count: results.length,
        }

        this.addNotification(
          `${results.length} agendamento(s) encontrado(s) - Lista filtrada`,
          'success'
        )
      } else {
        // Se não há resultados, limpar a lista
        this.schedules = []
        this.isSearchActive = true
        this.currentSearchInfo = {
          type: searchData.searchType,
          value: searchData.searchValue,
          count: 0,
        }

        this.addNotification('Nenhum agendamento encontrado', 'info')
      }
    },

    handleSearchError(errorMessage) {
      this.addNotification(errorMessage, 'error')
    },

    handleSearchStart() {
      console.log('🔍 Iniciando busca por NFe/chave...')
    },

    clearSearch() {
      if (this.isSearchActive) {
        // Restaurar agendamentos originais
        this.schedules = [...this.originalSchedules]
        this.isSearchActive = false
        this.currentSearchInfo = null
        this.originalSchedules = []

        this.addNotification('Busca limpa - Lista restaurada', 'info')
      }
    },

    // Verificar versão e limpar cache se necessário
    checkVersionAndClearCache() {
      const currentAppVersion = '1.0.0'
      const storedVersion = localStorage.getItem('app_version')

      if (storedVersion && storedVersion !== currentAppVersion) {
        console.log(
          `🔄 Nova versão detectada: ${storedVersion} → ${currentAppVersion}`
        )

        // Limpar todos os caches relacionados à aplicação
        const cacheKeys = [
          'schedules_cache',
          'clients_cache',
          'products_cache',
          'user_permissions_cache',
          'api_cache',
          'schedule_filters',
          'batch_products_cache',
        ]

        cacheKeys.forEach(key => {
          localStorage.removeItem(key)
          sessionStorage.removeItem(key)
        })

        // Limpar cache de API se existir
        if ('caches' in window) {
          caches.delete('api-cache')
        }

        console.log(`✨ Caches limpos para versão ${currentAppVersion}`)

        // Notificações removidas - informações disponíveis na página de versionamento
      }

      // Sempre atualizar a versão armazenada
      localStorage.setItem('app_version', currentAppVersion)
    },
  },

  async mounted() {
    // App.vue inicializado
    console.log('🚀 MOUNTED: Iniciando App.vue...')

    // Expor notificações do sistema globalmente - evita alert() do navegador em qualquer módulo
    window.__showToast = (msg, type) =>
      this.addNotification(msg, type || 'info')

    // GARANTIR ABSOLUTAMENTE QUE O SCROLL ESTEJA HABILITADO NO MOUNT
    // Forçar remoção de todos os estilos que podem bloquear scroll
    document.body.style.overflow = ''
    document.body.style.overflowY = 'auto'
    document.body.style.overflowX = 'hidden'
    document.body.style.position = 'relative'
    document.body.style.width = ''
    document.body.style.top = ''
    document.body.style.height = ''
    document.documentElement.style.overflowY = 'auto'
    document.documentElement.style.overflowX = 'hidden'
    document.documentElement.style.position = ''

    // Verificar se houve atualização de versão e limpar caches se necessário
    this.checkVersionAndClearCache()

    // Carregar preferência de itens por página do localStorage
    this.loadItemsPerPagePreference()

    // Adicionar listener para fechar dropdown de exportação ao clicar fora
    document.addEventListener('click', this.handleClickOutsideExportDropdown)

    // Após inicializar, garantir que scroll esteja habilitado se não estiver em mobile com sidebar
    this.$nextTick(() => {
      if (!this.isMobile || !this.isSidebarOpen) {
        this.updateBodyScroll()
      }
    })

    // TIMEOUT DE SEGURANÇA: Forçar finalização do loading após 60 segundos (bancos remotos podem demorar)
    const loadingTimeout = setTimeout(() => {
      console.log(
        '⏰ TIMEOUT: Forçando finalização do loading após 60 segundos!'
      )
      this.setLoading(false)
      this.addNotification('Sistema carregado (modo de segurança)', 'warning')
    }, 60000)

    // Registrar timestamp de início e listener de visibilidade para detectar loading travado
    // (quando a aba fica em background, os timers são throttled pelo browser e podem não disparar)
    this._mountedStartTime = Date.now()
    this._mountedComplete = false
    document.addEventListener('visibilitychange', this._handleVisibilityForLoading)

    // Event listener para fechar dropdown do usuário ao clicar fora
    document.addEventListener('click', this.handleClickOutside)

    // Inicializar responsividade móvel
    this.resizeCleanup = this.setupResizeListener()

    // Inicializar redimensionamento automático das status badges
    this.initStatusBadgeAutoResize()

    try {
      // Carregamento simples - sem verificações complexas
      console.log('🔄 MOUNTED: Iniciando loading...')
      this.setLoading(true, 'Carregando Sistema...', 'Aguarde um momento')

      // Carregar dados do localStorage (já verificado no main.js)
      console.log('👤 MOUNTED: Carregando usuário...')
      this.loadUserFromStorage()

      // Buscar dados atualizados do usuário do banco de dados
      console.log(
        '🔄 MOUNTED: Atualizando dados do usuário do banco de dados...'
      )
      await this.refreshUserFromDatabase()

      // Atualizar dados do usuário periodicamente (a cada 5 minutos)
      this.userRefreshInterval = setInterval(async () => {
        console.log(
          '🔄 [INTERVAL] Atualizando dados do usuário do banco de dados...'
        )
        await this.refreshUserFromDatabase()
      }, 300000) // 5 minutos

      // Atualizar dados do usuário quando a janela recebe foco (usuário volta para a aba)
      window.addEventListener('focus', this.handleWindowFocus)

      // Carregar dados iniciais sem verificações de token
      console.log('📊 MOUNTED: Carregando dados iniciais...')
      await this.loadInitialDataSimple()

      // Inicializar permissões
      console.log('🔐 MOUNTED: Inicializando permissões...')
      initializePermissions()

      // Iniciar pré-carregamento em background após carregamento inicial
      setTimeout(() => {
        console.log('⚡ MOUNTED: Pré-carregando páginas...')
        this.preloadPages()
      }, 1000)

      console.log('✅ MOUNTED: App.vue carregado com sucesso')
      console.log('🔍 [MOUNTED] Estado final após mounted():', {
        schedulesCount: this.schedules.length,
        isSearchActive: this.isSearchActive,
        user: this.user?.user || 'N/A',
      })

      // Verificar se há mensagem de sucesso salva após reload
      const reloadSuccessMessage = localStorage.getItem('reloadSuccessMessage')
      if (reloadSuccessMessage) {
        this.addNotification(reloadSuccessMessage, 'success')
        localStorage.removeItem('reloadSuccessMessage')
        console.log(
          '📢 Mensagem de sucesso exibida após reload:',
          reloadSuccessMessage
        )
      }

      // Perfis somente-BI antes do redirecionamento padrão de nível 4 (manutenção)
      if (this.user && isBiDiretoriaPortalOnlyUser(this.user)) {
        console.log(
          '🔄 MOUNTED: Usuário restrito ao BI Diretoria — abrindo painel'
        )
        this.$nextTick(() => {
          this.handleMenuClick('bi-diretoria')
        })
      } else if (this.user && isBiArmazensPortalOnlyUser(this.user)) {
        console.log(
          '🔄 MOUNTED: Usuário restrito à Análise Armazéns — abrindo BI'
        )
        this.$nextTick(() => {
          this.handleMenuClick('bi-armazens')
        })
      } else if (
        this.user &&
        Number(this.user.level_access) === 4 &&
        !isBiDiretoriaPortalOnlyUser(this.user) &&
        !isBiArmazensPortalOnlyUser(this.user)
      ) {
        console.log(
          '🔄 MOUNTED: Usuário nível 4 - redirecionando para Diaristas'
        )
        this.$nextTick(() => {
          this.handleMenuClick('diaristas')
        })
      }
    } catch (error) {
      console.error('❌ MOUNTED: Erro na inicialização do App.vue:', error)
      this.addNotification('Erro ao inicializar sistema', 'error')
    } finally {
      // CORREÇÃO CRÍTICA: Sempre finalizar loading para evitar tela infinita
      console.log(
        '🔄 MOUNTED: Finalizando loading da inicialização do App.vue...'
      )
      this.setLoading(false)
      console.log('✅ MOUNTED: Loading da inicialização finalizado!')

      // Limpar timeout de segurança
      clearTimeout(loadingTimeout)
      console.log('⏰ MOUNTED: Timeout de segurança limpo')

      // Marcar inicialização concluída e remover listener de visibilidade
      this._mountedComplete = true
      this._mountedStartTime = null
      document.removeEventListener('visibilitychange', this._handleVisibilityForLoading)
    }
  },

  beforeUnmount() {
    // Limpar intervalo de atualização de dados do usuário
    if (this.userRefreshInterval) {
      clearInterval(this.userRefreshInterval)
    }

    // Remover listener de visibilidade (segurança caso finally não tenha rodado)
    document.removeEventListener('visibilitychange', this._handleVisibilityForLoading)

    // Remover listener do dropdown de exportação
    document.removeEventListener('click', this.handleClickOutsideExportDropdown)

    // Remover listener de foco da janela
    window.removeEventListener('focus', this.handleWindowFocus)

    // CORREÇÃO: Sem scroll infinito na página principal - apenas remover listener de clique
    // Remover event listener para clique fora do dropdown
    document.removeEventListener('click', this.handleClickOutside)

    // Limpar listener de resize responsivo
    if (this.resizeCleanup) {
      this.resizeCleanup()
    }

    // Restaurar scroll do body caso esteja bloqueado
    document.body.style.overflow = ''
    document.body.style.overflowY = 'auto'
    document.body.style.position = ''
    document.body.style.width = ''
    document.body.style.top = ''
    document.documentElement.style.overflowY = 'auto'
    document.body.style.overflowY = 'auto'
    document.body.style.position = ''
    document.body.style.width = ''
    document.body.style.top = ''
    document.documentElement.style.overflowY = 'auto'

    // Limpar observers das status badges
    if (this._badgeResizeObserver) {
      this._badgeResizeObserver.disconnect()
    }
    if (this._badgeMutationObserver) {
      this._badgeMutationObserver.disconnect()
    }
  },
}

// Disponibilizar globalmente para compatibilidade
window.apiClient = apiClient
</script>

<style scoped>
/* Table wrapper - using page scroll instead of container scroll */
.table-container {
  position: relative;
}

.table-wrapper {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
}

.schedules-table {
  width: 100%;
  margin-bottom: 0;
}

/* Loading de filtros - overlay sutil sobre a tabela */
.table-container.filter-loading {
  opacity: 0.7;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.filter-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 0.375rem;
  backdrop-filter: blur(2px);
}

.filter-loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.filter-loading-spinner i {
  font-size: 2rem;
  color: #007bff;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Bordas verticais sutis entre colunas */
.schedules-table th,
.schedules-table td {
  border-right: 1px solid rgba(0, 0, 0, 0.08);
}

/* Remover borda da última coluna */
.schedules-table th:last-child,
.schedules-table td:last-child {
  border-right: none;
}

/* Coluna N° NF-e - Página Principal (2ª coluna) */
.content-area:not(.schedules-list) .schedules-table td:nth-child(2),
.content-area:not(.schedules-list) .schedules-table th:nth-child(2) {
  max-width: 100px;
  width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Coluna OC - Permite quebra de linha quando o texto ultrapassa o espaço */
.schedules-table .col-oc,
.schedules-table th.col-oc,
.schedules-table td.col-oc,
.content-area:not(.schedules-list) .schedules-table td.col-oc,
.content-area:not(.schedules-list) .schedules-table th.col-oc,
.schedules-list .schedules-table td.col-oc,
.schedules-list .schedules-table th.col-oc {
  max-width: 120px !important;
  width: 120px !important;
  min-width: 120px !important;
  white-space: normal !important;
  word-wrap: break-word !important;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
  text-align: center !important;
  padding: 12px 8px !important;
  vertical-align: middle !important;
  line-height: 1.4 !important;
}

/* Coluna Cliente - Página Principal (3ª coluna) - Apenas para níveis diferentes de 1 */
.content-area:not(.schedules-list) .schedules-table td:nth-child(3),
.content-area:not(.schedules-list) .schedules-table th:nth-child(3) {
  max-width: 380px;
  width: 380px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Colunas Fornecedor e Transportadora - Apenas para nível 1 */
/* Fornecedor (3ª coluna quando nível 1) */
.schedules-table td:nth-child(3)[v-if],
.schedules-table th:nth-child(3)[v-if] {
  width: 18% !important;
  min-width: 130px !important;
  max-width: 220px !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px !important;
}

/* Transportadora (4ª coluna quando nível 1) */
.schedules-table td:nth-child(4)[v-if],
.schedules-table th:nth-child(4)[v-if] {
  width: 15% !important;
  min-width: 120px !important;
  max-width: 180px !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px !important;
}

/* Coluna N° NF-e - Página Histórico (2ª coluna) */
.schedules-list .schedules-table td:nth-child(2),
.schedules-list .schedules-table th:nth-child(2) {
  max-width: 100px;
  width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Coluna Cliente - Página Histórico (3ª coluna) */
.schedules-list .schedules-table td:nth-child(3),
.schedules-list .schedules-table th:nth-child(3) {
  max-width: 380px;
  width: 380px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.schedules-table td:nth-child(4) {
  width: 15% !important;
  min-width: 120px !important;
  max-width: 180px !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: keep-all;
  font-size: 12px !important;
}

/* Coluna Vols - Largura reduzida */
.schedules-table .col-vols,
.schedules-table td.col-vols,
.schedules-table th.col-vols {
  width: 5% !important;
  min-width: 45px !important;
  max-width: 65px !important;
}

/* Coluna Status - Largura aumentada */
.schedules-table .col-status,
.schedules-table td.col-status,
.schedules-table th.col-status {
  width: 180px !important;
  min-width: 180px !important;
}

/* Estilos para seleção de linhas */
.checkbox-column {
  width: 50px;
  text-align: center;
  padding: 0.5rem !important;
}

.clickable-row {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable-row:hover {
  background-color: #f8f9fa;
}

.selected-row {
  background-color: #e3f2fd !important;
  border-left: 4px solid #1976d2;
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.1);
}

.selected-row:hover {
  background-color: #e3f2fd !important;
}

/* Estilos para colunas ordenáveis */
.sortable-column {
  cursor: pointer;
  user-select: none;
  position: relative;
  transition: all 0.2s ease;
}

.sortable-column:hover {
  background-color: #f0f0f0;
  color: #1976d2;
}

.sortable-column i {
  margin-left: 0.5rem;
  font-size: 0.85em;
  transition: all 0.2s ease;
}

.sortable-column .sort-icon-inactive {
  opacity: 0.3;
}

.sortable-column:hover .sort-icon-inactive {
  opacity: 0.6;
}

.sortable-column.sorted-asc,
.sortable-column.sorted-desc {
  background-color: #e3f2fd;
  color: #1976d2;
  font-weight: 600;
}

.sortable-column.sorted-asc i,
.sortable-column.sorted-desc i {
  opacity: 1;
  color: #1976d2;
}

/* Loading more indicator */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  color: #6c757d;
  border-top: 1px solid #dee2e6;
  background-color: #f8f9fa;
}

.loading-more i {
  margin-right: 0.5rem;
}

.loading-more p {
  margin: 0;
  font-size: 0.875rem;
}

/* Selection badge styles */
.selection-btn {
  position: relative;
}

.selection-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #dc3545;
  color: white;
  border-radius: 50%;
  min-width: 20px;
  height: 20px;
  font-size: 0.75rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Universal Loading Overlay */
.universal-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease-out;
}

.loading-content {
  background: white;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  width: 90%;
  animation: scaleIn 0.4s ease-out;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 24px auto;
}

.loading-content h3 {
  margin: 0 0 12px 0;
  color: #1f2937;
  font-size: 1.5rem;
  font-weight: 600;
}

.loading-content p {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.5;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.selected-info {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  gap: 1rem;
  font-weight: 500;
  color: #495057;
  flex-wrap: wrap;
}

/* Status badge styles */
.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: clamp(
    8px,
    var(--status-badge-font-size),
    var(--status-badge-font-size)
  );
  font-weight: 600;
  text-transform: uppercase;
  border: 1px solid;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 150px;
  min-width: 60px;
  white-space: nowrap;
  overflow: hidden;
  text-align: center;
  container-type: inline-size;
}

/* Células de tabela com status badge têm menos padding */
table td:has(.status-badge),
.schedules-table td:has(.status-badge),
.schedules-table td.col-status,
.schedules-table td:nth-child(7),
.table td:has(.status-badge) {
  padding: 6px !important;
}

/* Status badge em tabelas ocupa toda a célula */
table td .status-badge,
.schedules-table td .status-badge,
.table td .status-badge {
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

/* Container queries para redimensionar automaticamente o texto da badge */
@container (max-width: 120px) {
  .status-badge {
    font-size: clamp(4px, 1.5cqw, 8px) !important;
    padding: 4px 6px !important;
  }
}

@container (max-width: 100px) {
  .status-badge {
    font-size: clamp(4px, 1.2cqw, 7px) !important;
    padding: 4px 5px !important;
  }
}

@container (max-width: 80px) {
  .status-badge {
    font-size: clamp(3px, 1cqw, 6px) !important;
    padding: 3px 4px !important;
  }
}

@container (max-width: 60px) {
  .status-badge {
    font-size: clamp(3px, 0.8cqw, 5px) !important;
    padding: 2px 3px !important;
  }
}

/* Responsive font size for longer status text */
@media (max-width: 1200px) {
  .status-badge {
    font-size: clamp(
      8px,
      var(--status-badge-font-size),
      var(--status-badge-font-size)
    );
  }
}

@media (max-width: 768px) {
  .status-badge {
    font-size: var(--status-badge-font-size);
    max-width: 120px;
  }
}

@media (max-width: 480px) {
  .status-badge {
    font-size: var(--status-badge-font-size);
    max-width: 100px;
  }
}

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

/* Bulk Actions Styles */
.bulk-actions-bar {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  min-height: 50px;
}

.contestado-actions,
.solicitado-actions,
.agendado-actions,
.cancelar-actions,
.universal-actions,
.effectivate-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  white-space: nowrap;
}

.non-level-1-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  white-space: nowrap;
}

.level-1-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.action-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Modal Alterar status (lote) - Solicitação de agendamentos */
.status-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.status-modal-box {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  max-width: 520px;
  width: 90%;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.status-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.status-modal-header h3 {
  margin: 0;
  font-size: 1.15rem;
}

.status-modal-header .btn-close-modal {
  padding: 0.35rem 0.5rem;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  border-radius: 4px;
}

.status-modal-header .btn-close-modal:hover {
  background: #eee;
  color: #333;
}

.status-modal-body {
  padding: 1rem 1.25rem;
  overflow-y: auto;
}

.status-modal-hint {
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  color: #555;
}

.status-modal-loading {
  text-align: center;
  padding: 1.5rem;
  color: #666;
}

.status-badges-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.status-badge-option {
  padding: 0.4rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition:
    opacity 0.15s,
    transform 0.1s;
}

.status-badge-option:hover {
  opacity: 0.9;
  transform: scale(1.03);
}

/* Estilos específicos para botões de Recusar */
.recusar-actions .btn-primary {
  background-color: #007bff !important;
  border-color: #007bff !important;
  color: white !important;
}

.recusar-actions .btn-primary:hover {
  background-color: #0056b3 !important;
  border-color: #004085 !important;
}

.recusar-actions .btn-danger {
  background-color: #dc3545 !important;
  border-color: #dc3545 !important;
  color: white !important;
}

.recusar-actions .btn-danger:hover {
  background-color: #c82333 !important;
  border-color: #bd2130 !important;
}

/* Estilos de input de data movidos para .date-change-group */

/* ========================================
   ESTILOS BASE PARA header-actions (Desktop)
   ======================================== */
.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: nowrap;
}

.header-actions .btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  min-width: 0;
  flex-shrink: 0;
  line-height: 1.4;
  text-align: center;
}

.header-actions .btn-outline-danger {
  flex: 0 1 auto;
  min-width: 0;
}

.header-actions .btn-refresh-icon {
  flex: 0 0 auto;
}

.header-actions .btn i {
  flex-shrink: 0;
  align-self: center;
}

.header-actions .btn-primary {
  margin-right: 0;
  font-weight: 600;
}

/* ========================================
   MEDIA QUERIES PARA header-actions (Mobile)
   ======================================== */
@media (max-width: 768px) {
  /* Responsividade para seleção */
  .checkbox-column {
    width: 40px;
  }

  /* Responsividade para botões do header - Layout vertical em mobile */
  .header-actions {
    gap: 0.5rem;
    flex-wrap: wrap;
    flex-direction: row;
    align-items: stretch;
    width: 100%;
  }

  .header-actions .btn {
    font-size: 0.875rem;
    padding: 0.4rem 0.6rem;
    gap: 0.35rem;
    white-space: normal;
    justify-content: center;
  }

  .header-actions .btn i {
    font-size: 0.875rem;
    align-self: center;
  }

  /* Todos os botões ocupam 100% da largura EXCETO Recusar NF e Atualizar */
  .header-actions .btn:not(.btn-outline-danger):not(.btn-refresh-icon) {
    flex: 0 0 100%;
    width: 100%;
    max-width: 100%;
  }

  .header-actions .btn-primary {
    margin-right: 0;
    order: 1;
  }

  .header-actions .btn-outline-primary:not(.btn-refresh-icon) {
    order: 2;
  }

  /* Recusar NF e Atualizar na mesma linha */
  .header-actions .btn-outline-danger {
    flex: 1 1 auto;
    width: auto;
    max-width: calc(100% - 50px);
    min-width: 100px;
    order: 3;
  }

  .header-actions .btn-refresh-icon {
    flex: 0 0 auto;
    width: auto;
    order: 4;
  }

  .btn-refresh-icon {
    width: 36px;
    height: 36px;
  }

  .btn-refresh-icon i {
    font-size: 0.85rem;
  }
}

@media (max-width: 576px) {
  .header-actions {
    gap: 0.4rem;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: stretch;
  }

  .header-actions .btn {
    font-size: 0.8rem;
    padding: 0.35rem 0.5rem;
    gap: 0.3rem;
    white-space: normal;
    justify-content: center;
  }

  .header-actions .btn i {
    font-size: 0.8rem;
    align-self: center;
  }

  /* Todos os botões ocupam 100% da largura EXCETO Recusar NF e Atualizar */
  .header-actions .btn:not(.btn-outline-danger):not(.btn-refresh-icon) {
    flex: 0 0 100%;
    width: 100%;
    max-width: 100%;
  }

  /* Recusar NF e Atualizar na mesma linha */
  .header-actions .btn-outline-danger {
    flex: 1 1 auto;
    width: auto;
    max-width: calc(100% - 45px);
    min-width: 90px;
    order: 3;
  }

  .header-actions .btn-refresh-icon {
    flex: 0 0 auto;
    width: auto;
    order: 4;
  }

  .btn-refresh-icon {
    width: 32px;
    height: 32px;
  }

  .btn-refresh-icon i {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .header-actions {
    gap: 0.3rem;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: stretch;
  }

  .header-actions .btn {
    font-size: 0.75rem;
    padding: 0.3rem 0.45rem;
    gap: 0.25rem;
    white-space: normal;
    justify-content: center;
  }

  .header-actions .btn i {
    font-size: 0.75rem;
    align-self: center;
  }

  /* Todos os botões ocupam 100% da largura EXCETO Recusar NF e Atualizar */
  .header-actions .btn:not(.btn-outline-danger):not(.btn-refresh-icon) {
    flex: 0 0 100%;
    width: 100%;
    max-width: 100%;
  }

  /* Recusar NF e Atualizar na mesma linha */
  .header-actions .btn-outline-danger {
    flex: 1 1 auto;
    width: auto;
    max-width: calc(100% - 40px);
    min-width: 80px;
    order: 3;
  }

  .header-actions .btn-refresh-icon {
    flex: 0 0 auto;
    width: auto;
    order: 4;
  }
}

@media (max-width: 360px) {
  .header-actions {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: stretch;
  }

  .header-actions .btn {
    font-size: 0.7rem;
    padding: 0.25rem 0.4rem;
    justify-content: center;
  }

  .header-actions .btn i {
    font-size: 0.7rem;
  }

  /* Todos os botões ocupam 100% da largura EXCETO Recusar NF e Atualizar */
  .header-actions .btn:not(.btn-outline-danger):not(.btn-refresh-icon) {
    flex: 0 0 100%;
    width: 100%;
    max-width: 100%;
  }

  /* Recusar NF e Atualizar na mesma linha */
  .header-actions .btn-outline-danger {
    flex: 1 1 auto;
    width: auto;
    max-width: calc(100% - 38px);
    min-width: 70px;
    order: 3;
  }

  .header-actions .btn-refresh-icon {
    flex: 0 0 auto;
    width: auto;
    order: 4;
  }

  .btn-refresh-icon {
    width: 30px;
    height: 30px;
  }

  .btn-refresh-icon i {
    font-size: 0.7rem;
  }
}

@media (max-width: 768px) {
  .bulk-actions-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .bulk-actions {
    justify-content: center;
  }

  .contestado-actions,
  .solicitado-actions,
  .agendado-actions,
  .txt-actions {
    flex-wrap: wrap;
    justify-content: center;
  }

  .non-level-1-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
}

/* Header actions - ESTILOS BASE REMOVIDOS - Agora estão antes das media queries */

/* Checkboxes maiores */
.schedules-table input[type='checkbox'] {
  transform: scale(1.5);
  margin: 0;
  cursor: pointer;
}

/* Botão Aceitar Cancelamento com cor vinho */
.btn-accept-cancel {
  background-color: #8b1538 !important;
  border-color: #8b1538 !important;
  color: white !important;
}

.btn-accept-cancel:hover {
  background-color: #6b1028 !important;
  border-color: #6b1028 !important;
  color: white !important;
}

.btn-accept-cancel:focus,
.btn-accept-cancel:active {
  background-color: #5b0e20 !important;
  border-color: #5b0e20 !important;
  color: white !important;
  box-shadow: 0 0 0 0.2rem rgba(139, 21, 56, 0.25) !important;
}

/* Action buttons styling */
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0.5rem; /* Espaço entre ícone de relógio e botão de informações */
}

.action-icons-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 0 0 auto;
}

.action-icons-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 0 0 auto;
  margin-left: auto;
}

/* Botão Informações da NF-e (Solicitação de agendamento): ícone ocupa quase todo o espaço */
.btn-nfe-info {
  padding: 4px !important;
  min-width: 34px !important;
  width: 34px !important;
  height: 34px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  box-sizing: border-box !important;
  border-radius: 6px !important;
}
.btn-nfe-info i {
  font-size: 1.35rem !important;
  margin: 0 !important;
  line-height: 1 !important;
}

/* Estilos específicos para coluna de ações */
.actions-column {
  padding: 0.5rem !important;
  white-space: nowrap; /* Evitar quebra de linha */
}

.actions-column-header {
  padding: 0.75rem !important;
}

/* Ícone de agendamento atrasado */
.delayed-icon {
  color: #dc3545;
  font-size: 1.1rem;
  animation: pulse-slow 2s ease-in-out infinite;
}

/* Borda vermelha piscante para linha de agendamento atrasado */
.delayed-row {
  border-left: 4px solid #dc3545 !important;
  animation: pulse-border 2s ease-in-out infinite;
}

@keyframes pulse-slow {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes pulse-border {
  0%,
  100% {
    border-left-color: #dc3545;
    box-shadow: -2px 0 12px rgba(220, 53, 69, 0.6);
    background-color: rgba(220, 53, 69, 0.45);
  }
  50% {
    border-left-color: rgba(220, 53, 69, 0.5);
    box-shadow: -2px 0 6px rgba(220, 53, 69, 0.3);
    background-color: rgba(220, 53, 69, 0.2);
  }
}

/* Botão Efetivar Marcação */
.effectivate-actions .btn-success {
  background-color: #059669 !important;
  border-color: #059669 !important;
  color: white !important;
  font-weight: 600;
}

.effectivate-actions .btn-success:hover {
  background-color: #047857 !important;
  border-color: #047857 !important;
  color: white !important;
}

.effectivate-actions .btn-success:focus,
.effectivate-actions .btn-success:active {
  background-color: #065f46 !important;
  border-color: #065f46 !important;
  color: white !important;
  box-shadow: 0 0 0 0.2rem rgba(5, 150, 105, 0.25) !important;
}

/* TXT Generation Actions */
.txt-actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Estilos do txt-indicator removidos - não mais necessários */

.txt-actions .btn {
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
  font-weight: 500;
}

.txt-actions .btn-info {
  background-color: #17a2b8 !important;
  border-color: #17a2b8 !important;
  color: white !important;
}

.txt-actions .btn-info:hover {
  background-color: #138496 !important;
  border-color: #117a8b !important;
  color: white !important;
}

.txt-actions .btn-info:focus,
.txt-actions .btn-info:active {
  background-color: #117a8b !important;
  border-color: #10707f !important;
  color: white !important;
  box-shadow: 0 0 0 0.2rem rgba(23, 162, 184, 0.25) !important;
}

/* Caixa visual para agrupar input de data e botão alterar data */
.date-change-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem;
  transition: all 0.2s ease;
}

.date-change-group:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.date-change-group:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.date-change-group .form-control {
  border: 1px solid #d1d5db;
  background: white;
  margin: 0;
  width: 170px;
  transition: border-color 0.2s ease;
}

.date-change-group .form-control:focus {
  border-color: #3b82f6;
  box-shadow: none;
}

.date-change-group .action-btn {
  margin: 0;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Responsividade para a caixa de data */
@media (max-width: 768px) {
  .date-change-group {
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem;
  }

  .date-change-group .form-control {
    width: 100%;
  }

  .date-change-group .action-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Visual highlighting for booking schedules */
.booking-row {
  background-color: rgba(
    254,
    226,
    226,
    0.5
  ) !important; /* Light red background */
  border-left: 3px solid #ef4444; /* Red left border for emphasis */
}

.booking-row:hover {
  background-color: rgba(254, 226, 226, 0.7) !important;
}

/* Visual highlighting for not scheduled (is_booking = 2) */
.not-scheduled-row {
  background-color: rgba(0, 229, 255, 0.2) !important; /* Cyan background */
  border-left: 3px solid #00bcd4; /* Cyan left border for emphasis */
}

.not-scheduled-row:hover {
  background-color: rgba(0, 229, 255, 0.35) !important;
}

/* Estilos para o indicador de busca ativa */
.search-indicator {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-active-card {
  background: linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%) !important;
  border: 2px solid #2196f3 !important;
  border-radius: 12px !important;
  padding: 1rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15) !important;
  transition: all 0.2s ease !important;
  width: 100% !important;
  box-sizing: border-box !important;
  min-height: 70px !important;
  gap: 1rem !important;
  overflow: hidden !important;
}

.search-active-card:hover {
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
}

.search-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  flex-wrap: nowrap;
}

.search-header {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
}

.search-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #2196f3, #1976d2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
  box-shadow: 0 2px 6px rgba(33, 150, 243, 0.3);
}

.search-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  flex: 1;
}

.search-type {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.search-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1976d2;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-results {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  min-width: fit-content;
  margin: 0;
}

.results-count {
  display: flex;
  flex-direction: row;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.count-number {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1976d2;
  line-height: 1;
}

.count-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.search-actions {
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  flex-shrink: 0 !important;
  margin-left: auto !important;
  padding-left: 0.5rem !important;
  gap: 0.8rem !important;
  min-width: fit-content !important;
  max-width: 200px !important;
}

.clear-search-btn {
  background: linear-gradient(135deg, #f44336, #d32f2f) !important;
  border: none !important;
  border-radius: 6px !important;
  color: white !important;
  padding: 0.4rem 0.6rem !important;
  font-size: 0.8rem !important;
  font-weight: 500 !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  gap: 0.3rem !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 2px 6px rgba(244, 67, 54, 0.3) !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
}

.clear-search-btn:hover {
  background: linear-gradient(135deg, #d32f2f, #b71c1c);
  box-shadow: 0 4px 10px rgba(244, 67, 54, 0.4);
}

.clear-search-btn:active {
  box-shadow: 0 2px 6px rgba(244, 67, 54, 0.3);
}

/* Responsividade para o indicador de busca */
@media (max-width: 768px) {
  .search-active-card {
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem;
  }

  .search-content {
    width: 100%;
    justify-content: center;
  }

  .search-actions {
    margin: 0;
    margin-left: 0;
    padding-left: 0;
    width: 100%;
    justify-content: center;
    flex-direction: column;
    gap: 0.75rem;
  }

  .search-results {
    margin: 0;
    justify-content: center;
  }

  .clear-search-btn {
    width: 100%;
    justify-content: center;
  }

  .search-header {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }

  .search-details {
    align-items: center;
  }
}

@media (max-width: 480px) {
  .search-value {
    font-size: 0.95rem;
    word-break: break-all;
  }

  .search-icon {
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }
}

/* Content Area Override - Reduzir padding superior */
.content-area {
  padding-top: 0px !important;
  font-size: 14px;
}

.content-area * {
  font-size: inherit;
}

.content-area h1,
.content-area h2,
.content-area h3,
.content-area h4,
.content-area h5,
.content-area h6 {
  font-size: inherit;
}

.content-area .page-header h2 {
  font-size: 1.5rem;
}

.content-area .btn {
  font-size: 14px;
}

.content-area input,
.content-area select,
.content-area textarea {
  font-size: 14px;
}

.content-area .table,
.content-area .table th,
.content-area .table td {
  font-size: 14px;
}

/* Produtos cadastrados: 98% da área horizontal em todos os viewports (mesmo padrão Solicitação/Histórico) */
.content-area.content-area-products {
  width: 98% !important;
  max-width: 98% !important;
  margin-left: auto !important;
  margin-right: auto !important;
  padding: 8px 0 !important;
  overflow-x: hidden !important;
  box-sizing: border-box !important;
}

/* BI / acompanhamento: ocupar toda a largura útil do main-content (evita faixas laterais em várias proporções) */
/* display sem !important: o v-show do BI usa display:none inline; !important quebrava o ocultar e deixava um bloco vazio branco sobre outras páginas (ex.: Dev WhatsApp Diretoria). */
.main-content > .content-area.content-area-bi {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  display: flex;
  flex-direction: column !important;
}
.content-area.content-area-bi {
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  align-self: stretch !important;
  flex: 1 1 auto !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  padding: 8px 10px !important;
  box-sizing: border-box !important;
}
/* BIPage (SLA / Rejeição / Armazéns): margens laterais mínimas — .bi-page vem após keep-alive. */
.content-area.content-area-bi:has(.bi-page) {
  padding: 6px 2px !important;
}
/* Só BIPage (SLA/Rejeição/Armazéns): fundo alinhado ao tema do card, sem faixa branca do main */
.content-area.content-area-bi:has(.bi-page) {
  background: #202326 !important;
}
.content-area.content-area-bi:has(.bi-page.bi-theme-light) {
  background: var(--gray-50) !important;
}
/* keep-alive + BIPage: ocupar altura da coluna para o fundo escuro preencher a viewport */
.content-area.content-area-bi:has(.bi-page) > * {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  display: flex;
  flex-direction: column !important;
  width: 100% !important;
}

/* Gerencial Group Link: mesma cadeia flex — gráficos podem crescer até o fim da área útil */
.content-area.content-area-bi:has(.bi-gligl) > * {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  width: 100% !important;
}

/* Painel BI (empilhado): não prender keep-alive à altura útil — senão os blocos em flex
   dividem um viewport e trechos (ex.: Movimentação de clientes) ficam invisíveis. */
.content-area.content-area-bi:has(.bi-painel:not(.bi-painel--doc-fs)) > * {
  flex: 0 0 auto !important;
  min-height: auto !important;
  height: auto !important;
}

/* Page Header Override - margem inferior reduzida */
.page-header {
  margin-bottom: 6px !important;
}

/* Header title section - espaçamento mínimo entre título e contagem */
.header-title-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-title-section h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

/* Agendamentos count */
.agendamentos-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.count-badge {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.85rem;
  min-width: 24px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 123, 255, 0.3);
}

.count-label {
  color: #6c757d;
  font-weight: 500;
  font-size: 0.9rem;
}

.filter-info {
  color: #28a745;
  font-size: 0.8rem;
  font-style: italic;
  margin-left: 0.25rem;
}

/* Responsividade para agendamentos count */
@media (max-width: 768px) {
  .header-title-section {
    gap: 2px;
  }

  .agendamentos-count {
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .filter-info {
    display: block;
    margin-left: 0;
    margin-top: 0.25rem;
  }
}

/* Top Bar Styles */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 2rem;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  border-radius: 8px;
  position: relative;
  border: 1px solid #e9ecef;
}

/* Search Row inside Filters Container */
.search-row {
  display: grid;
  grid-template-columns: 1fr minmax(500px, 800px) 1fr;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
  width: 100%;
}

.search-row::before {
  content: '';
}

.search-input-group {
  display: flex;
  align-items: center;
  width: 100%;
  justify-self: center;
}

/* Botão de Exportar no Header (linha de pesquisa) - mesma altura do Buscar */
.export-btn-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  white-space: nowrap;
  justify-self: end;
  min-height: 38px;
  box-sizing: border-box;
}

.export-btn-header:hover:not(:disabled) {
  box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
}

.export-btn-header:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-dropdown-header {
  justify-self: end;
}

.export-dropdown-header .dropdown-toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.6rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-height: 38px;
  box-sizing: border-box;
}

.search-input-group .search-input {
  flex: 1;
  padding: 0.6rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px 0 0 6px;
  font-size: 0.95rem;
  background: white;
  transition: border-color 0.3s ease;
  outline: none;
}

.search-input-group .search-input:focus {
  outline: none;
  border-color: #007bff;
}

.search-input-group .search-input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.search-input-group .search-button {
  padding: 0.6rem 1.25rem;
  background: #6c757d;
  color: white;
  border: 2px solid #6c757d;
  border-left: none;
  border-radius: 0 6px 6px 0;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.search-input-group .search-button:hover:not(:disabled) {
  background: #5a6268;
  border-color: #5a6268;
}

.search-input-group .search-button:disabled {
  background: #adb5bd;
  border-color: #adb5bd;
  cursor: not-allowed;
}

/* Preloading Indicator */
.preloading-indicator {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  padding: 15px 20px;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 123, 255, 0.3);
  min-width: 250px;
  animation: slideInUp 0.3s ease-out;
}

.preload-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.preload-icon {
  font-size: 1.5rem;
  animation: bounce 2s infinite;
}

.preload-text {
  font-weight: 500;
  font-size: 0.9rem;
  text-align: center;
}

.preload-progress {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #28a745, #20c997);
  transition: width 0.3s ease;
  border-radius: 3px;
}

.preload-percentage {
  font-size: 0.8rem;
  font-weight: 600;
}

@keyframes slideInUp {
  from {
    transform: translateY(100px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

/* User Profile */
.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  margin-left: auto;
}

.user-profile:hover {
  transform: translateY(-1px);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #007bff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
}

.user-name {
  color: #495057;
  font-weight: 500;
  font-size: 0.9rem;
}

/* Badges de Cargas */
.loads-badges {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0; /* Permite que o container encolha quando vazio */
}

.load-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  border-radius: 18px;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
  cursor: default;
}

.load-badge i {
  font-size: 1rem;
}

.load-badge-null {
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
}

.load-badge-null:hover {
  background: linear-gradient(135deg, #357abd 0%, #2868a8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.load-badge-docar {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  animation: pulse-red 2s infinite;
}

.load-badge-docar:hover {
  background: linear-gradient(135deg, #c0392b 0%, #a93226 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

@keyframes pulse-red {
  0%,
  100% {
    box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
  }
  50% {
    box-shadow: 0 2px 16px rgba(231, 76, 60, 0.6);
  }
}

.dropdown-arrow {
  color: #6c757d;
  font-size: 0.8rem;
  transition: transform 0.3s ease;
}

.dropdown-arrow.rotate {
  transform: rotate(180deg);
}

/* User Dropdown */
.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  border: 1px solid #e9ecef;
  min-width: 150px;
  z-index: 1000;
  margin-top: 8px;
  overflow: hidden;
}

.dropdown-item {
  padding: 12px 16px;
  color: #495057;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 10px;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
}

.dropdown-item i {
  font-size: 0.9rem;
  color: #dc3545;
}

/* Responsive */
@media (max-width: 768px) {
  .top-bar {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    padding: 0.2rem 1rem;
    margin-bottom: 12px;
    min-height: unset;
  }

  .user-profile {
    align-self: center;
    padding: 2px 6px;
    gap: 6px;
  }

  .user-avatar {
    width: 26px;
    height: 26px;
    font-size: 0.75rem;
  }

  .user-name {
    font-size: 0.8rem;
  }

  .loads-badges {
    gap: 10px;
  }

  .load-badge {
    padding: 6px 14px;
    font-size: 0.95rem;
  }

  .load-badge i {
    font-size: 0.9rem;
  }

  /* Responsivo para busca */
  .search-row {
    justify-content: stretch;
  }

  .search-input-group {
    max-width: none;
  }

  .search-input-group .search-input,
  .search-input-group .search-button {
    border-radius: 4px;
  }

  .search-input-group .search-input {
    margin-bottom: 0.5rem;
    border-right: 1px solid #ddd;
  }

  .search-input-group .search-button {
    width: 100%;
    justify-content: center;
    border: 1px solid #28a745;
  }
}

/* Filtros Styles */
.filters-container {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Header mobile para filtros - oculto em desktop */
.filters-mobile-header {
  display: none;
}

/* Container colapsável - sem efeito em desktop */
.filters-collapsible {
  display: block;
}

.filters-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #555;
  margin-right: 1rem;
  white-space: nowrap;
}

.filters-header i {
  color: #007bff;
}

.filter-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
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
  margin-bottom: 0.25rem;
}

.filter-group .form-control {
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
}

/* Altura padronizada para todos os controles da linha de filtros (inputs nativos,
   selects, botão de estoque, botão de status e botões Hoje/Limpar). Sem isso, os
   inputs nativos renderizam ~36-38px enquanto os botões da .filter-buttons-row são
   forçados a 40px (regra abaixo) — visualmente os botões ultrapassam a altura da linha. */
.filter-row .filter-group .form-control,
.filter-row .filter-group .client-filter-btn,
.filter-row .filter-group .status-filter-btn,
.filter-row .filter-buttons-row .btn {
  height: 40px !important;
  min-height: 40px !important;
  box-sizing: border-box !important;
}

.filter-group .form-control:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  outline: none;
}

.client-filter-btn {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  padding: 0.5rem 0.75rem !important;
  font-size: 0.9rem !important;
  border-radius: 4px !important;
  text-align: left !important;
  position: relative !important;
  overflow: hidden !important;
  min-width: 0 !important;
}

.client-filter-content {
  display: flex !important;
  align-items: center !important;
  width: 100% !important;
  min-width: 0 !important;
  gap: 0.5rem !important;
}

.client-filter-text {
  flex: 1 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  min-width: 0 !important;
}

.client-filter-btn i.fa-warehouse {
  color: currentColor !important;
}

.client-filter-btn i.fa-times {
  color: #dc3545 !important;
  font-size: 0.75rem !important;
  padding: 2px !important;
  border-radius: 2px !important;
  transition: background-color 0.2s ease !important;
}

.client-filter-btn i.fa-times:hover {
  background-color: rgba(220, 53, 69, 0.1) !important;
}

.btn-primary.client-filter-btn {
  background-color: #007bff !important;
  border-color: #007bff !important;
  color: white !important;
}

.btn-outline-primary.client-filter-btn {
  background-color: white !important;
  border-color: #007bff !important;
  color: #007bff !important;
}

.btn-outline-primary.client-filter-btn:hover {
  background-color: #007bff !important;
  color: white !important;
}

/* Botão de atualizar circular (apenas ícone) */
.btn-refresh-icon {
  width: 42px;
  height: 42px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50% !important;
  transition: all 0.2s ease;
}

.btn-refresh-icon i {
  margin: 0;
  font-size: 1rem;
}

.btn-refresh-icon:hover {
  transform: rotate(180deg);
}

.btn-refresh-icon:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.filter-actions-buttons {
  display: flex;
  flex-direction: column !important;
  min-width: auto;
  flex: 0 0 auto;
  align-items: flex-start;
}

.filter-actions-buttons label {
  font-size: 0.85rem;
  font-weight: 500;
  color: transparent;
  margin-bottom: 0.3rem;
  line-height: normal;
}

.filter-buttons-row {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: nowrap;
  align-self: flex-end;
}

.filter-buttons-row .btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
  padding: 0.5rem 0.75rem !important;
  height: 40px !important;
  min-height: 40px !important;
  font-size: 0.9rem !important;
  box-sizing: border-box !important;
}

/* Dropdown de Exportação Excel */
.export-dropdown {
  position: relative;
  display: inline-block;
}

.export-dropdown .dropdown-toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.export-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  min-width: 180px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-top: 4px;
  overflow: hidden;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px;
  border: none;
  background: none;
  text-align: left;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: background-color 0.2s;
}

.export-option:hover {
  background-color: #f5f5f5;
}

.export-option:first-child {
  border-bottom: 1px solid #e0e0e0;
}

.export-option i {
  width: 16px;
  color: #28a745;
}

/* Responsividade da tabela de agendamentos no App.vue */
/* Desktop pequeno / Tablet grande (992px - 1199px) */
@media (min-width: 992px) and (max-width: 1199px) {
  /* Reduzir largura da coluna Fornecedor (para usuários nível 1) */
  .schedules-table td:nth-child(3)[v-if],
  .schedules-table th:nth-child(3)[v-if] {
    max-width: 200px !important;
    width: 200px !important;
    font-size: 10px !important;
  }

  /* Reduzir largura da coluna Transportadora (para usuários nível 1) */
  .schedules-table td:nth-child(4)[v-if],
  .schedules-table th:nth-child(4)[v-if] {
    max-width: 180px !important;
    width: 180px !important;
    font-size: 10px !important;
  }

  .schedules-table td:nth-child(4) {
    max-width: 180px !important;
    font-size: 10px !important;
  }
}

/* Tablet (768px - 991px) */
@media (min-width: 768px) and (max-width: 991px) {
  /* Reduzir largura da coluna Fornecedor (para usuários nível 1) */
  .schedules-table td:nth-child(3)[v-if],
  .schedules-table th:nth-child(3)[v-if] {
    max-width: 170px !important;
    width: 170px !important;
    font-size: 9px !important;
  }

  /* Reduzir largura da coluna Transportadora (para usuários nível 1) */
  .schedules-table td:nth-child(4)[v-if],
  .schedules-table th:nth-child(4)[v-if] {
    max-width: 150px !important;
    width: 150px !important;
    font-size: 9px !important;
  }

  .schedules-table td:nth-child(4) {
    max-width: 150px !important;
    font-size: 9px !important;
  }
}

/* Mobile grande (576px - 767px) */
@media (min-width: 576px) and (max-width: 767px) {
  /* Reduzir largura da coluna Fornecedor (para usuários nível 1) */
  .schedules-table td:nth-child(3)[v-if],
  .schedules-table th:nth-child(3)[v-if] {
    max-width: 140px !important;
    width: 140px !important;
    font-size: 8px !important;
  }

  /* Reduzir largura da coluna Transportadora (para usuários nível 1) */
  .schedules-table td:nth-child(4)[v-if],
  .schedules-table th:nth-child(4)[v-if] {
    max-width: 120px !important;
    width: 120px !important;
    font-size: 8px !important;
  }

  .schedules-table td:nth-child(4) {
    max-width: 120px !important;
    font-size: 8px !important;
  }
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

/* Estilos reutilizados para modal de filtro de cliente */
.search-container {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  background-color: #f8f9fa;
  flex-shrink: 0 !important;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #6c757d;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  background-color: white;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.search-input::placeholder {
  color: #adb5bd;
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  color: #495057;
  background-color: #f1f3f4;
}

.search-results-info {
  margin-top: 8px;
  font-size: 12px;
  color: #6c757d;
  text-align: center;
}

.search-results-info span {
  background-color: #e9ecef;
  padding: 4px 8px;
  border-radius: 12px;
}

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

/* Header do modal de seleção - manter em linha */
.estoque-selection-modal .modal-header {
  display: flex !important;
  flex-direction: row !important;
  justify-content: space-between !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
  padding: 12px 16px !important;
  gap: 10px !important;
}

.estoque-selection-modal .modal-header h3 {
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  font-size: 1rem !important;
  flex: 1 !important;
  white-space: nowrap !important;
}

.estoque-selection-modal .modal-header h3 i {
  font-size: 1rem !important;
  color: #3b82f6 !important;
}

.estoque-selection-modal .modal-close-btn {
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

.estoque-selection-modal .modal-close-btn:hover {
  background: #e2e8f0 !important;
  color: #dc3545 !important;
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
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
}

.clickable-item:hover {
  background-color: #f8f9fa !important;
  border-color: #007bff !important;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15) !important;
  transform: translateY(-1px) !important;
}

.clickable-item:active {
  transform: translateY(0) !important;
  box-shadow: 0 1px 3px rgba(0, 123, 255, 0.2) !important;
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
  transform: translateX(4px) !important;
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
  text-align: center;
}

.loading-spinner {
  margin-bottom: 1rem;
}

.loading-spinner i {
  font-size: 2rem;
  color: #007bff;
}

.loading-text {
  font-size: 1.1rem;
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.5rem;
}

.loading-subtext {
  color: #6c757d;
}

.estoque-lista-vazia {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.estoque-lista-vazia i {
  font-size: 2rem;
  margin-bottom: 1rem;
}
/* CORREÇÃO ESPECÍFICA PARA O BOTÃO LIMPAR NO CONTAINER DE BUSCA */
.search-indicator .search-active-card {
  overflow: hidden !important;
  padding-right: 0.5rem !important;
  max-width: 100% !important;
  position: relative !important;
}

.search-indicator .search-actions {
  max-width: 165px !important;
  padding-right: 0 !important;
  margin-right: 0 !important;
  flex-wrap: nowrap !important;
  gap: 0.5rem !important;
}

.search-indicator .clear-search-btn {
  max-width: 75px !important;
  padding: 0.35rem 0.6rem !important;
  font-size: 0.8rem !important;
  margin-left: 0.4rem !important;
  border-radius: 6px !important;
  position: relative !important;
  right: 0 !important;
}

.search-indicator .clear-search-btn i {
  font-size: 0.75rem !important;
}

.search-indicator .clear-search-btn span {
  font-size: 0.8rem !important;
}

.search-indicator .search-results {
  max-width: 80px !important;
  overflow: hidden !important;
}

/* FORÇA O CONTAINER A CONTER TODOS OS ELEMENTOS */
.search-indicator .search-active-card * {
  max-width: 100% !important;
  box-sizing: border-box !important;
}

.search-indicator .search-active-card::after {
  content: '' !important;
  display: block !important;
  clear: both !important;
}

/* Supplier Tooltip Styles */
.supplier-tooltip {
  position: fixed;
  transform: translate(-50%, -100%);
  background: linear-gradient(135deg, #1c44f5 0%, #0077ff 100%);
  color: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  pointer-events: none;
  animation: tooltipFadeIn 0.2s ease-out;
  overflow: hidden;
  white-space: nowrap;
}

.supplier-tooltip::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #0077ff;
}

.supplier-tooltip-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.supplier-tooltip-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.supplier-tooltip-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.supplier-tooltip-label {
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.85;
}

.supplier-tooltip-label i {
  font-size: 12px;
  width: 14px;
}

.supplier-tooltip-label strong {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.supplier-tooltip-value {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  padding-left: 20px;
}

/* Delayed Tooltip Styles (Red Warning) */
.supplier-tooltip.delayed-tooltip {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  animation:
    pulse-tooltip 2s ease-in-out infinite,
    tooltipFadeIn 0.2s ease-out;
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
}

.supplier-tooltip.delayed-tooltip::after {
  border-top-color: #c82333;
}

.supplier-tooltip-warning {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px;
}

.supplier-tooltip-warning i {
  font-size: 16px;
  animation: pulse-slow 2s ease-in-out infinite;
}

.supplier-tooltip-warning strong {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

@keyframes pulse-tooltip {
  0%,
  100% {
    box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4);
  }
  50% {
    box-shadow: 0 4px 20px rgba(220, 53, 69, 0.7);
  }
}

.has-supplier-tooltip {
  position: relative;
}

.has-supplier-tooltip:hover {
  box-shadow: 0 0 0 2px rgba(28, 68, 245, 0.1);
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -100%) translateY(5px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%) translateY(0);
  }
}

/* ==================== ESTILOS DE PAGINAÇÃO ==================== */
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  margin-top: 10px;
  border-radius: 0 0 8px 8px;
}

.pagination-info {
  color: #6c757d;
  font-size: 14px;
  font-weight: 500;
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-btn {
  padding: 8px 12px;
  border: 1px solid #dee2e6;
  background: white;
  color: #495057;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  min-width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-btn:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #adb5bd;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8f9fa;
}

.pagination-current {
  padding: 0 16px;
  color: #495057;
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
}

/* Botões de página específicos */
.pagination-page {
  min-width: 40px;
  font-weight: 500;
}

.pagination-page.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
  font-weight: 700;
  cursor: default;
}

.pagination-page.active:hover {
  background: #0056b3;
  border-color: #0056b3;
}

/* Botões de seta (anterior/próxima) */
.pagination-arrow {
  min-width: 40px;
}

/* Reticências */
.pagination-ellipsis {
  padding: 8px 4px;
  color: #6c757d;
  font-size: 14px;
  font-weight: 600;
  user-select: none;
  display: flex;
  align-items: center;
}

/* Wrapper para controles e seletor */
.pagination-controls-wrapper {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

/* Estilo para quando há apenas uma página */
.pagination-buttons.single-page {
  opacity: 0.5;
}

.pagination-buttons.single-page .pagination-btn {
  opacity: 0.6;
  pointer-events: none;
}

.pagination-buttons.single-page .pagination-btn.active {
  opacity: 0.8;
  background: linear-gradient(135deg, #6c757d, #5a6268);
  border-color: #6c757d;
  box-shadow: none;
}

/* Seletor de itens por página */
.items-per-page-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.items-per-page-selector label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: #6c757d;
  white-space: nowrap;
}

.items-per-page-selector label i {
  color: #007bff;
}

.items-per-page-select {
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #495057;
  background-color: white;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 12px;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 90px;
}

.items-per-page-select:hover {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.1);
}

.items-per-page-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
}

.pagination-info i {
  color: #007bff;
  margin-right: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .pagination-controls {
    flex-direction: column;
    gap: 12px;
    padding: 15px;
  }

  .pagination-controls-wrapper {
    flex-direction: column;
    gap: 1rem;
  }

  .pagination-info {
    font-size: 13px;
    text-align: center;
  }

  .items-per-page-selector {
    justify-content: center;
    width: 100%;
  }

  .items-per-page-selector label {
    font-size: 0.85rem;
  }

  .items-per-page-select {
    font-size: 0.85rem;
    padding: 0.4rem 1.8rem 0.4rem 0.6rem;
    min-width: 80px;
  }

  .pagination-buttons {
    width: 100%;
    justify-content: center;
  }

  .pagination-btn {
    padding: 6px 10px;
    min-width: 36px;
  }

  .pagination-page {
    min-width: 36px;
    font-size: 13px;
  }

  .pagination-ellipsis {
    padding: 6px 2px;
    font-size: 13px;
  }

  .pagination-current {
    padding: 0 12px;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .pagination-info {
    font-size: 0.8rem;
  }

  .pagination-btn {
    min-width: 32px;
    height: 32px;
    padding: 4px 8px;
    font-size: 0.8rem;
  }

  .pagination-page {
    min-width: 32px;
  }

  /* Esconder alguns botões em telas muito pequenas */
  .pagination-buttons .pagination-page:nth-child(n + 6) {
    display: none;
  }

  .items-per-page-selector label {
    font-size: 0.8rem;
  }

  .items-per-page-selector label i {
    display: none;
  }

  .items-per-page-select {
    font-size: 0.8rem;
    min-width: 75px;
  }

  .pagination-ellipsis {
    padding: 4px 2px;
    font-size: 12px;
  }
}

/* ============================================
   RESPONSIVIDADE MOBILE - PÁGINA PRINCIPAL
   ============================================ */

/* Ocultar tabela desktop em mobile */
@media (max-width: 768px) {
  .desktop-table-view {
    display: none !important;
  }

  .mobile-cards-view {
    display: block;
  }

  /* Cards Mobile: container 100% largura, cards ocupam toda a largura da div */
  .mobile-cards-view {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    background: transparent !important;
    box-shadow: none !important;
  }

  .schedule-card-mobile {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .schedule-card-mobile:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .schedule-card-mobile.selected-row {
    border-left: 4px solid #1976d2;
    background-color: #e3f2fd;
    box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
  }

  .schedule-card-mobile.delayed-row {
    border-left: 4px solid #ff9800;
  }

  .schedule-card-mobile.booking-row {
    background-color: rgba(254, 243, 199, 0.3);
  }

  .schedule-card-mobile.not-scheduled-row {
    background-color: rgba(254, 226, 226, 0.3);
  }

  /* Grid: linha 1 = checkbox, NF-e, status, botão (2 linhas) | linha 2 = cliente */
  .card-header-mobile.card-header-mobile-grid {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    grid-template-rows: auto auto;
    gap: 6px 10px;
    align-items: center;
  }

  .card-header-mobile-grid .card-checkbox-mobile {
    grid-column: 1;
    grid-row: 1;
  }

  .card-header-mobile-grid .card-nfe-mobile {
    grid-column: 2;
    grid-row: 1;
    min-width: 0;
  }

  .card-header-mobile-grid .card-status-mobile {
    grid-column: 3;
    grid-row: 1;
  }

  .card-header-mobile-grid .card-actions-mobile-span-2 {
    grid-column: 4;
    grid-row: 1 / span 2;
    align-self: stretch;
    display: flex;
    align-items: stretch;
  }

  .card-header-mobile-grid .card-actions-mobile-span-2 .btn-nfe-info {
    height: 100% !important;
    width: auto !important;
    aspect-ratio: 1;
    min-height: 48px !important;
    flex: 0 0 auto;
    padding: 6px !important;
  }

  .card-header-mobile-grid .card-client-mobile {
    grid-column: 1 / span 3;
    grid-row: 2;
    min-width: 0;
  }

  .card-checkbox-mobile {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-checkbox-mobile input[type='checkbox'] {
    width: 20px;
    height: 20px;
    cursor: pointer;
    margin: 0;
  }

  .card-nfe-mobile {
    font-weight: 600;
    font-size: 15px;
    color: #333;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-client-mobile {
    font-size: 13px;
    color: #666;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-status-mobile {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .card-row-oc-mobile {
    font-size: 13px;
    color: #555;
    padding: 4px 0;
  }

  .status-badge-mobile {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    text-align: center;
    white-space: nowrap;
    max-width: fit-content;
    line-height: 1.2;
  }

  .card-actions-mobile {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-actions-mobile .btn {
    padding: 8px;
    font-size: 16px;
    min-width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
  }

  .card-actions-mobile .btn i {
    margin: 0;
  }

  /* Botão Informações da NF-e: ícone ocupa quase todo o espaço, pequeno padding */
  .card-actions-mobile .btn-nfe-info {
    padding: 4px !important;
    min-width: 36px !important;
    width: 36px !important;
    height: 36px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    box-sizing: border-box !important;
  }
  .card-actions-mobile .btn-nfe-info i {
    font-size: 1.4rem !important;
    margin: 0 !important;
    line-height: 1 !important;
  }

  .card-second-row-mobile {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin-top: 10px;
    min-width: 0;
  }

  .card-info-box-mobile {
    background-color: #f0f0f0;
    border-radius: 6px;
    padding: 5px 5px;
    min-width: 0;
    min-height: 44px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-sizing: border-box;
  }

  .card-info-box-mobile--empty {
    min-height: 44px;
  }

  .card-info-item-mobile {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    justify-content: center;
  }

  .card-info-label-mobile {
    font-size: 11px;
    font-weight: 600;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1.2;
  }

  .card-info-value-mobile {
    font-size: 10px;
    color: #333;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
    word-break: break-word;
    line-height: 1.2;
  }

  .card-body-mobile {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #f0f0f0;
  }

  .card-row-mobile {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 14px;
  }

  .card-label-mobile {
    font-weight: 600;
    color: #666;
    min-width: 100px;
    flex-shrink: 0;
  }

  .card-value-mobile {
    color: #333;
    flex: 1;
    word-break: break-word;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .delayed-icon-mobile {
    color: #ff9800;
    font-size: 14px;
  }

  .mobile-empty-message {
    text-align: center;
    padding: 40px 20px;
    color: #666;
  }

  .mobile-empty-message i {
    font-size: 3em;
    margin-bottom: 16px;
    display: block;
    color: #ccc;
  }

  .mobile-empty-message p {
    margin: 8px 0;
    font-size: 14px;
  }

  /* Ajustes na barra de busca mobile */
  .search-row {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .search-row::before {
    display: none;
  }

  .search-input-group {
    width: 100%;
    flex-direction: column;
    gap: 8px;
    max-width: none;
    justify-self: stretch;
  }

  .search-input-group .search-input,
  .search-input {
    width: 100%;
    border-radius: 6px;
    border-right: 2px solid #e0e0e0;
    font-size: 16px; /* Evita zoom no iOS */
  }

  .export-btn-header,
  .export-dropdown-header {
    width: 100%;
    justify-self: stretch;
  }

  .export-btn-header {
    justify-content: center;
  }

  .export-dropdown-header .dropdown-toggle {
    width: 100%;
    justify-content: center;
  }

  .export-dropdown-header .export-dropdown-menu {
    width: 100%;
    left: 0;
    right: 0;
  }

  .search-input-group .search-button,
  .search-button {
    width: 100%;
    padding: 0.6rem 1.25rem;
    font-size: 16px;
    border-radius: 6px;
    border: 2px solid #6c757d;
    justify-content: center;
  }

  /* ========================================
     DROPDOWN DE FILTROS EM MOBILE
     ======================================== */

  /* Header mobile para toggle dos filtros */
  .filters-mobile-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.4rem 0.6rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 8px;
    cursor: pointer;
    margin-bottom: 0;
    transition: all 0.3s ease;
    border: 1px solid #dee2e6;
  }

  .filters-mobile-header:hover {
    background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  }

  .filters-mobile-header:active {
    transform: scale(0.98);
  }

  .filters-mobile-title {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-weight: 600;
    color: #495057;
  }

  .filters-mobile-title i {
    color: #007bff;
  }

  .filters-mobile-chevron {
    color: #6c757d;
    transition: transform 0.3s ease;
  }

  /* Container colapsável */
  .filters-collapsible {
    max-height: 2000px;
    overflow: hidden;
    transition:
      max-height 0.4s ease-in-out,
      opacity 0.3s ease,
      padding 0.3s ease;
    opacity: 1;
    padding-top: 12px;
  }

  .filters-collapsible.filters-collapsed {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
  }

  /* Ajustes nos filtros mobile */
  .filters-container {
    padding: 12px;
  }

  /* Solicitação de agendamentos (mobile): todos os textos do container de filtros = mesmo tamanho do nome do cliente no card (13px = .card-client-mobile) */
  .content-area-recebimento-agenda .filters-container,
  .content-area-recebimento-agenda .filters-container * {
    font-size: 13px !important;
  }
  .content-area-recebimento-agenda .filters-container input::placeholder,
  .content-area-recebimento-agenda
    .filters-container
    input::-webkit-input-placeholder,
  .content-area-recebimento-agenda .filters-container select,
  .content-area-recebimento-agenda .filters-container option {
    font-size: 13px !important;
  }

  /* Ocultar o header de filtros original dentro do filter-row em mobile */
  .filters-header {
    display: none;
  }

  .filter-group {
    margin-bottom: 12px;
  }

  .filter-group label {
    font-size: 14px;
    margin-bottom: 6px;
  }

  .filter-group .form-control {
    font-size: 16px; /* Evita zoom no iOS */
    padding: 10px;
  }

  .client-filter-btn {
    width: 100%;
    padding: 10px;
    font-size: 14px;
  }

  /* Sobrescreve TUDO no container de filtros (Solicitação): mesmo tamanho do nome do cliente no card (13px) - após as regras acima para garantir prioridade */
  .content-area-recebimento-agenda .schedules-list .filters-container,
  .content-area-recebimento-agenda .schedules-list .filters-container *,
  .content-area-recebimento-agenda .schedules-list .filters-container label,
  .content-area-recebimento-agenda
    .schedules-list
    .filters-container
    .form-control,
  .content-area-recebimento-agenda .schedules-list .filters-container input,
  .content-area-recebimento-agenda .schedules-list .filters-container select,
  .content-area-recebimento-agenda .schedules-list .filters-container option,
  .content-area-recebimento-agenda
    .schedules-list
    .filters-container
    .search-input,
  .content-area-recebimento-agenda
    .schedules-list
    .filters-container
    .search-button,
  .content-area-recebimento-agenda
    .schedules-list
    .filters-container
    .client-filter-btn,
  .content-area-recebimento-agenda
    .schedules-list
    .filters-container
    .client-filter-text,
  .content-area-recebimento-agenda .schedules-list .filters-container .btn,
  .content-area-recebimento-agenda
    .schedules-list
    .filters-container
    .export-btn-header,
  .content-area-recebimento-agenda
    .schedules-list
    .filters-container
    .dropdown-toggle,
  .content-area-recebimento-agenda
    .schedules-list
    .filters-container
    .export-option,
  .content-area-recebimento-agenda
    .schedules-list
    .filters-container
    .filters-mobile-title,
  .content-area-recebimento-agenda
    .schedules-list
    .filters-container
    .filters-mobile-chevron {
    font-size: 13px !important;
  }
  .content-area-recebimento-agenda
    .schedules-list
    .filters-container
    input::placeholder {
    font-size: 13px !important;
  }

  /* Histórico: filtros com mesmo tamanho de texto da Solicitação (13px = nome cliente no card) */
  .content-area-recebimento-historico .schedules-list .filters-container,
  .content-area-recebimento-historico .schedules-list .filters-container * {
    font-size: 13px !important;
  }
  .content-area-recebimento-historico
    .schedules-list
    .filters-container
    input::placeholder {
    font-size: 13px !important;
  }

  .client-filter-content {
    width: 100%;
    justify-content: space-between;
  }

  .filter-buttons-row {
    width: 100%;
    display: flex;
    gap: 8px;
  }

  .filter-buttons-row .btn {
    flex: 1;
    padding: 10px;
    font-size: 14px;
  }

  /* Remove espaço extra do grupo de botões de ação em mobile */
  .filter-actions-buttons {
    margin-bottom: 0;
  }

  .filter-actions-buttons label {
    display: none;
  }

  /* Ajustes na barra de ações em massa mobile */
  .bulk-actions-bar {
    padding: 12px;
    flex-direction: column;
    gap: 12px;
  }

  .selected-info {
    width: 100%;
  }

  .selection-btn {
    width: 100%;
    justify-content: center;
    padding: 10px;
  }

  .bulk-actions {
    width: 100%;
    flex-direction: column;
    gap: 10px;
  }

  .contestado-actions,
  .solicitado-actions,
  .agendado-actions,
  .conferencia-actions,
  .cancelar-actions,
  .recusar-actions,
  .level1-cancel-actions,
  .universal-actions,
  .effectivate-actions {
    width: 100%;
    flex-direction: column;
    gap: 10px;
  }

  .contestado-actions .action-btn,
  .solicitado-actions .action-btn,
  .agendado-actions .action-btn,
  .conferencia-actions .action-btn,
  .cancelar-actions .action-btn,
  .recusar-actions .action-btn,
  .level1-cancel-actions .action-btn,
  .universal-actions .action-btn,
  .effectivate-actions .action-btn {
    width: 100%;
    padding: 12px;
    font-size: 14px;
    justify-content: center;
  }

  .date-change-group {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }

  .date-change-group .form-control {
    width: 100%;
    font-size: 16px; /* Evita zoom no iOS */
    padding: 10px;
  }

  .date-change-group .action-btn {
    width: 100%;
    padding: 12px;
  }

  .contact-text {
    text-align: center;
    font-size: 13px;
    margin-top: 8px;
  }

  /* Indicador de busca mobile */
  .search-indicator {
    margin-bottom: 12px;
  }

  .search-active-card {
    padding: 12px;
    flex-direction: column;
    gap: 12px;
  }

  .search-content {
    width: 100%;
  }

  .search-actions {
    width: 100%;
    flex-direction: column;
    gap: 10px;
  }

  .clear-search-btn {
    width: 100%;
    padding: 10px;
    justify-content: center;
  }

  /* Paginação mobile */
  .pagination-controls {
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    margin-top: 16px;
  }

  .pagination-info {
    text-align: center;
    font-size: 13px;
    margin-bottom: 12px;
  }

  .pagination-buttons {
    flex-wrap: wrap;
    justify-content: center;
    gap: 4px;
  }

  .pagination-btn {
    min-width: 36px;
    height: 36px;
    padding: 6px 8px;
    font-size: 13px;
  }

  /* Conteúdo principal mobile */
  .content-area {
    padding: 12px;
  }

  /* Lista de pedidos: 98% da largura; sem padding horizontal; evita overflow */
  .content-area.content-area-expeditions {
    padding: 12px 0 !important;
    overflow-x: hidden !important;
  }

  /* Histórico de pedidos: 98% da largura (igual Lista de pedidos) */
  .content-area.content-area-expedition-history {
    padding: 12px 0 !important;
    overflow-x: hidden !important;
  }

  /* Solicitação de agendamento: mesma margem da expeditions-page (98%, margin auto, 8px 0) */
  .content-area.content-area-recebimento-agenda {
    width: 98% !important;
    max-width: 98% !important;
    margin-left: auto !important;
    margin-right: auto !important;
    padding: 8px 0 !important;
    overflow-x: hidden !important;
    box-sizing: border-box !important;
  }

  /* schedules-list: mesma margem/padding da div expeditions-page (8px 0 em 768px) */
  .content-area-recebimento-agenda .schedules-list,
  .content-area-recebimento-historico .schedules-list {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 8px 0 !important;
    box-sizing: border-box !important;
  }

  /* Histórico de agendamentos: mesmo espaço lateral da Solicitação (98%, margin auto) */
  .content-area.content-area-recebimento-historico {
    width: 98% !important;
    max-width: 98% !important;
    margin-left: auto !important;
    margin-right: auto !important;
    padding: 8px 0 !important;
    overflow-x: hidden !important;
    box-sizing: border-box !important;
  }

  /* Produtos cadastrados: 98% da área horizontal (mesmo padrão Solicitação/Histórico) */
  .content-area.content-area-products {
    width: 98% !important;
    max-width: 98% !important;
    margin-left: auto !important;
    margin-right: auto !important;
    padding: 8px 0 !important;
    overflow-x: hidden !important;
    box-sizing: border-box !important;
  }

  .content-area.content-area-bi {
    width: 100% !important;
    max-width: 100vw !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding: 8px 6px !important;
  }
  .content-area.content-area-bi:has(.bi-page) {
    background: #202326 !important;
  }
  .content-area.content-area-bi:has(.bi-page.bi-theme-light) {
    background: var(--gray-50) !important;
  }

  /* Header mobile */
  .header-title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .agendamentos-count {
    flex-wrap: wrap;
    gap: 8px;
  }
}

/* schedules-list: padding só vertical para cards ocuparem 100% da largura da div */
@media (max-width: 480px) {
  .content-area-recebimento-agenda .schedules-list,
  .content-area-recebimento-historico .schedules-list {
    padding: 12px 0 !important;
  }
}
@media (max-width: 360px) {
  .content-area-recebimento-agenda .schedules-list,
  .content-area-recebimento-historico .schedules-list {
    padding: 8px 0 !important;
  }
}
@media (max-width: 320px) {
  .content-area-recebimento-agenda .schedules-list,
  .content-area-recebimento-historico .schedules-list {
    padding: 6px 0 !important;
  }
}

/* Desktop: Ocultar cards mobile e mostrar tabela */
@media (min-width: 769px) {
  .mobile-cards-view {
    display: none !important;
  }

  .desktop-table-view {
    display: block !important;
  }

  .desktop-table {
    display: table !important;
  }
}

/* Mobile: Ocultar tabela desktop */
@media (max-width: 768px) {
  /* Prevenir overflow horizontal em mobile */
  html,
  body,
  #app,
  .container,
  .main-content,
  .content-area {
    overflow-x: hidden !important;
    width: 100% !important;
    max-width: 100vw !important;
  }

  .desktop-table-view,
  .desktop-table {
    display: none !important;
  }

  .table-container {
    padding: 0;
    width: 100% !important;
    max-width: 100vw !important;
    overflow-x: hidden !important;
  }

  /* Garantir que cards tenham scroll horizontal se necessário */
  .mobile-cards-view {
    overflow-x: hidden;
  }

  /* Container dos cards transparente e sem sombra (evita faixa visível entre os cards) */
  .content-area-recebimento-agenda .schedules-list .table-container,
  .content-area-recebimento-historico .schedules-list .table-container {
    background: transparent !important;
    box-shadow: none !important;
  }

  /* Melhorar espaçamento dos cards */
  .schedule-card-mobile {
    margin-bottom: 0;
  }

  /* Ajustar status badge nos cards */
  .status-badge-mobile.primary {
    background-color: #007bff;
    color: white;
  }

  .status-badge-mobile.success {
    background-color: #28a745;
    color: white;
  }

  .status-badge-mobile.warning {
    background-color: #ffc107;
    color: #856404;
  }

  .status-badge-mobile.danger {
    background-color: #dc3545;
    color: white;
  }

  .status-badge-mobile.info {
    background-color: #17a2b8;
    color: white;
  }

  .status-badge-mobile.secondary {
    background-color: #6c757d;
    color: white;
  }

  .status-badge-mobile.light {
    background-color: #f8f9fa;
    color: #495057;
    border: 1px solid #dee2e6;
  }

  .status-badge-mobile.dark {
    background-color: #343a40;
    color: white;
  }
}
</style>
