<template>
  <div class="expeditions-page">
    <div class="page-header">
      <div class="header-title-section">
        <h2>
          <i class="fas fa-clipboard-list"></i>
          Pedidos
        </h2>
        <div class="count-badge-container">
          <span class="count-badge">{{ totalItems }}</span>
          <span class="count-label">
            {{ totalItems === 1 ? 'pedido' : 'pedidos' }}
          </span>
        </div>
      </div>
      <div class="header-actions">
        <button
          v-if="!isLevel1 && selectedExpeditions.length > 0"
          class="btn btn-integrate-bulk"
          @click="openBulkIntegrateModal"
          :disabled="bulkIntegrating"
        >
          <i
            :class="
              bulkIntegrating ? 'fas fa-spinner fa-spin' : 'fas fa-paper-plane'
            "
          ></i>
          {{
            bulkIntegrating
              ? 'Integrando...'
              : `Integrar em Lote (${selectedExpeditions.length})`
          }}
        </button>
        <button
          v-if="selectedExpeditions.length > 0"
          class="btn btn-print"
          @click="openBulkPrintModal"
          :disabled="bulkPrinting"
        >
          <i
            :class="bulkPrinting ? 'fas fa-spinner fa-spin' : 'fas fa-print'"
          ></i>
          {{
            bulkPrinting
              ? 'Imprimindo...'
              : `Imprimir em Lote (${selectedExpeditions.length})`
          }}
        </button>
        <button
          v-if="selectedExpeditions.length > 0"
          class="btn btn-danger"
          @click="bulkDelete"
        >
          <i class="fas fa-trash"></i>
          Excluir ({{ selectedExpeditions.length }})
        </button>
        <button
          class="btn btn-outline-primary"
          @click="refresh"
          :disabled="loading"
        >
          <i
            :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"
          ></i>
        </button>

        <!-- Botão de Exportar Excel -->
        <div class="export-dropdown export-dropdown-header">
          <button
            class="btn btn-sm btn-outline-success dropdown-toggle"
            @click="exportToExcel"
            :disabled="totalItems === 0"
            title="Exportar para Excel"
          >
            <i class="fas fa-file-excel"></i>
            Exportar
            <i class="fas fa-caret-down ms-1"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Busca -->
    <div class="search-container">
      <div class="search-input-group">
        <div class="search-field-wrapper">
          <i class="fas fa-search search-icon"></i>
          <input
            type="text"
            v-model="searchTerm"
            placeholder="Buscar pedido ou NF-e"
            title="Buscar por número do pedido ou NF-e de entrada"
            class="search-input"
            autocomplete="off"
            data-lpignore="true"
            data-form-type="other"
            name="pedido-search"
            @keyup.enter="executeSearch"
          />
        </div>
        <button class="btn-search" @click="executeSearch" title="Pesquisar">
          <i class="fas fa-search"></i>
          <span>Pesquisar</span>
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filters-container">
      <div
        v-if="shouldShowEstoqueFilter"
        class="filter-group filter-group-estoque"
      >
        <label for="estoque-filter">
          <i class="fas fa-filter"></i> Filtros
        </label>
        <button
          id="estoque-filter"
          class="btn client-filter-btn"
          @click="handleEstoqueFilterClick"
          :class="{
            'btn-primary': selectedFilterEstoque,
            'btn-outline-primary': !selectedFilterEstoque,
          }"
        >
          <div class="client-filter-content">
            <i class="fas fa-warehouse"></i>
            <span class="client-filter-text">{{
              selectedFilterEstoque
                ? selectedFilterEstoque.name
                : 'Selecionar Estoque'
            }}</span>
            <i v-if="selectedFilterEstoque" class="fas fa-times ml-2"></i>
          </div>
        </button>
      </div>

      <!-- Filtro de Data -->
      <div class="filter-group filter-group-date-from">
        <label for="date-from">Data de:</label>
        <div class="date-input-wrapper">
          <input
            id="date-from"
            ref="dateFromInput"
            type="date"
            lang="pt-BR"
            v-model="dateFrom"
            @blur="handleDateFilterChange"
            @change="handleDateFilterChange"
            @keydown="preventDateInput"
            @selectstart.prevent
            @mousedown.prevent="handleDateInputClick"
            @focus.prevent="handleDateInputFocus"
            @paste.prevent
            class="form-control date-input-readonly"
          />
          <span
            v-if="!isDateFromFocused"
            :class="['date-display-text', { placeholder: !dateFromDisplay }]"
          >
            {{ dateFromDisplay || 'dd/mm/yyyy' }}
          </span>
        </div>
      </div>

      <div class="filter-group filter-group-date-to">
        <label for="date-to">Data até:</label>
        <div class="date-input-wrapper">
          <input
            id="date-to"
            ref="dateToInput"
            type="date"
            lang="pt-BR"
            v-model="dateTo"
            @blur="handleDateFilterChange"
            @change="handleDateFilterChange"
            @keydown="preventDateInput"
            @selectstart.prevent
            @mousedown.prevent="handleDateInputClick"
            @focus.prevent="handleDateInputFocus"
            @paste.prevent
            class="form-control date-input-readonly"
          />
          <span
            v-if="!isDateToFocused"
            :class="['date-display-text', { placeholder: !dateToDisplay }]"
          >
            {{ dateToDisplay || 'dd/mm/yyyy' }}
          </span>
        </div>
      </div>

      <!-- Filtro de Evidências -->
      <div class="filter-group filter-group-evidence">
        <label for="no-evidence-filter">Evidências</label>
        <button
          id="no-evidence-filter"
          type="button"
          class="btn btn-photos evidence-filter-btn"
          :class="{ 'btn-photos-has-evidences': onlyWithoutEvidence }"
          @click="onlyWithoutEvidence = !onlyWithoutEvidence"
        >
          <i class="fas fa-camera"></i>
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="loader-spinner"></div>
      <p>Carregando pedidos...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button @click="refresh" class="retry-btn">
          <i class="fas fa-redo"></i>
          Tentar novamente
        </button>
      </div>
    </div>

    <!-- Tabela de Pedidos -->
    <div v-else-if="filteredExpeditions.length > 0" class="table-container">
      <table class="expeditions-table">
        <thead>
          <tr>
            <th v-if="!isLevel1" class="col-checkbox">
              <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleSelectAll"
                class="checkbox-input"
              />
            </th>
            <th class="col-pedido th-center">Pedido</th>
            <th class="col-estoque th-left">Estoque</th>
            <th class="col-ref-entrada th-center">Ref. Entrada</th>
            <th class="col-data-criacao th-center">Data de Criação</th>
            <th class="col-status th-center">Status</th>
            <th class="col-acoes th-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(item, index) in groupedExpeditions" :key="index">
            <!-- LOT com múltiplos pedidos (Accordion) -->
            <template v-if="item.type === 'lot'">
              <!-- Linha principal do LOT -->
              <tr
                class="lot-row"
                :class="{
                  'lot-expanded': isLotExpanded(item.lot),
                  'needs-evidence-warning':
                    !isLevel1 && itemNeedsEvidenceButMissing(item),
                }"
              >
                <td
                  v-if="!isLevel1 && lotHasIntegrableOrders(item)"
                  class="col-checkbox"
                >
                  <input
                    type="checkbox"
                    :checked="isLotSelected(item.lot)"
                    @change="toggleLotSelection(item.lot)"
                    class="checkbox-input"
                    title="Selecionar todos os pedidos integráveis do lote"
                  />
                </td>
                <td v-else-if="!isLevel1" class="col-checkbox"></td>
                <td
                  class="col-pedido td-center"
                  @click="toggleLot(item.lot)"
                  style="cursor: pointer"
                >
                  <div class="lot-pedido-info">
                    <i
                      class="fas fa-chevron-right lot-chevron"
                      :class="{ 'chevron-expanded': isLotExpanded(item.lot) }"
                    ></i>
                    <span class="lot-label">
                      <i class="fas fa-layer-group"></i>
                      LOTE
                    </span>
                    <span
                      class="lot-count-badge"
                      :title="`${item.count} ${item.count === 1 ? 'pedido' : 'pedidos'} neste lote`"
                    >
                      {{ item.count }}
                    </span>
                  </div>
                </td>
                <td class="col-estoque td-left">
                  <span class="estoque-name">{{ item.armazem }}</span>
                </td>
                <td class="col-ref-entrada td-center">
                  <span
                    class="ref-entrada"
                    v-if="item.refEntrada && item.refEntrada.length > 0"
                  >
                    {{ item.refEntrada.join(', ') }}
                  </span>
                  <span class="ref-entrada-empty" v-else>-</span>
                </td>
                <td class="col-data-criacao td-center">
                  <span class="data-criacao">{{
                    formatDate(item.createdAt)
                  }}</span>
                </td>
                <td class="col-status td-center">
                  <span
                    class="status-badge"
                    :class="getStatusClass(item.status)"
                    :title="
                      item.hasRejections
                        ? 'Este lote contém pedidos com rejeições'
                        : ''
                    "
                  >
                    {{ getStatusLabel(item.status) }}
                    <i
                      v-if="item.hasRejections"
                      class="fas fa-info-circle rejection-icon"
                    ></i>
                  </span>
                </td>
                <td class="col-acoes td-center">
                  <div class="actions-buttons">
                    <button
                      v-if="!isLevel1 && lotHasIntegrableOrders(item)"
                      class="expeditions-action-btn btn-icon btn-integrate"
                      @click="integrateLot(item.lot)"
                      title="Integrar todos os pedidos integráveis do lote"
                    >
                      <i class="fas fa-paper-plane"></i>
                    </button>
                    <button
                      class="expeditions-action-btn btn-icon btn-details"
                      @click="viewLotDetails(item.lot)"
                      title="Detalhes do Lote"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                    <button
                      class="expeditions-action-btn btn-icon btn-documents"
                      @click="viewLotDocuments(item.lot)"
                      title="Documentos do Lote"
                    >
                      <i class="fas fa-file-alt"></i>
                    </button>
                    <button
                      class="expeditions-action-btn btn-icon btn-photos"
                      :class="{
                        'btn-photos-has-evidences': hasLotPhotos(item.lot),
                      }"
                      @click="handleLotPhotosClick(item.lot)"
                      title="Fotos do Lote"
                    >
                      <i class="fas fa-camera"></i>
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Pedidos do LOT (expandido) -->
              <template v-if="isLotExpanded(item.lot)">
                <tr
                  v-for="(order, index) in item.orders"
                  :key="order.id"
                  class="lot-order-row lot-order-animate"
                  :class="{
                    selected: isSelected(order.id),
                    'lot-order-last': index === item.orders.length - 1,
                  }"
                >
                  <td
                    v-if="!isLevel1 && order.apenasLeitura === false"
                    class="col-checkbox"
                  >
                    <input
                      type="checkbox"
                      :checked="isSelected(order.id)"
                      @change="toggleSelect(order.id)"
                      class="checkbox-input"
                    />
                  </td>
                  <td
                    v-else-if="!isLevel1"
                    class="col-checkbox"
                    :title="'Pedido Apenas leitura - sem integração'"
                  ></td>
                  <td class="col-pedido td-center">
                    <div class="pedido-info">
                      <span class="pedido-numero">{{
                        order.numeroPedido || '-'
                      }}</span>
                    </div>
                  </td>
                  <td class="col-estoque td-left">
                    <span class="estoque-name">{{ order.armazem }}</span>
                  </td>
                  <td class="col-ref-entrada td-center">
                    <!-- Pedidos dentro de um lote expandido não mostram Ref. Entrada -->
                    <span class="ref-entrada-empty">-</span>
                  </td>
                  <td class="col-data-criacao td-center">
                    <span class="data-criacao">{{
                      formatDate(order.createdAt)
                    }}</span>
                  </td>
                  <td class="col-status td-center">
                    <span
                      class="status-badge"
                      :class="getStatusClass(order.status)"
                      :title="getRejectionTooltip(order.rejectionCode)"
                    >
                      {{ getStatusLabel(order.status) }}
                      <i
                        v-if="order.rejectionCode"
                        class="fas fa-info-circle rejection-icon"
                      ></i>
                    </span>
                  </td>
                  <td class="col-acoes td-center">
                    <div class="actions-buttons">
                      <button
                        v-if="!isLevel1 && order.apenasLeitura === false"
                        class="expeditions-action-btn btn-icon btn-integrate"
                        @click="integrateExpedition(order)"
                        :title="getIntegrationTooltip(order)"
                      >
                        <i class="fas fa-paper-plane"></i>
                      </button>
                      <button
                        class="expeditions-action-btn btn-icon btn-details"
                        @click="viewDetails(order)"
                        title="Detalhes"
                      >
                        <i class="fas fa-eye"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
            </template>

            <!-- Pedido único (sem LOT ou LOT com 1 pedido) -->
            <template v-else-if="item.type === 'single'">
              <tr
                :class="{
                  selected: isSelected(item.order.id),
                  'needs-evidence-warning':
                    !isLevel1 && itemNeedsEvidenceButMissing(item),
                }"
              >
                <td
                  v-if="!isLevel1 && item.order.apenasLeitura === false"
                  class="col-checkbox"
                >
                  <input
                    type="checkbox"
                    :checked="isSelected(item.order.id)"
                    @change="toggleSelect(item.order.id)"
                    class="checkbox-input"
                  />
                </td>
                <td
                  v-else-if="!isLevel1"
                  class="col-checkbox"
                  :title="'Pedido Apenas leitura - sem integração'"
                ></td>
                <td class="col-pedido td-center">
                  <div class="pedido-info">
                    <span class="pedido-numero">{{
                      item.order.numeroPedido || '-'
                    }}</span>
                  </div>
                </td>
                <td class="col-estoque td-left">
                  <span class="estoque-name">{{ item.order.armazem }}</span>
                </td>
                <td class="col-ref-entrada td-center">
                  <span
                    class="ref-entrada"
                    v-if="
                      item.order.refEntrada && item.order.refEntrada.length > 0
                    "
                  >
                    {{ item.order.refEntrada.join(', ') }}
                  </span>
                  <span class="ref-entrada-empty" v-else>-</span>
                </td>
                <td class="col-data-criacao td-center">
                  <span class="data-criacao">{{
                    formatDate(item.order.createdAt)
                  }}</span>
                </td>
                <td class="col-status td-center">
                  <span
                    class="status-badge"
                    :class="getStatusClass(item.order.status)"
                    :title="getRejectionTooltip(item.order.rejectionCode)"
                  >
                    {{ getStatusLabel(item.order.status) }}
                    <i
                      v-if="item.order.rejectionCode"
                      class="fas fa-info-circle rejection-icon"
                    ></i>
                  </span>
                </td>
                <td class="col-acoes td-center">
                  <div class="actions-buttons">
                    <button
                      v-if="!isLevel1 && item.order.apenasLeitura === false"
                      class="expeditions-action-btn btn-icon btn-integrate"
                      @click="integrateExpedition(item.order)"
                      :title="getIntegrationTooltip(item.order)"
                    >
                      <i class="fas fa-paper-plane"></i>
                    </button>
                    <button
                      class="expeditions-action-btn btn-icon btn-details"
                      @click="viewDetails(item.order)"
                      title="Detalhes"
                    >
                      <i class="fas fa-eye"></i>
                    </button>
                    <button
                      class="expeditions-action-btn btn-icon btn-documents"
                      @click="viewDocuments(item.order)"
                      title="Documentos"
                    >
                      <i class="fas fa-file-alt"></i>
                    </button>
                    <button
                      v-if="item.order.lot"
                      class="expeditions-action-btn btn-icon btn-photos"
                      :class="{
                        'btn-photos-has-evidences': hasLotPhotos(
                          item.order.lot
                        ),
                      }"
                      @click="handleLotPhotosClick(item.order.lot)"
                      title="Fotos do Lote"
                    >
                      <i class="fas fa-camera"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Paginação -->
    <div v-if="totalPages > 1" class="pagination-container">
      <button
        class="btn btn-sm"
        :disabled="currentPage <= 1"
        @click="goToPage(currentPage - 1)"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
      <span class="pagination-info">
        Página {{ currentPage }} de {{ totalPages }} ({{ totalItems }} pedidos)
      </span>
      <button
        class="btn btn-sm"
        :disabled="currentPage >= totalPages"
        @click="goToPage(currentPage + 1)"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!loading && filteredExpeditions.length === 0"
      class="empty-state"
    >
      <i class="fas fa-box-open"></i>
      <h3>Nenhum pedido encontrado</h3>
      <p>Não há pedidos de expedição no momento</p>
    </div>

    <!-- Modal de Detalhes do Pedido -->
    <OrderDetailsModal
      :show-modal="showDetailsModal"
      :order-data="selectedOrder"
      @close="closeDetailsModal"
      @refresh-order="refreshOrderDetails"
    />

    <!-- Modal de Documentos -->
    <DocumentsModal
      :show-modal="showDocumentsModal"
      :order-id="selectedOrderId"
      @close="closeDocumentsModal"
    />

    <!-- Modal de Detalhes do Lote -->
    <LotDetailsModal
      :show-modal="showLotDetailsModal"
      :lot-code="selectedLotCode"
      @close="closeLotDetailsModal"
    />

    <!-- Modal de Fotos do Lote -->
    <LotPhotosModal
      :show-modal="showLotPhotosModal"
      :lot-code="selectedLotCodeForPhotos"
      @close="closeLotPhotosModal"
      @refresh="loadExpeditions"
      @loaded="onLotPhotosLoaded"
    />

    <!-- Modal de Confirmação de Integração em Lote -->
    <div
      v-if="showBulkIntegrateModal"
      class="modal-overlay"
      @click.self="closeBulkIntegrateModal"
    >
      <div class="modal-content bulk-integrate-modal">
        <div class="modal-header">
          <h3>
            <i class="fas fa-paper-plane"></i>
            Confirmar Integração em Lote
          </h3>
          <button @click="closeBulkIntegrateModal" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="modal-icon integrate-icon">
            <i class="fas fa-paper-plane"></i>
          </div>
          <div class="modal-message">
            <h4>Deseja integrar {{ selectedExpeditions.length }} pedido(s)?</h4>
            <p>
              Todos os pedidos selecionados serão enviados para integração com o
              CorpEM WMS.
            </p>
            <div class="modal-info integrate-info">
              <i class="fas fa-info-circle"></i>
              <span>Os pedidos serão processados sequencialmente</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeBulkIntegrateModal" class="btn btn-secondary">
            <i class="fas fa-times"></i>
            Cancelar
          </button>
          <button @click="confirmBulkIntegrate" class="btn btn-primary">
            <i class="fas fa-paper-plane"></i>
            Confirmar Integração
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação de Impressão em Lote -->
    <div
      v-if="showBulkPrintModal"
      class="modal-overlay"
      @click.self="closeBulkPrintModal"
    >
      <div class="modal-content bulk-print-modal">
        <div class="modal-header">
          <h3>
            <i class="fas fa-print"></i>
            Confirmar Impressão em Lote
          </h3>
          <button @click="closeBulkPrintModal" class="btn-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="modal-icon">
            <i class="fas fa-print"></i>
          </div>
          <div class="modal-message">
            <h4>Deseja imprimir {{ selectedExpeditions.length }} pedido(s)?</h4>
            <p>
              Todos os documentos (PDFs e ZPLs convertidos) serão combinados em
              um único arquivo PDF para impressão.
            </p>
            <div class="modal-info">
              <i class="fas fa-info-circle"></i>
              <span
                >Arquivos ZPL serão automaticamente convertidos para PDF</span
              >
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeBulkPrintModal" class="btn btn-secondary">
            <i class="fas fa-times"></i>
            Cancelar
          </button>
          <button @click="confirmBulkPrint" class="btn btn-primary">
            <i class="fas fa-print"></i>
            Confirmar Impressão
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Filtro por Estoque -->
    <div
      v-if="showEstoqueFilterModal"
      class="modal-overlay"
      @click="closeEstoqueFilterModal"
    >
      <div class="modal-content estoque-selection-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-warehouse"></i>
            <span class="modal-title-text">Filtrar por Estoque</span>
          </h3>
          <button class="modal-close-btn" @click="closeEstoqueFilterModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- Search input -->
          <div v-if="!loadingFilterEstoques" class="search-container">
            <div class="search-input-wrapper">
              <input
                type="text"
                v-model="estoqueFilterSearchQuery"
                placeholder="Pesquisar por nome, CNPJ ou número Corpem..."
                class="search-input"
                @input="filterEstoques"
                autocomplete="off"
                data-lpignore="true"
                data-form-type="other"
                name="estoque-filter-search"
              />
              <button
                v-if="estoqueFilterSearchQuery"
                @click="clearEstoqueFilterSearch"
                class="clear-search-btn"
                title="Limpar pesquisa"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="search-results-info" v-if="estoqueFilterSearchQuery">
              <span
                >{{ filteredFilterEstoques.length }} de
                {{ availableFilterEstoques.length }} estoques encontrados</span
              >
            </div>
          </div>

          <!-- Loading state for estoques -->
          <div v-if="loadingFilterEstoques" class="loading-clients-container">
            <div class="loading-spinner">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
            <p class="loading-text">Carregando estoques...</p>
            <small class="loading-subtext"
              >Processando lista de estoques disponíveis</small
            >
          </div>

          <!-- Estoques list -->
          <div v-else class="estoque-lista-vertical">
            <div
              v-for="estoque in filteredFilterEstoques"
              :key="estoque.cnpj"
              class="estoque-lista-item clickable-item"
              @click="selectFilterEstoque(estoque)"
            >
              <div class="estoque-lista-info">
                <span class="estoque-nome">{{ estoque.name }}</span>
                <span class="estoque-cnpj"
                  >CNPJ: {{ formatCNPJ(estoque.cnpj) }}</span
                >
                <span v-if="estoque.corpem_code" class="estoque-numero"
                  >Corpem: {{ estoque.corpem_code }}</span
                >
              </div>
              <div class="estoque-lista-arrow">
                <i class="fas fa-chevron-right"></i>
              </div>
            </div>
            <div
              v-if="availableFilterEstoques.length === 0"
              class="text-muted estoque-lista-vazia"
            >
              <i class="fas fa-info-circle"></i>
              Nenhum estoque disponível para filtro.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { BASE_URL } from '../config/api'
