<template>
  <div class="schedules-list">
    <!-- Header -->
    <div class="page-header">
      <div class="header-title-section">
        <h2>Histórico de Agendamentos</h2>
        <div class="agendamentos-count">
          <span class="count-badge">{{ totalSchedules || 0 }}</span>
          <span class="count-label">{{
            (totalSchedules || 0) === 1 ? 'agendamento' : 'agendamentos'
          }}</span>
          <span v-if="selectedFilterClient" class="filter-info">
            (filtrado por: {{ selectedFilterClient.name }})
          </span>
        </div>
      </div>
    </div>

    <!-- Filtros e Busca -->
    <div class="filters-container">
      <!-- Mobile: header do dropdown (Busca + Filtros) - toggle -->
      <div class="filters-mobile-header" @click="toggleMobileFilters">
        <div class="filters-mobile-title">
          <i class="fas fa-search"></i>
          <span>Busca e Filtros</span>
        </div>
        <i
          class="fas filters-mobile-chevron"
          :class="mobileFiltersOpen ? 'fa-chevron-up' : 'fa-chevron-down'"
        ></i>
      </div>

      <!-- Container colapsável: barra de busca + filtros (mobile = dropdown) -->
      <div
        class="filters-collapsible"
        :class="{ 'filters-collapsed': !mobileFiltersOpen }"
      >
        <!-- Search Bar com Exportar -->
        <div class="search-row">
          <div class="search-input-group">
            <input
              type="text"
              v-model="searchInput"
              @keyup.enter="handleSearch"
              :disabled="loading"
              placeholder="Digite o número da NF-e, OC, ou chave de acesso (44 dígitos)"
              class="search-input"
              autocomplete="off"
              data-lpignore="true"
              data-form-type="other"
              name="nfe-search-history"
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
          <div v-else class="export-dropdown export-dropdown-header">
            <button
              class="btn btn-sm btn-outline-success dropdown-toggle"
              @click="toggleExportDropdown"
              :disabled="exportingExcel"
              title="Exportar para Excel"
            >
              <i v-if="exportingExcel" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-file-excel"></i>
              Exportar
              <i class="fas fa-caret-down ms-1"></i>
            </button>
            <div v-if="showExportDropdown" class="export-dropdown-menu">
              <button class="export-option" @click="exportToExcel('mercocamp')">
                <i class="fas fa-building"></i>
                Formato Mercocamp
              </button>
              <button class="export-option" @click="exportToExcel('cliente')">
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
            <label for="status-filter-history">Status:</label>
            <button
              id="status-filter-history"
              class="btn btn-outline-primary status-filter-btn"
              :class="{ 'btn-primary': currentFilters.status }"
              @click="openStatusFilterModal"
            >
              <span class="status-filter-text">{{
                currentFilters.status || 'Selecionar Status'
              }}</span>
              <i
                v-if="currentFilters.status"
                class="fas fa-times status-filter-clear"
                @click.stop="clearStatusFilter"
                title="Limpar filtro de status"
              ></i>
              <i v-else class="fas fa-chevron-down status-filter-chevron"></i>
            </button>
          </div>

          <div class="filter-group">
            <label for="date-from-history">Data de:</label>
            <input
              id="date-from-history"
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
            <label for="date-to-history">Data até:</label>
            <input
              id="date-to-history"
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
            :key="`client-filter-hist-${userFilterKey}`"
          >
            <label for="client-filter-history">Estoque:</label>
            <button
              id="client-filter-history"
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
              <button
                v-if="userLevel !== 1"
                class="btn filter-action-btn"
                :class="
                  todayFilterActive ? 'btn-primary' : 'btn-outline-primary'
                "
                @click="toggleTodayFilter"
                title="Filtrar agendamentos de hoje"
              >
                <i class="fas fa-calendar-day"></i>
                Hoje
              </button>
              <button
                v-if="hasActiveFilters"
                class="btn btn-outline-danger filter-action-btn"
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
                name="client-filter-search-history"
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

          <div v-if="loadingFilterClients" class="loading-clients-container">
            <div class="loading-spinner">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
            <p class="loading-text">Carregando clientes...</p>
            <small class="loading-subtext"
              >Processando lista de clientes disponíveis</small
            >
          </div>

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

    <!-- Modal de filtro por status (status_config) -->
    <div
      v-if="showStatusFilterModal"
      class="status-filter-modal-overlay"
      @click.self="closeStatusFilterModal"
    >
      <div class="status-filter-modal-box">
        <div class="status-filter-modal-header">
          <h3>
            <i class="fas fa-filter"></i>
            Filtrar por Status
          </h3>
          <button
            type="button"
            class="btn-close-modal"
            aria-label="Fechar"
            @click="closeStatusFilterModal"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="status-filter-modal-body">
          <p class="status-filter-modal-hint">
            Selecione o status para filtrar a lista. Os status são carregados da
            tabela status_config e ficam sempre atualizados.
          </p>
          <div v-if="statusConfigLoading" class="status-filter-modal-loading">
            <i class="fas fa-spinner fa-spin"></i> Carregando status...
          </div>
          <div v-else class="status-filter-badges-grid">
            <button
              type="button"
              class="status-filter-badge-option status-filter-badge-todos"
              :class="{ selected: !currentFilters.status }"
              @click="selectStatusFilter(null)"
            >
              Todos
            </button>
            <button
              v-for="item in statusConfigList"
              :key="item.id !== null ? item.id : 'native-' + item.name"
              type="button"
              class="status-filter-badge-option"
              :class="{ selected: currentFilters.status === item.name }"
              :style="statusFilterBadgeStyle(item)"
              @click="selectStatusFilter(item)"
            >
              {{ item.name }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Indicador de Busca Ativa -->
    <div v-if="isSearchActive" class="search-indicator mb-3">
      <div class="search-active-card">
        <div class="search-content">
          <div class="search-header">
            <div class="search-icon">
              <i class="fas fa-search"></i>
            </div>
            <div class="search-details">
              <div class="search-type">
                {{
                  currentSearchInfo.type === 'nfe_key'
                    ? 'Chave de Acesso'
                    : 'Número da NF-e / Código da Carga'
                }}
              </div>
              <div class="search-value">
                {{ currentSearchInfo.value }}
              </div>
            </div>
          </div>
          <div class="search-results">
            <div class="results-count">
              <span class="count-number">{{ currentSearchInfo.count }}</span>
              <span class="count-label">{{
                currentSearchInfo.count === 1 ? 'resultado' : 'resultados'
              }}</span>
            </div>
          </div>
        </div>
        <div class="search-actions">
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

    <!-- Table -->
    <div class="table-container" :class="{ 'filter-loading': filterLoading }">
      <!-- Overlay de loading para filtros -->
      <div v-if="filterLoading" class="filter-loading-overlay">
        <div class="filter-loading-spinner">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
      </div>

      <div v-if="loading" class="loading-container">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Carregando agendamentos...</p>
      </div>

      <div v-else-if="sortedSchedules.length === 0" class="empty-state">
        <i class="fas fa-inbox"></i>
        <h3>Nenhum agendamento encontrado</h3>
        <p>Não há agendamentos que correspondam aos filtros aplicados.</p>
      </div>

      <!-- Mobile Cards View - IDÊNTICO à página Solicitação de Agendamentos -->
      <div v-else class="mobile-cards-view">
        <div
          v-for="schedule in paginatedSchedules"
          :key="'mobile-' + schedule.id"
          class="schedule-card-mobile"
          :class="{
            'booking-row': Number(schedule.is_booking) === 1,
            'not-scheduled-row': Number(schedule.is_booking) === 2,
            'integration-alert-row': schedule.schedule_order_integration_alert,
            'delayed-row': isScheduleDelayed(
              schedule.date,
              schedule.status,
              schedule.prevision
            ),
          }"
        >
          <!-- Linha 1: NF-e, Status | Botão Info (ocupa 2 linhas) - sem checkbox no Histórico -->
          <!-- Linha 2: Nome cliente/estoque -->
          <div
            class="card-header-mobile card-header-mobile-grid card-header-mobile-no-checkbox"
          >
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
                :title="
                  isBookingSchedule(schedule)
                    ? 'Informações do agendamento (Marcação)'
                    : 'Informações da NF-e'
                "
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
          <div v-if="hasOcColumn && schedule.oc" class="card-row-oc-mobile">
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

          <!-- Transportadora para nível 1 -->
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
            Use o botão "Buscar" para mostrar agendamentos em outros status.
          </p>
        </div>
      </div>

      <!-- Desktop Table View -->
      <div
        v-if="sortedSchedules.length > 0"
        class="table-wrapper desktop-table-view"
        ref="tableWrapper"
      >
        <table class="schedules-table desktop-table">
          <thead>
            <tr>
              <th class="col-nfe">N° NF-e</th>
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
                    sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down'
                  "
                ></i>
                <i v-else class="fas fa-sort sort-icon-inactive"></i>
              </th>
              <th v-if="userLevel !== 1" style="text-align: center">
                Solicitação
              </th>
              <!-- Novas colunas para usuários nível 1 -->
              <th v-if="userLevel === 1" class="col-fornecedor">Fornecedor</th>
              <th v-if="userLevel === 1" class="col-transportadora">
                Transportadora
              </th>
              <th
                class="col-date sortable-column"
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
                    sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down'
                  "
                ></i>
                <i v-else class="fas fa-sort sort-icon-inactive"></i>
              </th>
              <th class="col-vols" style="text-align: center">Vols</th>
              <th class="col-status" style="text-align: center">Status</th>
              <th class="actions-column-header"></th>
            </tr>
          </thead>
          <tbody>
            <!-- Mensagem quando não há agendamentos visíveis (todos filtrados) -->
            <tr v-if="paginatedSchedules.length === 0">
              <td
                :colspan="(userLevel === 1 ? 7 : 7) + (hasOcColumn ? 1 : 0)"
                style="text-align: center; padding: 40px; color: #666"
              >
                <i
                  class="fas fa-filter"
                  style="font-size: 2em; margin-bottom: 10px; display: block"
                ></i>
                <p style="margin: 0; font-size: 1.1em">
                  Todos os agendamentos foram filtrados por status.
                </p>
                <p style="margin: 10px 0 0 0; font-size: 0.9em">
                  Use o botão "Buscar" para mostrar agendamentos em outros
                  status.
                </p>
              </td>
            </tr>
            <tr
              v-for="schedule in paginatedSchedules"
              :key="schedule.id"
              :class="{
                'booking-row': Number(schedule.is_booking) === 1,
                'not-scheduled-row': Number(schedule.is_booking) === 2,
                'integration-alert-row':
                  schedule.schedule_order_integration_alert,
                'has-supplier-tooltip': schedule.supplier,
              }"
            >
              <td class="col-nfe">{{ schedule.number }}</td>
              <td v-if="hasOcColumn" class="col-oc">
                {{ schedule.oc || '-' }}
              </td>
              <!-- Colunas para usuários que NÃO são nível 1 -->
              <td v-if="userLevel !== 1">{{ schedule.client }}</td>
              <td v-if="userLevel !== 1" style="text-align: center">
                {{ formatDateShort(getRequestDate(schedule)) }}
              </td>
              <!-- Novas colunas para usuários nível 1 -->
              <td v-if="userLevel === 1" class="col-fornecedor">
                {{ getSupplierLabel(schedule) }}
              </td>
              <td v-if="userLevel === 1" class="col-transportadora">
                {{ getTransportadoraName(schedule) || '-' }}
              </td>
              <td class="col-date" style="text-align: center">
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
                  <button
                    class="btn btn-sm btn-outline-primary"
                    @click="openInfoModal(schedule)"
                    :title="
                      isBookingSchedule(schedule)
                        ? 'Mais informações (Marcação)'
                        : 'Mais informações'
                    "
                  >
                    <i class="fas fa-info-circle"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Controles de Paginação (mesmo padrão do App.vue) -->
      <div class="pagination-controls" v-if="totalSchedules > 0">
        <div class="pagination-info">
          <i class="fas fa-list"></i>
          {{ paginationInfo.start }} - {{ paginationInfo.end }} de
          {{ paginationInfo.total }}
        </div>

        <div class="pagination-controls-wrapper">
          <div
            class="pagination-buttons"
            :class="{ 'single-page': totalPages <= 1 }"
          >
            <!-- Botão primeira página -->
            <button
              @click="firstPage"
              :disabled="currentPage === 1 || totalPages <= 1"
              class="pagination-btn pagination-arrow"
              title="Primeira página"
            >
              <i class="fas fa-angle-double-left"></i>
            </button>

            <!-- Botão anterior -->
            <button
              @click="prevPage"
              :disabled="currentPage === 1 || totalPages <= 1"
              class="pagination-btn pagination-arrow"
              title="Página anterior"
            >
              <i class="fas fa-chevron-left"></i>
            </button>

            <!-- Mobile: número da página atual (mesmo elemento <button> para idêntica métrica e alinhamento) -->
            <button
              type="button"
              disabled
              class="pagination-current-mobile pagination-btn pagination-page active"
              aria-current="page"
              :aria-label="`Página atual: ${currentPage}`"
            >
              {{ currentPage }}
            </button>

            <!-- Desktop: reticências + botões de página -->
            <div class="pagination-pages-desktop">
              <span
                v-if="showLeftEllipsis && totalPages > 1"
                class="pagination-ellipsis"
              >
                ...
              </span>
              <button
                v-for="page in visiblePagesFiltered"
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
              <span
                v-if="showRightEllipsis && totalPages > 1"
                class="pagination-ellipsis"
              >
                ...
              </span>
            </div>

            <!-- Botão próximo -->
            <button
              @click="nextPage"
              :disabled="currentPage === totalPages || totalPages <= 1"
              class="pagination-btn pagination-arrow"
              title="Próxima página"
            >
              <i class="fas fa-chevron-right"></i>
            </button>

            <!-- Botão última página -->
            <button
              @click="lastPage"
              :disabled="currentPage === totalPages || totalPages <= 1"
              class="pagination-btn pagination-arrow"
              title="Última página"
            >
              <i class="fas fa-angle-double-right"></i>
            </button>
          </div>

          <!-- Seletor de itens por página -->
          <div class="items-per-page-selector">
            <label for="itemsPerPage">
              <i class="fas fa-th-list"></i>
              Itens por página:
            </label>
            <select
              id="itemsPerPage"
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
          <p v-if="limitCappedFromServer" class="limit-capped-msg">
            <i class="fas fa-info-circle"></i> Mostrando até
            {{ maxItemsPerPage }} registros por página. Use a seta para ver
            mais.
          </p>
        </div>
      </div>
    </div>

    <!-- Modals - NfeInfoModal é instância única no App.vue, aberto via store -->
    <schedule-edit-modal
      v-if="showEditModal"
      :schedule-data="scheduleToEdit"
      :show-modal="showEditModal"
      @close="closeEditModal"
      @updated="handleScheduleUpdated"
      @notification="$emit('notification', $event)"
    >
    </schedule-edit-modal>

    <schedule-booking-modal
      :show-modal="showBookingModal"
      @close="closeBookingModal"
      @created="handleBookingCreated"
    >
    </schedule-booking-modal>
  </div>