import OrderDetailsModal from '../components/OrderDetailsModal.vue'
import DocumentsModal from '../components/DocumentsModal.vue'
import LotDetailsModal from '../components/LotDetailsModal.vue'
import LotPhotosModal from '../components/LotPhotosModal.vue'
import ExcelJS from 'exceljs'

export default {
  name: 'ExpeditionsPage',
  components: {
    OrderDetailsModal,
    DocumentsModal,
    LotDetailsModal,
    LotPhotosModal,
  },
  data() {
    return {
      loading: false,
      error: null,
      expeditions: [],
      searchTerm: '',
      // Paginação server-side
      currentPage: 1,
      totalItems: 0,
      totalPages: 1,
      itemsPerPage: 50,
      selectedExpeditions: [],
      showDetailsModal: false,
      selectedOrder: null,
      showDocumentsModal: false,
      selectedOrderId: null,
      showLotDetailsModal: false,
      selectedLotCode: null,
      showLotPhotosModal: false,
      selectedLotCodeForPhotos: null,
      // Informações de fotos/evidências por lote (mapa: lotCode -> { hasPhotos, count })
      lotPhotosInfo: {},
      bulkPrinting: false,
      showBulkPrintModal: false,
      bulkIntegrating: false,
      showBulkIntegrateModal: false,
      expandedLots: [], // LOTs expandidos no accordion
      // Filtro de estoque
      showEstoqueFilterModal: false,
      selectedFilterEstoque: null,
      availableFilterEstoques: [],
      filteredFilterEstoques: [],
      loadingFilterEstoques: false,
      estoqueFilterSearchQuery: '',
      // Filtro de data
      dateFrom: '',
      dateTo: '',
      // Controle de foco para ocultar texto formatado quando em foco
      isDateFromFocused: false,
      isDateToFocused: false,
      // Filtro: mostrar apenas lotes/pedidos sem evidências/fotos
      onlyWithoutEvidence: false,
    }
  },
  computed: {
    isLevel1() {
      const currentUser = this.getCurrentUser()
      return currentUser && currentUser.level_access === 1
    },
    dateFromDisplay() {
      return this.formatDateForDisplay(this.dateFrom)
    },
    dateToDisplay() {
      return this.formatDateForDisplay(this.dateTo)
    },
    filteredExpeditions() {
      let filtered = [...this.expeditions]

      // Detectar se há busca ativa — quando há busca, o filtro de Embarcado é ignorado
      // para que o usuário consiga encontrar qualquer pedido pelo número
      const hasSearchTerm = this.searchTerm && this.searchTerm.trim().length > 0

      // Filtro para excluir pedidos com status "Embarcado" (apenas quando NÃO há busca ativa)
      // EXCEÇÃO: Se checkout_evidence = '1' e status = 'Embarcado' mas não tem evidências,
      // o pedido permanece na lista (borda avermelhada) EXCETO se:
      // 1. O status Embarcado foi acionado antes de hoje — nesse caso não exige evidências e o pedido sai da lista
      // 2. O pedido foi criado antes de 01/01/2026 — nesse caso não exige evidências e o pedido sai da lista
      if (!hasSearchTerm) {
        filtered = filtered.filter(exp => {
          if (exp.status === 'Embarcado') {
            // Se o embarque foi antes de hoje, não exige evidências: remove da lista
            if (this.embarcadoAntesDeHoje(exp)) {
              return false
            }
            // Verificar se precisa de evidências obrigatórias
            const needsEvidence = exp.checkoutEvidence === '1'
            if (needsEvidence) {
              const lotCode = exp.lot
              const hasEvidence = lotCode ? this.hasLotPhotos(lotCode) : false
              // Se não tem evidências, verificar se foi criado a partir de 01/01/2026
              if (!hasEvidence) {
                // Só manter na lista se foi criado a partir de 01/01/2026
                if (this.criadoAPartirDe2026(exp)) {
                  return true
                }
                // Se foi criado antes de 01/01/2026, remover da lista
                return false
              }
            }
            // Caso contrário, remover da lista
            return false
          }
          return true
        })
      }

      // Filtros de estoque, data e busca são agora server-side (enviados como query params)

      return filtered
    },
    groupedExpeditions() {
      const filtered = this.filteredExpeditions
      const groups = []
      const lotMap = {}
      const singleOrders = []

      // Agrupar pedidos por LOT
      filtered.forEach(exp => {
        if (exp.lot) {
          if (!lotMap[exp.lot]) {
            lotMap[exp.lot] = []
          }
          lotMap[exp.lot].push(exp)
        } else {
          // Pedidos sem LOT (antigos)
          singleOrders.push({
            type: 'single',
            order: exp,
          })
        }
      })

      // Processar LOTs
      Object.keys(lotMap).forEach(lot => {
        const orders = lotMap[lot]

        if (orders.length > 1) {
          // LOT com múltiplos pedidos - criar grupo
          groups.push({
            type: 'lot',
            lot: lot,
            orders: orders,
            count: orders.length,
            // Dados consolidados do lote
            armazem: orders[0].armazem,
            createdAt: orders[0].createdAt,
            // Ref. Entrada: usar o refEntrada do primeiro pedido (todos devem ter o mesmo)
            refEntrada: orders[0].refEntrada || [],
            // Status: mostrar o status mais avançado ou 'Misto' se houver diferença
            status: this.getLotStatus(orders),
            // Verificar se algum pedido tem rejection_code
            hasRejections: orders.some(order => order.rejectionCode),
          })
        } else {
          // LOT com apenas 1 pedido - tratar como pedido único
          singleOrders.push({
            type: 'single',
            order: orders[0],
          })
        }
      })

      // Ordenar grupos por data (mais recentes primeiro)
      groups.sort((a, b) => {
        const dateA = new Date(
          a.type === 'lot' ? a.createdAt : a.order.createdAt
        )
        const dateB = new Date(
          b.type === 'lot' ? b.createdAt : b.order.createdAt
        )
        return dateB - dateA
      })

      // Ordenar pedidos únicos por data
      singleOrders.sort((a, b) => {
        const dateA = new Date(a.order.createdAt)
        const dateB = new Date(b.order.createdAt)
        return dateB - dateA
      })

      // Combinar: grupos (LOTs) primeiro, depois pedidos únicos
      let result = [...groups, ...singleOrders]

      // Se o filtro "somente sem evidências" estiver ativo, manter apenas lotes/pedidos sem fotos
      if (this.onlyWithoutEvidence) {
        result = result.filter(item => {
          if (item.type === 'lot') {
            // Lote com múltiplos pedidos: usar o código do lote
            return !this.hasLotPhotos(item.lot)
          }

          if (item.type === 'single') {
            const lotCode = item.order && item.order.lot

            // Se tiver LOT, usar as evidências do lote; se não tiver LOT, considerar como sem evidência
            if (lotCode) {
              return !this.hasLotPhotos(lotCode)
            }

            return true
          }

          return true
        })
      }

      return result
    },
    integrableExpeditions() {
      return (this.filteredExpeditions || []).filter(e => !e.apenasLeitura)
    },
    allSelected() {
      return (
        this.integrableExpeditions.length > 0 &&
        this.selectedExpeditions.length === this.integrableExpeditions.length
      )
    },

    shouldShowEstoqueFilter() {
      try {
        const currentUser = this.getCurrentUser()

        console.log(
          '🔍 [shouldShowEstoqueFilter] Verificando visibilidade do filtro:',
          {
            hasUser: !!currentUser,
            level_access: currentUser?.level_access,
            hasCliAccess: !!currentUser?.cli_access,
            cliAccessType: typeof currentUser?.cli_access,
            cliAccessValue: currentUser?.cli_access,
            cliAccessString:
              typeof currentUser?.cli_access === 'string'
                ? currentUser.cli_access.substring(0, 100)
                : currentUser?.cli_access,
          }
        )

        // Usuários nível 0 sempre veem o filtro (acesso total a todos os estoques)
        if (currentUser && Number(currentUser.level_access) === 0) {
          console.log(
            '✅ [shouldShowEstoqueFilter] Usuário nível 0 - mostrando filtro (acesso total)'
          )
          return true
        }

        // Se não tem usuário, não mostrar
        if (!currentUser) {
          console.log(
            '❌ [shouldShowEstoqueFilter] Sem usuário - ocultando filtro'
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
            '✅ [shouldShowEstoqueFilter] Sem cli_access ou vazio - mostrando filtro (acesso total)'
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
              '✅ [shouldShowEstoqueFilter] cli_access é string vazia/inválida - mostrando filtro'
            )
            return true
          }
          try {
            cliAccess = JSON.parse(trimmed)
            console.log(
              '📦 [shouldShowEstoqueFilter] cli_access parseado:',
              cliAccess
            )
          } catch (e) {
            console.warn(
              '⚠️ [shouldShowEstoqueFilter] Erro ao parsear cli_access:',
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
            '✅ [shouldShowEstoqueFilter] cli_access vazio/inválido após parse - mostrando filtro'
          )
          return true
        }

        // Se tem apenas 1 estoque no cli_access, ocultar o filtro
        const estoquesCount = Object.keys(cliAccess).length
        console.log(
          `🔢 [shouldShowEstoqueFilter] Estoque(s) no cli_access: ${estoquesCount}`,
          Object.keys(cliAccess)
        )
        const shouldShow = estoquesCount > 1
        console.log(
          `${shouldShow ? '✅' : '❌'} [shouldShowEstoqueFilter] ${shouldShow ? 'Mostrando' : 'Ocultando'} filtro (${estoquesCount} estoque(s))`
        )
        return shouldShow
      } catch (error) {
        console.error(
          '❌ [shouldShowEstoqueFilter] Erro ao verificar filtro:',
          error
        )
        return true // Em caso de erro, mostrar o filtro por segurança
      }
    },
  },
  async mounted() {
    // Atualizar dados do usuário do banco de dados antes de carregar expedições
    await this.refreshUserFromDatabase()
    await this.loadExpeditions()
    this.$emit('page-ready')
  },
  async activated() {
    // Recarrega a lista toda vez que o componente é reativado (keep-alive)
    // Atualizar dados do usuário do banco de dados
    await this.refreshUserFromDatabase()
    this.loadExpeditions()
  },
  watch: {
    // Recarrega quando a rota muda para esta página
    $route(to, from) {
      if (to.path === '/expeditions' || to.name === 'expeditions') {
        this.loadExpeditions()
      }
    },
    // Filtros server-side: recarregar do servidor quando mudam
    dateFrom() {
      this.loadExpeditions(1)
    },
    dateTo() {
      this.loadExpeditions(1)
    },
    // Durante a montagem/atualização da lista, garantir que evidências dos lotes exibidos estejam carregadas (borda do botão Evidência)
    groupedExpeditions: {
      handler(items) {
        if (!Array.isArray(items) || items.length === 0) return
        const lots = new Set()
        items.forEach(item => {
          if (item.type === 'lot' && item.lot) lots.add(item.lot)
          if (item.type === 'single' && item.order && item.order.lot)
            lots.add(item.order.lot)
        })
        lots.forEach(lot => {
          const info = this.lotPhotosInfo[lot]
          if (!info || !info._loaded) this.loadLotPhotosInfo(lot, true)
        })
      },
      deep: true,
    },
  },
  methods: {
    executeSearch() {
      this.loadExpeditions(1)
    },

    // ========== Métodos de Exportação ==========
    async exportToExcel() {
      try {
        const expeditions = this.filteredExpeditions

        if (!expeditions || expeditions.length === 0) {
          alert('Não há pedidos para exportar')
          return
        }

        console.log(`📊 Exportando ${expeditions.length} pedidos para Excel...`)

        // Mapeamento de cores de status (cores de fundo e texto) - mesmas cores do agendamento
        const statusColors = {
          Criado: { bg: 'FFE2E3E5', text: 'FF383D41' },
          Integrado: { bg: 'FFFFF3CD', text: 'FF856404' },
          Separando: { bg: 'FFCCE5FF', text: 'FF004085' },
          Separado: { bg: 'FFD4EDDA', text: 'FF155724' },
          Embarcado: { bg: 'FFE1BEE7', text: 'FF7B1FA2' },
          Rejeitado: { bg: 'FFFCE4EC', text: 'FFC62828' },
          Erro: { bg: 'FFF8D7DA', text: 'FF721C24' },
          Cancelado: { bg: 'FFD6D6D6', text: 'FF1B1E21' },
        }

        // Obter e-mail do usuário
        let userEmail = 'E-mail não identificado'
        const currentUser = this.getCurrentUser()
        if (currentUser) {
          if (currentUser.config) {
            try {
              const config =
                typeof currentUser.config === 'string'
                  ? JSON.parse(currentUser.config)
                  : currentUser.config
              if (config?.emailSettings?.primaryEmail) {
                userEmail = config.emailSettings.primaryEmail
              }
            } catch (e) {
              console.warn('Erro ao parsear config do usuário:', e)
            }
          }
          if (userEmail === 'E-mail não identificado') {
            userEmail =
              currentUser.user ||
              currentUser.username ||
              currentUser.name ||
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

        // Obter informações de filtros aplicados
        const filtrosAplicados = []

        // Estoque
        if (this.selectedFilterEstoque) {
          filtrosAplicados.push(`Estoque: ${this.selectedFilterEstoque.name}`)
        } else {
          filtrosAplicados.push('Estoque: Todos')
        }

        // Data de
        filtrosAplicados.push(
          `Data de: ${this.dateFrom ? this.formatDateForDisplay(this.dateFrom) : 'Início'}`
        )

        // Data até
        filtrosAplicados.push(
          `Data até: ${this.dateTo ? this.formatDateForDisplay(this.dateTo) : 'Sempre'}`
        )

        // Busca
        if (this.searchTerm) {
          filtrosAplicados.push(`Busca: ${this.searchTerm}`)
        }

        // Definir cabeçalhos das colunas da tabela
        const tableHeaders = [
          'Pedido',
          'Lote',
          'Estoque',
          'Ref. Entrada',
          'Observações',
          'Data de Criação',
          'Status',
        ]
        const numCols = tableHeaders.length

        // Índice da coluna de status (última coluna)
        const statusColIndex = tableHeaders.length

        // Preparar dados para exportação
        const dataRows = expeditions.map(exp => {
          const refEntrada =
            Array.isArray(exp.refEntrada) && exp.refEntrada.length > 0
              ? exp.refEntrada.join(', ')
              : '-'

          return {
            data: [
              exp.numeroPedido || '-',
              exp.lot || '-',
              exp.armazem || '-',
              refEntrada,
              exp.obs || exp.observacoes || '-',
              this.formatDate(exp.createdAt) || '-',
              this.getStatusLabel(exp.status),
            ],
            status: exp.status,
          }
        })

        // Criar workbook e worksheet com ExcelJS
        const workbook = new ExcelJS.Workbook()
        workbook.creator = 'Portal Mercocamp'
        workbook.created = now

        const worksheet = workbook.addWorksheet('Pedidos de Saída', {
          properties: { defaultRowHeight: 18 },
        })

        // Estilo de borda padrão
        const thinBorder = { style: 'thin', color: { argb: 'FF1565C0' } }
        const mediumBorder = { style: 'medium', color: { argb: 'FF0D47A1' } }

        // ===== LINHA 1: TÍTULO =====
        worksheet.mergeCells(1, 1, 1, numCols)
        const titleCell = worksheet.getCell('A1')
        titleCell.value = 'RELATÓRIO DE PEDIDOS DE SAÍDA'
        titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } }
        titleCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0D47A1' },
        }
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
        }
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

        // ===== LINHA 4: FILTROS =====
        const row4 = worksheet.getRow(4)
        row4.getCell(1).value = 'Filtros:'
        row4.getCell(1).font = { bold: true, size: 10 }
        row4.getCell(1).fill = lightBlueFill
        row4.getCell(1).border = {
          left: thinBorder,
          top: thinBorder,
          bottom: thinBorder,
        }

        filtrosAplicados.forEach((filtro, index) => {
          const colIndex = index + 2
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

        // Preencher células vazias restantes
        for (let i = filtrosAplicados.length + 2; i <= numCols; i++) {
          row4.getCell(i).fill = lightBlueFill
          row4.getCell(i).border = {
            top: thinBorder,
            bottom: thinBorder,
            right: i === numCols ? thinBorder : undefined,
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
        const leftAlignColumns = [2, 3, 4] // Estoque, Ref. Entrada e Observações

        // ===== DADOS DA TABELA =====
        let currentRow = 7
        dataRows.forEach((rowObj, rowIndex) => {
          const row = worksheet.getRow(currentRow)
          const isFirstRow = rowIndex === 0
          const isLastRow = rowIndex === dataRows.length - 1

          rowObj.data.forEach((value, colIndex) => {
            const cell = row.getCell(colIndex + 1)
            cell.value = value
            cell.font = { size: 10 }
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
        worksheet.getColumn(1).width = 15 // Pedido
        worksheet.getColumn(2).width = 30 // Lote
        worksheet.getColumn(3).width = 30 // Estoque
        worksheet.getColumn(4).width = 20 // Ref. Entrada
        worksheet.getColumn(5).width = 35 // Observações
        worksheet.getColumn(6).width = 18 // Data de Criação
        worksheet.getColumn(7).width = 15 // Status

        // ===== GERAR E BAIXAR ARQUIVO =====
        const buffer = await workbook.xlsx.writeBuffer()
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })

        const dateStr = now.toLocaleDateString('pt-BR').replace(/\//g, '-')
        const fileName = `Pedidos_saida_portal_mercocamp_${dateStr}.xlsx`

        // Download usando link temporário
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.click()
        window.URL.revokeObjectURL(url)

        console.log(`✅ Exportação concluída: ${fileName}`)
      } catch (error) {
        console.error('❌ Erro ao exportar para Excel:', error)
        alert('Erro ao exportar para Excel. Tente novamente.')
      }
    },

    // ========== Métodos de Carregamento ==========
    async loadExpeditions(pageOverride) {
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const user = JSON.parse(userData)
          if (Number(user.level_access) === 4) {
            console.log(
              '📦 ExpeditionsPage: Usuário nível 4 (Manutenção) - pulando carregamento de expedições'
            )
            this.expeditions = []
            this.loading = false
            return
          }
        } catch (_) {}
      }
      this.loading = true
      this.error = null
      try {
        const token = localStorage.getItem('token')
        const pg = pageOverride != null ? pageOverride : this.currentPage
        const params = { page: pg, limit: this.itemsPerPage }
        if (this.selectedFilterEstoque) {
          params.estoque = String(this.selectedFilterEstoque.cnpj).replace(
            /\D/g,
            ''
          )
        }
        if (this.searchTerm && this.searchTerm.trim()) {
          params.search = this.searchTerm.trim()
        }
        if (this.dateFrom) params.date_from = this.dateFrom
        if (this.dateTo) params.date_to = this.dateTo
        const response = await axios.get('/expeditions', {
          headers: { Authorization: `Bearer ${token}` },
          params,
        })

        // A API retorna { success, count, pedidos }
        if (response.data && response.data.pedidos) {
          // Verificar prontidão de cada pedido com agendamentos vinculados
          const pedidosComVerificacao = await Promise.all(
            response.data.pedidos.map(async pedido => {
              // Verificar se tem checkin_nf
              let hasCheckinNfs = false
              let readyToIntegrate = true

              if (pedido.checkin_nf) {
                try {
                  const checkinNfs =
                    typeof pedido.checkin_nf === 'string'
                      ? JSON.parse(pedido.checkin_nf)
                      : pedido.checkin_nf

                  hasCheckinNfs =
                    Array.isArray(checkinNfs) && checkinNfs.length > 0

                  if (hasCheckinNfs) {
                    // Verificar prontidão via API
                    try {
                      const readinessResponse = await axios.get(
                        `/expeditions/${pedido.id}/check-readiness`,
                        { headers: { Authorization: `Bearer ${token}` } }
                      )

                      readyToIntegrate = readinessResponse.data.ready || false
                      console.log(
                        `🔍 Pedido #${pedido.id}: ${readyToIntegrate ? 'Pronto' : 'Não pronto'} para integração`
                      )
                    } catch (error) {
                      console.warn(
                        `⚠️ Erro ao verificar prontidão do pedido ${pedido.id}:`,
                        error
                      )
                      readyToIntegrate = false
                    }
                  }
                } catch (e) {
                  console.warn(
                    `⚠️ Erro ao parsear checkin_nf do pedido ${pedido.id}:`,
                    e
                  )
                }
              }

              return {
                ...pedido,
                hasCheckinNfs,
                readyToIntegrate,
                // Garantir que refEntrada seja sempre um array
                refEntrada: Array.isArray(pedido.refEntrada)
                  ? pedido.refEntrada
                  : pedido.refEntrada
                    ? [pedido.refEntrada]
                    : [],
              }
            })
          )

          this.expeditions = pedidosComVerificacao
          this.totalItems = response.data.total ?? pedidosComVerificacao.length
          this.totalPages = response.data.pages ?? 1
          this.currentPage = response.data.page ?? pg
          // Preencher contagem de mídias a partir da lista (coluna midia_count no banco); evita requisições /images/count
          this.fillLotPhotosInfoFromList(pedidosComVerificacao)
          // Fallback: buscar count apenas para lotes que ainda não têm dado (ex.: API antiga)
          this.prefetchLotsPhotosInfo(this.expeditions)
          console.log(
            `✅ ${response.data.count} pedido(s) carregado(s) (página ${this.currentPage}/${this.totalPages}, total: ${this.totalItems})`
          )
        } else {
          this.expeditions = []
          console.warn('⚠️ Resposta da API não contém pedidos')
        }
      } catch (error) {
        // Não logar quando requisição foi abortada (timeout, navegação rápida, etc.)
        const isAborted =
          error?.code === 'ERR_CANCELED' ||
          error?.message?.toLowerCase?.().includes('aborted')
        if (!isAborted) {
          console.error('❌ Erro ao carregar pedidos:', error)
          this.error =
            error.response?.data?.message ||
            'Erro ao carregar pedidos de expedição'
        }
      } finally {
        this.loading = false
      }
    },
    async refresh() {
      await this.loadExpeditions(1)
      this.selectedExpeditions = []
    },
    goToPage(pg) {
      if (pg < 1 || pg > this.totalPages) return
      this.currentPage = pg
      this.loadExpeditions(pg)
    },
    /**
     * Preenche lotPhotosInfo a partir do midiaCount retornado na lista de expedições (coluna midia_count no banco).
     * Assim não é necessário buscar /lot/:lot/images/count para cada lote — apenas ao abrir o modal são carregadas as imagens.
     */
    fillLotPhotosInfoFromList(expeditions) {
      if (!Array.isArray(expeditions)) return
      expeditions.forEach(exp => {
        if (!exp.lot) return
        const count = exp.midiaCount != null ? parseInt(exp.midiaCount, 10) : 0
        const n = isNaN(count) ? 0 : Math.max(0, count)
        this.lotPhotosInfo[exp.lot] = {
          hasPhotos: n > 0,
          count: n,
          _loaded: true,
        }
      })
    },
    /**
     * Pré-carrega contagem de fotos apenas para lotes que ainda não têm dado (fallback para API sem midiaCount).
     * A maioria dos lotes já vem com midiaCount na lista, então não dispara requisições extras.
     */
    prefetchLotsPhotosInfo(expeditions) {
      try {
        if (!Array.isArray(expeditions) || expeditions.length === 0) return

        const uniqueLots = [
          ...new Set(expeditions.map(exp => exp.lot).filter(Boolean)),
        ]
        const lotsWithoutInfo = uniqueLots.filter(
          lot => !this.lotPhotosInfo[lot] || !this.lotPhotosInfo[lot]._loaded
        )
        if (lotsWithoutInfo.length === 0) return

        const MAX_CONCURRENT = 3
        const BATCH_DELAY_MS = 500
        let idx = 0
        const runBatch = () => {
          const batch = lotsWithoutInfo.slice(idx, idx + MAX_CONCURRENT)
          if (batch.length === 0) return
          idx += MAX_CONCURRENT
          batch.forEach(lot => this.loadLotPhotosInfo(lot, true))
          if (idx < lotsWithoutInfo.length) {
            setTimeout(runBatch, BATCH_DELAY_MS)
          }
        }
        setTimeout(runBatch, 200)
      } catch (error) {
        console.warn(
          'Erro ao pré-carregar informações de fotos dos lotes:',
          error
        )
      }
    },
    /**
     * Carrega (ou recarrega) informações de fotos/evidências de um lote específico
     */
    async loadLotPhotosInfo(lot, force = false) {
      if (!lot) return

      const existing = this.lotPhotosInfo[lot]
      if (!force && existing && existing._loaded) {
        return
      }

      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(
          `/expeditions/lot/${lot}/images/count`,
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000,
          }
        )

        const count =
          response.data && typeof response.data.count === 'number'
            ? response.data.count
            : 0

        this.lotPhotosInfo[lot] = {
          hasPhotos: count > 0,
          count,
          _loaded: true,
        }
      } catch {
        this.lotPhotosInfo[lot] = {
          hasPhotos: false,
          count: 0,
          _loaded: true,
          error: null,
        }
      }
    },
    /**
     * Verifica se um lote possui uma ou mais fotos/evidências
     */
    hasLotPhotos(lot) {
      if (!lot) return false
      const info = this.lotPhotosInfo[lot]
      return !!(info && info.hasPhotos)
    },
    /**
     * Retorna true se o status "Embarcado" foi acionado antes da data de hoje.
     * Nesse caso o pedido/lote não precisa de evidências para sair da lista a partir de hoje.
     */
    embarcadoAntesDeHoje(expedition) {
      if (!expedition || !expedition.statusEmbarcadoAt) return false
      const embarcadoDate = new Date(expedition.statusEmbarcadoAt)
      embarcadoDate.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return embarcadoDate < today
    },
    /**
     * Retorna true se o pedido foi criado a partir de 01/01/2026.
     * Usado para determinar se pedidos embarcados sem evidências devem aparecer na lista.
     */
    criadoAPartirDe2026(expedition) {
      if (!expedition || !expedition.createdAt) return false
      const createdDate = new Date(expedition.createdAt)
      createdDate.setHours(0, 0, 0, 0)
      const cutoffDate = new Date('2026-01-01')
      cutoffDate.setHours(0, 0, 0, 0)
      return createdDate >= cutoffDate
    },
    /**
     * Verifica se um pedido precisa de evidências mas não possui
     * Retorna true se: checkoutEvidence = '1', status = 'Embarcado', não tem evidências
     * e o status Embarcado foi acionado hoje ou não temos a data (exige evidências).
     * Se foi embarcado antes de hoje, não exige evidências (retorna false).
     * Se foi criado antes de 01/01/2026, não exige evidências (retorna false).
     */
    needsEvidenceButMissing(expedition) {
      if (!expedition) return false
      if (expedition.checkoutEvidence !== '1') return false
      if (expedition.status !== 'Embarcado') return false
      // Embarque antes de hoje: não exige evidências
      if (this.embarcadoAntesDeHoje(expedition)) return false
      // Criado antes de 01/01/2026: não exige evidências
      if (!this.criadoAPartirDe2026(expedition)) return false
      const lotCode = expedition.lot
      if (!lotCode) return false
      return !this.hasLotPhotos(lotCode)
    },
    /**
     * Verifica se um item (lote ou pedido único) precisa de evidências mas não possui
     * Para uso no template (groupedExpeditions).
     * Embarque antes de hoje: não exige evidências (retorna false).
     * Criado antes de 01/01/2026: não exige evidências (retorna false).
     */
    itemNeedsEvidenceButMissing(item) {
      if (!item) return false
      if (item.type === 'lot') {
        const firstOrder =
          item.orders && item.orders.length > 0 ? item.orders[0] : null
        if (!firstOrder) return false
        if (firstOrder.checkoutEvidence !== '1') return false
        if (firstOrder.status !== 'Embarcado') return false
        if (this.embarcadoAntesDeHoje(firstOrder)) return false
        // Criado antes de 01/01/2026: não exige evidências
        // Para lotes, usar createdAt do item (que vem do primeiro pedido) ou do primeiro pedido
        const orderToCheck = item.createdAt ? item : firstOrder
        if (!this.criadoAPartirDe2026(orderToCheck)) return false
        return !this.hasLotPhotos(item.lot)
      } else if (item.type === 'single') {
        return this.needsEvidenceButMissing(item.order)
      }
      return false
    },
    getStatusLabel(status) {
      const labels = {
        Criado: 'Criado',
        pendente: 'Pendente',
        Integrado: 'Integrado',
        Separando: 'Separando',
        Separado: 'Separado',
        Embarcado: 'Embarcado',
        Rejeitado: 'Rejeitado',
        Erro: 'Erro',
        erro_token: 'Erro - Token',
        erro_corpem: 'Erro - CorpEM',
        erro_envio: 'Erro - Envio',
        Multiplo: 'MÚLTIPLO',
      }
      return labels[status] || status
    },
    getStatusClass(status) {
      const classes = {
        Criado: 'status-criado',
        pendente: 'status-pendente',
        Integrado: 'status-integrado',
        Separando: 'status-separando',
        Separado: 'status-separado',
        Embarcado: 'status-embarcado',
        Rejeitado: 'status-rejeitado',
        Erro: 'status-erro',
        erro_token: 'status-erro',
        erro_corpem: 'status-erro',
        erro_envio: 'status-erro',
        Multiplo: 'status-multiplo',
      }
      return classes[status] || 'status-default'
    },
    getIntegrationTooltip(expedition) {
      return 'Integrar pedido com CorpEM WMS'
    },
    getRejectionTooltip(rejectionCode) {
      if (!rejectionCode) return ''

      const rejectionMessages = {
        1: 'Código 1: No. NF Inválido',
        2: 'Código 2: Dt. Emi. Inválida',
        3: 'Código 3: NF/Ped. Existente',
        4: 'Código 4: CNPJ Transp. não Informado',
        5: 'Código 5: No. Pedido não Informado',
        6: 'Código 6: Merc(s). Rejeitada(s)',
        7: 'Código 7: No. N.F. não Informado',
        8: 'Código 8: Série N.F. não Informada',
        9: 'Código 9: Dt. Emissão não Informada',
        A: 'Código A: Vl. N.F. não Informado',
        B: 'Código B: CNPJ/CPF Dest. não Informado',
        V: 'Código V: R. Social Dest. não Informado',
        D: 'Código D: Logradouro não Informado',
        E: 'Código E: Município não Informado',
        F: 'Código F: UF não Informada',
        G: 'Código G: Bairro não Informado',
        H: 'Código H: CEP não Informado',
        I: 'Código I: Vl. N.F. Inválido',
      }

      return (
        rejectionMessages[rejectionCode.toUpperCase()] ||
        `Código de rejeição: ${rejectionCode}`
      )
    },
    isSelected(id) {
      return this.selectedExpeditions.includes(id)
    },
    toggleSelect(id) {
      const exp = this.filteredExpeditions.find(e => e.id === id)
      if (exp?.apenasLeitura) return
      const index = this.selectedExpeditions.indexOf(id)
      if (index > -1) {
        this.selectedExpeditions.splice(index, 1)
      } else {
        this.selectedExpeditions.push(id)
      }
    },
    toggleSelectAll() {
      if (this.allSelected) {
        this.selectedExpeditions = []
      } else {
        this.selectedExpeditions = this.integrableExpeditions.map(exp => exp.id)
      }
    },
    async integrateExpedition(expedition) {
      // Usuários com nível de acesso 1 não têm permissão para integrar
      if (this.isLevel1) {
        alert('Você não tem permissão para realizar integração de pedidos.')
        return
      }

      if (
        !confirm(
          `Deseja integrar o pedido ${expedition.numeroPedido} ao sistema CorpEM?`
        )
      ) {
        return
      }

      try {
        console.log(
          '🚀 Iniciando integração do pedido:',
          expedition.numeroPedido
        )
        this.loading = true

        const token = localStorage.getItem('token')
        const response = await axios.post(
          `/expeditions/${expedition.id}/integrate`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )

        console.log('✅ Resposta da integração:', response.data)

        if (response.data.success) {
          if (response.data.warning) {
            alert(
              `Pedido ${expedition.numeroPedido} integrado com sucesso!\n\n⚠️ Aviso: ${response.data.warning}`
            )
          } else {
            alert(`Pedido ${expedition.numeroPedido} integrado com sucesso!`)
          }
          // Recarregar lista para atualizar status
          await this.loadExpeditions()
        } else {
          // Verificar se é erro de evidências obrigatórias
          if (
            response.data?.requiresEvidence &&
            !response.data?.hasEvidence
          ) {
            const reason =
              response.data?.reason ||
              'Evidências obrigatórias não encontradas'
            alert(
              `INTEGRAÇÃO BLOQUEADA\n\n${reason}\n\nPor favor, adicione evidências (imagens ou vídeos) ao lote antes de integrar.`
            )
          } else {
            alert(
              `Erro ao integrar: ${response.data.error || response.data.message}`
            )
          }
        }
      } catch (error) {
        console.error('❌ Erro ao integrar pedido:', error)
        const errorMsg =
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message

        // Verificar se é erro de evidências obrigatórias
        if (
          error.response?.data?.requiresEvidence &&
          !error.response?.data?.hasEvidence
        ) {
          const reason =
            error.response?.data?.reason ||
            'Evidências obrigatórias não encontradas'
          alert(
            `INTEGRAÇÃO BLOQUEADA\n\n${reason}\n\nPor favor, adicione evidências (imagens ou vídeos) ao lote antes de integrar.`
          )
        } else {
          alert(`Erro ao integrar pedido: ${errorMsg}`)
        }
      } finally {
        this.loading = false
      }
    },
    async viewDetails(expedition) {
      console.log('📋 Abrindo detalhes do pedido:', expedition)

      try {
        this.loading = true

        const token = localStorage.getItem('token')
        const response = await axios.get(`/expeditions/${expedition.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        console.log('✅ Detalhes do pedido recebidos:', response.data)

        if (response.data.success && response.data.pedido) {
          this.selectedOrder = response.data.pedido
          this.showDetailsModal = true
        } else {
          console.error('❌ Resposta inesperada da API:', response.data)
          alert('Erro ao carregar detalhes do pedido')
        }
      } catch (error) {
        console.error('❌ Erro ao buscar detalhes do pedido:', error)
        const errorMsg =
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message
        alert(`Erro ao carregar detalhes: ${errorMsg}`)
      } finally {
        this.loading = false
      }
    },
    closeDetailsModal() {
      this.showDetailsModal = false
      this.selectedOrder = null
    },
    async refreshOrderDetails({ orderId }) {
      if (orderId == null || !this.selectedOrder) return
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`/expeditions/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.data.success && response.data.pedido) {
          this.selectedOrder = response.data.pedido
        }
      } catch (err) {
        console.error('Erro ao atualizar detalhes do pedido (aba Dev):', err)
      }
    },
    handleLotPhotosClick(lot) {
      // Imagens são carregadas apenas quando o modal abre (LotPhotosModal.loadImages)
      this.viewLotPhotos(lot)
    },
    viewLotDetails(lot) {
      console.log('📋 Abrindo detalhes do lote:', lot)
      this.selectedLotCode = lot
      this.showLotDetailsModal = true
    },
    closeLotDetailsModal() {
      this.showLotDetailsModal = false
      this.selectedLotCode = null
    },
    viewLotPhotos(lot) {
      console.log('📷 Abrindo fotos do lote:', lot)
      this.selectedLotCodeForPhotos = lot
      this.showLotPhotosModal = true
    },
    closeLotPhotosModal() {
      this.showLotPhotosModal = false
      this.selectedLotCodeForPhotos = null
    },
    /** Atualiza o cache de fotos do lote após o modal carregar (para badge na lista) */
    onLotPhotosLoaded(payload) {
      if (!payload || !payload.lotCode) return
      const count = payload.count != null ? payload.count : 0
      this.lotPhotosInfo[payload.lotCode] = {
        hasPhotos: count > 0,
        count,
        _loaded: true,
      }
    },
    viewDocuments(expedition) {
      console.log('📄 Abrindo documentos do pedido:', expedition)

      // Se o pedido tem LOT, buscar documentos da tabela 'lot'
      // Caso contrário, buscar da tabela 'orders' (pedido individual)
      if (expedition.lot) {
        console.log(
          '📦 Pedido tem LOT, buscando documentos da tabela lot:',
          expedition.lot
        )
        this.selectedOrderId = expedition.lot
      } else {
        console.log(
          '📄 Pedido sem LOT, buscando documentos da tabela orders:',
          expedition.id
        )
        this.selectedOrderId = expedition.id
      }

      this.showDocumentsModal = true
    },
    closeDocumentsModal() {
      this.showDocumentsModal = false
      this.selectedOrderId = null
    },
    async bulkDelete() {
      if (
        !confirm(
          `Deseja realmente excluir ${this.selectedExpeditions.length} pedido(s) selecionado(s)?`
        )
      ) {
        return
      }

      // TODO: Implementar exclusão em massa
      console.log('Excluir pedidos:', this.selectedExpeditions)
      alert('Funcionalidade de exclusão em massa em desenvolvimento')
    },
    formatDate(dateString) {
      if (!dateString) return '-'

      try {
        const date = new Date(dateString)

        // Verificar se a data é válida
        if (isNaN(date.getTime())) return '-'

        // Formatar data no formato DD/MM/YYYY (sem hora)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()

        return `${day}/${month}/${year}`
      } catch (error) {
        console.error('Erro ao formatar data:', error)
        return '-'
      }
    },

    formatDateForDisplay(dateString) {
      if (!dateString) return ''

      // Se já está no formato YYYY-MM-DD, converter para DD/MM/YYYY
      if (
        typeof dateString === 'string' &&
        /^\d{4}-\d{2}-\d{2}$/.test(dateString)
      ) {
        const [year, month, day] = dateString.split('-')
        return `${day}/${month}/${year}`
      }

      try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return ''

        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()

        return `${day}/${month}/${year}`
      } catch (error) {
        console.error('Erro ao formatar data para exibição:', error)
        return ''
      }
    },

    // Métodos para gerenciar LOTs
    getLotStatus(orders) {
      // Retorna status consolidado de um lote
      const statuses = [...new Set(orders.map(o => o.status))]

      if (statuses.length === 1) {
        return statuses[0]
      }

      // Se houver múltiplos status, retornar 'Multiplo'
      return 'Multiplo'
    },

    toggleLot(lot) {
      const index = this.expandedLots.indexOf(lot)
      if (index > -1) {
        this.expandedLots.splice(index, 1)
      } else {
        this.expandedLots.push(lot)
      }
    },

    isLotExpanded(lot) {
      return this.expandedLots.includes(lot)
    },

    lotHasIntegrableOrders(item) {
      if (!item || item.type !== 'lot' || !item.orders) return false
      return item.orders.some(o => !o.apenasLeitura)
    },
    isLotSelected(lot) {
      const lotOrders = this.groupedExpeditions.find(
        item => item.type === 'lot' && item.lot === lot
      )
      if (!lotOrders || !lotOrders.orders) return false
      const integrableIds = lotOrders.orders
        .filter(o => !o.apenasLeitura)
        .map(o => o.id)
      if (integrableIds.length === 0) return false
      return integrableIds.every(id => this.selectedExpeditions.includes(id))
    },

    toggleLotSelection(lot) {
      const lotGroup = this.groupedExpeditions.find(
        item => item.type === 'lot' && item.lot === lot
      )
      if (!lotGroup || !lotGroup.orders) return
      const integrableIds = lotGroup.orders
        .filter(o => !o.apenasLeitura)
        .map(o => o.id)
      if (integrableIds.length === 0) return
      const allSelected = integrableIds.every(id =>
        this.selectedExpeditions.includes(id)
      )
      if (allSelected) {
        this.selectedExpeditions = this.selectedExpeditions.filter(
          id => !integrableIds.includes(id)
        )
      } else {
        integrableIds.forEach(id => {
          if (!this.selectedExpeditions.includes(id))
            this.selectedExpeditions.push(id)
        })
      }
    },

    async integrateLot(lot) {
      // Usuários com nível de acesso 1 não têm permissão para integrar
      if (this.isLevel1) {
        alert('Você não tem permissão para realizar integração de pedidos.')
        return
      }
      // Integrar todos os pedidos do lote
      const lotGroup = this.groupedExpeditions.find(
        item => item.type === 'lot' && item.lot === lot
      )

      if (!lotGroup || !lotGroup.orders) {
        alert('Lote não encontrado')
        return
      }

      const orders = lotGroup.orders.filter(o => !o.apenasLeitura)
      if (orders.length === 0) {
        alert('Este lote não possui pedidos que possam ser integrados.')
        return
      }
      const confirmMsg = `Deseja integrar os ${orders.length} pedido(s) integrável(is) do lote ${lot}?`

      if (!confirm(confirmMsg)) return

      this.loading = true
      let successCount = 0
      let errorCount = 0
      const errors = []

      try {
        const token = localStorage.getItem('token')

        // Integrar cada pedido sequencialmente
        for (const order of orders) {
          try {
            const response = await axios.post(
              `/expeditions/${order.id}/integrate`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            )

            if (response.data.success) {
              successCount++
            } else {
              errorCount++
              // Verificar se é erro de evidências obrigatórias
              let errorMessage = response.data.error || 'Erro desconhecido'
              if (
                response.data.requiresEvidence &&
                !response.data.hasEvidence
              ) {
                errorMessage = `Evidências obrigatórias não encontradas: ${response.data.reason || 'Cliente requer evidências, mas o lote não possui evidências cadastradas'}`
              }
              errors.push({
                numero: order.numeroPedido,
                message: errorMessage,
              })
            }
          } catch (error) {
            errorCount++
            let errorMsg =
              error.response?.data?.error ||
              error.response?.data?.message ||
              error.message

            // Verificar se é erro de evidências obrigatórias
            if (
              error.response?.data?.requiresEvidence &&
              !error.response?.data?.hasEvidence
            ) {
              errorMsg = `Evidências obrigatórias não encontradas: ${error.response?.data?.reason || 'Cliente requer evidências, mas o lote não possui evidências cadastradas'}`
            }

            errors.push({
              numero: order.numeroPedido,
              message: errorMsg,
            })
          }
        }

        // Mostrar resultado
        let resultMsg = `Integração do lote concluída:\n\n`
        resultMsg += `Sucesso: ${successCount} pedido(s)\n`
        resultMsg += `Erros: ${errorCount} pedido(s)`
        if (errors.length > 0) {
          resultMsg += `\n\nDetalhes dos erros:\n`
          resultMsg += `────────────────────────────────────────\n`
          errors.forEach((error, index) => {
            const errorText =
              typeof error === 'string'
                ? error
                : `Pedido ${error.numero}: ${error.message}`
            resultMsg += `${index + 1}. ${errorText}\n`
          })
          resultMsg += `────────────────────────────────────────`
        }

        alert(resultMsg)

        // Recarregar lista
        await this.loadExpeditions()
      } catch (error) {
        console.error('❌ Erro ao integrar lote:', error)
        alert(`Erro ao integrar lote: ${error.message}`)
      } finally {
        this.loading = false
      }
    },

    async viewLotDocuments(lot) {
      // Abrir modal de documentos do lote
      console.log('📎 Abrindo documentos do lote:', lot)

      try {
        this.loading = true

        const token = localStorage.getItem('token')
        const response = await axios.get(`/expeditions/lot/${lot}/documents`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        console.log('✅ Documentos do lote recebidos:', response.data)

        if (response.data.success) {
          // Abrir modal de documentos com dados do LOT
          // TODO: Adaptar DocumentsModal para aceitar dados de LOT
          this.selectedOrderId = lot // Passar LOT como ID
          this.showDocumentsModal = true
        } else {
          alert('Nenhum documento encontrado para este lote')
        }
      } catch (error) {
        console.error('❌ Erro ao buscar documentos do lote:', error)
        const errorMsg =
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message
        alert(`Erro ao carregar documentos: ${errorMsg}`)
      } finally {
        this.loading = false
      }
    },

    openBulkIntegrateModal() {
      // Usuários com nível de acesso 1 não têm permissão para integrar
      if (this.isLevel1) {
        alert('Você não tem permissão para realizar integração de pedidos.')
        return
      }
      // Verificar se há pedidos selecionados
      if (this.selectedExpeditions.length === 0) {
        alert('Nenhum pedido selecionado para integração')
        return
      }

      // Abrir modal de confirmação
      this.showBulkIntegrateModal = true
    },

    closeBulkIntegrateModal() {
      this.showBulkIntegrateModal = false
    },

    async confirmBulkIntegrate() {
      // Usuários com nível de acesso 1 não têm permissão para integrar
      if (this.isLevel1) {
        alert('Você não tem permissão para realizar integração de pedidos.')
        this.closeBulkIntegrateModal()
        return
      }
      try {
        console.log(
          `🔄 [BULK-INTEGRATE] Iniciando integração em lote de ${this.selectedExpeditions.length} pedidos`
        )

        this.bulkIntegrating = true
        this.closeBulkIntegrateModal()

        const token = localStorage.getItem('token')
        let successCount = 0
        let errorCount = 0
        const errors = []

        // Processar cada pedido sequencialmente
        for (const expeditionId of this.selectedExpeditions) {
          try {
            console.log(
              `📤 [BULK-INTEGRATE] Integrando pedido ${expeditionId}...`
            )

            const response = await axios.post(
              `/expeditions/${expeditionId}/integrate`,
              {},
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            )

            if (response.data.success) {
              successCount++
              console.log(
                `✅ [BULK-INTEGRATE] Pedido ${expeditionId} integrado com sucesso`
              )
            } else {
              errorCount++
              // Verificar se é erro de evidências obrigatórias
              let errorMessage =
                response.data.error ||
                response.data.message ||
                'Erro desconhecido'
              if (
                response.data.requiresEvidence &&
                !response.data.hasEvidence
              ) {
                errorMessage = `Evidências obrigatórias não encontradas: ${response.data.reason || 'Cliente requer evidências, mas o lote não possui evidências cadastradas'}`
              }
              errors.push({
                id: expeditionId,
                message: errorMessage,
              })
              console.error(
                `❌ [BULK-INTEGRATE] Erro no pedido ${expeditionId}:`,
                errorMessage
              )
            }
          } catch (error) {
            errorCount++
            let errorMsg =
              error.response?.data?.error ||
              error.message ||
              'Erro desconhecido'

            // Verificar se é erro de evidências obrigatórias
            if (
              error.response?.data?.requiresEvidence &&
              !error.response?.data?.hasEvidence
            ) {
              errorMsg = `Evidências obrigatórias não encontradas: ${error.response?.data?.reason || 'Cliente requer evidências, mas o lote não possui evidências cadastradas'}`
            }

            errors.push({
              id: expeditionId,
              message: errorMsg,
            })
            console.error(
              `❌ [BULK-INTEGRATE] Exceção no pedido ${expeditionId}:`,
              error
            )
          }
        }

        // Mostrar resultado
        let message = `Integração em lote concluída!\n\n`
        message += `Sucesso: ${successCount} pedido(s)\n`
        if (errorCount > 0) {
          message += `Erros: ${errorCount} pedido(s)\n\n`
          message += `Detalhes dos erros:\n`
          message += `────────────────────────────────────────\n`
          errors.forEach((error, index) => {
            const errorText =
              typeof error === 'string'
                ? error
                : `Pedido ${error.id}: ${error.message}`
            message += `${index + 1}. ${errorText}\n`
          })
          message += `────────────────────────────────────────\n\n`

          // Verificar se há erros relacionados a evidências
          const evidenceErrors = errors.filter(e => {
            const errorText = typeof e === 'string' ? e : e.message
            return errorText.includes('Evidências obrigatórias')
          })
          if (evidenceErrors.length > 0) {
            message += `ATENÇÃO: ${evidenceErrors.length} pedido(s) bloqueado(s) por falta de evidências obrigatórias.\n`
            message += `Por favor, adicione evidências (imagens ou vídeos) aos lotes antes de integrar.`
          }
        }

        alert(message)

        // Recarregar lista de expedições
        await this.loadExpeditions()

        // Limpar seleção
        this.selectedExpeditions = []

        console.log(
          `✅ [BULK-INTEGRATE] Integração em lote concluída: ${successCount} sucesso, ${errorCount} erros`
        )
      } catch (error) {
        console.error(
          '❌ [BULK-INTEGRATE] Erro fatal na integração em lote:',
          error
        )
        alert(`Erro ao realizar integração em lote:\n\n${error.message}`)
      } finally {
        this.bulkIntegrating = false
      }
    },

    openBulkPrintModal() {
      // Verificar se há pedidos selecionados
      if (this.selectedExpeditions.length === 0) {
        alert('Nenhum pedido selecionado para impressão')
        return
      }

      // Abrir modal de confirmação
      this.showBulkPrintModal = true
    },

    closeBulkPrintModal() {
      this.showBulkPrintModal = false
    },

    async confirmBulkPrint() {
      try {
        console.log(
          `🖨️ [BULK-PRINT] Iniciando impressão em lote de ${this.selectedExpeditions.length} pedidos`
        )

        this.bulkPrinting = true
        this.closeBulkPrintModal()

        const token = localStorage.getItem('token')

        // Chamar endpoint de impressão em lote
        const response = await axios.post(
          '/expeditions/bulk-print',
          {
            expeditionIds: this.selectedExpeditions,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            responseType: 'blob', // Receber PDF como blob
          }
        )

        console.log(
          '✅ [BULK-PRINT] PDF recebido, tamanho:',
          response.data.size
        )

        // Criar URL do blob
        const pdfBlob = new Blob([response.data], { type: 'application/pdf' })
        const pdfUrl = URL.createObjectURL(pdfBlob)

        // Abrir em nova aba
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

        console.log('✅ [BULK-PRINT] PDF aberto com sucesso')
      } catch (error) {
        console.error('❌ [BULK-PRINT] Erro na impressão em lote:', error)
        const errorMsg =
          error.response?.data?.error ||
          error.message ||
          'Erro ao realizar impressão em lote'
        alert(`Erro ao imprimir em lote:\n\n${errorMsg}`)
      } finally {
        this.bulkPrinting = false
      }
    },

    // Métodos para filtro de estoque
    handleEstoqueFilterClick() {
      // Se já há um estoque selecionado, limpar o filtro
      if (this.selectedFilterEstoque) {
        this.clearEstoqueFilter()
      } else {
        // Se não há estoque selecionado, abrir o modal para selecionar
        this.openEstoqueFilterModal()
      }
    },

    async openEstoqueFilterModal() {
      this.showEstoqueFilterModal = true
      await this.loadFilterEstoques()
    },

    closeEstoqueFilterModal() {
      this.showEstoqueFilterModal = false
      this.clearEstoqueFilterSearch()
    },

    async loadFilterEstoques() {
      this.loadingFilterEstoques = true
      try {
        console.log('🏢 Carregando estoques para filtro...')

        // Primeiro, atualizar dados do usuário do banco de dados para garantir dados atualizados
        await this.refreshUserFromDatabase()

        let allEstoques = []

        // Tentar usar cache global primeiro (mais rápido e já filtrado)
        if (window.globalClientsCache && window.globalClientsCache.clients) {
          console.log('✅ Usando cache global de clientes')
          allEstoques = window.globalClientsCache.clients
        } else {
          // Se não há cache, carregar da API
          console.log('🔄 Carregando clientes da API...')
          const token = localStorage.getItem('token')
          const response = await axios.get('/clients', {
            headers: { Authorization: `Bearer ${token}` },
          })

          // Backend /api/clients retorna sempre { data: [...] }
          if (
            response.data &&
            response.data.data &&
            Array.isArray(response.data.data)
          ) {
            allEstoques = response.data.data
          } else if (response.data && Array.isArray(response.data)) {
            allEstoques = response.data
          } else if (
            response.data &&
            response.data.clients &&
            Array.isArray(response.data.clients)
          ) {
            allEstoques = response.data.clients
          }
        }

        console.log('📦 Total de estoques recebidos:', allEstoques.length)
        if (allEstoques.length > 0) {
          console.log(
            '📦 Primeiros estoques:',
            allEstoques.slice(0, 3).map(e => ({
              cnpj: e.cnpj,
              name: e.name,
              cnpj_normalized: (e.cnpj || '').replace(/[^\d]/g, ''),
            }))
          )
        }

        // Filtrar estoques que não têm CNPJ
        allEstoques = allEstoques.filter(estoque => estoque.cnpj)
        console.log('📦 Estoque com CNPJ válido:', allEstoques.length)

        // Obter usuário atual (agora com dados atualizados)
        const currentUser = this.getCurrentUser()
        console.log('👤 Usuário atual:', {
          level_access: currentUser?.level_access,
          hasCliAccess: !!currentUser?.cli_access,
          cliAccessType: typeof currentUser?.cli_access,
          cliAccessValue: currentUser?.cli_access,
          cliAccessKeys:
            currentUser?.cli_access &&
            typeof currentUser.cli_access === 'object'
              ? Object.keys(currentUser.cli_access)
              : null,
        })

        // Filtrar estoques baseado no cli_access do usuário
        // Usuários nível 0 têm acesso total a todos os estoques, independente de cli_access
        const isLevel0 = currentUser && Number(currentUser.level_access) === 0
        if (currentUser && !isLevel0) {
          if (currentUser.cli_access) {
            let cliAccess = currentUser.cli_access
            if (typeof cliAccess === 'string' && cliAccess) {
              try {
                cliAccess = JSON.parse(cliAccess)
              } catch (e) {
                console.warn('Erro ao parsear cli_access:', e)
                cliAccess = null
              }
            }

            // Se tem cli_access válido com chaves, filtrar pelos estoques permitidos
            if (
              cliAccess &&
              typeof cliAccess === 'object' &&
              Object.keys(cliAccess).length > 0
            ) {
              const allowedCNPJs = Object.keys(cliAccess).map(cnpj =>
                cnpj.replace(/[^\d]/g, '')
              )
              console.log('🔐 CNPJs permitidos no cli_access:', allowedCNPJs)
              console.log(
                '🔐 Total de estoques antes do filtro:',
                allEstoques.length
              )
              console.log(
                '🔐 Estoque CNPJs disponíveis:',
                allEstoques.map(e => (e.cnpj || '').replace(/[^\d]/g, ''))
              )

              allEstoques = allEstoques.filter(estoque => {
                const estoqueCnpj = (estoque.cnpj || '').replace(/[^\d]/g, '')
                const isAllowed = allowedCNPJs.includes(estoqueCnpj)
                if (isAllowed) {
                  console.log(
                    `✅ Estoque permitido: ${estoque.name} (CNPJ: ${estoqueCnpj})`
                  )
                }
                return isAllowed
              })
              console.log(
                `🔐 Filtrados para ${allEstoques.length} estoques baseado em cli_access`
              )
            } else {
              console.log(
                '⚠️ cli_access não é um objeto válido ou está vazio:',
                {
                  cliAccess,
                  type: typeof cliAccess,
                  keys:
                    cliAccess && typeof cliAccess === 'object'
                      ? Object.keys(cliAccess)
                      : null,
                }
              )
            }
            // Se cli_access está vazio ou inválido, não filtrar (acesso total)
          }
          // Se não tem cli_access, não filtrar (acesso total)
        }
        if (isLevel0) {
          console.log(
            '👤 Usuário nível 0 - acesso total a todos os estoques (independente de cli_access)'
          )
        }

        this.availableFilterEstoques = allEstoques.map(e => ({
          cnpj: e.cnpj,
          name: e.name || e.supplier || '',
          corpem_code: e.corpem_code || e.numero || '',
          storage: e.storage || e.cd || '',
          integration: e.integration || 0,
        }))
        this.filteredFilterEstoques = [...this.availableFilterEstoques]
        console.log(
          `✅ ${this.availableFilterEstoques.length} estoques carregados para filtro`
        )
      } catch (error) {
        console.error('❌ Erro ao carregar estoques para filtro:', error)
        console.error(
          '❌ Detalhes do erro:',
          error.response?.data || error.message
        )
        this.availableFilterEstoques = []
        this.filteredFilterEstoques = []
      } finally {
        this.loadingFilterEstoques = false
      }
    },

    selectFilterEstoque(estoque) {
      console.log(
        '🎯 Estoque selecionado para filtro:',
        estoque.name,
        'CNPJ:',
        estoque.cnpj
      )
      this.selectedFilterEstoque = estoque
      this.closeEstoqueFilterModal()
      this.loadExpeditions(1)
    },

    clearEstoqueFilter() {
      console.log('🧹 Limpando filtro de estoque')
      this.selectedFilterEstoque = null
      this.loadExpeditions(1)
    },

    handleDateFilterChange(event) {
      console.log('📅 Filtro de data alterado:', {
        dateFrom: this.dateFrom,
        dateTo: this.dateTo,
      })
      // Remover foco quando a data muda ou quando perde o foco
      if (event && event.target) {
        if (event.target.id === 'date-from') {
          this.isDateFromFocused = false
        } else if (event.target.id === 'date-to') {
          this.isDateToFocused = false
        }
      } else {
        // Se não há evento, remover foco de ambos
        this.isDateFromFocused = false
        this.isDateToFocused = false
      }
      // O filtro é aplicado automaticamente através do computed filteredExpeditions
    },

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
      // Marcar como focado para ocultar texto formatado
      if (input.id === 'date-from') {
        this.isDateFromFocused = true
      } else if (input.id === 'date-to') {
        this.isDateToFocused = true
      }
      // Abrir o calendário automaticamente quando o input recebe foco
      setTimeout(() => {
        input.showPicker?.()
      }, 10)
    },

    filterEstoques() {
      if (!this.estoqueFilterSearchQuery.trim()) {
        this.filteredFilterEstoques = [...this.availableFilterEstoques]
        return
      }

      const searchTerm = this.estoqueFilterSearchQuery.toLowerCase().trim()

      this.filteredFilterEstoques = this.availableFilterEstoques.filter(
        estoque => {
          // Pesquisa por nome
          const nameMatch =
            estoque.name && estoque.name.toLowerCase().includes(searchTerm)

          // Pesquisa por CNPJ (com ou sem formatação)
          const cnpjMatch =
            estoque.cnpj &&
            (estoque.cnpj.includes(searchTerm) ||
              this.formatCNPJ(estoque.cnpj).includes(searchTerm))

          // Pesquisa por número Corpem
          const corpemMatch =
            estoque.corpem_code &&
            estoque.corpem_code.toString().includes(searchTerm)

          return nameMatch || cnpjMatch || corpemMatch
        }
      )

      console.log(
        `🔍 Pesquisa filtro por "${searchTerm}": ${this.filteredFilterEstoques.length} resultado(s)`
      )
    },

    clearEstoqueFilterSearch() {
      this.estoqueFilterSearchQuery = ''
      this.filteredFilterEstoques = [...this.availableFilterEstoques]
    },

    formatCNPJ(cnpj) {
      if (!cnpj) return ''
      return cnpj.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      )
    },

    getCurrentUser() {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return null

        const user = JSON.parse(userData)

        // Parse cli_access se for string
        if (user.cli_access && typeof user.cli_access === 'string') {
          const trimmed = user.cli_access.trim()
          if (
            trimmed &&
            trimmed !== '{}' &&
            trimmed !== 'null' &&
            trimmed !== 'undefined'
          ) {
            try {
              user.cli_access = JSON.parse(trimmed)
            } catch (e) {
              console.warn(
                '⚠️ [ExpeditionsPage getCurrentUser] Erro ao parsear cli_access:',
                e
              )
            }
          }
        }

        return user
      } catch (error) {
        console.error('Erro ao obter usuário:', error)
        return null
      }
    },

    // Buscar dados atualizados do usuário do banco de dados
    async refreshUserFromDatabase() {
      const userData = localStorage.getItem('user')
      if (userData) {
        try {
          const user = JSON.parse(userData)
          if (Number(user.level_access) === 4) {
            console.log(
              '🔄 [ExpeditionsPage refreshUserFromDatabase] Usuário nível 4 (Manutenção) - pulando'
            )
            return null
          }
        } catch (_) {}
      }
      try {
        console.log(
          '🔄 [refreshUserFromDatabase] Buscando dados atualizados do usuário...'
        )
        const token = localStorage.getItem('token')
        if (!token) {
          console.warn('⚠️ [refreshUserFromDatabase] Token não encontrado')
          return null
        }

        const response = await axios.get('/users/profile/me', {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response && response.data && response.data.user) {
          // Parse cli_access se for string
          let userData = { ...response.data.user }
          if (userData.cli_access && typeof userData.cli_access === 'string') {
            try {
              userData.cli_access = JSON.parse(userData.cli_access)
            } catch (e) {
              console.warn(
                '⚠️ [ExpeditionsPage refreshUserFromDatabase] Erro ao parsear cli_access:',
                e
              )
            }
          }

          // Atualizar localStorage com dados atualizados
          localStorage.setItem('user', JSON.stringify(userData))
          console.log(
            '✅ [refreshUserFromDatabase] Dados do usuário atualizados:',
            {
              id: userData.id,
              level_access: userData.level_access,
              cli_access_count:
                userData.cli_access && typeof userData.cli_access === 'object'
                  ? Object.keys(userData.cli_access).length
                  : 0,
              cli_access_keys:
                userData.cli_access && typeof userData.cli_access === 'object'
                  ? Object.keys(userData.cli_access)
                  : null,
            }
          )
          return userData
        }
        return null
      } catch (error) {
        console.error(
          '❌ [refreshUserFromDatabase] Erro ao buscar dados do usuário:',
          error
        )
        return null
      }
    },
  },
}
</script>