</template>

<script>
import ScheduleEditModal from './ScheduleEditModal.vue'
import { useNfeInfoModalStore } from '../stores/nfeInfoModal.js'
import ScheduleBookingModal from './ScheduleBookingModal.vue'
import ExcelJS from 'exceljs'
import {
  ensureStatusConfigCache,
  getStatusDisplayInfo,
} from '../utils/statusConfigCache.js'

export default {
  name: 'SchedulesList',

  components: {
    ScheduleEditModal,
    ScheduleBookingModal,
  },

  props: {
    showAll: {
      type: Boolean,
      default: true, // Por padrão mostra todos (Histórico)
    },
  },

  data() {
    return {
      schedules: [],
      loading: false,
      filterLoading: false, // Loading de filtros
      newDate: '',
      bulkActionLoading: false,
      showEditModal: false,
      scheduleToEdit: null,
      showBookingModal: false,
      showExportDropdown: false, // Dropdown de opções de exportação Excel
      exportingExcel: false, // Loading durante requisição de exportação

      // Busca
      searchInput: '',
      mobileFiltersOpen: false, // No mobile: dropdown de filtros inicia fechado

      // Paginação (opção "Todos" = até 2000 para evitar timeouts e erros no servidor)
      currentPage: 1,
      itemsPerPage: 50,
      itemsPerPageOptions: [50, 100, 200, 300, 'Todos'],
      maxItemsPerPage: 2000, // Teto alinhado ao backend MAX_PAGE_LIMIT
      totalSchedules: 0, // Total de agendamentos no servidor
      totalPagesServer: 0, // Total de páginas no servidor
      limitCappedFromServer: false, // true quando backend limitou o limite solicitado

      // Ordenação
      sortColumn: 'date',
      sortDirection: 'desc',

      // Filtros
      currentFilters: {
        status: '',
        date_from: '',
        date_to: '',
      },

      // Variáveis para controle de pesquisa
      isSearchActive: false,
      originalSchedules: [],
      currentSearchInfo: null,

      // Filtro de cliente
      selectedFilterClient: null,
      allSchedules: [], // Para armazenar todos os agendamentos antes da filtragem por cliente
      showClientFilterModal: false,
      availableFilterClients: [],
      filteredFilterClients: [],
      loadingFilterClients: false,
      clientFilterSearchQuery: '',
      todayFilterActive: false,

      // Modal de filtro por status (status_config)
      showStatusFilterModal: false,
      statusConfigList: [],
      statusConfigLoading: false,
    }
  },

  computed: {
    currentUser() {
      return this.getCurrentUser()
    },

    statusConfig() {
      return {
        Solicitado: { class: 'warning', label: 'Solicitado' },
        Contestado: { class: 'contestado', label: 'Contestado' },
        Agendado: { class: 'primary', label: 'Agendado' },
        'Em conferência': { class: 'success', label: 'Em conferência' },
        Conferência: { class: 'success', label: 'Em conferência' }, // Compatibilidade com dados antigos
        Recebido: { class: 'success', label: 'Em conferência' }, // Compatibilidade com dados antigos
        Tratativa: { class: 'danger', label: 'Tratativa' },
        'Em estoque': { class: 'estoque', label: 'Em estoque' },
        Estoque: { class: 'estoque', label: 'Em estoque' }, // Compatibilidade com dados antigos
        Recusar: { class: 'danger', label: 'Recusar' },
        Cancelar: { class: 'warning', label: 'Cancelar' },
        Recusado: { class: 'dark', label: 'Recusado' },
        Cancelado: { class: 'secondary', label: 'Cancelado' },
        Marcação: { class: 'booking', label: 'Marcação' },
        'Não agendado': { class: 'not-scheduled', label: 'Não agendado' },
      }
    },

    userLevel() {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return null
        const user = JSON.parse(userData)
        return user.level_access
      } catch (error) {
        console.error('Erro ao obter nível do usuário:', error)
        return null
      }
    },

    today() {
      return new Date().toISOString().split('T')[0]
    },

    canCreateBooking() {
      return this.userLevel !== 1
    },

    // Verifica se há filtros ativos
    hasActiveFilters() {
      return (
        this.currentFilters.status !== '' ||
        this.currentFilters.date_from !== '' ||
        this.currentFilters.date_to !== '' ||
        (this.selectedFilterClient && this.selectedFilterClient.cnpj) ||
        this.isSearchActive ||
        this.todayFilterActive
      )
    },

    // Exibir filtro de cliente (mesma lógica do App.vue: nível 0 ou mais de 1 estoque em cli_access)
    shouldShowClientFilter() {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return false
        const parsedUser = JSON.parse(userData)
        let cliAccess = parsedUser.cli_access
        if (typeof cliAccess === 'string' && cliAccess) {
          const trimmed = cliAccess.trim()
          if (
            trimmed &&
            trimmed !== '{}' &&
            trimmed !== 'null' &&
            trimmed !== 'undefined'
          ) {
            try {
              cliAccess = JSON.parse(trimmed)
            } catch (e) {
              console.warn('Erro ao parsear cli_access:', e)
            }
          }
        }
        if (parsedUser.level_access === 0) return true
        if (
          !cliAccess ||
          typeof cliAccess !== 'object' ||
          Object.keys(cliAccess).length === 0
        )
          return true
        return Object.keys(cliAccess).length > 1
      } catch (e) {
        console.error('shouldShowClientFilter:', e)
        return true
      }
    },

    userFilterKey() {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return 'none'
        const user = JSON.parse(userData)
        const count =
          user.cli_access && typeof user.cli_access === 'object'
            ? Object.keys(user.cli_access).length
            : 0
        return `${user.id || 'none'}-${count}`
      } catch (e) {
        return 'none'
      }
    },

    // Agendamentos filtrados por cliente (se aplicável)
    filteredSchedules() {
      if (!this.selectedFilterClient) {
        return this.schedules
      }

      const filtered = this.schedules.filter(schedule => {
        if (!schedule.client) return false

        // Filtrar por nome do cliente (mesmo approach do App.vue)
        return schedule.client
          .toLowerCase()
          .includes(this.selectedFilterClient.name.toLowerCase())
      })

      console.log(
        `🔍 Filtro de cliente aplicado: ${filtered.length} agendamentos de ${this.schedules.length} total`
      )
      return filtered
    },

    // Agendamentos ordenados (mais recentes primeiro)
    sortedSchedules() {
      const sorted = [...this.filteredSchedules].sort((a, b) => {
        // Ordenar por ID em ordem decrescente (IDs maiores = mais recentes)
        // Assumindo que IDs crescem sequencialmente
        return b.id - a.id
      })

      console.log(
        `📊 Agendamentos ordenados: ${sorted.length} (mais recentes primeiro)`
      )
      return sorted
    },

    // Agendamentos paginados (agora vem direto do servidor)
    paginatedSchedules() {
      return this.sortedSchedules
    },

    // Verifica se há algum agendamento com valor na coluna 'oc'
    hasOcColumn() {
      if (!Array.isArray(this.paginatedSchedules)) return false
      return this.paginatedSchedules.some(
        schedule => schedule.oc && schedule.oc.trim() !== ''
      )
    },

    // Total de páginas (do servidor)
    totalPages() {
      return this.totalPagesServer || 1
    },

    // Informação de paginação para exibição
    paginationInfo() {
      const start = (this.currentPage - 1) * this.itemsPerPage + 1
      const end = Math.min(
        this.currentPage * this.itemsPerPage,
        this.totalSchedules
      )
      return {
        start,
        end,
        total: this.totalSchedules,
      }
    },

    // Páginas visíveis na paginação (com elipses)
    visiblePages() {
      const pages = []
      const total = this.totalPages
      const current = this.currentPage

      if (total <= 7) {
        // Se tiver 7 ou menos páginas, mostra todas
        for (let i = 1; i <= total; i++) {
          pages.push(i)
        }
      } else {
        // Sempre mostra primeira página
        pages.push(1)

        if (current <= 3) {
          // Próximas 4 páginas
          for (let i = 2; i <= 5; i++) {
            pages.push(i)
          }
          pages.push('...')
          pages.push(total)
        } else if (current >= total - 2) {
          // Últimas 4 páginas
          pages.push('...')
          for (let i = total - 4; i <= total; i++) {
            pages.push(i)
          }
        } else {
          // Páginas do meio
          pages.push('...')
          for (let i = current - 1; i <= current + 1; i++) {
            pages.push(i)
          }
          pages.push('...')
          pages.push(total)
        }
      }

      return pages
    },

    // Páginas visíveis filtradas (sem reticências)
    visiblePagesFiltered() {
      return this.visiblePages.filter(p => p !== '...')
    },

    // Mostrar reticências à esquerda
    showLeftEllipsis() {
      return this.totalPages > 7 && this.currentPage > 3
    },

    // Mostrar reticências à direita
    showRightEllipsis() {
      return this.totalPages > 7 && this.currentPage < this.totalPages - 2
    },
  },

  methods: {
    // Toggle filtros mobile
    toggleMobileFilters() {
      this.mobileFiltersOpen = !this.mobileFiltersOpen
    },

    // Handler de busca
    async handleSearch() {
      if (!this.searchInput.trim()) return

      const searchTerm = this.searchInput.trim()
      console.log('🔍 Buscando por:', searchTerm)

      this.loading = true
      try {
        const apiClient = window.apiClient

        // Detectar tipo de busca
        const isNfeKey = /^\d{44}$/.test(searchTerm.replace(/\D/g, ''))

        const response = await apiClient.request('/schedules/search', {
          method: 'GET',
          params: {
            query: searchTerm,
          },
        })

        const results = response && response.data ? response.data : []
        if (results.length > 0) {
          this.schedules = results
          this.totalSchedules = results.length
          this.totalPagesServer = 1
          this.currentPage = 1
          this.isSearchActive = true
          this.currentSearchInfo = {
            type: isNfeKey ? 'nfe_key' : 'number',
            value: searchTerm,
            count: results.length,
          }
          this.$emit('schedules-loaded', {
            schedules: results,
            total: results.length,
          })
          this.$emit('notification', {
            type: 'success',
            message: `${results.length} agendamento(s) encontrado(s).`,
          })
        } else {
          this.schedules = []
          this.totalSchedules = 0
          this.totalPagesServer = 1
          this.currentPage = 1
          this.isSearchActive = true
          this.currentSearchInfo = {
            type: isNfeKey ? 'nfe_key' : 'number',
            value: searchTerm,
            count: 0,
          }
          this.$emit('schedules-loaded', { schedules: [], total: 0 })
          this.$emit('notification', {
            type: 'info',
            message: 'Nenhum agendamento encontrado.',
          })
        }
      } catch (error) {
        console.error('Erro na busca:', error)
        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao realizar busca',
        })
      } finally {
        this.loading = false
      }
    },

    // Handler de mudança de filtro
    handleFilterChange() {
      console.log('📋 Filtros alterados:', this.currentFilters)
      this.currentPage = 1
      this.loadSchedules()
    },

    // Resetar filtros
    resetFilters() {
      this.todayFilterActive = false
      this.currentFilters = {
        status: '',
        date_from: '',
        date_to: '',
      }
      this.searchInput = ''
      this.isSearchActive = false
      this.currentSearchInfo = null
      this.selectedFilterClient = null
      this.currentPage = 1
      this.loadSchedules()
    },

    async loadSchedules() {
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const user = JSON.parse(userData)
          if (Number(user.level_access) === 4) {
            console.log(
              '📄 SchedulesList: Usuário nível 4 (Manutenção) - pulando carregamento de agendamentos'
            )
            this.schedules = []
            this.totalSchedules = 0
            this.totalPagesServer = 0
            this.$emit('schedules-loaded', { schedules: [], total: 0 })
            return
          }
        } catch (_) {}
      }
      this.loading = true
      try {
        // Cache de status_config é atualizado ao abrir Histórico; aqui garante que existe
        await ensureStatusConfigCache()
        // Usar o apiClient global
        const apiClient = window.apiClient
        console.log('🔍 Fazendo requisição para carregar TODOS os agendamentos')
        console.log('🔑 Token presente:', !!localStorage.getItem('token'))

        // Filtrar apenas parâmetros com valores não vazios
        const filteredParams = {}
        Object.keys(this.currentFilters).forEach(key => {
          const value = this.currentFilters[key]
          if (value && value.toString().trim() !== '') {
            filteredParams[key] = value
          }
        })

        // 🔍 DEBUG: Verificar filtros antes de enviar
        console.log(
          '🔍 [DEBUG LOAD] currentFilters RAW:',
          JSON.stringify(this.currentFilters)
        )
        console.log(
          '🔍 [DEBUG LOAD] filteredParams (após filtrar vazios):',
          JSON.stringify(filteredParams)
        )
        console.log(
          '🔍 [DEBUG LOAD] Quantidade de filtros não vazios:',
          Object.keys(filteredParams).length
        )

        // Carregar apenas UMA página por vez (paginação no servidor)
        const requestParams = {
          page: this.currentPage,
          limit: this.itemsPerPage,
          ...filteredParams,
          show_all: this.showAll, // Controlado pela prop: true para Histórico, false para Agenda (apenas ativos)
        }

        // Incluir filtro de cliente na requisição (CNPJ normalizado, apenas dígitos)
        if (this.selectedFilterClient && this.selectedFilterClient.cnpj) {
          const normalizedCnpj = String(this.selectedFilterClient.cnpj).replace(
            /[^\d]/g,
            ''
          )
          requestParams.client = normalizedCnpj
        }

        const response = await apiClient.request('/schedules', {
          method: 'GET',
          params: requestParams,
        })

        if (response && response.schedules) {
          console.log(
            `✅ Página ${this.currentPage} carregada: ${response.schedules.length} agendamentos`
          )

          // Armazenar apenas os agendamentos da página atual
          this.schedules = response.schedules
          this.limitCappedFromServer = !!(
            response.pagination && response.pagination.limit_capped
          )

          // Armazenar informações de paginação do servidor
          if (response.pagination) {
            this.totalSchedules =
              response.pagination.total || response.schedules.length
            this.totalPagesServer = response.pagination.pages || 1
            console.log(
              `📊 Paginação: ${this.totalSchedules} total, ${this.totalPagesServer} páginas`
            )
          } else {
            // Fallback se não houver paginação na resposta
            this.totalSchedules = response.schedules.length
            this.totalPagesServer = 1
          }

          // Emitir dados para sincronizar com App.vue
          this.$emit('schedules-loaded', {
            schedules: response.schedules,
            total: this.totalSchedules,
          })
        } else {
          this.schedules = []
          this.totalSchedules = 0
          this.totalPagesServer = 0
          this.limitCappedFromServer = false
          // Emitir dados vazios
          this.$emit('schedules-loaded', {
            schedules: [],
            total: 0,
          })
        }
      } catch (error) {
        console.error('Erro ao carregar agendamentos:', error)
        console.error('URL da requisição:', error.config?.url)
        console.error('Status do erro:', error.response?.status)
        console.error('Dados do erro:', error.response?.data)
        console.error('Headers da requisição:', error.config?.headers)

        // Verificar se é erro de autenticação
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('=== SCHEDULES LIST: ERRO 401/403 ===')
          console.log('REMOVENDO REDIRECIONAMENTO AUTOMÁTICO')
          console.log('Deixando que o usuário continue usando a interface')

          this.$emit('notification', {
            type: 'warning',
            message: 'Sessão expirada. Alguns dados podem não carregar.',
          })

          // NÃO remover token nem redirecionar automaticamente
          // Apenas logar o erro
          return
        }

        // Verificar se é erro de servidor
        if (error.response?.status === 500) {
          this.$emit('notification', {
            type: 'error',
            message:
              'Erro interno do servidor. Verifique se o backend está funcionando corretamente.',
          })
        } else {
          this.$emit('notification', {
            type: 'error',
            message: `Erro ao carregar agendamentos: ${error.response?.status || 'Erro desconhecido'}`,
          })
        }

        this.schedules = []

        // Emitir dados vazios em caso de erro
        this.$emit('schedules-loaded', {
          schedules: [],
          total: 0,
        })
      } finally {
        this.loading = false
      }
    },

    async openInfoModal(schedule) {
      if (!schedule?.id) return
      try {
        const apiClient = window.apiClient
        const response = await apiClient.request(`/schedules/${schedule.id}`, {
          method: 'GET',
        })
        const fullSchedule =
          response?.schedule ?? response?.data?.schedule ?? response
        useNfeInfoModalStore().openWithSchedule(fullSchedule || schedule)
      } catch (err) {
        console.error('Erro ao carregar detalhes do agendamento:', err)
        useNfeInfoModalStore().openWithSchedule(schedule)
      }
    },

    openEditModal(schedule) {
      console.log('🔧 Abrindo modal de edição:', schedule)
      this.scheduleToEdit = schedule
      this.showEditModal = true
      // Fechar o modal de informações NFe (instância única no App.vue)
      useNfeInfoModalStore().close()
    },

    closeEditModal() {
      this.showEditModal = false
      this.scheduleToEdit = null
    },

    handleScheduleUpdated(updatedSchedule) {
      console.log('✅ Agendamento atualizado:', updatedSchedule)

      // Fechar modal primeiro para evitar problemas visuais
      this.closeEditModal()

      // Refresh completo da página após salvamento
      console.log(
        '🔄 Realizando refresh da página após atualização do agendamento'
      )
      setTimeout(() => {
        window.location.reload()
      }, 500) // Pequeno delay para permitir que o modal feche suavemente
    },

    async handleMarkTratativa(scheduleData) {
      try {
        console.log('⚠️ Marcando agendamento como Em Tratativa:', scheduleData)

        const apiClient = window.apiClient
        const currentUser = this.getCurrentUser()

        // Preparar dados para atualização - apenas alterar o status
        const updateData = {
          ...scheduleData,
          status: 'Tratativa',
          historic: {
            ...scheduleData.historic,
            [`tratativa_${Date.now()}`]: {
              timestamp: new Date().toISOString(),
              user: currentUser?.user || 'Usuário desconhecido',
              action: 'Status alterado para Em Tratativa',
              changes: [`Status: "${scheduleData.status}" → "Tratativa"`],
              comment: `Status alterado de "${scheduleData.status}" para "Tratativa"`,
            },
          },
        }

        const response = await apiClient.request(
          `/schedules/${scheduleData.id}`,
          {
            method: 'PUT',
            data: updateData,
          }
        )

        console.log('✅ Agendamento marcado como Em Tratativa:', response)

        // Fechar modal primeiro
        this.closeInfoModal()

        // Notificar sucesso
        this.$emit('notification', {
          type: 'success',
          message: 'Agendamento marcado como Em Tratativa!',
        })

        // Refresh completo da página após alteração de status
        console.log(
          '🔄 Realizando refresh da página após marcar como Em Tratativa'
        )
        setTimeout(() => {
          window.location.reload()
        }, 1000) // Delay maior para mostrar a notificação
      } catch (error) {
        console.error('❌ Erro ao marcar como Em Tratativa:', error)

        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao marcar agendamento como Em Tratativa.',
        })
      }
    },

    async handleChangeStatus(data) {
      try {
        console.log('🔄 Alterando status do agendamento:', data)

        const { scheduleData, newStatus } = data
        const apiClient = window.apiClient
        const currentUser = this.getCurrentUser()

        // Preparar dados para atualização
        const updateData = {
          ...scheduleData,
          status: newStatus,
          historic: {
            ...scheduleData.historic,
            [`status_change_${Date.now()}`]: {
              timestamp: new Date().toISOString(),
              user: currentUser?.user || 'Usuário desconhecido',
              action: `Status alterado para ${newStatus}`,
              changes: [`Status: "${scheduleData.status}" → "${newStatus}"`],
              comment: `Status alterado de "${scheduleData.status}" para "${newStatus}"`,
            },
          },
        }

        const response = await apiClient.request(
          `/schedules/${scheduleData.id}`,
          {
            method: 'PUT',
            data: updateData,
          }
        )

        console.log('✅ Status do agendamento alterado:', response)

        // Fechar modal primeiro
        this.closeInfoModal()

        // Notificar sucesso
        this.$emit('notification', {
          type: 'success',
          message: `Status alterado para ${newStatus}!`,
        })

        // Refresh completo da página após alteração de status
        console.log('🔄 Realizando refresh da página após alteração de status')
        setTimeout(() => {
          window.location.reload()
        }, 1000) // Delay maior para mostrar a notificação
      } catch (error) {
        console.error('❌ Erro ao alterar status:', error)

        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao alterar status do agendamento.',
        })
      }
    },

    // Função loadMoreSchedules removida - não há mais paginação

    // Função handleScroll removida - não há mais scroll infinito

    getStatusDisplayFor(schedule) {
      return getStatusDisplayInfo(
        schedule && schedule.status,
        this.getStatusBadge
      )
    },
    getStatusBadge(status) {
      return (
        this.statusConfig[status] || {
          class: 'secondary',
          label: 'Desconhecido',
        }
      )
    },

    formatDate(dateString) {
      if (!dateString) return '-'

      // Evitar problemas de timezone para datas no formato YYYY-MM-DD
      if (
        typeof dateString === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateString)
      ) {
        const [year, month, day] = dateString.split('-')
        return `${day}/${month}/${year}`
      }

      // Fallback para outros formatos
      try {
        const date = new Date(dateString)
        return date.toLocaleDateString('pt-BR')
      } catch (error) {
        return dateString
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
        const year = String(d.getFullYear()).slice(-2)
        return `${day}/${month}/${year}`
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

    isScheduleDelayed(scheduleDate, status, prevision = 0) {
      if (!scheduleDate) return false

      // Não mostrar atraso para agendamentos cancelados, recusados, em estoque, etc
      const finalStatuses = [
        'Cancelado',
        'Recusado',
        'Em estoque',
        'Estoque',
        'Cancelar',
      ]
      if (finalStatuses.includes(status)) return false

      // Não mostrar atraso para agendamentos com previsão (prevision = 1)
      if (prevision === 1 || prevision === true) return false

      // Verificar se a data do agendamento já passou
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Parse da data evitando problemas de timezone
      let scheduleDateTime
      if (
        typeof scheduleDate === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(scheduleDate)
      ) {
        const [year, month, day] = scheduleDate.split('-')
        scheduleDateTime = new Date(year, month - 1, day)
      } else {
        scheduleDateTime = new Date(scheduleDate)
      }
      scheduleDateTime.setHours(0, 0, 0, 0)

      return scheduleDateTime < today
    },

    sortByColumn(column) {
      if (this.sortColumn === column) {
        // Alternar direção se clicar na mesma coluna
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
      } else {
        // Nova coluna, começar com decrescente
        this.sortColumn = column
        this.sortDirection = 'desc'
      }
      // Recarregar dados com nova ordenação
      this.loadSchedules()
    },

    formatCurrency(value) {
      if (!value) return 'R$ 0,00'
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value)
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
        if (!userData) return null
        const user = JSON.parse(userData)
        return user // Retornar o objeto completo do usuário
      } catch (error) {
        console.error('Erro ao obter dados do usuário:', error)
        return null
      }
    },

    // Função para garantir que a data seja processada corretamente sem problemas de timezone
    formatDateForBackend(dateString) {
      if (!dateString) return null

      // Se já está no formato YYYY-MM-DD, manter como está
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.log('📅 Data original:', dateString)
        return dateString
      }

      // Se for um objeto Date, formatar corretamente
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')

      const formattedDate = `${year}-${month}-${day}`
      console.log('📅 Data formatada:', formattedDate)
      return formattedDate
    },

    // Função auxiliar para resetar paginação
    resetData() {
      this.schedules = []
      console.log('🔄 Dados resetados')
    },

    // Métodos de filtros
    handleFiltersChanged(newFilters) {
      console.log('🔍 Filtros alterados:', newFilters)
      this.currentFilters = { ...newFilters }
      this.resetData()
      this.resetPagination()
      this.loadSchedules()
    },

    // NOVA FUNCIONALIDADE: Limpar filtros sem recarregar dados
    clearFilters() {
      console.log('🧹 [SCHEDULESLIST] Limpando filtros silenciosamente...')
      this.currentFilters = {
        status: '',
        date_from: '',
        date_to: '',
      }
      console.log('✅ [SCHEDULESLIST] Filtros limpos:', this.currentFilters)
    },

    handleResetFilters() {
      console.log('🔍 Resetando filtros')
      this.currentFilters = {
        status: '',
        date_from: '',
        date_to: '',
      }
      // Também limpar o filtro de cliente
      this.selectedFilterClient = null
      this.resetData()
      this.resetPagination()
      this.loadSchedules()
    },

    // Métodos para agendamentos de marcação
    isBookingSchedule(schedule) {
      // Agendamento de marcação é identificado pelo campo is_booking
      return Number(schedule.is_booking) === 1
    },

    openBookingModal() {
      this.showBookingModal = true
    },

    closeBookingModal() {
      this.showBookingModal = false
    },

    async handleBookingCreated(response) {
      this.$emit('notification', {
        type: 'success',
        message: 'Agendamento de marcação criado com sucesso!',
      })

      // Recarregar a lista de agendamentos
      this.resetData()
      await this.loadSchedules()

      this.closeBookingModal()
    },

    async confirmDeleteBooking(schedule) {
      if (
        !confirm(
          `Tem certeza que deseja excluir o agendamento de marcação para ${schedule.client}?`
        )
      ) {
        return
      }

      try {
        const apiClient = window.apiClient
        await apiClient.request(`/schedules/${schedule.id}`, {
          method: 'DELETE',
        })

        this.$emit('notification', {
          type: 'success',
          message: 'Agendamento de marcação excluído com sucesso!',
        })

        // Recarregar a lista
        this.resetData()
        await this.loadSchedules()
      } catch (error) {
        console.error('Erro ao excluir agendamento de marcação:', error)
        this.$emit('notification', {
          type: 'error',
          message: 'Erro ao excluir agendamento de marcação',
        })
      }
    },

    // Métodos para busca por NFe
    handleSearchResults(data) {
      console.log('🔍 Resultados recebidos no SchedulesList:', data)

      const results = data.results || []

      // Salvar agendamentos originais se ainda não estão salvos
      if (!this.isSearchActive) {
        this.originalSchedules = [...this.schedules]
      }

      if (results.length > 0) {
        // Substituir a lista de agendamentos pelos resultados da busca
        this.schedules = results
        this.isSearchActive = true
        this.currentSearchInfo = {
          type: data.searchType,
          value: data.searchValue,
          count: results.length,
        }

        this.$emit(
          'notification',
          `${results.length} agendamento(s) encontrado(s) - Lista filtrada`,
          'success'
        )
      } else {
        // Se não há resultados, limpar a lista
        this.schedules = []
        this.isSearchActive = true
        this.currentSearchInfo = {
          type: data.searchType,
          value: data.searchValue,
          count: 0,
        }

        this.$emit('notification', 'Nenhum agendamento encontrado', 'info')
      }
    },

    handleSearchError(error) {
      this.$emit('notification', error, 'error')
    },

    handleSearchStart() {
      console.log('🔍 Iniciando busca por NFe/chave no SchedulesList...')
    },

    clearSearch() {
      if (this.isSearchActive) {
        // Restaurar agendamentos originais
        this.schedules = [...this.originalSchedules]
        this.isSearchActive = false
        this.currentSearchInfo = null
        this.originalSchedules = []
        this.resetPagination()

        this.$emit('notification', 'Busca limpa - Lista restaurada', 'info')
      }
    },

    // Método para lidar com filtro de cliente (chamado externamente)
    handleClientFilterChanged(client) {
      console.log('🏢 Filtro de cliente alterado:', client)
      this.selectedFilterClient = client
      this.resetPagination()

      if (client) {
        this.$emit('notification', `Filtro aplicado: ${client.name}`, 'info')
      } else {
        this.$emit('notification', 'Filtro de cliente removido', 'info')
      }
    },

    openClientFilterModal() {
      this.showClientFilterModal = true
      this.loadFilterClients()
    },

    closeClientFilterModal() {
      this.showClientFilterModal = false
      this.clearFilterSearch()
    },

    async openStatusFilterModal() {
      this.showStatusFilterModal = true
      this.statusConfigList = []
      this.statusConfigLoading = true
      try {
        const apiClient = window.apiClient
        const data = await apiClient.request('/status-config', {
          method: 'GET',
        })
        this.statusConfigList = (data?.list || []).map(
          ({ id, name, badge_color, text_color }) => ({
            id,
            name,
            badge_color,
            text_color,
          })
        )
      } catch (err) {
        console.error('Erro ao carregar status:', err)
        this.$emit('notification', {
          message: 'Erro ao carregar lista de status',
          type: 'error',
        })
        this.closeStatusFilterModal()
      } finally {
        this.statusConfigLoading = false
      }
    },

    closeStatusFilterModal() {
      this.showStatusFilterModal = false
      this.statusConfigList = []
    },

    selectStatusFilter(item) {
      this.currentFilters.status = item ? item.name : ''
      this.closeStatusFilterModal()
      this.handleFilterChange()
    },

    clearStatusFilter() {
      this.currentFilters.status = ''
      this.handleFilterChange()
    },

    statusFilterBadgeStyle(item) {
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

    async loadFilterClients() {
      this.loadingFilterClients = true
      try {
        const apiClient = window.apiClient
        const response = await apiClient.request('/clients', { method: 'GET' })
        let allClients =
          response?.data && Array.isArray(response.data) ? response.data : []
        allClients = allClients.filter(c => c.cnpj)

        const userData = localStorage.getItem('user')
        if (userData) {
          try {
            const user = JSON.parse(userData)
            if (user.level_access !== 0 && user.cli_access) {
              let cliAccess = user.cli_access
              if (typeof cliAccess === 'string' && cliAccess) {
                try {
                  cliAccess = JSON.parse(cliAccess)
                } catch (e) {
                  cliAccess = null
                }
              }
              if (
                cliAccess &&
                typeof cliAccess === 'object' &&
                Object.keys(cliAccess).length > 0
              ) {
                const allowedCNPJs = Object.keys(cliAccess).map(cnpj =>
                  String(cnpj).replace(/[^\d]/g, '')
                )
                allClients = allClients.filter(client => {
                  const cnpj = String(client.cnpj || '').replace(/[^\d]/g, '')
                  return allowedCNPJs.includes(cnpj)
                })
              }
            }
          } catch (e) {
            console.warn('Erro ao filtrar clientes por cli_access:', e)
          }
        }

        this.availableFilterClients = allClients.map(c => ({
          cnpj: c.cnpj,
          name: c.name || c.supplier,
          corpem_code: c.corpem_code || c.numero || '',
        }))
        this.filteredFilterClients = [...this.availableFilterClients]
      } catch (error) {
        console.error('Erro ao carregar clientes para filtro:', error)
        this.availableFilterClients = []
        this.filteredFilterClients = []
      } finally {
        this.loadingFilterClients = false
      }
    },

    selectFilterClient(client) {
      this.selectedFilterClient = client
      this.closeClientFilterModal()
      this.currentPage = 1
      this.handleFilterChange()
    },

    clearClientFilter() {
      this.selectedFilterClient = null
      this.currentPage = 1
      this.handleFilterChange()
    },

    filterFilterClients() {
      if (!this.clientFilterSearchQuery.trim()) {
        this.filteredFilterClients = [...this.availableFilterClients]
        return
      }
      const term = this.clientFilterSearchQuery.toLowerCase().trim()
      this.filteredFilterClients = this.availableFilterClients.filter(
        c =>
          (c.name && c.name.toLowerCase().includes(term)) ||
          (c.cnpj &&
            (c.cnpj.includes(term) ||
              this.formatCNPJ(c.cnpj).includes(term))) ||
          (c.corpem_code && c.corpem_code.toString().includes(term))
      )
    },

    clearFilterSearch() {
      this.clientFilterSearchQuery = ''
      this.filteredFilterClients = [...this.availableFilterClients]
    },

    formatCNPJ(cnpj) {
      if (!cnpj) return ''
      const s = String(cnpj).replace(/\D/g, '')
      return s.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      )
    },

    preventDateInput(event) {
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
      if (event.ctrlKey || event.metaKey) return
      if (!allowedKeys.includes(event.key)) {
        event.preventDefault()
        event.stopPropagation()
      }
    },

    handleDateInputClick(event) {
      const input = event.target
      const rect = input.getBoundingClientRect()
      const clickX = event.clientX - rect.left
      const iconAreaStart = rect.width - 40
      if (clickX >= iconAreaStart) {
        input.focus()
        setTimeout(() => input.showPicker?.(), 10)
        return
      }
      event.preventDefault()
      event.stopPropagation()
      setTimeout(() => input.showPicker?.(), 10)
    },

    handleDateInputFocus(event) {
      const input = event.target
      setTimeout(() => input.showPicker?.(), 10)
    },

    isValidDate(dateString) {
      if (!dateString) return false
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false
      const [y, m, d] = dateString.split('-').map(Number)
      const date = new Date(y, m - 1, d)
      return (
        date.getFullYear() === y &&
        date.getMonth() === m - 1 &&
        date.getDate() === d
      )
    },

    async handleDateFilterChange() {
      if (
        this.currentFilters.date_from &&
        !this.isValidDate(this.currentFilters.date_from)
      ) {
        this.currentFilters.date_from = ''
        return
      }
      if (
        this.currentFilters.date_to &&
        !this.isValidDate(this.currentFilters.date_to)
      ) {
        this.currentFilters.date_to = ''
        return
      }
      const fromOk =
        !this.currentFilters.date_from ||
        this.isValidDate(this.currentFilters.date_from)
      const toOk =
        !this.currentFilters.date_to ||
        this.isValidDate(this.currentFilters.date_to)
      if (!fromOk || !toOk) return
      if (!this.currentFilters.date_from && !this.currentFilters.date_to) return
      this.filterLoading = true
      try {
        await this.loadSchedules()
      } finally {
        setTimeout(() => {
          this.filterLoading = false
        }, 300)
      }
    },

    async toggleTodayFilter() {
      if (this.todayFilterActive) {
        this.todayFilterActive = false
        await this.resetFilters()
      } else {
        this.todayFilterActive = true
        const todayStr = new Date().toISOString().split('T')[0]
        this.currentFilters = {
          status: '',
          date_from: todayStr,
          date_to: todayStr,
        }
        this.selectedFilterClient = null
        this.handleFilterChange()
      }
    },

    // Método para atualizar status de um agendamento específico (chamado pelo App.vue)
    updateScheduleStatus(scheduleId, newStatus) {
      console.log(
        `⚡ [SchedulesList] Atualizando status do agendamento ${scheduleId} para "${newStatus}"`
      )

      const scheduleIndex = this.schedules.findIndex(
        schedule => schedule.id === scheduleId
      )

      if (scheduleIndex !== -1) {
        // Atualizar o status no array local usando reatividade do Vue
        this.schedules[scheduleIndex] = {
          ...this.schedules[scheduleIndex],
          status: newStatus,
        }

        console.log(
          `✅ [SchedulesList] Status atualizado para agendamento ${scheduleId} - Badge deve refletir mudança instantaneamente`
        )

        // Forçar re-render do componente (Vue 3 normalmente não precisa, mas garante atualização)
        this.$forceUpdate()
      } else {
        console.warn(
          `⚠️ [SchedulesList] Agendamento ${scheduleId} não encontrado na lista local`
        )
      }
    },

    // Métodos de paginação
    async goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
        console.log(`📄 Navegando para página ${page} de ${this.totalPages}`)

        // Carregar dados da nova página do servidor
        await this.loadSchedules()

        // Scroll para o topo da tabela
        this.$nextTick(() => {
          const tableWrapper = this.$refs.tableWrapper
          if (tableWrapper) {
            tableWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        })
      }
    },

    async nextPage() {
      if (this.currentPage < this.totalPages) {
        await this.goToPage(this.currentPage + 1)
      }
    },

    async prevPage() {
      if (this.currentPage > 1) {
        await this.goToPage(this.currentPage - 1)
      }
    },

    async firstPage() {
      await this.goToPage(1)
    },

    async lastPage() {
      await this.goToPage(this.totalPages)
    },

    // Resetar para primeira página quando filtros mudarem
    resetPagination() {
      this.currentPage = 1
      console.log('🔄 Paginação resetada para página 1')
    },

    // Alterar quantidade de itens por página (Todos = até maxItemsPerPage para evitar timeouts)
    async changeItemsPerPage(value) {
      const newValue =
        value === 'Todos' ? this.maxItemsPerPage : parseInt(value, 10)

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
          'schedules_itemsPerPage',
          value === 'Todos' ? 'Todos' : newValue.toString()
        )
        console.log(
          '💾 Preferência de itens por página salva no localStorage:',
          value
        )
      } else {
        // Se voltar para 50, remover do localStorage
        localStorage.removeItem('schedules_itemsPerPage')
        console.log(
          '🗑️ Preferência de itens por página removida do localStorage (valor padrão)'
        )
      }

      // Recarregar dados com nova quantidade
      await this.loadSchedules()
    },

    // Carregar preferência de itens por página do localStorage
    loadItemsPerPagePreference() {
      const savedValue = localStorage.getItem('schedules_itemsPerPage')
      if (savedValue) {
        if (savedValue === 'Todos') {
          this.itemsPerPage = this.maxItemsPerPage
          console.log(
            '📂 Preferência carregada do localStorage: Todos os itens (até',
            this.maxItemsPerPage,
            ')'
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
      if (this.itemsPerPage === this.maxItemsPerPage) {
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
      const dropdown = this.$el.querySelector('.export-dropdown')
      if (dropdown && !dropdown.contains(event.target)) {
        this.showExportDropdown = false
      }
    },

    async exportToExcel(formato = 'mercocamp') {
      // Fechar dropdown se estiver aberto
      this.showExportDropdown = false
      this.exportingExcel = true
      try {
        const apiClient = window.apiClient
        // Parâmetros dos filtros ativos: a API /schedules/export retorna TODOS os agendamentos
        // compatíveis com cli_access e com estes filtros (sem paginação)
        const params = {
          status: this.currentFilters.status || '',
          date_from: this.currentFilters.date_from || '',
          date_to: this.currentFilters.date_to || '',
          show_all: 'true', // Exportação sempre inclui todos os status, inclusive Em estoque, Recusado, Cancelado
        }
        if (this.selectedFilterClient && this.selectedFilterClient.cnpj) {
          params.client = String(this.selectedFilterClient.cnpj).replace(
            /[^\d]/g,
            ''
          )
        }
        if (
          this.isSearchActive &&
          this.searchInput &&
          this.searchInput.trim()
        ) {
          params.query = this.searchInput.trim()
        }

        this.$emit('notification', {
          message: 'Exportando todos os agendamentos (conforme filtros)...',
          type: 'info',
        })
        const response = await apiClient.request('/schedules/export', {
          method: 'GET',
          params,
        })
        const schedules = response?.schedules || []

        if (!schedules.length) {
          this.$emit('notification', {
            message: 'Não há agendamentos para exportar',
            type: 'warning',
          })
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
        const user = this.currentUser
        let userEmail = 'E-mail não identificado'
        if (user) {
          // Tentar obter email de config.emailSettings.primaryEmail
          if (user.config) {
            try {
              const config =
                typeof user.config === 'string'
                  ? JSON.parse(user.config)
                  : user.config
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
              user.user ||
              user.username ||
              user.name ||
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

        // Determinar se usa formato cliente (Fornecedor/Transportadora) ou mercocamp (Cliente/Data de Entrega)
        const userLevel = user?.level_access
        const useClienteFormat = formato === 'cliente' || userLevel === 1

        // Obter informações de filtros aplicados (sempre mostrar todos os filtros com valores padrão)
        const filtrosAplicados = []

        // Status: valor selecionado ou "Todos"
        filtrosAplicados.push(
          `Status: ${this.currentFilters.status || 'Todos'}`
        )

        // Data de: valor selecionado ou "Início"
        filtrosAplicados.push(
          `Data de: ${this.currentFilters.date_from ? this.formatDate(this.currentFilters.date_from) : 'Início'}`
        )

        // Data até: valor selecionado ou "Sempre"
        filtrosAplicados.push(
          `Data até: ${this.currentFilters.date_to ? this.formatDate(this.currentFilters.date_to) : 'Sempre'}`
        )

        // Cliente/Estoque: valor selecionado, único estoque do usuário, ou "Todos"
        let clienteEstoqueValue = 'Todos'
        if (this.selectedFilterClient) {
          clienteEstoqueValue = this.selectedFilterClient.name
        } else if (user?.cli_access && typeof user.cli_access === 'object') {
          const cliAccessKeys = Object.keys(user.cli_access)
          if (cliAccessKeys.length === 1) {
            // Usuário tem acesso a apenas um cliente/estoque
            const unicoCliente = user.cli_access[cliAccessKeys[0]]
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
        if (this.isSearchActive && this.currentSearchInfo) {
          filtrosAplicados.push(`Busca: ${this.currentSearchInfo.value}`)
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
        tableHeaders.push('Entrega', 'Vols', 'Status')

        // Índice da coluna de status (última coluna)
        const statusColIndex = tableHeaders.length

        // Índices das colunas de texto (para alinhamento à esquerda)
        // Considerando: NF-e, Chave NF, [OC], (Fornecedor|Cliente), (Transportadora|Solicitação), Entrega, Vols, Status
        const textColumnIndices = []
        let colIdx = 3 // Começa na coluna 3 (após NF-e e Chave NF)
        if (hasOcInExport) colIdx++ // OC ocupa uma coluna adicional
        textColumnIndices.push(colIdx) // Fornecedor ou Cliente
        textColumnIndices.push(colIdx + 1) // Transportadora ou Solicitação

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

          return {
            data: row,
            status: schedule.status,
            textColumnIndices,
            schedule_order_integration_alert:
              !!schedule.schedule_order_integration_alert,
          }
        })

        const numCols = tableHeaders.length

        // Criar workbook e worksheet com ExcelJS
        const workbook = new ExcelJS.Workbook()
        workbook.creator = 'Portal Mercocamp'
        workbook.created = now

        const worksheet = workbook.addWorksheet('Histórico Agendamentos', {
          properties: { defaultRowHeight: 18 },
        })

        // Estilo de borda padrão
        const thinBorder = { style: 'thin', color: { argb: 'FF1565C0' } }
        const mediumBorder = { style: 'medium', color: { argb: 'FF0D47A1' } }

        // ===== LINHA 1: TÍTULO =====
        worksheet.mergeCells(1, 1, 1, numCols)
        const titleCell = worksheet.getCell('A1')
        titleCell.value = 'HISTÓRICO DE AGENDAMENTOS'
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
        dataRows.forEach((rowObj, rowIndex) => {
          const row = worksheet.getRow(currentRow)
          const isFirstRow = rowIndex === 0
          const isLastRow = rowIndex === dataRows.length - 1

          // Fundo vermelho para linhas de alerta (crossdocking sem saída associada após tempo limite)
          const integrationAlertFill = rowObj.schedule_order_integration_alert
            ? {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF8D7DA' },
              } // Vermelho claro (mesma tonalidade do alerta Tratativa)
            : undefined

          rowObj.data.forEach((value, colIndex) => {
            const cell = row.getCell(colIndex + 1)
            cell.value = value
            cell.font = { size: 10 }
            // Colunas de texto descritivo (Fornecedor, Transportadora, Cliente, Data de Entrega) ficam à esquerda
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

            // Linha inteira vermelha quando alerta de integração (sem saída após tempo limite)
            if (integrationAlertFill) {
              cell.fill = integrationAlertFill
              if (colIndex + 1 === statusColIndex) {
                cell.font = {
                  size: 10,
                  color: { argb: 'FF721C24' },
                  bold: true,
                }
              }
            } else if (colIndex + 1 === statusColIndex) {
              // Aplicar cor de status na célula de status (apenas quando não é alerta)
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

        this.$emit('notification', {
          message: `Exportados ${schedules.length} agendamentos (todos conforme filtros) para ${fileName}`,
          type: 'success',
        })
        console.log(`✅ Exportação concluída: ${fileName}`)
      } catch (error) {
        console.error('❌ Erro ao exportar para Excel:', error)
        this.$emit('notification', {
          message: 'Erro ao exportar para Excel',
          type: 'danger',
        })
      } finally {
        this.exportingExcel = false
      }
    },
  },

  async mounted() {
    console.log('📄 SchedulesList montado - iniciando carregamento...')
    console.log(
      '🔄 CORREÇÃO: SchedulesList vai emitir dados para App.vue via @schedules-loaded'
    )

    // Carregar preferência de itens por página do localStorage
    this.loadItemsPerPagePreference()

    // Adicionar listener para fechar dropdown de exportação ao clicar fora
    document.addEventListener('click', this.handleClickOutsideExportDropdown)

    // 🔍 DEBUG: Verificar estado inicial dos filtros
    console.log(
      '🔍 [DEBUG MOUNTED] currentFilters inicial:',
      JSON.stringify(this.currentFilters)
    )
    console.log(
      '🔍 [DEBUG MOUNTED] Filtros estão vazios?',
      Object.values(this.currentFilters).every(
        v => !v || v.toString().trim() === ''
      )
    )
    console.log('🔍 [DEBUG MOUNTED] itemsPerPage:', this.itemsPerPage)

    // CORREÇÃO: Garantir que sempre emite dados na inicialização
    try {
      await this.loadSchedules()
      console.log('✅ SchedulesList.mounted(): loadSchedules() concluído')
    } catch (error) {
      console.error(
        '❌ SchedulesList.mounted(): erro em loadSchedules():',
        error
      )
      // Mesmo em caso de erro, emitir dados vazios para sincronizar
      this.$emit('schedules-loaded', {
        schedules: [],
        pagination: { page: 1, total: 0, hasMore: false },
      })
    }

    // Scroll infinito removido - não há mais paginação
    this.$emit('page-ready')
  },

  beforeUnmount() {
    // Remover listener do dropdown de exportação
    document.removeEventListener('click', this.handleClickOutsideExportDropdown)
  },
}
</script>

<style scoped>
/* Status badge styles */
.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: var(--status-badge-font-size);
  font-weight: 600;
  text-transform: uppercase;
  border: 1px solid;
  display: inline-block;
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

.status-badge.estoque {
  background-color: #c8e6c9;
  color: #1b5e20;
  border-color: #2e7d32;
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

/* Table wrapper - sem scroll interno, deixa a página controlar */
.table-wrapper {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  width: 100%;
}

.schedules-table {
  width: 100%;
  margin-bottom: 0;
}

/* Alerta crossdocking: integração de pedido de saída ultrapassou tempo mínimo sem lote vinculado */
.schedules-table tbody tr.integration-alert-row {
  background-color: rgba(220, 53, 69, 0.25);
  animation: integration-alert-blink 1.5s ease-in-out infinite;
}
.schedules-table tbody tr.integration-alert-row td {
  background-color: transparent;
}
.schedules-table tbody tr.integration-alert-row:hover {
  background-color: rgba(220, 53, 69, 0.35);
}

/* Coluna NF-e - Largura fixa maior */
.schedules-table .col-nfe,
.schedules-table th.col-nfe,
.schedules-table td.col-nfe {
  min-width: 100px !important;
  width: 100px !important;
  text-align: center !important;
  white-space: nowrap !important;
}

/* Coluna OC - Permite quebra de linha quando o texto ultrapassa o espaço */
.schedules-table .col-oc,
.schedules-table th.col-oc,
.schedules-table td.col-oc {
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

/* Coluna Fornecedor - Largura reduzida */
.schedules-table .col-fornecedor,
.schedules-table th.col-fornecedor,
.schedules-table td.col-fornecedor {
  max-width: 200px !important;
  width: 200px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

/* Coluna Transportadora - Largura reduzida */
.schedules-table .col-transportadora,
.schedules-table th.col-transportadora,
.schedules-table td.col-transportadora {
  max-width: 120px !important;
  width: 120px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  text-align: center !important;
}

/* Coluna Entrega (coluna 4) - largura conforme maior conteúdo (data dd/mm/yy ou ~ dd/mm/yy) */
.schedules-list .table-wrapper .schedules-table .col-date,
.schedules-list .table-wrapper .schedules-table th.col-date,
.schedules-list .table-wrapper .schedules-table td.col-date {
  width: 1% !important;
  white-space: nowrap !important;
  min-width: 0 !important;
  max-width: none !important;
  overflow: visible !important;
}

/* Coluna Vols - largura conforme maior conteúdo (números) */
.schedules-list .table-wrapper .schedules-table .col-vols,
.schedules-list .table-wrapper .schedules-table th.col-vols,
.schedules-list .table-wrapper .schedules-table td.col-vols {
  width: 1% !important;
  white-space: nowrap !important;
  min-width: 0 !important;
  max-width: none !important;
  overflow: visible !important;
}

/* Coluna Status - Largura fixa para não ser comprimida */
.schedules-table .col-status,
.schedules-table th.col-status,
.schedules-table td.col-status {
  min-width: 110px !important;
  width: 110px !important;
  white-space: nowrap !important;
}

/* Loading more indicator - agora fora da tabela */
.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  color: #6c757d;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  margin-top: 1rem;
}

.loading-more i {
  margin-right: 0.5rem;
}

.loading-more p {
  margin: 0;
  font-size: 0.875rem;
}

/* End of list indicator */
.end-of-list {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  color: #28a745;
  background-color: #f8fff9;
  border: 1px solid #d4edda;
  border-radius: 0.375rem;
  margin-top: 1rem;
}

.end-of-list i {
  margin-right: 0.5rem;
  color: #28a745;
}

.end-of-list p {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Responsivo para filtros */
@media (max-width: 1200px) {
  .filter-row {
    flex-wrap: wrap;
  }

  .filter-group {
    min-width: 120px;
    flex: 1 1 auto;
  }
}

/* 992px: manter layout igual App.vue (sem coluna na busca) */

@media (orientation: portrait) {
  /* Container e dropdown ocupam toda a largura e ficam centralizados */
  .schedules-list {
    width: 100%;
    max-width: 100%;
    padding-left: 0;
    padding-right: 0;
    box-sizing: border-box;
  }

  .filters-container {
    width: 100%;
    max-width: 100%;
    margin-left: 0;
    margin-right: 0;
    padding: 0.75rem;
    box-sizing: border-box;
  }

  .table-container {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  /* Botão do dropdown (Busca e Filtros) - sempre visível e clicável no mobile */
  .filters-mobile-header {
    display: flex !important;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 0.75rem 1rem;
    min-height: 48px;
    cursor: pointer;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-radius: 8px;
    margin-bottom: 0.5rem;
    transition: all 0.3s ease;
    border: 1px solid #dee2e6;
    box-sizing: border-box;
    outline: none;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1);
  }

  .filters-mobile-header:hover,
  .filters-mobile-header:focus {
    background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
    border-color: #dee2e6;
    outline: none;
  }

  .filters-mobile-header:active {
    transform: scale(0.98);
    border-color: #dee2e6;
    outline: none;
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

  .filters-collapsible {
    overflow: hidden;
    transition: max-height 0.3s ease;
  }

  .filters-collapsible:not(.filters-collapsed) {
    max-height: 75vh;
  }

  .filters-collapsed {
    max-height: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: hidden;
  }

  /* No mobile, esconder o label "Filtros" dentro do dropdown (evitar duplicata com o header) */
  .filter-row .filters-header {
    display: none;
  }

  .filter-row {
    flex-direction: column;
    width: 100%;
  }

  .filter-group {
    min-width: 100%;
    flex: 1;
    max-width: none;
  }

  .filter-actions-buttons {
    flex-direction: row;
    justify-content: center;
    min-width: 100%;
  }

  /* Barra de busca mobile - idêntico ao App.vue (Ajustes na barra de busca mobile) */
  .search-row {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    justify-content: stretch;
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
    font-size: 16px;
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

  .search-input-group .search-button,
  .search-button {
    width: 100%;
    padding: 0.6rem 1.25rem;
    font-size: 16px;
    border-radius: 6px;
    border: 2px solid #6c757d;
    justify-content: center;
  }
}

/* Estilos para agendamentos de marcação */
.schedule-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.booking-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #e3f2fd;
  color: #1565c0;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid #90caf9;
}

/* Status badge para marcação */
.status-badge.booking {
  background-color: #f3e5f5;
  color: #7b1fa2;
  border: 1px solid #ba68c8;
  font-weight: 500;
}

/* Status badge para não agendado */
.status-badge.not-scheduled {
  background-color: #e3f2fd;
  color: #1565c0;
  border: 1px solid #90caf9;
  font-weight: 500;
}

/* Search Indicator Styles */
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

@keyframes integration-alert-blink {
  0%,
  100% {
    background-color: rgba(220, 53, 69, 0.25);
  }
  50% {
    background-color: rgba(185, 28, 28, 0.45);
  }
}

.search-active-card {
  background: linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%);
  border: 2px solid #2196f3;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.15);
  transition: all 0.2s ease;
}

.search-active-card:hover {
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);
  transform: translateY(-1px);
}

.search-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
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
}

.search-results {
  margin-left: auto;
  margin-right: 1rem;
}

.results-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.count-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1976d2;
  line-height: 1;
}

.count-label {
  font-size: 0.75rem;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.search-actions {
  margin-left: auto;
}

.clear-search-btn {
  background: linear-gradient(135deg, #f44336, #d32f2f);
  border: none;
  border-radius: 8px;
  color: white;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(244, 67, 54, 0.3);
}

.clear-search-btn:hover {
  background: linear-gradient(135deg, #d32f2f, #b71c1c);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(244, 67, 54, 0.4);
}

.clear-search-btn:active {
  transform: translateY(0);
}

/* Responsividade para o indicador de busca */
@media (orientation: portrait) {
  .search-active-card {
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem;
  }

  .search-content {
    width: 100%;
    justify-content: center;
  }

  .search-results {
    margin: 0;
  }

  .search-actions {
    margin: 0;
    width: 100%;
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

/* Header styles - copied from App.vue */
.page-header {
  margin-bottom: 20px !important;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-title-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.export-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ==================== */
/* Filtros Container (mesmo padrão do App.vue) */
/* ==================== */

.filters-container {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Header mobile para filtros - oculto apenas em desktop (mobile mostra o botão) */
@media (orientation: landscape) {
  .filters-mobile-header {
    display: none !important;
  }
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

/* Filter Row */
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

/* Histórico: altura padronizada para todos os controles de filtro (inputs, select, botões) */
.schedules-list .filter-row .filter-group .form-control,
.schedules-list .filter-row .filter-group .client-filter-btn,
.schedules-list .filter-row .filter-group .status-filter-btn,
.schedules-list .filter-row .filter-buttons-row .btn {
  height: 40px !important;
  min-height: 40px !important;
  box-sizing: border-box !important;
}

.filter-group .form-control:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  outline: none;
}

.filter-group .form-control.date-input-readonly {
  cursor: pointer;
}

/* Botão filtro de cliente - idêntico ao App.vue */
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

/* Botão filtro de status (mesmo padrão do cliente) */
.status-filter-btn {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  width: 100% !important;
  min-height: 40px !important;
  padding: 0.5rem 0.75rem !important;
  font-size: 0.9rem !important;
  border-radius: 4px !important;
  gap: 0.5rem !important;
}
.status-filter-text {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.status-filter-chevron {
  flex-shrink: 0;
  font-size: 0.75rem;
  opacity: 0.8;
}
.status-filter-clear {
  flex-shrink: 0;
  font-size: 0.75rem;
  padding: 2px;
  border-radius: 2px;
  opacity: 0.9;
}
.status-filter-clear:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

/* Modal de filtro por status (status_config) */
.status-filter-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
}
.status-filter-modal-box {
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
.status-filter-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}
.status-filter-modal-header h3 {
  margin: 0;
  font-size: 1.15rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.status-filter-modal-header .btn-close-modal {
  padding: 0.35rem 0.5rem;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  border-radius: 4px;
}
.status-filter-modal-header .btn-close-modal:hover {
  background: #eee;
  color: #333;
}
.status-filter-modal-body {
  padding: 1rem 1.25rem;
  overflow-y: auto;
}
.status-filter-modal-hint {
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  color: #555;
}
.status-filter-modal-loading {
  text-align: center;
  padding: 1.5rem;
  color: #666;
}
.status-filter-badges-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}
.status-filter-badge-option {
  padding: 0.4rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition:
    opacity 0.15s,
    transform 0.1s;
  border: 2px solid transparent;
}
.status-filter-badge-option:hover {
  opacity: 0.9;
  transform: scale(1.03);
}
.status-filter-badge-option.selected {
  box-shadow: 0 0 0 2px #007bff;
}
.status-filter-badge-todos {
  background: #e9ecef;
  color: #495057;
  border-color: #dee2e6;
}

/* Modal de filtro por cliente - idêntico ao App.vue */
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
  padding: 1rem;
}

.modal-content.estoque-selection-modal {
  max-height: 95vh !important;
  height: 95vh !important;
  max-width: 800px !important;
  width: 90% !important;
  margin: 2.5vh auto !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

.estoque-selection-modal .modal-header {
  display: flex !important;
  flex-direction: row !important;
  justify-content: space-between !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
  padding: 12px 16px !important;
  gap: 10px !important;
  border-bottom: 1px solid #e9ecef;
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

.estoque-selection-modal .search-container {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  background-color: #f8f9fa;
  flex-shrink: 0 !important;
}

.estoque-selection-modal .search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.estoque-selection-modal .search-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  background-color: white;
}

.estoque-selection-modal .search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.estoque-selection-modal .clear-search-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
}

.estoque-selection-modal .clear-search-btn:hover {
  color: #495057;
  background-color: #f1f3f4;
}

.estoque-selection-modal .search-results-info {
  margin-top: 8px;
  font-size: 12px;
  color: #6c757d;
  text-align: center;
}

.estoque-selection-modal .loading-clients-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.estoque-selection-modal .loading-spinner i {
  font-size: 2rem;
  color: #007bff;
}

.estoque-selection-modal .estoque-lista-vertical {
  flex: 1 !important;
  overflow-y: auto !important;
  padding: 1rem !important;
}

.estoque-selection-modal .estoque-lista-item.clickable-item {
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

.estoque-selection-modal .clickable-item:hover {
  background-color: #f8f9fa !important;
  border-color: #007bff !important;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15) !important;
  transform: translateY(-1px) !important;
}

.estoque-selection-modal .estoque-lista-info {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
}

.estoque-selection-modal .estoque-nome {
  font-weight: 600 !important;
  color: #495057 !important;
  font-size: 16px !important;
}

.estoque-selection-modal .estoque-cnpj,
.estoque-selection-modal .estoque-numero {
  font-size: 14px !important;
  color: #6c757d !important;
}

.estoque-selection-modal .estoque-lista-arrow {
  color: #6c757d !important;
  font-size: 16px !important;
}

.estoque-selection-modal .clickable-item:hover .estoque-lista-arrow {
  color: #007bff !important;
  transform: translateX(4px) !important;
}

.estoque-selection-modal .estoque-lista-vazia {
  padding: 1.5rem;
  text-align: center;
  color: #6c757d;
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
  gap: 0.5rem;
  align-items: stretch;
  flex-wrap: nowrap;
  align-self: flex-end;
}

/* Botões Hoje e Limpar: altura já definida pela regra .filter-row .filter-buttons-row .btn acima */
.schedules-list .filter-buttons-row .filter-action-btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.5rem !important;
}

/* Dropdown de Exportação Excel */
.export-dropdown {
  position: relative;
  display: inline-block;
}

.export-dropdown .dropdown-toggle {
  display: flex;
  align-items: center;
  gap: 0.25rem;
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

/* Modal de filtro por cliente (idêntico ao App.vue) */
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

/* Container de busca dentro do modal */
.schedules-list .search-container {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  background-color: #f8f9fa;
  flex-shrink: 0 !important;
}

.schedules-list .search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.schedules-list .search-input-wrapper .search-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  background-color: white;
}

.schedules-list .search-input-wrapper .search-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.schedules-list .search-input-wrapper .clear-search-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
}

.schedules-list .search-input-wrapper .clear-search-btn:hover {
  color: #495057;
  background-color: #f1f3f4;
}

.schedules-list .search-results-info {
  margin-top: 8px;
  font-size: 12px;
  color: #6c757d;
  text-align: center;
}

.loading-clients-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.loading-clients-container .loading-spinner {
  margin-bottom: 1rem;
}

.loading-clients-container .loading-spinner i {
  font-size: 2rem;
  color: #007bff;
}

.estoque-lista-vertical {
  flex: 1 !important;
  overflow-y: auto !important;
  padding: 1rem !important;
}

.estoque-lista-item.clickable-item {
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

.estoque-lista-item.clickable-item:hover {
  background-color: #f8f9fa !important;
  border-color: #007bff !important;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15) !important;
  transform: translateY(-1px) !important;
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

.estoque-lista-item.clickable-item:hover .estoque-lista-arrow {
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

.estoque-lista-vazia {
  padding: 1rem;
  text-align: center;
  color: #6c757d;
}

.header-title-section h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

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
@media (orientation: portrait) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-title-section {
    gap: 0.75rem;
  }

  .header-actions {
    justify-content: flex-start;
  }

  .export-btn {
    width: auto;
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
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

/* Pagination Styles (mesmo padrão do App.vue) */
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
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

.pagination-info i {
  color: #007bff;
  margin-right: 0.5rem;
}

.pagination-controls-wrapper {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Desktop: mostrar números de página; mobile: esconder */
.pagination-pages-desktop {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-current-mobile {
  display: none;
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

.limit-capped-msg {
  margin: 6px 0 0;
  font-size: 12px;
  color: #0c5460;
  background: #d1ecf1;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #bee5eb;
}

.limit-capped-msg i {
  margin-right: 6px;
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

/* Botões de página específicos */
.pagination-page {
  min-width: 40px;
  font-weight: 500;
}

.pagination-page.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

/* Reticências de paginação */
.pagination-ellipsis {
  padding: 0 8px;
  color: #6c757d;
  font-weight: 500;
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
  background: #6c757d;
  border-color: #6c757d;
}

/* Responsive Pagination - caber na área visível sem scroll horizontal */
@media (orientation: portrait) {
  .pagination-controls {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
  }

  .pagination-controls-wrapper {
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .pagination-info {
    font-size: 13px;
    text-align: center;
    width: 100%;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
  }

  /* Mobile: uma linha [<<][Anterior][Pág. X][Próxima][>>] */
  .pagination-pages-desktop {
    display: none !important;
  }

  /* TODOS os botões da fila (setas + página atual): mesma caixa quadrada 36×36px para alinhamento perfeito */
  .pagination-buttons .pagination-btn {
    min-width: 36px !important;
    width: 36px !important;
    max-width: 36px !important;
    min-height: 36px !important;
    height: 36px !important;
    max-height: 36px !important;
    aspect-ratio: 1 !important;
    box-sizing: border-box !important;
    padding: 0 !important;
    flex: 0 0 36px !important;
    flex-shrink: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  /* Força todos os botões de página (incl. atual) à mesma métrica e formato quadrado */
  .pagination-buttons .pagination-btn.pagination-page {
    min-width: 36px !important;
    width: 36px !important;
    max-width: 36px !important;
    min-height: 36px !important;
    height: 36px !important;
    max-height: 36px !important;
    aspect-ratio: 1 !important;
    box-sizing: border-box !important;
    flex: 0 0 36px !important;
  }

  /* Botão página atual: exatamente o mesmo tamanho que << < > >> (quadrado) */
  .pagination-buttons .pagination-current-mobile.pagination-btn {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 36px !important;
    min-width: 36px !important;
    max-width: 36px !important;
    min-height: 36px !important;
    height: 36px !important;
    max-height: 36px !important;
    aspect-ratio: 1 !important;
    padding: 0 !important;
    margin: 0 !important;
    border-width: 1px !important;
    box-sizing: border-box !important;
    flex: 0 0 36px !important;
    flex-shrink: 0 !important;
    /* Visual de página ativa */
    background: #007bff !important;
    color: white !important;
    border-color: #007bff !important;
    font-weight: 500 !important;
    font-size: 13px !important;
    line-height: 1 !important;
    cursor: default !important;
    pointer-events: none !important;
  }

  .pagination-buttons {
    gap: 4px;
    flex-wrap: nowrap;
    justify-content: center;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .pagination-btn {
    min-width: 36px;
    width: 36px;
    max-width: 36px;
    min-height: 36px;
    height: 36px;
    max-height: 36px;
    aspect-ratio: 1;
    padding: 0;
    box-sizing: border-box;
    font-size: 13px;
    flex: 0 0 36px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .items-per-page-selector {
    justify-content: center;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .items-per-page-selector label {
    font-size: 0.85rem;
    white-space: normal;
  }

  .items-per-page-select {
    font-size: 0.85rem;
    padding: 0.4rem 1.8rem 0.4rem 0.6rem;
    min-width: 70px;
    max-width: 100%;
    box-sizing: border-box;
  }
}

@media (max-width: 480px) {
  .pagination-controls {
    padding: 10px 8px;
  }

  .pagination-info {
    font-size: 12px;
  }

  .pagination-btn {
    min-width: 32px;
    width: 32px;
    max-width: 32px;
    min-height: 32px;
    height: 32px;
    max-height: 32px;
    aspect-ratio: 1;
    padding: 0;
    font-size: 12px;
    box-sizing: border-box;
    flex: 0 0 32px;
  }

  /* TODOS os botões da fila: mesma caixa quadrada 32×32px em 480px */
  .pagination-buttons .pagination-btn {
    min-width: 32px !important;
    width: 32px !important;
    max-width: 32px !important;
    min-height: 32px !important;
    height: 32px !important;
    max-height: 32px !important;
    aspect-ratio: 1 !important;
    flex: 0 0 32px !important;
  }

  /* Força botão da página atual à mesma métrica e quadrado em 480px */
  .pagination-buttons .pagination-btn.pagination-page {
    min-width: 32px !important;
    width: 32px !important;
    max-width: 32px !important;
    min-height: 32px !important;
    height: 32px !important;
    max-height: 32px !important;
    aspect-ratio: 1 !important;
    flex: 0 0 32px !important;
  }

  .pagination-buttons .pagination-current-mobile.pagination-btn {
    width: 32px !important;
    min-width: 32px !important;
    max-width: 32px !important;
    min-height: 32px !important;
    height: 32px !important;
    max-height: 32px !important;
    aspect-ratio: 1 !important;
    flex: 0 0 32px !important;
    font-size: 12px !important;
  }

  /* Esconder reticências em telas muito pequenas */
  .pagination-ellipsis {
    display: none;
  }

  .items-per-page-selector {
    flex-wrap: wrap;
    justify-content: center;
  }

  .items-per-page-selector label {
    font-size: 0.8rem;
  }

  .items-per-page-selector label i {
    display: none;
  }

  .items-per-page-select {
    font-size: 0.8rem;
    min-width: 70px;
    max-width: 100%;
  }
}

/* ==================== */
/* Mobile/Desktop Views - IDÊNTICO à página Solicitação de Agendamentos */
/* ==================== */

.mobile-cards-view {
  display: none;
}

.desktop-table-view {
  display: block;
}

/* Mobile: mesmo breakpoint da Solicitação (768px) */
@media (orientation: portrait) {
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

  .desktop-table-view {
    display: none !important;
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

  /* Agendamentos de marcação: mesmo padrão visual dos demais cards */
  .schedule-card-mobile.booking-row {
    background-color: #fff;
  }

  .schedule-card-mobile.not-scheduled-row {
    background-color: rgba(254, 226, 226, 0.3);
  }

  /* Alerta crossdocking: integração de pedido de saída ultrapassou tempo mínimo sem lote vinculado */
  .schedule-card-mobile.integration-alert-row {
    background-color: rgba(220, 53, 69, 0.25);
    animation: integration-alert-blink 1.5s ease-in-out infinite;
  }
  .schedule-card-mobile.integration-alert-row:hover {
    background-color: rgba(220, 53, 69, 0.35);
  }

  /* Histórico: atraso não muda a cor do card, apenas o ícone de relógio na linha Entrega */
  .schedule-card-mobile.delayed-row {
    border-left-color: #e0e0e0 !important;
    background-color: #fff !important;
  }
  .schedule-card-mobile.delayed-row:hover {
    background-color: #fff !important;
  }
  /* Alerta de integração tem prioridade sobre delayed-row */
  .schedule-card-mobile.integration-alert-row.delayed-row {
    background-color: rgba(220, 53, 69, 0.25) !important;
    animation: integration-alert-blink 1.5s ease-in-out infinite;
  }
  .schedule-card-mobile.integration-alert-row.delayed-row:hover {
    background-color: rgba(220, 53, 69, 0.35) !important;
  }

  /* Grid Histórico (sem checkbox): linha 1 = NF-e, status, botão (2 linhas) | linha 2 = cliente - sem bordas para ficar idêntico à Solicitação */
  .card-header-mobile.card-header-mobile-grid.card-header-mobile-no-checkbox {
    display: grid;
    grid-template-columns: 1fr auto auto;
    grid-template-rows: auto auto;
    gap: 6px 10px;
    align-items: center;
    margin-bottom: 4px;
  }

  .card-header-mobile-no-checkbox .card-nfe-mobile {
    grid-column: 1;
    grid-row: 1;
    min-width: 0;
  }

  .card-header-mobile-no-checkbox .card-status-mobile {
    grid-column: 2;
    grid-row: 1;
  }

  .card-header-mobile-no-checkbox .card-actions-mobile-span-2 {
    grid-column: 3;
    grid-row: 1 / span 2;
    align-self: stretch;
    display: flex;
    align-items: stretch;
  }

  .card-header-mobile-no-checkbox .card-actions-mobile-span-2 .btn-nfe-info {
    height: 100% !important;
    width: auto !important;
    aspect-ratio: 1;
    min-height: 48px !important;
    flex: 0 0 auto;
    padding: 6px !important;
  }

  .card-header-mobile-no-checkbox .card-client-mobile {
    grid-column: 1 / span 2;
    grid-row: 2;
    min-width: 0;
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
    margin-bottom: 8px;
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

  /* Containers idênticos à página Solicitação: mesmo tamanho, proporção e texto */
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
    font-size: 11px !important;
    font-weight: 600;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1.2;
  }

  .card-info-value-mobile {
    font-size: 10px !important;
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
}

/* Cores das badges mobile - iguais à Solicitação */
.status-badge-mobile.warning {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffc107;
}

.status-badge-mobile.primary {
  background-color: #cce5ff;
  color: #004085;
  border: 1px solid #007bff;
}

.status-badge-mobile.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #28a745;
}

.status-badge-mobile.estoque {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #28a745;
}

.status-badge-mobile.danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #dc3545;
}

.status-badge-mobile.dark {
  background-color: #d6d6d6;
  color: #1b1e21;
  border: 1px solid #343a40;
}

.status-badge-mobile.secondary {
  background-color: #e2e3e5;
  color: #383d41;
  border: 1px solid #6c757d;
}

.status-badge-mobile.contestado {
  background-color: #8b1538 !important;
  color: white !important;
  border: 1px solid #8b1538 !important;
}

.status-badge-mobile.booking {
  background-color: #f3e5f5;
  color: #7b1fa2;
  border: 1px solid #ba68c8;
}

.status-badge-mobile.not-scheduled {
  background-color: #e3f2fd;
  color: #1565c0;
  border: 1px solid #90caf9;
}

.booking-badge-mobile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: #e3f2fd;
  color: #1565c0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  min-height: 48px;
  min-width: 36px;
  box-sizing: border-box;
}

.mobile-empty-message {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.mobile-empty-message i {
  font-size: 2em;
  margin-bottom: 10px;
  display: block;
}

.mobile-empty-message p {
  margin: 0;
  font-size: 0.9em;
}

/* Sortable columns */
.sortable-column {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.sortable-column:hover {
  background-color: #f8f9fa;
}

.sortable-column i.fa-sort {
  margin-left: 4px;
  opacity: 0.4;
}

.sortable-column.sorted-asc,
.sortable-column.sorted-desc {
  background-color: #e7f3ff;
}

.sortable-column.sorted-asc i,
.sortable-column.sorted-desc i {
  opacity: 1;
  color: #007bff;
}

.sort-icon-inactive {
  opacity: 0.3;
  margin-left: 4px;
}

/* Action buttons in table */
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.action-icons-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-icons-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.delayed-icon {
  color: #ff5722;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Actions column */
.actions-column {
  white-space: nowrap;
  min-width: 100px;
  text-align: right;
}

.actions-column-header {
  width: 100px;
}

/* Delayed row styling */
.delayed-row {
  background-color: #fff8f6 !important;
}

.delayed-row:hover {
  background-color: #ffefe9 !important;
}

/* Filter loading overlay */
.table-container.filter-loading {
  position: relative;
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
}

.filter-loading-spinner {
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.filter-loading-spinner i {
  font-size: 2rem;
  color: #007bff;
}
</style>