<style scoped>
.expeditions-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-title-section h2 {
  font-size: 28px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.count-badge-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-badge {
  background: #3b82f6;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
}

.count-label {
  color: #64748b;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-outline-primary {
  background: white;
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

.btn-outline-primary:hover:not(:disabled) {
  background: #eff6ff;
}

/* Dropdown de Exportação Excel */
.export-dropdown-header {
  position: relative;
  display: inline-block;
}

.export-dropdown-header .dropdown-toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  white-space: nowrap;
  background: white;
  color: #28a745;
  border: 1px solid #28a745;
}

.export-dropdown-header .dropdown-toggle:hover:not(:disabled) {
  background: #28a745;
  color: white;
}

.export-dropdown-header .dropdown-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 180px;
  overflow: hidden;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  color: #333;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  text-align: left;
}

.export-option:hover {
  background: #f5f5f5;
}

.export-option i {
  width: 16px;
  color: #28a745;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.search-container {
  margin-bottom: 24px;
  display: flex;
  justify-content: center;
  flex-shrink: 0 !important;
}

.search-input-group {
  max-width: 600px;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-field-wrapper {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 10px 14px 10px 45px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.9rem;
}

.search-input::placeholder {
  font-size: 0.9rem;
  color: #94a3b8;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-search {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
  flex-shrink: 0;
}

.btn-search:hover {
  background: #2563eb;
}

.btn-search:active {
  background: #1d4ed8;
}

.loading-container,
.error-container,
.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.loader-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message,
.empty-state {
  color: #64748b;
}

.error-message i,
.empty-state i {
  font-size: 48px;
  color: #cbd5e1;
  margin-bottom: 16px;
}

.retry-btn {
  margin-top: 16px;
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* Tabela */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.expeditions-table {
  width: 100%;
  border-collapse: collapse;
}

.expeditions-table thead {
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

.expeditions-table th {
  padding: 10px 8px;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-right: 1px solid rgba(226, 232, 240, 0.6);
}

.expeditions-table th:last-child {
  border-right: none;
}

.expeditions-table th.th-center {
  text-align: center;
}

.expeditions-table th.th-left {
  text-align: left;
}

.expeditions-table tbody tr {
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.15s;
}

.expeditions-table tbody tr:hover {
  background: #f8fafc;
}

.expeditions-table tbody tr.selected {
  background: #eff6ff;
}

/* Borda avermelhada para pedidos que precisam de evidências mas não possuem */
.expeditions-table tbody tr.needs-evidence-warning {
  border-left: 4px solid #ef4444;
  background: #fef2f2;
}

.expeditions-table tbody tr.needs-evidence-warning:hover {
  background: #fee2e2;
}

.expeditions-table td {
  padding: 10px 8px;
  font-size: 14px;
  color: #1e293b;
  border-right: 1px solid rgba(226, 232, 240, 0.6);
}

.expeditions-table td:last-child {
  border-right: none;
}

.expeditions-table td.td-center {
  text-align: center;
}

.expeditions-table td.td-left {
  text-align: left;
}

/* Colunas */
.col-checkbox {
  width: 36px;
  text-align: center;
  padding-left: 8px !important;
  padding-right: 8px !important;
  vertical-align: middle;
}

.col-pedido {
  width: 12.5%;
}

.col-estoque {
  width: 28%;
}

.col-ref-entrada {
  width: 20%;
}

.col-data-criacao {
  width: 10%;
}

.col-status {
  width: 20%;
}

.col-acoes {
  width: 120px;
}

/* Checkbox */
.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3b82f6;
  vertical-align: middle;
  margin: 0;
}

th.col-checkbox .checkbox-input {
  display: block;
  margin: 0 auto;
}

/* Pedido */
.pedido-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  justify-content: center;
}

.pedido-numero {
  font-weight: 600;
  color: #1e293b;
}

.pedido-nf {
  font-size: 13px;
  color: #64748b;
}

/* Estoque */
.estoque-name {
  color: #475569;
  font-weight: 500;
}

/* Ref. Entrada */
.ref-entrada {
  font-size: 13px;
  color: #1e40af;
  font-weight: 500;
}

.ref-entrada-empty {
  font-size: 13px;
  color: #94a3b8;
  font-style: italic;
}

/* Data de Criação */
.data-criacao {
  color: #475569;
  font-weight: 500;
  font-size: 13px;
}

/* Status Badge - texto um pouco menor (0.80rem) */
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 18px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  min-width: 120px;
  text-align: center;
  border: 2px solid transparent;
  cursor: default;
}

.status-badge[title]:hover {
  cursor: help;
}

.rejection-icon {
  font-size: 12px;
  opacity: 0.8;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}

.status-badge.status-criado {
  background: #e0f2fe;
  color: #0c4a6e;
  border-color: #0ea5e9;
}

.status-badge.status-pendente {
  background: #fef3c7;
  color: #78350f;
  border-color: #fbbf24;
}

.status-badge.status-integrado {
  background: #fef3c7;
  color: #78350f;
  border-color: #fbbf24;
}

.status-badge.status-separando {
  background: #dbeafe;
  color: #1e3a8a;
  border-color: #3b82f6;
}

.status-badge.status-separado {
  background: #d1fae5;
  color: #064e3b;
  border-color: #10b981;
}

.status-badge.status-embarcado {
  background: #e0e7ff;
  color: #3730a3;
  border-color: #6366f1;
}

.status-badge.status-rejeitado {
  background: #fef3c7;
  color: #ea580c;
  border-color: #fb923c;
}

.status-badge.status-erro {
  background: #fee2e2;
  color: #7f1d1d;
  border-color: #ef4444;
}

.status-badge.status-multiplo {
  background: #e2e8f0;
  color: #334155;
  border-color: #94a3b8;
  font-weight: 700;
}

.status-badge.status-default {
  background: #e2e8f0;
  color: #334155;
  border-color: #94a3b8;
}

/* Botões de Ação */
.actions-buttons {
  display: flex;
  gap: 5px;
  justify-content: center;
  align-items: center;
}

/* Alinhar botões de ações dos lotes à direita */
.expeditions-table tbody tr.lot-row .actions-buttons {
  justify-content: flex-end;
}

.btn-icon {
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  max-width: 44px;
  max-height: 44px;
  padding: 5px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 22px;
  box-sizing: border-box;
  flex: 0 0 auto;
  flex-shrink: 0;
  aspect-ratio: 1;
}

.expeditions-table .btn-icon i {
  font-size: 1em;
}

/* Botões de ação da lista: quadrados, um pouco maiores */
.expeditions-table .expeditions-action-btn {
  min-width: 44px !important;
  min-height: 44px !important;
  max-width: 44px !important;
  max-height: 44px !important;
  width: 44px !important;
  height: 44px !important;
  flex: 0 0 auto !important;
}

.btn-integrate {
  background: #dbeafe;
  color: #1e40af;
}

.btn-integrate:hover:not(:disabled) {
  background: #bfdbfe;
  transform: translateY(-2px);
}

.btn-integrate:disabled,
.btn-integrate.btn-disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-integrate:disabled:hover,
.btn-integrate.btn-disabled:hover {
  transform: none;
  background: #e5e7eb;
}

.btn-documents {
  background: #fef3c7;
  color: #92400e;
}

.btn-documents:hover {
  background: #fde68a;
  transform: translateY(-2px);
}

.btn-photos {
  background: #dbeafe;
  color: #1e40af;
}

.btn-photos-has-evidences {
  border: 2px solid #1e3a8a;
}

.btn-photos:hover {
  background: #bfdbfe;
  transform: translateY(-2px);
}

.btn-details {
  background: #f3e8ff;
  color: #6b21a8;
}

.btn-details:hover {
  background: #e9d5ff;
  transform: translateY(-2px);
}

/* Botão de Integração em Lote */
.btn-integrate-bulk {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-integrate-bulk:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.btn-integrate-bulk:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Botão de Impressão em Lote */
.btn-print {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.btn-print:hover:not(:disabled) {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
}

.btn-print:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal de Confirmação de Impressão */
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
  padding: 20px;
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

.bulk-print-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.bulk-print-modal .modal-header {
  padding: 24px 28px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bulk-print-modal .modal-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
}

.bulk-print-modal .modal-header h3 i {
  color: #f59e0b;
  font-size: 22px;
}

.bulk-print-modal .btn-close {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 18px;
}

.bulk-print-modal .btn-close:hover {
  background: #e2e8f0;
  color: #475569;
}

.bulk-print-modal .modal-body {
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 20px;
}

.bulk-print-modal .modal-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: white;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.bulk-print-modal .modal-message h4 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.bulk-print-modal .modal-message p {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.bulk-print-modal .modal-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: #f59e0b;
  background: #fffbeb;
  padding: 12px 16px;
  border-radius: 8px;
}

.bulk-print-modal .modal-info i {
  font-size: 14px;
}

.bulk-print-modal .modal-footer {
  padding: 20px 28px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.bulk-print-modal .modal-footer .btn {
  flex: 1;
  justify-content: center;
}

/* Modal de Integração em Lote */
.bulk-integrate-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease-out;
}

.bulk-integrate-modal .modal-header {
  padding: 24px 28px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bulk-integrate-modal .modal-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
}

.bulk-integrate-modal .modal-header h3 i {
  color: #3b82f6;
  font-size: 22px;
}

.bulk-integrate-modal .btn-close {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 18px;
}

.bulk-integrate-modal .btn-close:hover {
  background: #e2e8f0;
  color: #475569;
}

.bulk-integrate-modal .modal-body {
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 20px;
}

.bulk-integrate-modal .modal-icon.integrate-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.bulk-integrate-modal .modal-message h4 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.bulk-integrate-modal .modal-message p {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.bulk-integrate-modal .modal-info.integrate-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: #3b82f6;
  background: #eff6ff;
  padding: 12px 16px;
  border-radius: 8px;
}

.bulk-integrate-modal .modal-info.integrate-info i {
  font-size: 14px;
}

.bulk-integrate-modal .modal-footer {
  padding: 20px 28px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.bulk-integrate-modal .modal-footer .btn {
  flex: 1;
  justify-content: center;
}

/* Responsivo - Lista de pedidos: 98% da largura do display, sem overflow */
@media (max-width: 768px) {
  .expeditions-page {
    width: 98% !important;
    max-width: 98% !important;
    margin-left: auto !important;
    margin-right: auto !important;
    padding: 8px 0 !important;
    box-sizing: border-box !important;
    overflow-x: hidden !important;
  }

  /* Header, busca, filtros e lista com mesma largura (100% do container 98%) */
  .expeditions-page .page-header,
  .expeditions-page .search-container,
  .expeditions-page .filters-container,
  .expeditions-page .table-container {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    box-sizing: border-box !important;
    overflow-x: hidden !important;
  }

  /* Container de filtros: 100% da página, grid respeitando largura (sem overflow) */
  .expeditions-page .filters-container {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    justify-content: stretch !important;
    align-items: stretch !important;
    overflow: hidden !important;
  }

  /* Ajustar fontes base para mobile */
  .expeditions-table td {
    font-size: 13px !important;
  }

  .expeditions-table td::before {
    font-size: 11px !important;
  }

  .expeditions-table .lot-pedido-info {
    font-size: 15px !important;
  }

  .expeditions-table .pedido-numero {
    font-size: 14px !important;
  }

  /* Ajustar valores dos campos */
  .expeditions-table td > * {
    font-size: 13px !important;
  }

  .expeditions-table .estoque-name,
  .expeditions-table .ref-entrada,
  .expeditions-table .data-criacao {
    font-size: 13px !important;
  }

  /* Padrão visual igual à página Histórico de pedidos */
  .page-header {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .header-title-section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    min-width: 0;
  }

  .header-title-section h2 {
    font-size: 22px;
    line-height: 1.2;
  }

  .header-actions {
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
  }

  .header-actions .btn,
  .header-actions .btn-sm {
    padding: 8px 12px;
    font-size: 13px;
  }

  .header-actions .export-dropdown-header .dropdown-toggle {
    padding: 8px 10px;
    font-size: 13px;
  }

  .search-container {
    margin-bottom: 8px;
  }

  .search-input-group {
    max-width: 100%;
  }

  .search-input {
    padding-left: 48px !important;
  }

  .search-icon {
    left: 16px;
  }

  .btn-search span {
    display: none;
  }

  .btn-search {
    padding: 10px 14px;
  }

  .table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
    background: transparent;
    box-shadow: none;
    border-radius: 0;
    box-sizing: border-box;
  }

  /* Converter tabela em cards no mobile */
  .expeditions-table {
    width: 100%;
    max-width: 100%;
    margin: 0;
  }

  .expeditions-table thead,
  .expeditions-table tbody,
  .expeditions-table th,
  .expeditions-table td,
  .expeditions-table tr {
    display: block;
    width: 100%;
    box-sizing: border-box;
  }

  .expeditions-table tbody {
    width: 100%;
  }

  .expeditions-table thead {
    display: none;
  }

  .expeditions-table tbody tr {
    display: block;
    width: 100%;
    max-width: 100%;
    margin-bottom: 16px;
    margin-left: 0;
    margin-right: 0;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    box-sizing: border-box;
    min-width: 0;
  }

  .expeditions-table tbody tr.lot-row {
    background: #f8fafc;
    border: 2px solid #3b82f6;
  }

  .expeditions-table tbody tr.lot-order-row {
    background: #f0f9ff;
    border-left: 4px solid #3b82f6;
    margin-left: 0;
    margin-bottom: 8px;
  }

  /* Esconder checkboxes na versão mobile */
  .expeditions-table td.col-checkbox {
    display: none !important;
  }

  /* Header do card - Título sem checkbox */
  .expeditions-table td.col-pedido {
    order: 0;
    display: flex;
    align-items: center;
    padding: 8px 10px !important;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    margin: 0;
    font-weight: 600;
    font-size: 13px !important;
    color: #1e293b;
    gap: 6px !important;
    width: 100%;
    box-sizing: border-box;
    min-width: 0;
  }

  .expeditions-table td.col-pedido::before {
    display: none;
  }

  /* Informações do card */
  .expeditions-table td.col-estoque,
  .expeditions-table td.col-ref-entrada,
  .expeditions-table td.col-data-criacao,
  .expeditions-table td.col-status {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 6px 10px !important;
    border-bottom: 1px solid #f1f5f9;
    margin: 0;
    gap: 8px !important;
    flex-wrap: wrap;
    width: 100%;
    box-sizing: border-box;
    font-size: 12px !important;
    min-width: 0;
  }

  .expeditions-table td.col-estoque::before {
    content: 'Estoque:';
    font-weight: 600;
    color: #64748b;
    font-size: 10px !important;
    text-transform: uppercase;
    letter-spacing: 0.2px;
    flex-shrink: 0;
    text-align: left;
    white-space: nowrap;
  }

  .expeditions-table td.col-ref-entrada::before {
    content: 'Ref. Entrada:';
    font-weight: 600;
    color: #64748b;
    font-size: 10px !important;
    text-transform: uppercase;
    letter-spacing: 0.2px;
    flex-shrink: 0;
    text-align: left;
    white-space: nowrap;
  }

  .expeditions-table td.col-data-criacao::before {
    content: 'Data:';
    font-weight: 600;
    color: #64748b;
    font-size: 10px !important;
    text-transform: uppercase;
    letter-spacing: 0.2px;
    flex-shrink: 0;
    text-align: left;
    white-space: nowrap;
  }

  .expeditions-table td.col-status::before {
    content: 'Status:';
    font-weight: 600;
    color: #64748b;
    font-size: 10px !important;
    text-transform: uppercase;
    letter-spacing: 0.2px;
    flex-shrink: 0;
    text-align: left;
    white-space: nowrap;
  }

  /* Conteúdo à direita - permite quebra de linha para caber no dispositivo */
  .expeditions-table td.col-estoque > *,
  .expeditions-table td.col-ref-entrada > *,
  .expeditions-table td.col-data-criacao > * {
    text-align: right;
    font-size: 12px !important;
    color: #1e293b;
    flex: 1 1 auto;
    min-width: 0;
    max-width: 100%;
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: normal;
  }

  .expeditions-table td.col-estoque .estoque-name,
  .expeditions-table td.col-ref-entrada .ref-entrada,
  .expeditions-table td.col-ref-entrada .ref-entrada-empty,
  .expeditions-table td.col-data-criacao .data-criacao {
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: normal;
    max-width: 100%;
  }

  .expeditions-table td.col-status > * {
    text-align: right;
    flex: 0 1 50%;
    max-width: 50%;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    min-width: 0;
    white-space: nowrap;
  }

  /* Status badge: tamanho respeita o texto para exibir o valor completo (0.80rem) */
  .expeditions-table td.col-status .status-badge,
  .expeditions-table .status-badge,
  .expeditions-table tbody tr .status-badge,
  .expeditions-table tbody tr td .status-badge {
    font-size: 0.8rem !important;
    padding: 4px 8px !important;
    min-width: 0 !important;
    max-width: none !important;
    width: max-content !important;
    height: auto !important;
    line-height: 1.2 !important;
    border-radius: 8px !important;
    font-weight: 600 !important;
    letter-spacing: 0.1px !important;
    border-width: 1px !important;
    gap: 3px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    text-align: center !important;
    white-space: nowrap !important;
    overflow: visible !important;
    text-overflow: clip !important;
  }

  /* Seção de ações: "Ações:" e botões na mesma linha, botões à direita */
  .expeditions-table td.col-acoes {
    order: 5;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border-bottom: none;
    margin: 0;
    gap: 10px;
    width: 100%;
    box-sizing: border-box;
    min-width: 0;
  }

  /* "Ações:" mesmo tamanho dos outros títulos do card (Estoque:, Data:, etc.) */
  .expeditions-table td.col-acoes::before {
    content: 'Ações:';
    font-weight: 600;
    color: #64748b;
    font-size: 10px !important;
    text-transform: uppercase;
    letter-spacing: 0.2px;
    flex-shrink: 0;
    text-align: left;
    white-space: nowrap;
  }

  /* Ajustes para conteúdo específico */
  .expeditions-table .pedido-info,
  .expeditions-table .lot-pedido-info {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  .expeditions-table .lot-pedido-info {
    font-weight: 600;
    font-size: 13px !important;
  }

  .expeditions-table .actions-buttons {
    display: flex;
    gap: 5px;
    flex-wrap: nowrap;
    justify-content: flex-end;
    align-items: center;
    min-width: 0;
    width: auto;
    flex-shrink: 0;
  }

  /* Garantir que botões de ações de lotes fiquem à direita */
  .expeditions-table tbody tr.lot-row .actions-buttons,
  .expeditions-table tbody tr .col-acoes .actions-buttons {
    justify-content: flex-end !important;
  }

  .expeditions-table .status-badge {
    margin-left: 0;
  }

  /* Botões de ação quadrados, um pouco maiores; margem entre botões reduzida (gap) */
  .expeditions-table .expeditions-action-btn,
  .expeditions-table td.col-acoes .actions-buttons .expeditions-action-btn {
    min-width: 44px !important;
    min-height: 44px !important;
    max-width: 44px !important;
    max-height: 44px !important;
    width: 44px !important;
    height: 44px !important;
    padding: 5px !important;
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    flex: 0 0 auto !important;
    flex-shrink: 0;
    box-sizing: border-box;
    aspect-ratio: 1;
    font-size: 22px;
  }

  .expeditions-table tbody tr.selected {
    background: #eff6ff;
    border-color: #3b82f6;
  }

  .expeditions-table tbody tr:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  /* Ajustar espaçamento dos cards */
  .expeditions-table tbody tr.selected {
    background: #eff6ff;
    border-color: #3b82f6;
  }

  .expeditions-table tbody tr:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  /* Filtros em mobile: grid 2 colunas que respeitam 98% (minmax(0,1fr) evita overflow) */
  .filters-container {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
    gap: 10px !important;
    justify-content: stretch !important;
    align-items: stretch !important;
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    padding-bottom: 2px !important;
    margin-top: 8px !important;
    margin-bottom: 16px !important;
    box-sizing: border-box !important;
    overflow: hidden !important;
  }

  /* Reordenar: linha 1 = [Selecionar Estoque][Evidências], linha 2 = [Data de][Data até] */
  .filters-container .filter-group-estoque {
    order: 1;
  }
  .filters-container .filter-group-evidence {
    order: 2;
  }
  .filters-container .filter-group-date-from {
    order: 3;
  }
  .filters-container .filter-group-date-to {
    order: 4;
  }

  .filters-container .filter-group {
    display: flex !important;
    flex-direction: column !important;
    min-width: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    padding: 0 !important;
    margin: 0 !important;
    align-items: stretch !important;
  }

  .filters-container .filter-group label {
    font-size: 0.85rem !important;
    margin-bottom: 0.2rem !important;
    margin-top: 0 !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    font-weight: 500 !important;
    color: #555 !important;
    display: flex !important;
    align-items: center !important;
  }

  .filters-container .filter-group .form-control,
  .filters-container .filter-group .date-input-wrapper,
  .filters-container .filter-group button.client-filter-btn,
  .filters-container .filter-group .evidence-filter-btn {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    height: 38px !important;
    min-height: 38px !important;
    max-height: 38px !important;
    font-size: 0.9rem !important;
    padding: 0.5rem 0.75rem !important;
    box-sizing: border-box !important;
    border-radius: 6px !important;
    border: 1px solid #ced4da !important;
  }

  /* Botão Evidências: obrigatório min-width 0 em mobile para não ultrapassar o grid */
  .filters-container .filter-group .evidence-filter-btn {
    min-width: 0 !important;
    max-width: 100% !important;
    flex-shrink: 1 !important;
  }

  .filters-container .filter-group button.client-filter-btn,
  .filters-container .filter-group .evidence-filter-btn {
    border: 1px solid #3b82f6 !important;
  }

  .filters-container .filter-group .date-input-wrapper {
    display: flex !important;
    align-items: center !important;
    position: relative !important;
    flex: none !important;
    height: 38px !important;
    min-height: 38px !important;
    overflow: hidden !important;
    background: #fff !important;
  }

  .filters-container .filter-group .date-input-wrapper input[type='date'] {
    width: 100% !important;
    height: 100% !important;
    min-height: 38px !important;
    padding: 0 2.25rem 0 0.75rem !important;
    box-sizing: border-box !important;
    border: none !important;
    border-radius: 6px !important;
    line-height: 38px !important;
    font-size: 0.9rem !important;
  }

  .filters-container
    .filter-group
    .date-input-wrapper
    input[type='date']::-webkit-calendar-picker-indicator {
    position: absolute !important;
    right: 0.5rem !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    margin: 0 !important;
    padding: 0 !important;
    height: 1.25rem !important;
    width: 1.25rem !important;
  }

  .filters-container .filter-group .date-input-wrapper .date-display-text {
    position: absolute !important;
    left: 0.75rem !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    margin: 0 !important;
    padding: 0 !important;
    font-size: 0.9rem !important;
    line-height: 1.2 !important;
    width: max-content !important;
    max-width: calc(100% - 2.25rem) !important;
    background: transparent !important;
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
  }

  .filters-container .filter-group button.client-filter-btn,
  .filters-container .filter-group .evidence-filter-btn {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    min-width: 0 !important;
    overflow: hidden !important;
  }

  .filters-container .filter-group .client-filter-content {
    font-size: 0.9rem !important;
    min-width: 0 !important;
    overflow: hidden !important;
  }

  .filters-container .filter-group .client-filter-text {
    font-size: 0.9rem !important;
    min-width: 0 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }
}

/* ======================
   LOT ACCORDION STYLES
   ====================== */

.lot-row {
  background-color: #f8f9fa;
  border-left: 4px solid #6c757d;
  transition: all 0.3s ease;
  font-weight: 500;
}

.lot-row:hover {
  background-color: #e9ecef;
}

.lot-row.lot-expanded {
  background-color: #e3f2fd;
  border-left: 3px solid #2196f3;
  border-right: 3px solid #2196f3;
  border-top: 3px solid #2196f3;
}

/* Coluna Pedido do LOT */
.lot-pedido-info {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.lot-chevron {
  color: #6c757d;
  transition: transform 0.3s ease;
  font-size: 12px;
  flex-shrink: 0;
}

.lot-chevron.chevron-expanded {
  transform: rotate(90deg);
}

.lot-pedido-info .lot-count-badge {
  margin-left: 6px;
}

.lot-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: #495057;
  font-size: 13px;
  letter-spacing: 0.5px;
}

.lot-label i {
  color: #6c757d;
  font-size: 14px;
}

.lot-count-badge {
  background-color: #2196f3;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: help;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.lot-count-badge:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.4);
}

.lot-order-row {
  background-color: #ffffff;
  position: relative;
}

.lot-order-row:hover {
  background-color: #f8f9fa;
}

.lot-order-row.selected {
  background-color: #e3f2fd;
}

/* Animação de expansão/colapso */
.lot-order-animate {
  animation: slideDown 0.3s ease-out;
  transform-origin: top;
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

/* Borda chamativa ao redor dos pedidos do lote */
.lot-order-row {
  border-left: 3px solid #2196f3;
  border-right: 3px solid #2196f3;
}

.lot-order-row.lot-order-last {
  border-bottom: 3px solid #2196f3;
}

/* Ajustar status badge dentro do lot header */
.lot-header .status-badge {
  margin-left: 8px;
}

@media (max-width: 768px) {
  .lot-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .lot-count-badge {
    order: 2;
  }

  .lot-armazem {
    order: 3;
    width: 100%;
  }

  .lot-data {
    order: 4;
    margin-left: 0;
  }
}

/* ======================
   MODAL DE FILTRO DE ESTOQUE
   ====================== */
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
  padding: 20px;
  animation: fadeIn 0.2s ease-out;
}

/* Overlay do modal Estoque: 1% cada lado para a janela ocupar 98% do display */
.modal-overlay:has(.estoque-selection-modal) {
  padding: 20px 1% !important;
  box-sizing: border-box;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.estoque-selection-modal {
  max-height: 95vh !important;
  height: 95vh !important;
  max-width: 100% !important;
  width: 100% !important;
  margin: 2.5vh auto !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  background: white !important;
  border-radius: 12px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
  animation: slideUp 0.3s ease-out !important;
  box-sizing: border-box !important;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Header: título à esquerda e botão X à direita, mesma linha, alinhados ao topo */
.estoque-selection-modal .modal-header {
  padding: 20px 24px !important;
  border-bottom: 1px solid #e2e8f0 !important;
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  justify-content: space-between !important;
  align-items: center !important;
  flex-shrink: 0 !important;
}

.estoque-selection-modal .modal-header h3 {
  font-size: 20px !important;
  font-weight: 600 !important;
  color: #1e293b !important;
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  margin: 0 !important;
  min-width: 0 !important;
  text-align: left !important;
  flex: 1 1 auto !important;
  max-width: none !important;
}

.estoque-selection-modal .modal-header h3 .modal-title-text {
  min-width: 0 !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

.estoque-selection-modal .modal-header h3 i {
  color: #3b82f6 !important;
  font-size: 22px !important;
  flex-shrink: 0 !important;
}

.modal-close-btn {
  width: 36px !important;
  height: 36px !important;
  border-radius: 8px !important;
  border: none !important;
  background: #f1f5f9 !important;
  color: #64748b !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s !important;
  font-size: 18px !important;
}

.modal-close-btn:hover {
  background: #e2e8f0 !important;
  color: #475569 !important;
}

.estoque-selection-modal .modal-header .modal-close-btn {
  flex-shrink: 0 !important;
  margin-left: auto !important;
}

.estoque-selection-modal .modal-body {
  flex: 1 !important;
  overflow: hidden !important;
  display: flex !important;
  flex-direction: column !important;
  padding: 24px 2.5% !important;
  min-height: 0 !important;
  box-sizing: border-box !important;
}

/* Input de busca e lista de estoques: 95% da área horizontal da janela (via padding 2.5% no body) */
.estoque-selection-modal .search-container,
.estoque-selection-modal .search-input-wrapper,
.estoque-selection-modal .estoque-lista-vertical {
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
}

/* Modal e botão Selecionar Estoque responsivos em mobile */
@media (max-width: 768px) {
  .estoque-selection-modal .modal-header {
    padding: 12px 16px !important;
    gap: 8px !important;
  }

  .estoque-selection-modal .modal-header h3 {
    font-size: 16px !important;
    min-width: 0 !important;
    flex: 1 1 auto !important;
    max-width: none !important;
  }

  .estoque-selection-modal .modal-header h3 .modal-title-text {
    min-width: 0 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  .estoque-selection-modal .modal-header h3 i {
    font-size: 18px !important;
    flex-shrink: 0 !important;
  }

  .estoque-selection-modal .modal-header .modal-close-btn {
    width: 32px !important;
    height: 32px !important;
    font-size: 16px !important;
    flex-shrink: 0 !important;
  }

  .estoque-selection-modal .search-input-wrapper .search-input,
  .estoque-selection-modal .search-input-wrapper .search-input::placeholder {
    font-size: 16px !important;
  }

  .estoque-selection-modal .search-input-wrapper .search-input {
    text-align: left !important;
    padding-left: 14px !important;
  }

  .filters-container
    .filter-group
    button.client-filter-btn
    .client-filter-content,
  .filters-container .filter-group .client-filter-btn .client-filter-content {
    min-width: 0 !important;
    overflow: hidden !important;
  }

  .filters-container .filter-group button.client-filter-btn .client-filter-text,
  .filters-container .filter-group .client-filter-btn .client-filter-text {
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    min-width: 0 !important;
  }
}

@media (max-width: 400px) {
  .estoque-selection-modal .modal-header {
    padding: 10px 12px !important;
    gap: 6px !important;
  }

  .estoque-selection-modal .modal-header h3 {
    font-size: 14px !important;
    max-width: none !important;
  }

  .estoque-selection-modal .modal-header h3 .modal-title-text {
    min-width: 0 !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  .estoque-selection-modal .modal-header h3 i {
    font-size: 16px !important;
  }

  .estoque-selection-modal .modal-header .modal-close-btn {
    width: 28px !important;
    height: 28px !important;
    font-size: 14px !important;
  }

  .estoque-selection-modal .search-input-wrapper .search-input,
  .estoque-selection-modal .search-input-wrapper .search-input::placeholder {
    font-size: 14px !important;
  }

  .estoque-selection-modal .search-input-wrapper .search-input {
    text-align: left !important;
    padding-left: 12px !important;
  }

  .filters-container .filter-group button.client-filter-btn,
  .filters-container .filter-group .evidence-filter-btn {
    font-size: 0.8rem !important;
    padding: 0.4rem 0.5rem !important;
  }

  .filters-container .filter-group .client-filter-text {
    font-size: 0.8rem !important;
  }

  /* Placeholder da barra de busca com mesmo tamanho do botão "Selecionar Estoque" */
  .search-input-group .search-input,
  .search-input-group .search-input::placeholder {
    font-size: 0.8rem !important;
  }
}

.search-input-wrapper {
  position: relative !important;
  margin-bottom: 16px !important;
}

.search-input-wrapper .search-input {
  width: 100% !important;
  padding: 10px 40px 10px 14px !important;
  border: 1px solid #cbd5e1 !important;
  border-radius: 8px !important;
  font-size: 14px !important;
}

.search-input-wrapper .search-input:focus {
  outline: none !important;
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

/* Input de pesquisa do modal: mesma fonte do título, alinhado à esquerda */
.estoque-selection-modal .search-input-wrapper .search-input {
  font-size: 20px !important;
  text-align: left !important;
  padding-left: 14px !important;
}

.estoque-selection-modal .search-input-wrapper .search-input::placeholder {
  font-size: 20px !important;
  color: #6c757d !important;
  opacity: 0.8 !important;
}

.clear-search-btn {
  position: absolute !important;
  right: 8px !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  background: none !important;
  border: none !important;
  color: #94a3b8 !important;
  cursor: pointer !important;
  padding: 4px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border-radius: 4px !important;
  transition: all 0.2s !important;
}

.clear-search-btn:hover {
  background: #f1f5f9 !important;
  color: #64748b !important;
}

.search-results-info {
  font-size: 13px !important;
  color: #64748b !important;
  margin-bottom: 16px !important;
}

.loading-clients-container {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 60px 20px !important;
  text-align: center !important;
}

.loading-spinner {
  font-size: 32px !important;
  color: #3b82f6 !important;
  margin-bottom: 16px !important;
}

.loading-text {
  font-size: 16px !important;
  font-weight: 500 !important;
  color: #1e293b !important;
  margin: 0 0 8px 0 !important;
}

.loading-subtext {
  font-size: 13px !important;
  color: #64748b !important;
}

.estoque-lista-vertical {
  flex: 1 !important;
  overflow-y: auto !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 8px !important;
  min-height: 0 !important;
}

.estoque-lista-item {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 12px 16px !important;
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 8px !important;
  cursor: pointer !important;
}

.estoque-lista-item:hover {
  background: #f1f5f9 !important;
  border-color: #cbd5e1 !important;
}

/* Estilos específicos para o filtro de estoque na página de Pedidos */
.filters-container {
  margin-top: 15px;
  margin-bottom: 24px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-end;
}

.filters-container .filter-group {
  display: flex !important;
  flex-direction: column !important;
  min-width: auto !important;
  max-width: none !important;
  width: auto !important;
  flex: none !important;
}

.filters-container .filter-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #555;
  margin-bottom: 0.3rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filters-container .filter-group label i.fa-filter {
  color: #007bff;
  font-size: 0.9rem;
}

/* min-width apenas em desktop; em mobile é sobrescrito no bloco @media (max-width: 768px) */
.filters-container .filter-group .form-control {
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  height: 38px;
}

@media (min-width: 769px) {
  .filters-container .filter-group .form-control {
    min-width: 150px;
  }
}

/* Botão de filtro de evidências com o mesmo tamanho/formato dos outros filtros (apenas desktop) */
@media (min-width: 769px) {
  .filters-container .filter-group .evidence-filter-btn {
    padding: 0.5rem 0.75rem !important;
    font-size: 0.9rem !important;
    height: 38px !important;
    min-width: 150px !important;
    border-radius: 6px !important;
    border-width: 1px !important;
    display: flex !important;
    align-items: center;
    justify-content: center;
  }
}

.filters-container .filter-group .form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Estilos para inputs de data - desabilitar seleção de texto e permitir apenas seleção no calendário */
.filters-container .filter-group .date-input-readonly {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  cursor: pointer;
  caret-color: transparent;
}

.filters-container .filter-group .date-input-readonly::selection {
  background: transparent;
}

.filters-container .filter-group .date-input-readonly::-moz-selection {
  background: transparent;
}

/* Wrapper para inputs de data com texto formatado */
.filters-container .filter-group .date-input-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #fff;
}

/* Forçar formato brasileiro para inputs de data - ocultar valor padrão e mostrar formato customizado */
.filters-container .filter-group .date-input-wrapper input[type='date'] {
  position: relative;
  color: transparent;
  background: transparent !important;
  background-color: transparent !important;
}

.filters-container .filter-group .date-input-wrapper input[type='date']:focus {
  color: #495057;
}

.filters-container
  .filter-group
  .date-input-wrapper
  input[type='date']::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 1;
  z-index: 2;
  position: relative;
}

.filters-container .filter-group .date-input-wrapper .date-display-text {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #495057;
  font-size: 0.9rem;
  z-index: 1;
  background: transparent !important;
  background-color: transparent !important;
  border: none;
  box-shadow: none;
  width: max-content;
  max-width: calc(100% - 2.5rem);
  padding: 0;
}

/* Estilo para placeholder quando não há data */
.filters-container
  .filter-group
  .date-input-wrapper
  .date-display-text.placeholder {
  color: #6c757d;
  opacity: 0.7;
}

.filters-container
  .filter-group
  .date-input-wrapper
  input[type='date']:focus
  ~ .date-display-text {
  display: none;
}

/* Sobrescrever estilos do App.vue com maior especificidade */
.filters-container .filter-group button.client-filter-btn,
.filters-container .filter-group .btn.client-filter-btn,
.filters-container .filter-group #estoque-filter.client-filter-btn {
  width: auto !important;
  min-width: auto !important;
  max-width: none !important;
  padding: 0.5rem 0.75rem !important;
  white-space: nowrap !important;
  flex: none !important;
  display: inline-flex !important;
  justify-content: center !important;
}

.filters-container
  .filter-group
  button.client-filter-btn
  .client-filter-content,
.filters-container .filter-group .btn.client-filter-btn .client-filter-content,
.filters-container
  .filter-group
  #estoque-filter.client-filter-btn
  .client-filter-content {
  width: auto !important;
  min-width: auto !important;
  max-width: none !important;
  flex: none !important;
  display: inline-flex !important;
  gap: 0.5rem !important;
}

.filters-container
  .filter-group
  button.client-filter-btn
  .client-filter-content
  i.fa-warehouse,
.filters-container
  .filter-group
  .btn.client-filter-btn
  .client-filter-content
  i.fa-warehouse,
.filters-container
  .filter-group
  #estoque-filter.client-filter-btn
  .client-filter-content
  i.fa-warehouse {
  margin-right: 0 !important;
}

.filters-container .filter-group button.client-filter-btn .client-filter-text,
.filters-container .filter-group .btn.client-filter-btn .client-filter-text,
.filters-container
  .filter-group
  #estoque-filter.client-filter-btn
  .client-filter-text {
  margin-left: 0 !important;
}

/* Estilos de hover para o botão de filtro de estoque */
.filters-container
  .filter-group
  button.btn-outline-primary.client-filter-btn:hover,
.filters-container
  .filter-group
  .btn.btn-outline-primary.client-filter-btn:hover,
.filters-container
  .filter-group
  #estoque-filter.btn-outline-primary.client-filter-btn:hover {
  background-color: #007bff !important;
  border-color: white !important;
  color: white !important;
}

.filters-container
  .filter-group
  button.btn-outline-primary.client-filter-btn:hover
  .client-filter-content,
.filters-container
  .filter-group
  .btn.btn-outline-primary.client-filter-btn:hover
  .client-filter-content,
.filters-container
  .filter-group
  #estoque-filter.btn-outline-primary.client-filter-btn:hover
  .client-filter-content {
  color: white !important;
}

.filters-container
  .filter-group
  button.btn-outline-primary.client-filter-btn:hover
  .client-filter-content
  i,
.filters-container
  .filter-group
  .btn.btn-outline-primary.client-filter-btn:hover
  .client-filter-content
  i,
.filters-container
  .filter-group
  #estoque-filter.btn-outline-primary.client-filter-btn:hover
  .client-filter-content
  i {
  color: white !important;
}

.filters-container .filter-group button.client-filter-btn .client-filter-text,
.filters-container .filter-group .btn.client-filter-btn .client-filter-text,
.filters-container
  .filter-group
  #estoque-filter.client-filter-btn
  .client-filter-text {
  flex: none !important;
  white-space: nowrap !important;
  overflow: visible !important;
  text-overflow: clip !important;
  display: inline-block !important;
}

.estoque-lista-info {
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
  flex: 1 !important;
}

.estoque-nome {
  font-weight: 600 !important;
  color: #1e293b !important;
  font-size: 14px !important;
}

.estoque-cnpj {
  font-size: 13px !important;
  color: #64748b !important;
}

.estoque-numero {
  font-size: 13px !important;
  color: #64748b !important;
}

.estoque-lista-arrow {
  color: #94a3b8 !important;
  font-size: 14px !important;
}

.estoque-lista-vazia {
  text-align: center !important;
  padding: 40px 20px !important;
  color: #94a3b8 !important;
  font-size: 14px !important;
}

.estoque-lista-vazia i {
  font-size: 24px !important;
  margin-bottom: 8px !important;
  display: block !important;
}

.text-muted {
  color: #94a3b8 !important;
}

/* Media queries para ajuste responsivo de fontes em telas menores */
@media (max-width: 480px) {
  /* Reduzir tamanhos de fonte em telas pequenas */
  .expeditions-page {
    padding: 12px !important;
  }

  .page-header h2 {
    font-size: 20px !important;
  }

  .expeditions-table td {
    font-size: 11px !important;
    padding: 6px 8px !important;
  }

  .expeditions-table td::before {
    font-size: 9px !important;
  }

  .expeditions-table td.col-pedido {
    padding: 6px 8px !important;
    font-size: 12px !important;
  }

  .expeditions-table td.col-estoque,
  .expeditions-table td.col-ref-entrada,
  .expeditions-table td.col-data-criacao,
  .expeditions-table td.col-status {
    padding: 5px 8px !important;
    font-size: 11px !important;
    gap: 6px !important;
  }

  .expeditions-table td.col-estoque > *,
  .expeditions-table td.col-ref-entrada > *,
  .expeditions-table td.col-data-criacao > * {
    font-size: 11px !important;
  }

  .expeditions-table .lot-pedido-info {
    font-size: 12px !important;
  }

  .expeditions-table .pedido-numero {
    font-size: 12px !important;
  }

  .expeditions-table td.col-status .status-badge,
  .expeditions-table .status-badge,
  .expeditions-table tbody tr .status-badge {
    font-size: 0.8rem !important;
    padding: 4px 8px !important;
    min-width: 0 !important;
    max-width: none !important;
    width: max-content !important;
    line-height: 1.2 !important;
    letter-spacing: 0.1px !important;
    overflow: visible !important;
    text-overflow: clip !important;
  }

  .expeditions-table .btn-icon {
    min-width: 40px !important;
    width: 40px !important;
    height: 40px !important;
    max-width: 40px !important;
    max-height: 40px !important;
    padding: 4px !important;
    font-size: 20px !important;
    box-sizing: border-box !important;
    flex: 0 0 auto !important;
    aspect-ratio: 1;
  }

  .expeditions-table .expeditions-action-btn,
  .expeditions-table td.col-acoes .actions-buttons .expeditions-action-btn {
    min-width: 40px !important;
    min-height: 40px !important;
    max-width: 40px !important;
    max-height: 40px !important;
    width: 40px !important;
    height: 40px !important;
    padding: 4px !important;
    font-size: 20px !important;
  }

  /* "Ações:" mesmo tamanho dos outros títulos do card (td::before 9px neste breakpoint) */
  .expeditions-table td.col-acoes::before {
    font-size: 9px !important;
  }

  .lot-count-badge {
    width: 24px !important;
    height: 24px !important;
    font-size: 11px !important;
  }

  .search-input {
    font-size: 13px !important;
    padding: 8px 12px 8px 40px !important;
  }

  .filters-container .filter-group label {
    font-size: 0.65rem !important;
  }

  .filters-container .filter-group .form-control {
    font-size: 0.7rem !important;
    padding: 0.3rem 0.35rem !important;
    height: 32px !important;
  }
}

@media (max-width: 360px) {
  /* Ajustes adicionais para telas muito pequenas */
  .expeditions-page {
    padding: 8px !important;
  }

  .page-header h2 {
    font-size: 18px !important;
  }

  .expeditions-table td {
    font-size: 11px !important;
    padding: 6px 10px !important;
  }

  .expeditions-table td::before {
    font-size: 9px !important;
  }

  .expeditions-table .lot-pedido-info {
    font-size: 13px !important;
  }

  .expeditions-table .pedido-numero {
    font-size: 12px !important;
  }

  .expeditions-table td.col-status .status-badge,
  .expeditions-table .status-badge,
  .expeditions-table tbody tr .status-badge {
    font-size: 0.8rem !important;
    padding: 4px 8px !important;
    min-width: 0 !important;
    max-width: none !important;
    width: max-content !important;
    line-height: 1.2 !important;
    letter-spacing: 0.1px !important;
    overflow: visible !important;
    text-overflow: clip !important;
  }

  .expeditions-table .btn-icon {
    min-width: 36px !important;
    width: 36px !important;
    height: 36px !important;
    max-width: 36px !important;
    max-height: 36px !important;
    padding: 3px !important;
    font-size: 18px !important;
    box-sizing: border-box !important;
    flex: 0 0 auto !important;
    aspect-ratio: 1;
  }

  .expeditions-table .expeditions-action-btn,
  .expeditions-table td.col-acoes .actions-buttons .expeditions-action-btn {
    min-width: 36px !important;
    min-height: 36px !important;
    max-width: 36px !important;
    max-height: 36px !important;
    width: 36px !important;
    height: 36px !important;
    padding: 3px !important;
    font-size: 18px !important;
  }

  .expeditions-table td.col-acoes {
    padding: 8px 12px !important;
    gap: 6px !important;
  }

  .expeditions-table td.col-acoes::before {
    font-size: 9px !important;
  }

  .lot-count-badge {
    width: 22px !important;
    height: 22px !important;
    font-size: 10px !important;
  }

  .search-input {
    font-size: 12px !important;
    padding: 7px 10px 7px 38px !important;
  }

  .filters-container .filter-group label {
    font-size: 0.6rem !important;
  }

  .filters-container .filter-group .form-control {
    font-size: 0.65rem !important;
    padding: 0.25rem 0.3rem !important;
    height: 30px !important;
  }
}

@media (max-width: 320px) {
  /* Ajustes para telas extremamente pequenas */
  .expeditions-page {
    padding: 6px !important;
  }

  .page-header h2 {
    font-size: 16px !important;
  }

  .expeditions-table tbody tr {
    margin-bottom: 12px !important;
    padding: 0 !important;
  }

  .expeditions-table td {
    font-size: 10px !important;
    padding: 5px 8px !important;
  }

  .expeditions-table td::before {
    font-size: 8px !important;
  }

  .expeditions-table .lot-pedido-info {
    font-size: 12px !important;
  }

  .expeditions-table .pedido-numero {
    font-size: 11px !important;
  }

  .expeditions-table td.col-status .status-badge,
  .expeditions-table .status-badge,
  .expeditions-table tbody tr .status-badge {
    font-size: 0.8rem !important;
    padding: 4px 8px !important;
    min-width: 0 !important;
    max-width: none !important;
    width: max-content !important;
    line-height: 1.2 !important;
    letter-spacing: 0.1px !important;
    overflow: visible !important;
    text-overflow: clip !important;
  }

  .expeditions-table .btn-icon {
    min-width: 32px !important;
    width: 32px !important;
    height: 32px !important;
    max-width: 32px !important;
    max-height: 32px !important;
    padding: 2px !important;
    font-size: 16px !important;
    box-sizing: border-box !important;
    flex: 0 0 auto !important;
    aspect-ratio: 1;
  }

  .expeditions-table .expeditions-action-btn,
  .expeditions-table td.col-acoes .actions-buttons .expeditions-action-btn {
    min-width: 32px !important;
    min-height: 32px !important;
    max-width: 32px !important;
    max-height: 32px !important;
    width: 32px !important;
    height: 32px !important;
    padding: 2px !important;
    font-size: 16px !important;
  }

  .expeditions-table td.col-acoes {
    padding: 5px 8px !important;
    gap: 4px !important;
  }

  .expeditions-table td.col-acoes::before {
    font-size: 8px !important;
  }

  .expeditions-table td.col-pedido {
    padding: 5px 8px !important;
    font-size: 11px !important;
  }

  .expeditions-table td.col-estoque,
  .expeditions-table td.col-ref-entrada,
  .expeditions-table td.col-data-criacao,
  .expeditions-table td.col-status {
    padding: 4px 6px !important;
    font-size: 10px !important;
    gap: 5px !important;
  }

  .expeditions-table td.col-estoque > *,
  .expeditions-table td.col-ref-entrada > *,
  .expeditions-table td.col-data-criacao > * {
    font-size: 10px !important;
  }

  .lot-count-badge {
    width: 20px !important;
    height: 20px !important;
    font-size: 9px !important;
  }

  .search-input {
    font-size: 11px !important;
    padding: 6px 8px 6px 36px !important;
  }

  .filters-container {
    gap: 6px !important;
  }

  .filters-container .filter-group label {
    font-size: 0.55rem !important;
  }

  .filters-container .filter-group .form-control {
    font-size: 0.6rem !important;
    padding: 0.2rem 0.25rem !important;
    height: 28px !important;
  }
}

/* ========== Paginação ========== */
.pagination-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 0;
  margin-top: 4px;
}

.pagination-container .btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  background: #fff;
  color: #495057;
  cursor: pointer;
  transition: all 0.15s ease;
}

.pagination-container .btn:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #adb5bd;
}

.pagination-container .btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.85rem;
  color: #6c757d;
  white-space: nowrap;
}
</style>
