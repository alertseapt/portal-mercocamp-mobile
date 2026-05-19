<template>
  <div
    ref="biPageRef"
    class="bi-page bi-adm-page"
    :class="[
      biTheme === 'light' ? 'bi-theme-light' : 'bi-theme-dark',
      { 'bi-fullscreen': isFullscreen },
    ]"
  >
    <!-- Overlay de carregamento -->
    <div v-if="loading" class="bi-loading-overlay">
      <div class="bi-loading-canvas">
        <i class="fas fa-spinner fa-spin bi-loading-icon"></i>
        <p class="bi-loading-message">
          Aguarde enquanto consultamos os dados mais recentes.
        </p>
      </div>
    </div>

    <!-- Header -->
    <div class="bi-header">
      <div class="bi-header-title-wrap">
        <h1 class="bi-header-title">
          {{
            isBiAdmAdminLevel2
              ? 'VISÃO OPERACIONAL'
              : 'ACOMPANHAMENTO OPERACIONAL POR ADMINISTRADOR'
          }}
        </h1>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="bi-toolbar">
      <div class="bi-tabs">
        <span class="bi-tab-label">{{
          isBiAdmAdminLevel2
            ? 'SLA + Rejeições'
            : 'SLA + Rejeições por ADM'
        }}</span>
      </div>
      <div class="bi-toolbar-right">
        <!-- Calendário: período único (SLA e rejeições) -->
        <div ref="calendarioRef" class="bi-calendario-wrap">
          <button
            type="button"
            class="btn-abrir-calendario-bi"
            :title="mostrarCalendario ? 'Fechar' : 'Selecionar período'"
            @click="mostrarCalendario = !mostrarCalendario"
          >
            <i class="fa fa-calendar-alt"></i>
            {{ labelIntervaloAtual }}
          </button>
          <div
            v-if="mostrarCalendario"
            class="calendario-dropdown-bi"
            @click.stop
          >
            <div class="calendario-layout-bi">
              <div class="calendario-presets-bi">
                <button
                  v-for="p in presetsCalendario"
                  :key="p.id"
                  type="button"
                  class="preset-btn-bi"
                  :class="{ active: presetAtivo === p.id }"
                  @click="aplicarPresetCalendario(p.id)"
                >
                  {{ p.label }}
                </button>
              </div>
              <div class="calendario-custom-bi">
                <div class="calendario-buttons-bi">
                  <button
                    type="button"
                    class="btn-cal-bi"
                    @click="irParaHojeCalendario"
                  >
                    Ir para Hoje
                  </button>
                  <button
                    type="button"
                    class="btn-cal-bi"
                    @click="limparIntervaloCalendario"
                  >
                    Limpar
                  </button>
                  <button
                    type="button"
                    class="btn-cal-bi btn-aplicar-bi"
                    @click="aplicarIntervaloCalendario"
                  >
                    Aplicar
                  </button>
                </div>
                <div class="calendario-inputs-bi">
                  <div class="input-data-wrap-bi">
                    <i class="fa fa-calendar"></i>
                    <input
                      type="text"
                      :value="dataInicioDisplay"
                      @input="onDataInicioInput"
                      placeholder="DD/MM/AAAA"
                      maxlength="10"
                    />
                  </div>
                  <div class="input-data-wrap-bi">
                    <i class="fa fa-calendar"></i>
                    <input
                      type="text"
                      :value="dataFimDisplay"
                      @input="onDataFimInput"
                      placeholder="DD/MM/AAAA"
                      maxlength="10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div ref="filtrosRef" class="bi-filtros-wrap">
          <button
            type="button"
            class="filter-btn"
            :class="{ active: mostrarFiltros || temFiltrosAtivos }"
            title="Filtros"
            @click="mostrarFiltros = !mostrarFiltros"
          >
            <i class="fas fa-filter"></i>
            <span v-if="temFiltrosAtivos" class="filter-badge">{{
              countFiltrosAtivos
            }}</span>
          </button>
          <div v-if="mostrarFiltros" class="filtros-dropdown-bi" @click.stop>
            <div class="filtros-header-bi">
              <span>Filtros</span>
              <button
                type="button"
                class="btn-limpar-filtros-bi"
                @click="limparFiltros"
              >
                Limpar
              </button>
            </div>
            <div class="filtros-grid-bi">
              <div v-if="!isBiAdmAdminLevel2" class="filtro-campo-bi">
                <label><i class="fa fa-user-cog"></i> ADM</label>
                <select v-model="filtroAdm" class="filtro-select-bi">
                  <option value="">Todos</option>
                  <option
                    v-for="a in opcoesAdmDistintos"
                    :key="'adm-' + a"
                    :value="a"
                  >
                    {{ a }}
                  </option>
                </select>
              </div>
              <div v-if="!isBiAdmAdminLevel2" class="filtro-campo-bi">
                <label><i class="fa fa-warehouse"></i> ARMAZÉM</label>
                <select v-model="filtroArmazem" class="filtro-select-bi">
                  <option value="">Todos</option>
                  <option
                    v-for="a in opcoesArmazemDistintos"
                    :key="'arm-' + a"
                    :value="a"
                  >
                    {{ a }}
                  </option>
                </select>
              </div>
              <div class="filtro-campo-bi">
                <label
                  ><i class="fa fa-file-contract"></i> SLA (contrato)</label
                >
                <select v-model="filtroSla" class="filtro-select-bi">
                  <option value="">Todos</option>
                  <option
                    v-for="s in opcoesSlaDistintos"
                    :key="'sla-' + s"
                    :value="s"
                  >
                    {{ s }}
                  </option>
                </select>
              </div>
              <div class="filtro-campo-bi">
                <label><i class="fa fa-barcode"></i> DP</label>
                <input
                  :value="filtroDp"
                  type="text"
                  inputmode="numeric"
                  autocomplete="off"
                  placeholder="DP"
                  class="filtro-select-bi"
                  @input="onFiltroDpInput"
                />
              </div>
              <div class="filtro-campo-bi">
                <label><i class="fa fa-file-invoice"></i> NF</label>
                <input
                  :value="filtroNf"
                  type="text"
                  inputmode="numeric"
                  autocomplete="off"
                  placeholder="NF"
                  class="filtro-select-bi"
                  @input="onFiltroNfInput"
                />
              </div>
              <div class="filtro-campo-bi">
                <label><i class="fa fa-shopping-cart"></i> PEDIDO</label>
                <input
                  v-model.trim="filtroPedido"
                  type="text"
                  placeholder="Pedido"
                  class="filtro-select-bi"
                />
              </div>
              <div class="filtro-campo-bi">
                <label><i class="fa fa-building"></i> CLIENTE</label>
                <input
                  v-model.trim="filtroBusca"
                  type="text"
                  placeholder="Cliente"
                  class="filtro-select-bi"
                />
              </div>
            </div>
          </div>
        </div>
        <!-- Atualizar -->
        <button
          type="button"
          class="theme-toggle-btn bi-refresh-btn"
          :class="{ 'bi-refresh-spinning': loading }"
          title="Atualizar dados agora"
          :disabled="loading"
          @click="loadAll()"
        >
          <i class="fas fa-sync-alt"></i>
        </button>
        <!-- Tema -->
        <button
          type="button"
          class="theme-toggle-btn"
          :title="biTheme === 'dark' ? 'Tema claro' : 'Tema escuro'"
          @click="toggleTheme()"
        >
          <i :class="biTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'"></i>
        </button>
        <!-- Tela cheia -->
        <button
          type="button"
          class="theme-toggle-btn bi-expand-btn"
          :title="isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'"
          @click="toggleFullscreen()"
        >
          <i :class="isFullscreen ? 'fas fa-compress' : 'fas fa-expand'"></i>
        </button>
      </div>
    </div>

    <!-- Cards de resumo geral -->
    <div class="adm-summary-cards">
      <div class="adm-summary-card">
        <div class="adm-summary-icon"><i class="fas fa-user-tie"></i></div>
        <div class="adm-summary-body">
          <span class="adm-summary-valor">{{ fmtNum(totalAdms) }}</span>
          <span class="adm-summary-label">Administradores</span>
        </div>
      </div>
      <div class="adm-summary-card">
        <div class="adm-summary-icon adm-summary-icon--sla">
          <i class="fas fa-clock"></i>
        </div>
        <div class="adm-summary-body">
          <span class="adm-summary-valor">{{ fmtNum(totalPedidosSla) }}</span>
          <span class="adm-summary-label">Pedidos em Aberto (SLA)</span>
        </div>
      </div>
      <div class="adm-summary-card">
        <div class="adm-summary-icon adm-summary-icon--exp">
          <i class="fas fa-truck"></i>
        </div>
        <div class="adm-summary-body">
          <span class="adm-summary-valor">{{ fmtNum(totalExpFora) }}</span>
          <span class="adm-summary-label">Expedição Fora do Prazo</span>
        </div>
      </div>
      <div class="adm-summary-card">
        <div class="adm-summary-icon adm-summary-icon--alerta-sep">
          <i class="fas fa-bell"></i>
        </div>
        <div class="adm-summary-body">
          <span class="adm-summary-valor">{{ fmtNum(totalAlertaSep) }}</span>
          <span class="adm-summary-label">Alerta Separação</span>
        </div>
      </div>
      <div class="adm-summary-card">
        <div class="adm-summary-icon adm-summary-icon--rej">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="adm-summary-body">
          <span class="adm-summary-valor">{{
            fmtNum(totalPedidosRejeicao)
          }}</span>
          <span class="adm-summary-label">Pedidos em Rejeição</span>
        </div>
      </div>
      <div class="adm-summary-card">
        <div class="adm-summary-icon adm-summary-icon--cli">
          <i class="fas fa-building"></i>
        </div>
        <div class="adm-summary-body">
          <span class="adm-summary-valor">{{
            fmtNum(totalClientesRejeicao)
          }}</span>
          <span class="adm-summary-label">Clientes com Rejeição</span>
        </div>
      </div>
    </div>

    <div v-if="temFiltrosAtivos" class="adm-active-filters">
      <span class="adm-filter-tag" v-if="filtroAdm && !isBiAdmAdminLevel2">
        ADM: {{ filtroAdm }}
        <button @click="filtroAdm = ''" class="adm-filter-tag-close">
          &times;
        </button>
      </span>
      <span class="adm-filter-tag" v-if="filtroArmazem && !isBiAdmAdminLevel2">
        Armazém: {{ filtroArmazem }}
        <button @click="filtroArmazem = ''" class="adm-filter-tag-close">
          &times;
        </button>
      </span>
      <span class="adm-filter-tag" v-if="filtroSla">
        SLA: {{ filtroSla }}
        <button @click="filtroSla = ''" class="adm-filter-tag-close">
          &times;
        </button>
      </span>
      <span class="adm-filter-tag" v-if="String(filtroDp).trim()">
        DP: {{ filtroDp }}
        <button @click="filtroDp = ''" class="adm-filter-tag-close">
          &times;
        </button>
      </span>
      <span class="adm-filter-tag" v-if="String(filtroNf).trim()">
        NF: {{ filtroNf }}
        <button @click="filtroNf = ''" class="adm-filter-tag-close">
          &times;
        </button>
      </span>
      <span class="adm-filter-tag" v-if="String(filtroPedido).trim()">
        Pedido: {{ filtroPedido }}
        <button @click="filtroPedido = ''" class="adm-filter-tag-close">
          &times;
        </button>
      </span>
      <span class="adm-filter-tag" v-if="String(filtroBusca || '').trim()">
        Cliente: {{ filtroBusca }}
        <button @click="filtroBusca = ''" class="adm-filter-tag-close">
          &times;
        </button>
      </span>
      <button class="adm-filter-clear-all" @click="limparFiltros">
        Limpar todos
      </button>
    </div>

    <!-- Erro -->
    <div v-if="loadError" class="adm-error">
      <i class="fas fa-exclamation-circle"></i> {{ loadError }}
    </div>

    <!-- Sem dados -->
    <div
      v-if="!loading && !loadError && admListFiltered.length === 0"
      class="adm-empty"
    >
      <i class="fas fa-inbox"></i>
      <h3>Nenhum administrador encontrado</h3>
      <p v-if="temFiltrosAtivos">Tente ajustar os filtros ativos.</p>
      <p v-else>Não há dados de SLA ou rejeição disponíveis no período.</p>
    </div>

    <!-- Colunas de ADMs — vertical lado a lado -->
    <div
      v-if="admListFiltered.length > 0"
      class="adm-columns"
      :class="{ 'adm-columns--single-fill': admListForView.length === 1 }"
    >
      <div
        v-for="adm in admListForView"
        :key="adm.nome"
        class="adm-col"
        :class="[
          'adm-col--' + (activeTabMap[adm.nome] || 'producao'),
          fsFlipping[adm.nome] === 'out' ? 'adm-col--flip-out' : '',
          fsFlipping[adm.nome] === 'in' ? 'adm-col--flip-in' : '',
        ]"
      >
        <!-- Header do ADM -->
        <div class="adm-col-header">
          <div class="adm-card-avatar"><i class="fas fa-user-tie"></i></div>
          <div class="adm-card-info">
            <span class="adm-card-nome">{{ adm.nome }}</span>
            <span class="adm-card-clientes"
              >{{ adm.totalClientes }} cliente(s)</span
            >
          </div>
        </div>

        <!-- Métricas compactas — total geral SLA + 5 mini-blocos clicáveis -->
        <div class="adm-card-stats">
          <div
            class="adm-stat adm-stat--total"
            title="Soma de todos os pedidos com SLA no período e filtros ativos (inclui embarcados, alertas e atrasados). A lista «Em Produção» mostra só os em andamento sem alerta."
          >
            <span class="adm-stat-val">{{ fmtNum(adm.sla.total) }}</span>
            <span class="adm-stat-lbl">Total pedidos</span>
          </div>
          <div
            class="adm-stat adm-stat--clickable"
            :class="{
              'adm-stat--selected': activeTabMap[adm.nome] === 'producao',
            }"
            @click="setDetailTab(adm.nome, 'producao')"
          >
            <span class="adm-stat-val">{{
              fmtNum(adm.pedidos.producao.length)
            }}</span>
            <span class="adm-stat-lbl">Em Produção</span>
          </div>
          <div
            class="adm-stat adm-stat--yellow adm-stat--clickable"
            :class="{
              'adm-stat--active': adm.alertas.alertaSep > 0,
              'adm-stat--selected': activeTabMap[adm.nome] === 'alertaSep',
            }"
            @click="setDetailTab(adm.nome, 'alertaSep')"
          >
            <span class="adm-stat-val">{{
              fmtNum(adm.alertas.alertaSep)
            }}</span>
            <span class="adm-stat-lbl">Alerta Sep.</span>
          </div>
          <div
            class="adm-stat adm-stat--red adm-stat--clickable"
            :class="{
              'adm-stat--active': adm.alertas.expFora > 0,
              'adm-stat--selected': activeTabMap[adm.nome] === 'atrasados',
            }"
            @click="setDetailTab(adm.nome, 'atrasados')"
          >
            <span class="adm-stat-val">{{ fmtNum(adm.alertas.expFora) }}</span>
            <span class="adm-stat-lbl">Exp. Atrasada</span>
          </div>
          <div
            class="adm-stat adm-stat--purple adm-stat--clickable"
            :class="{
              'adm-stat--active': adm.alertas.alertaCko > 0,
              'adm-stat--selected': activeTabMap[adm.nome] === 'alertaCko',
            }"
            @click="setDetailTab(adm.nome, 'alertaCko')"
          >
            <span class="adm-stat-val">{{
              fmtNum(adm.alertas.alertaCko)
            }}</span>
            <span class="adm-stat-lbl">Alerta Cko.</span>
          </div>
          <div
            class="adm-stat adm-stat--orange adm-stat--clickable"
            :class="{
              'adm-stat--active': adm.rejeicao.emRejeicao > 0,
              'adm-stat--selected': activeTabMap[adm.nome] === 'rejeicao',
            }"
            @click="setDetailTab(adm.nome, 'rejeicao')"
          >
            <span class="adm-stat-val">{{
              fmtNum(adm.rejeicao.emRejeicao)
            }}</span>
            <span class="adm-stat-lbl">Em Rejeição</span>
          </div>
        </div>

        <!-- Conteúdo da tab ativa -->
        <div class="adm-col-body" :ref="'colBody_' + adm.nome">
          <!-- Em Produção -->
          <div v-if="activeTabMap[adm.nome] === 'producao'">
            <div
              v-if="adm.pedidos.producao.length === 0"
              class="adm-detail-empty"
            >
              Nenhum pedido em produção
            </div>
            <div v-else class="adm-detail-table-wrap">
              <table class="adm-detail-table">
                <thead>
                  <tr>
                    <th>DP</th>
                    <th>NF</th>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Separação</th>
                    <th>Expedição</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="p in adm.pedidos.producao"
                    :key="'prod-' + p.dp + p.nf"
                  >
                    <td>{{ p.dp }}</td>
                    <td>{{ p.nf }}</td>
                    <td>{{ p.pedido }}</td>
                    <td :title="p.cliente">{{ truncar(p.cliente, 18) }}</td>
                    <td class="td-status" :style="statusCellStyle(p.statusSep)">
                      {{ p.statusSep }}
                    </td>
                    <td class="td-status" :style="statusCellStyle(p.statusExp)">
                      {{ p.statusExp }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Alerta Separação -->
          <div v-if="activeTabMap[adm.nome] === 'alertaSep'">
            <div
              v-if="filtrarRisco(adm, 'sep').length === 0"
              class="adm-detail-empty"
            >
              Nenhum alerta de separação
            </div>
            <div v-else class="adm-detail-table-wrap">
              <table class="adm-detail-table">
                <thead>
                  <tr>
                    <th>DP</th>
                    <th>NF</th>
                    <th>Pedido</th>
                    <th>Cliente</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="p in filtrarRisco(adm, 'sep')"
                    :key="'sep-' + p.dp + p.nf"
                  >
                    <td>{{ p.dp }}</td>
                    <td>{{ p.nf }}</td>
                    <td>{{ p.pedido }}</td>
                    <td :title="p.cliente">{{ truncar(p.cliente, 18) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Alerta Checkout -->
          <div v-if="activeTabMap[adm.nome] === 'alertaCko'">
            <div
              v-if="filtrarRisco(adm, 'cko').length === 0"
              class="adm-detail-empty"
            >
              Nenhum alerta de checkout
            </div>
            <div v-else class="adm-detail-table-wrap">
              <table class="adm-detail-table">
                <thead>
                  <tr>
                    <th>DP</th>
                    <th>NF</th>
                    <th>Pedido</th>
                    <th>Cliente</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="p in filtrarRisco(adm, 'cko')"
                    :key="'cko-' + p.dp + p.nf"
                  >
                    <td>{{ p.dp }}</td>
                    <td>{{ p.nf }}</td>
                    <td>{{ p.pedido }}</td>
                    <td :title="p.cliente">{{ truncar(p.cliente, 18) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Atrasados -->
          <div v-if="activeTabMap[adm.nome] === 'atrasados'">
            <div
              v-if="adm.pedidos.atrasados.length === 0"
              class="adm-detail-empty"
            >
              Nenhum pedido atrasado
            </div>
            <div v-else class="adm-detail-table-wrap">
              <table class="adm-detail-table">
                <thead>
                  <tr>
                    <th>DP</th>
                    <th>NF</th>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Dias</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="p in adm.pedidos.atrasados"
                    :key="'atr-' + p.dp + p.nf"
                  >
                    <td>{{ p.dp }}</td>
                    <td>{{ p.nf }}</td>
                    <td>{{ p.pedido }}</td>
                    <td :title="p.cliente">{{ truncar(p.cliente, 18) }}</td>
                    <td class="td-red">{{ p.diasAtraso }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Em Rejeição -->
          <div v-if="activeTabMap[adm.nome] === 'rejeicao'">
            <div
              v-if="adm.pedidos.rejeicao.length === 0"
              class="adm-detail-empty"
            >
              Nenhum pedido em rejeição
            </div>
            <div v-else class="adm-detail-table-wrap">
              <table class="adm-detail-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Sit. Arq.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="p in adm.pedidos.rejeicao"
                    :key="'rej-' + p.pedido + p.idCliente"
                  >
                    <td>{{ p.pedido }}</td>
                    <td :title="p.cliente">{{ truncar(p.cliente, 18) }}</td>
                    <td>{{ p.sitArquivo }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="adm-footer">
      <span v-if="lastUpdate" class="adm-footer-update">
        <i class="fas fa-clock"></i> Última atualização: {{ lastUpdate }}
      </span>
      <span
        class="adm-footer-countdown"
        :title="'Próxima atualização automática em ' + countdownFormatted"
      >
        <i class="fas fa-sync-alt"></i> Próxima atualização em
        {{ countdownFormatted }}
      </span>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { rejeicaoService } from '../services/api.js'

const AUTO_REFRESH_SEC = 5 * 60

export default {
  name: 'BIAdministradoresPage',
  emits: ['notification', 'page-ready'],
  props: {
    user: { type: Object, default: null },
  },
  data() {
    const now = new Date()
    return {
      loading: false,
      loadError: null,
      refreshCountdown: AUTO_REFRESH_SEC,
      _refreshInterval: null,
      corteSep: 14,
      corteCko: 14,
      biTheme: (() => {
        try {
          return localStorage.getItem('bi-theme') || 'light'
        } catch {
          return 'light'
        }
      })(),
      isFullscreen: false,
      fsSlots: [null, null, null],
      fsAdmQueue: [],
      fsDoneCount: {},
      fsFlipping: {},
      slaPedidos: [],
      slaPedidosTotais: [],
      rejeicaoDados: [],
      lastUpdate: null,
      activeDetailTabs: {},
      detailTabs: [
        { id: 'producao', label: 'Em Produção', icon: 'fas fa-cogs' },
        { id: 'risco', label: 'Em Risco', icon: 'fas fa-bell' },
        { id: 'atrasados', label: 'Atrasados', icon: 'fas fa-truck' },
        { id: 'rejeicao', label: 'Em Rejeição', icon: 'fas fa-ban' },
      ],

      // Calendário: mesmo intervalo para SLA e rejeições (padrão: 01/01 do ano atual até hoje)
      mostrarCalendario: false,
      dataInicio: `${now.getFullYear()}-01-01`,
      dataFim: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
      dataInicioDisplay: '',
      dataFimDisplay: '',
      presetAtivo: 'ano_atual',
      presetsCalendario: [
        { id: 'ano_atual', label: 'Ano atual' },
        { id: 'ontem', label: 'Ontem' },
        { id: 'hoje', label: 'Hoje' },
        { id: 'esta_semana', label: 'Esta Semana' },
        { id: 'semana_passada', label: 'Semana Passada' },
        { id: 'este_mes', label: 'Este Mês' },
        { id: 'mes_passado', label: 'Mês Passado' },
      ],

      mostrarFiltros: false,
      filtroAdm: '',
      filtroArmazem: '',
      filtroSla: '',
      filtroDp: '',
      filtroNf: '',
      filtroPedido: '',
      filtroBusca: '',
    }
  },
  watch: {
    isFullscreen(val) {
      if (val) {
        this.$nextTick(() => this.startAutoScroll())
      } else {
        this.stopAutoScroll()
      }
    },
    user: {
      deep: true,
      immediate: true,
      handler() {
        if (this.user && Number(this.user.level_access) === 2) {
          this.filtroAdm = ''
          this.filtroArmazem = ''
        }
      },
    },
  },
  computed: {
    isBiAdmAdminLevel2() {
      return this.user && Number(this.user.level_access) === 2
    },
    countdownFormatted() {
      const s = Math.max(0, Math.floor(this.refreshCountdown))
      const m = Math.floor(s / 60)
      const sec = s % 60
      return `${m}:${String(sec).padStart(2, '0')}`
    },
    labelIntervaloAtual() {
      if (!this.dataInicio && !this.dataFim) return 'Período'
      if (this.dataInicio && this.dataFim) {
        return `${this.formatarDataCalendario(this.dataInicio)} - ${this.formatarDataCalendario(this.dataFim)}`
      }
      return this.dataInicio
        ? this.formatarDataCalendario(this.dataInicio)
        : this.formatarDataCalendario(this.dataFim)
    },
    temFiltroDoc() {
      return !!(
        String(this.filtroDp || '').trim() ||
        String(this.filtroNf || '').trim() ||
        String(this.filtroPedido || '').trim()
      )
    },
    temFiltrosAtivos() {
      const admArm =
        !this.isBiAdmAdminLevel2 && (this.filtroAdm || this.filtroArmazem)
      return !!(
        admArm ||
        this.filtroSla ||
        String(this.filtroBusca || '').trim() ||
        this.temFiltroDoc
      )
    },
    countFiltrosAtivos() {
      let c = 0
      if (!this.isBiAdmAdminLevel2) {
        if (this.filtroAdm) c++
        if (this.filtroArmazem) c++
      }
      if (this.filtroSla) c++
      if (String(this.filtroDp || '').trim()) c++
      if (String(this.filtroNf || '').trim()) c++
      if (String(this.filtroPedido || '').trim()) c++
      if (String(this.filtroBusca || '').trim()) c++
      return c
    },
    opcoesAdmDistintos() {
      const set = new Set()
      for (const p of [...this.slaPedidos, ...this.rejeicaoDados]) {
        const a = p.adm != null ? String(p.adm).trim() : ''
        if (a) set.add(a)
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
    },
    opcoesArmazemDistintos() {
      const set = new Set()
      for (const p of [...this.slaPedidos, ...this.rejeicaoDados]) {
        const e =
          p.estabelecimento != null ? String(p.estabelecimento).trim() : ''
        if (e) set.add(e)
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
    },
    opcoesSlaDistintos() {
      const set = new Set()
      for (const p of [...this.slaPedidos, ...this.rejeicaoDados]) {
        const s = (p.sla || '').toString().trim().toUpperCase()
        if (s) set.add(s)
      }
      return Array.from(set).sort()
    },
    slaPedidosBaseFiltered() {
      let list = this.slaPedidos
      if (!this.isBiAdmAdminLevel2 && this.filtroArmazem) {
        list = list.filter(
          p => (p.estabelecimento || '').trim() === this.filtroArmazem
        )
      }
      if (this.filtroSla) {
        list = list.filter(
          p =>
            (p.sla || 'D+0').toString().trim().toUpperCase() === this.filtroSla
        )
      }
      return list
    },
    slaPedidosFiltrados() {
      let list = this.slaPedidosBaseFiltered
      if (this.temFiltroDoc) {
        list = list.filter(p => this.pedidoRowMatchesDoc(p))
      }
      return list
    },
    rejeicaoBaseFiltered() {
      let list = this.rejeicaoDados
      if (!this.isBiAdmAdminLevel2 && this.filtroArmazem) {
        list = list.filter(
          r => (r.estabelecimento || '').trim() === this.filtroArmazem
        )
      }
      if (this.filtroSla) {
        list = list.filter(
          r =>
            (r.sla || 'D+0').toString().trim().toUpperCase() === this.filtroSla
        )
      }
      return list
    },
    rejeicaoDadosFiltrados() {
      let list = this.rejeicaoBaseFiltered
      if (this.temFiltroDoc) {
        const allowed = this.buildAllowedPedidosFromSlaDoc()
        list = list.filter(r => this.rejeicaoRowMatchesPedidoSet(r, allowed))
      }
      return list
    },
    admList() {
      const admMap = {}
      const ensureAdm = nome => {
        if (!admMap[nome]) {
          admMap[nome] = {
            nome,
            _slaClientes: {},
            _rejClientes: {},
            _allClientes: new Set(),
            _expFora: 0,
            _alertaSep: 0,
            _alertaCko: 0,
            _pedProducao: [],
            _pedRisco: [],
            _pedAtrasados: [],
            _pedRejeicao: [],
          }
        }
        return admMap[nome]
      }

      const horaAtual = new Date().getHours()
      const corteSep = this.corteSep
      const corteCko = this.corteCko
      const STATUSES_CKO_OK = ['CKO. OK', 'CKOVOL. OK', 'EM CKO.', 'EM CKOVOL.']

      for (const p of this.slaPedidosFiltrados) {
        const adm = (p.adm != null ? String(p.adm).trim() : '') || '(sem ADM)'
        const entry = ensureAdm(adm)
        const clienteKey = String(p.id_cliente || p.nome_cliente || '').trim()
        const clienteNome = (p.nome_cliente || p.cliente || clienteKey || '')
          .trim()
          .toUpperCase()
        const armazem = (p.estabelecimento || '').trim()
        entry._allClientes.add(clienteKey)

        if (!entry._slaClientes[clienteKey]) {
          entry._slaClientes[clienteKey] = {
            id: clienteKey,
            nome: clienteNome,
            armazem,
            sla: (p.sla || 'D+0').toString().trim().toUpperCase(),
            total: 0,
            noPrazo: 0,
            fora: 0,
            pendente: 0,
          }
        }
        const c = entry._slaClientes[clienteKey]
        c.total++
        const sit = (p.situacao || '').trim().toUpperCase()
        const isEmb = sit === 'EMB. CONF.' || sit === 'EMBARCADO'
        if (isEmb) {
          const ss = this.computeSlaStatus(p, 'sep')
          const se = this.computeSlaStatus(p, 'exp')
          if (ss === 'fora' || se === 'fora') c.fora++
          else c.noPrazo++
        } else {
          const now = new Date()
          if (p.limite && now > new Date(p.limite)) c.fora++
          else c.pendente++
        }

        // Status separação e expedição — mesma lógica do BIPage
        const statusSep = this.computeStatusSeparacaoAdm(p)
        const statusExp = this.computeStatusExpedicaoAdm(p)

        const pedBase = {
          dp: p.no_dp || p.dp || '',
          pedido: p.numero_pedido || p.numeroPedido || p.no_ped_cli || '',
          nf: p.numero_nf || p.numeroNF || p.no_nf || '',
          cliente: clienteNome,
          idCliente: clienteKey,
          situacao: (p.situacao || p.sit_fase || '').trim(),
          sla: (p.sla || 'D+0').toString().trim().toUpperCase(),
          limite: p.limite,
          statusSep,
          statusExp,
        }

        // Alertas operacionais
        const limiteDate = p.limite ? new Date(p.limite) : null
        const rawExp = p.expedido || p.dt_checkout || p.dt_embarque
        const expDate = rawExp ? new Date(rawExp) : null
        const rawSep = p.separado || p.dt_conf_sep
        const sepDate = rawSep ? new Date(rawSep) : null
        const limiteHoje = limiteDate && this.isMesmoDia(limiteDate, new Date())
        let isAtrasado = false,
          isRisco = false

        // Expedição fora do prazo
        if (limiteDate && !isNaN(limiteDate.getTime())) {
          let foraExp = false
          if (!expDate) {
            const fimLimite = new Date(
              limiteDate.getFullYear(),
              limiteDate.getMonth(),
              limiteDate.getDate(),
              23,
              59,
              59
            )
            if (new Date() > fimLimite) foraExp = true
          } else {
            const diaExp = new Date(
              expDate.getFullYear(),
              expDate.getMonth(),
              expDate.getDate()
            )
            const diaLim = new Date(
              limiteDate.getFullYear(),
              limiteDate.getMonth(),
              limiteDate.getDate()
            )
            if (diaExp > diaLim) foraExp = true
          }
          if (foraExp) {
            entry._expFora++
            isAtrasado = true
            const diaLim = new Date(
              limiteDate.getFullYear(),
              limiteDate.getMonth(),
              limiteDate.getDate()
            )
            const ref = expDate || new Date()
            const diaRef = new Date(
              ref.getFullYear(),
              ref.getMonth(),
              ref.getDate()
            )
            const dias = Math.max(0, Math.floor((diaRef - diaLim) / 864e5))
            entry._pedAtrasados.push({ ...pedBase, diasAtraso: dias })
          }
        }
        // Alerta separação (só pedidos não embarcados)
        if (!isEmb && limiteHoje && horaAtual >= corteSep && !sepDate) {
          entry._alertaSep++
          isRisco = true
          entry._pedRisco.push({
            ...pedBase,
            tipoAlerta: 'sep',
            tipoAlertaLabel: 'Sep.',
          })
        }
        // Alerta checkout (só pedidos não embarcados, sem status de checkout ok)
        if (
          !isEmb &&
          limiteHoje &&
          horaAtual >= corteCko &&
          sepDate &&
          this.isMesmoDia(sepDate, limiteDate)
        ) {
          if (!STATUSES_CKO_OK.some(s => s === sit)) {
            entry._alertaCko++
            isRisco = true
            entry._pedRisco.push({
              ...pedBase,
              tipoAlerta: 'cko',
              tipoAlertaLabel: 'CKO',
            })
          }
        }
        // Em produção: não é atrasado nem em risco (pedidos normais em andamento)
        if (!isAtrasado && !isRisco && !isEmb) {
          entry._pedProducao.push(pedBase)
        }
      }

      for (const r of this.rejeicaoDadosFiltrados) {
        const adm = (r.adm || '').trim() || '(sem ADM)'
        const entry = ensureAdm(adm)
        const clienteKey = String(r.id_cliente || r.nome_cliente || '').trim()
        const clienteNome = (r.nome_cliente || clienteKey || '')
          .trim()
          .toUpperCase()
        const armazem = (r.estabelecimento || '').trim()
        entry._allClientes.add(clienteKey)

        if (!entry._rejClientes[clienteKey]) {
          entry._rejClientes[clienteKey] = {
            id: clienteKey,
            nome: clienteNome,
            armazem,
            sla: (r.sla || 'D+0').toString().trim().toUpperCase(),
            total: 0,
            emRejeicao: 0,
            integrados: 0,
            _seen: new Set(),
          }
        }
        const c = entry._rejClientes[clienteKey]
        const pedKey = `${r.pedido}|${r.id_cliente || ''}`
        if (c._seen.has(pedKey)) continue
        c._seen.add(pedKey)
        c.total++
        const sit = String(r.sit_arquivo || '').trim()
        if (sit === 'S/ Rejeições' || sit === 'Reprocessado') {
          c.integrados++
        } else {
          c.emRejeicao++
          entry._pedRejeicao.push({
            pedido: r.pedido || '',
            cliente: clienteNome,
            idCliente: clienteKey,
            sitArquivo: sit || 'Em rejeição',
            sla: (r.sla || 'D+0').toString().trim().toUpperCase(),
            rejeicao: r.motivo_rejeicao || r.rejeicao || sit || '',
          })
        }
      }

      return Object.values(admMap)
        .map(entry => {
          const slaClientes = Object.values(entry._slaClientes).sort(
            (a, b) => b.fora - a.fora || b.total - a.total
          )
          const rejClientes = Object.values(entry._rejClientes)
            .map(c => {
              const { _seen, ...rest } = c
              return rest
            })
            .sort((a, b) => b.emRejeicao - a.emRejeicao || b.total - a.total)
          const slaTotals = slaClientes.reduce(
            (acc, c) => ({
              total: acc.total + c.total,
              noPrazo: acc.noPrazo + c.noPrazo,
              foraPrazo: acc.foraPrazo + c.fora,
              pendente: acc.pendente + c.pendente,
            }),
            { total: 0, noPrazo: 0, foraPrazo: 0, pendente: 0 }
          )
          const rejTotals = rejClientes.reduce(
            (acc, c) => ({
              total: acc.total + c.total,
              emRejeicao: acc.emRejeicao + c.emRejeicao,
              integrados: acc.integrados + c.integrados,
            }),
            { total: 0, emRejeicao: 0, integrados: 0 }
          )
          return {
            nome: entry.nome,
            totalClientes: entry._allClientes.size,
            sla: { ...slaTotals, clientes: slaClientes },
            rejeicao: {
              ...rejTotals,
              clientes: new Set(rejClientes.map(c => c.id)).size,
              clientesList: rejClientes,
            },
            alertas: {
              expFora: entry._expFora,
              alertaSep: entry._alertaSep,
              alertaCko: entry._alertaCko,
            },
            pedidos: {
              producao: entry._pedProducao,
              risco: entry._pedRisco,
              atrasados: entry._pedAtrasados
                .slice()
                .sort((a, b) => b.diasAtraso - a.diasAtraso),
              rejeicao: entry._pedRejeicao,
            },
          }
        })
        .sort((a, b) => {
          const aS =
            a.alertas.expFora * 15 +
            a.alertas.alertaSep * 12 +
            a.alertas.alertaCko * 8 +
            a.sla.foraPrazo * 10 +
            a.rejeicao.emRejeicao * 5
          const bS =
            b.alertas.expFora * 15 +
            b.alertas.alertaSep * 12 +
            b.alertas.alertaCko * 8 +
            b.sla.foraPrazo * 10 +
            b.rejeicao.emRejeicao * 5
          return bS - aS || b.sla.total - a.sla.total
        })
    },
    admListFiltered() {
      let list = this.admList
      if (this.isBiAdmAdminLevel2 && this.user) {
        list = list.filter(a => this.admColunaPertenceAoUsuarioLogado(a.nome))
      }
      if (!this.isBiAdmAdminLevel2 && this.filtroAdm) {
        list = list.filter(a => a.nome === this.filtroAdm)
      }
      const qBusca = String(this.filtroBusca || '').trim()
      if (qBusca) {
        const qFold = this.foldTextoBusca(qBusca)
        const qDigits = qBusca.replace(/\D/g, '')
        list = list.filter(
          a =>
            a.sla.clientes.some(c =>
              this.clienteRowMatchesBusca(c, qFold, qDigits)
            ) ||
            a.rejeicao.clientesList.some(c =>
              this.clienteRowMatchesBusca(c, qFold, qDigits)
            )
        )
      }
      if (this.temFiltrosAtivos) {
        list = list.filter(a => a.sla.total > 0 || a.rejeicao.total > 0)
      }
      return list
    },
    admListVisible() {
      if (!this.isFullscreen) return this.admListFiltered
      const all = this.admListFiltered
      const visible = []
      for (const nome of this.fsSlots) {
        if (!nome) continue
        const adm = all.find(a => a.nome === nome)
        if (adm) visible.push(adm)
      }
      return visible.length > 0 ? visible : all.slice(0, 3)
    },
    admListForView() {
      const q = String(this.filtroBusca || '').trim()
      const visible = this.admListVisible
      if (!q) return visible
      return visible.map(adm => this.sliceAdmByClienteBusca(adm))
    },
    admListAfterClienteBusca() {
      const q = String(this.filtroBusca || '').trim()
      if (!q) return this.admListFiltered
      return this.admListFiltered.map(adm => this.sliceAdmByClienteBusca(adm))
    },
    activeTabMap() {
      const m = {}
      for (const adm of this.admListFiltered) {
        m[adm.nome] = this.activeDetailTabs[adm.nome] || 'producao'
      }
      return m
    },
    totalAdms() {
      return this.admListFiltered.length
    },
    totalPedidosSla() {
      return this.admListAfterClienteBusca.reduce((s, a) => s + a.sla.total, 0)
    },
    totalExpFora() {
      return this.admListAfterClienteBusca.reduce(
        (s, a) => s + a.alertas.expFora,
        0
      )
    },
    totalAlertaSep() {
      return this.admListAfterClienteBusca.reduce(
        (s, a) => s + a.alertas.alertaSep,
        0
      )
    },
    totalAlertaCko() {
      return this.admListAfterClienteBusca.reduce(
        (s, a) => s + a.alertas.alertaCko,
        0
      )
    },
    totalPedidosRejeicao() {
      return this.admListAfterClienteBusca.reduce(
        (s, a) => s + a.rejeicao.emRejeicao,
        0
      )
    },
    totalClientesRejeicao() {
      const set = new Set()
      for (const a of this.admListAfterClienteBusca) {
        for (const c of a.rejeicao.clientesList) {
          if (c.emRejeicao > 0) set.add(c.id)
        }
      }
      return set.size
    },
  },
  mounted() {
    this.syncDataDisplayFromModel()
    this.loadAll()
    this.$emit('page-ready')
    document.addEventListener('fullscreenchange', this.onFullscreenChange)
    document.addEventListener('click', this.onDocClick)
    this.startAutoRefresh()
  },
  beforeUnmount() {
    document.removeEventListener('fullscreenchange', this.onFullscreenChange)
    document.removeEventListener('click', this.onDocClick)
    this.stopAutoRefresh()
    this.stopAutoScroll()
  },
  methods: {
    startAutoRefresh() {
      this.stopAutoRefresh()
      this.refreshCountdown = AUTO_REFRESH_SEC
      this._refreshInterval = setInterval(() => {
        if (this.refreshCountdown > 0) {
          this.refreshCountdown--
        }
        if (
          this.refreshCountdown <= 0 &&
          !this.loading &&
          !this._silentLoadInFlight
        ) {
          this.loadAll({ silent: true })
        }
      }, 1000)
    },
    stopAutoRefresh() {
      if (this._refreshInterval) {
        clearInterval(this._refreshInterval)
        this._refreshInterval = null
      }
    },
    async loadAll({ silent } = {}) {
      if (silent) {
        if (this._silentLoadInFlight) return
        this._silentLoadInFlight = true
      } else {
        this.loading = true
      }
      this.loadError = null
      try {
        await this.fetchBiConfig()
        const [slaRes, rejRes] = await Promise.all([
          this.fetchSla(),
          this.fetchRejeicoes(),
        ])
        this.slaPedidos = slaRes.pedidos
        this.slaPedidosTotais = slaRes.pedidosTotais
        this.rejeicaoDados = rejRes
        this.lastUpdate = new Date().toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
        this.refreshCountdown = AUTO_REFRESH_SEC
      } catch (err) {
        console.error('[BI ADM] Erro ao carregar:', err)
        if (!silent) {
          this.loadError =
            err?.response?.data?.error ||
            err?.message ||
            'Erro ao carregar dados'
        }
      } finally {
        if (silent) {
          this._silentLoadInFlight = false
        } else {
          this.loading = false
        }
      }
    },
    async fetchSla() {
      const token = localStorage.getItem('token')
      const params = {}
      if (this.dataInicio) params.data_inicio = this.dataInicio
      if (this.dataFim) params.data_fim = this.dataFim
      const response = await axios.get('/bi/sla', {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      let pedidos = response?.data?.pedidos || response?.data?.orders || []
      if (!Array.isArray(pedidos)) pedidos = []
      let pedidosTotais = Array.isArray(response?.data?.pedidosTotais)
        ? response.data.pedidosTotais
        : []
      return { pedidos, pedidosTotais }
    },
    async fetchRejeicoes() {
      const params = {}
      if (this.dataInicio) params.data_inicio = this.dataInicio
      if (this.dataFim) params.data_fim = this.dataFim
      if (!params.data_inicio && !params.data_fim) {
        params.todo_periodo = '1'
      }
      params.excluir_resolvidos = '1'
      const res = await rejeicaoService.getRejeicoes(params)
      return Array.isArray(res?.data) ? res.data : []
    },
    async fetchBiConfig() {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get('/bi/pedidos-config', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const cfg = res?.data?.config
        if (cfg) {
          if (cfg.horario_probabilidade_sep != null)
            this.corteSep = parseInt(cfg.horario_probabilidade_sep, 10) || 14
          if (cfg.horario_probabilidade_cko != null)
            this.corteCko = parseInt(cfg.horario_probabilidade_cko, 10) || 16
        }
      } catch {
        // Silencia erro — usa valores default
      }
    },
    computeSlaStatus(p, tipo) {
      if (!p) return 'pendente'
      const now = new Date()
      if (tipo === 'sep') {
        const rawSep = p.separado || p.dt_conf_sep
        if (rawSep) {
          const sep = new Date(rawSep)
          const limite = p.limite ? new Date(p.limite) : null
          if (limite && sep > limite) return 'fora'
          return 'noPrazo'
        }
        return p.limite && now > new Date(p.limite) ? 'fora' : 'pendente'
      }
      const rawExp = p.expedido || p.dt_checkout || p.dt_embarque
      if (rawExp) {
        const emb = new Date(rawExp)
        const limite = p.limite ? new Date(p.limite) : null
        if (limite && emb > limite) return 'fora'
        return 'noPrazo'
      }
      return p.limite && now > new Date(p.limite) ? 'fora' : 'pendente'
    },

    // Calendário — paridade com BIPage.vue (+ preset "Ano atual" para SLA e rejeições)
    getHojeCalendario() {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      return d
    },
    toISOCalendario(d) {
      return d.toISOString().slice(0, 10)
    },
    formatarDataCalendario(iso) {
      if (!iso) return ''
      const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/)
      return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
    },
    isoToDDMMYYYY(v) {
      if (!v) return ''
      const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/)
      return m ? `${m[3]}/${m[2]}/${m[1]}` : v
    },
    parseDDMMYYYY(str) {
      if (!str || typeof str !== 'string') return ''
      const limpo = str.replace(/\D/g, '')
      if (limpo.length !== 8) return ''
      const dia = parseInt(limpo.slice(0, 2), 10)
      const mes = parseInt(limpo.slice(2, 4), 10) - 1
      const ano = parseInt(limpo.slice(4, 8), 10)
      if (
        ano < 1900 ||
        ano > 2100 ||
        mes < 0 ||
        mes > 11 ||
        dia < 1 ||
        dia > 31
      )
        return ''
      const d = new Date(ano, mes, dia)
      if (
        d.getDate() !== dia ||
        d.getMonth() !== mes ||
        d.getFullYear() !== ano
      )
        return ''
      return this.toISOCalendario(d)
    },
    formatarParaInputCalendario(val) {
      if (!val) return ''
      const nums = String(val).replace(/\D/g, '')
      if (nums.length <= 2) return nums
      if (nums.length <= 4) return `${nums.slice(0, 2)}/${nums.slice(2)}`
      return `${nums.slice(0, 2)}/${nums.slice(2, 4)}/${nums.slice(4, 8)}`
    },
    syncDataDisplayFromModel() {
      this.dataInicioDisplay = this.isoToDDMMYYYY(this.dataInicio)
      this.dataFimDisplay = this.isoToDDMMYYYY(this.dataFim)
    },
    onDataInicioInput(e) {
      const formatado = this.formatarParaInputCalendario(e.target.value)
      e.target.value = formatado
      this.dataInicioDisplay = formatado
      this.dataInicio = this.parseDDMMYYYY(formatado)
      this.presetAtivo = ''
    },
    onDataFimInput(e) {
      const formatado = this.formatarParaInputCalendario(e.target.value)
      e.target.value = formatado
      this.dataFimDisplay = formatado
      this.dataFim = this.parseDDMMYYYY(formatado)
      this.presetAtivo = ''
    },
    aplicarPresetCalendario(id) {
      this.presetAtivo = id
      const hoje = this.getHojeCalendario()
      let ini = ''
      let fim = ''
      switch (id) {
        case 'ano_atual':
          ini = `${hoje.getFullYear()}-01-01`
          fim = this.toISOCalendario(hoje)
          break
        case 'ontem': {
          const ontem = new Date(hoje)
          ontem.setDate(ontem.getDate() - 1)
          ini = fim = this.toISOCalendario(ontem)
          break
        }
        case 'hoje':
          ini = fim = this.toISOCalendario(hoje)
          break
        case 'esta_semana': {
          const dia = hoje.getDay()
          const seg = new Date(hoje)
          seg.setDate(hoje.getDate() - (dia === 0 ? 6 : dia - 1))
          fim = this.toISOCalendario(hoje)
          ini = this.toISOCalendario(seg)
          break
        }
        case 'semana_passada': {
          const dia = hoje.getDay()
          const segAtual = new Date(hoje)
          segAtual.setDate(hoje.getDate() - (dia === 0 ? 6 : dia - 1))
          const segPassada = new Date(segAtual)
          segPassada.setDate(segAtual.getDate() - 7)
          const domPassada = new Date(segPassada)
          domPassada.setDate(segPassada.getDate() + 6)
          ini = this.toISOCalendario(segPassada)
          fim = this.toISOCalendario(domPassada)
          break
        }
        case 'este_mes':
          ini = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
          fim = this.toISOCalendario(hoje)
          break
        case 'mes_passado': {
          const prim = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
          const ult = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
          ini = this.toISOCalendario(prim)
          fim = this.toISOCalendario(ult)
          break
        }
        default:
          return
      }
      this.dataInicio = ini
      this.dataFim = fim
      this.syncDataDisplayFromModel()
      this.mostrarCalendario = false
      this.loadAll()
    },
    aplicarIntervaloCalendario() {
      this.mostrarCalendario = false
      this.loadAll()
    },
    limparIntervaloCalendario() {
      const hoje = this.getHojeCalendario()
      this.dataInicio = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
      this.dataFim = this.toISOCalendario(
        new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
      )
      this.presetAtivo = 'este_mes'
      this.syncDataDisplayFromModel()
      this.mostrarCalendario = false
      this.loadAll()
    },
    irParaHojeCalendario() {
      this.dataInicio = this.toISOCalendario(this.getHojeCalendario())
      this.dataFim = this.toISOCalendario(this.getHojeCalendario())
      this.syncDataDisplayFromModel()
    },

    // Fullscreen
    async toggleFullscreen() {
      const el = this.$refs.biPageRef
      if (!el) return
      try {
        if (!document.fullscreenElement) {
          await el.requestFullscreen()
          this.isFullscreen = true
        } else {
          await document.exitFullscreen()
          this.isFullscreen = false
        }
      } catch (e) {
        console.warn('[BI ADM] Fullscreen:', e?.message || e)
        this.isFullscreen = false
      }
    },
    onFullscreenChange() {
      const fs = document.fullscreenElement
      const el = this.$refs.biPageRef
      this.isFullscreen = !!(fs && el && (fs === el || el.contains(fs)))
    },

    // ── Auto-scroll em fullscreen (3 slots com rotação) ──
    getAdmValidTabs(adm) {
      const tabs = []
      if ((adm.pedidos.producao || []).length > 0) tabs.push('producao')
      if (this.filtrarRisco(adm, 'sep').length > 0) tabs.push('alertaSep')
      if ((adm.pedidos.atrasados || []).length > 0) tabs.push('atrasados')
      if (this.filtrarRisco(adm, 'cko').length > 0) tabs.push('alertaCko')
      if ((adm.pedidos.rejeicao || []).length > 0) tabs.push('rejeicao')
      return tabs
    },

    initFsSlots() {
      const all = this.admListFiltered.map(a => a.nome)
      this.fsAdmQueue = all.slice(3)
      const slots = all.slice(0, 3)
      while (slots.length < 3) slots.push(null)
      this.fsSlots = slots
      this.fsDoneCount = {}
      for (const nome of this.fsSlots) {
        if (nome) this.fsDoneCount[nome] = 0
      }
    },

    rotateSlot(slotIdx) {
      if (this.fsAdmQueue.length === 0) {
        const allNames = this.admListFiltered.map(a => a.nome)
        const visible = this.fsSlots.filter(Boolean)
        this.fsAdmQueue = allNames.filter(n => !visible.includes(n))
        if (this.fsAdmQueue.length === 0) return
      }
      const oldName = this.fsSlots[slotIdx]
      const newName = this.fsAdmQueue.shift()
      if (oldName) this.fsAdmQueue.push(oldName)

      if (oldName)
        this.fsFlipping = Object.assign({}, this.fsFlipping, {
          [oldName]: 'out',
        })

      setTimeout(() => {
        this.$set
          ? this.$set(this.fsSlots, slotIdx, newName)
          : (this.fsSlots[slotIdx] = newName)
        this.fsSlots = [...this.fsSlots]
        if (newName) {
          this.fsDoneCount[newName] = 0
          delete this._scrollStates[oldName]
          this.fsFlipping = Object.assign({}, this.fsFlipping, {
            [newName]: 'in',
          })
        }
        if (oldName) {
          const f = Object.assign({}, this.fsFlipping)
          delete f[oldName]
          this.fsFlipping = f
        }

        setTimeout(() => {
          if (newName) {
            const f = Object.assign({}, this.fsFlipping)
            delete f[newName]
            this.fsFlipping = f
          }
        }, 600)
      }, 500)
    },

    startAutoScroll() {
      this.stopAutoScroll()
      this.initFsSlots()
      this._scrollStates = {}
      const SCROLL_PX_PER_TICK = 2
      const SCROLL_INTERVAL_MS = 40
      const PAUSE_AT_END_MS = 3000
      const STATIC_TAB_MS = 60000

      this._scrollMasterInterval = setInterval(() => {
        if (!this.isFullscreen) return
        for (let si = 0; si < 3; si++) {
          const nome = this.fsSlots[si]
          if (!nome) continue
          if (this.fsFlipping[nome]) continue
          const adm = this.admListFiltered.find(a => a.nome === nome)
          if (!adm) continue

          const freshTabs = this.getAdmValidTabs(adm)
          if (freshTabs.length === 0) {
            if (this.admListFiltered.length > 3) {
              this.rotateSlot(si)
              continue
            }
            continue
          }

          if (!this._scrollStates[nome]) {
            this.setDetailTab(nome, freshTabs[0])
            this._scrollStates[nome] = {
              validTabs: freshTabs,
              tabIdx: 0,
              phase: 'scrolling',
              pauseUntil: 0,
              cyclesDone: 0,
            }
          }
          const st = this._scrollStates[nome]
          st.validTabs = freshTabs
          if (st.tabIdx >= st.validTabs.length) st.tabIdx = 0
          const now = Date.now()

          if (st.phase === 'paused' && now < st.pauseUntil) continue
          if (st.phase === 'paused') {
            let nextTabIdx = st.tabIdx + 1
            if (nextTabIdx >= st.validTabs.length) {
              st.cyclesDone++
              if (this.admListFiltered.length > 3) {
                this.rotateSlot(si)
                continue
              }
              nextTabIdx = 0
            }
            st.tabIdx = nextTabIdx
            this.setDetailTab(nome, st.validTabs[st.tabIdx])
            st.phase = 'waitRender'
            st.pauseUntil = now + 150
            continue
          }
          if (st.phase === 'waitRender' && now < st.pauseUntil) continue
          if (st.phase === 'waitRender') {
            st.phase = 'scrolling'
          }

          const refKey = 'colBody_' + nome
          const bodyEl = this.$refs[refKey]
          const el = Array.isArray(bodyEl) ? bodyEl[0] : bodyEl
          if (!el) continue

          const wrap = el.querySelector('.adm-detail-table-wrap')
          if (!wrap) {
            if (st.validTabs.length <= 1) continue
            if (!st._staticStart) st._staticStart = now
            if (now - st._staticStart >= STATIC_TAB_MS) {
              st._staticStart = 0
              st.phase = 'paused'
              st.pauseUntil = now + 500
            }
            continue
          }

          const needsScroll = wrap.scrollHeight > wrap.clientHeight + 2
          if (!needsScroll) {
            if (!st._staticStart) st._staticStart = now
            if (now - st._staticStart >= STATIC_TAB_MS) {
              st._staticStart = 0
              st.phase = 'paused'
              st.pauseUntil = now + 500
            }
            continue
          }

          st._staticStart = 0
          const atBottom =
            wrap.scrollTop + wrap.clientHeight >= wrap.scrollHeight - 2
          if (atBottom) {
            st.phase = 'paused'
            st.pauseUntil = now + PAUSE_AT_END_MS
          } else {
            wrap.scrollTop += SCROLL_PX_PER_TICK
          }
        }
      }, SCROLL_INTERVAL_MS)
    },

    stopAutoScroll() {
      if (this._scrollMasterInterval) {
        clearInterval(this._scrollMasterInterval)
        this._scrollMasterInterval = null
      }
      this._scrollStates = {}
      this.fsSlots = [null, null, null]
      this.fsAdmQueue = []
    },

    limparFiltros() {
      this.filtroAdm = ''
      this.filtroArmazem = ''
      this.filtroSla = ''
      this.filtroDp = ''
      this.filtroNf = ''
      this.filtroPedido = ''
      this.filtroBusca = ''
    },

    formatDpNfDigitsToDisplay(digitStr) {
      const d = String(digitStr || '').replace(/\D/g, '')
      if (!d) return ''
      const n = parseInt(d, 10)
      if (!Number.isFinite(n)) return d
      if (n <= 999) return String(n)
      return n.toLocaleString('pt-BR')
    },
    onFiltroDpInput(e) {
      const digits = String(e.target.value || '').replace(/\D/g, '')
      this.filtroDp = this.formatDpNfDigitsToDisplay(digits)
    },
    onFiltroNfInput(e) {
      const digits = String(e.target.value || '').replace(/\D/g, '')
      this.filtroNf = this.formatDpNfDigitsToDisplay(digits)
    },
    fieldMatchesDoc(value, needle) {
      const n = String(needle || '').trim()
      if (!n) return true
      const v = String(value ?? '').trim()
      const nl = n.toLowerCase()
      const vl = v.toLowerCase()
      if (vl.includes(nl)) return true
      const vd = vl.replace(/\D/g, '')
      const nd = nl.replace(/\D/g, '')
      return nd.length > 0 && vd.includes(nd)
    },
    pedidoRowMatchesDoc(p) {
      const dp = String(this.filtroDp || '').trim()
      const nf = String(this.filtroNf || '').trim()
      const ped = String(this.filtroPedido || '').trim()
      if (!dp && !nf && !ped) return true
      const pDp = p.dp ?? p.DP ?? p.no_dp ?? ''
      const pNf = p.numero_nf ?? p.NF ?? p.no_nf ?? ''
      const pPed = p.numero_pedido ?? p.PEDIDO ?? p.no_ped_cli ?? ''
      if (dp && !this.fieldMatchesDoc(pDp, dp)) return false
      if (nf && !this.fieldMatchesDoc(pNf, nf)) return false
      if (ped && !this.fieldMatchesDoc(pPed, ped)) return false
      return true
    },
    extractPedidoKeyFromSlaRow(p) {
      return String(
        p.numero_pedido ?? p.PEDIDO ?? p.no_ped_cli ?? p.pedido ?? ''
      ).trim()
    },
    buildAllowedPedidosFromSlaDoc() {
      const allowed = new Set()
      for (const p of this.slaPedidosBaseFiltered) {
        if (!this.pedidoRowMatchesDoc(p)) continue
        const key = this.extractPedidoKeyFromSlaRow(p)
        if (key) allowed.add(key)
      }
      return allowed
    },
    rejeicaoRowMatchesPedidoSet(r, allowed) {
      const rp = String(r.pedido || '').trim()
      if (!rp) return false
      if (allowed.has(rp)) return true
      const rd = rp.replace(/\D/g, '')
      if (!rd) return false
      for (const x of allowed) {
        if (String(x).replace(/\D/g, '') === rd) return true
      }
      return false
    },
    foldTextoBusca(s) {
      return String(s ?? '')
        .normalize('NFKC')
        .toLocaleLowerCase('pt-BR')
        .trim()
    },
    admColunaPertenceAoUsuarioLogado(admNome) {
      if (!this.user) return false
      const col = this.foldTextoBusca(admNome || '').replace(/\s+/g, ' ')
      if (!col || col === '(sem adm)') return false
      const login = this.foldTextoBusca(this.user.user || '').replace(
        /\s+/g,
        ' '
      )
      const nomeCompleto = this.foldTextoBusca(this.user.name || '').replace(
        /\s+/g,
        ' '
      )
      const primeiroNome = nomeCompleto.split(/\s+/).filter(Boolean)[0] || ''
      if (col === login || col === nomeCompleto) return true
      if (primeiroNome && col === primeiroNome) return true
      if (col.length >= 2 && nomeCompleto.startsWith(`${col} `)) return true
      return false
    },
    clienteRowMatchesBusca(c, qFold, qDigits) {
      const id = this.foldTextoBusca(c.id ?? '')
      const nome = this.foldTextoBusca(c.nome ?? '')
      if (qFold && (id.includes(qFold) || nome.includes(qFold))) return true
      if (qDigits && qDigits.length > 0) {
        const idD = id.replace(/\D/g, '')
        const nomeD = nome.replace(/\D/g, '')
        if (idD.includes(qDigits) || nomeD.includes(qDigits)) return true
      }
      return false
    },
    sliceAdmByClienteBusca(adm) {
      const q = String(this.filtroBusca || '').trim()
      if (!q) return adm
      const qFold = this.foldTextoBusca(q)
      const qDigits = q.replace(/\D/g, '')
      const matchC = c => this.clienteRowMatchesBusca(c, qFold, qDigits)
      const matchP = p =>
        this.clienteRowMatchesBusca(
          { id: p.idCliente ?? p.id_cliente ?? '', nome: p.cliente ?? '' },
          qFold,
          qDigits
        )

      const slaClientes = adm.sla.clientes.filter(matchC)
      const rejClientes = adm.rejeicao.clientesList.filter(matchC)
      const slaTotals = slaClientes.reduce(
        (acc, c) => ({
          total: acc.total + c.total,
          noPrazo: acc.noPrazo + c.noPrazo,
          foraPrazo: acc.foraPrazo + c.fora,
          pendente: acc.pendente + c.pendente,
        }),
        { total: 0, noPrazo: 0, foraPrazo: 0, pendente: 0 }
      )
      const rejTotals = rejClientes.reduce(
        (acc, c) => ({
          total: acc.total + c.total,
          emRejeicao: acc.emRejeicao + c.emRejeicao,
          integrados: acc.integrados + c.integrados,
        }),
        { total: 0, emRejeicao: 0, integrados: 0 }
      )
      const ids = new Set([
        ...slaClientes.map(c => c.id),
        ...rejClientes.map(c => c.id),
      ])
      const producao = adm.pedidos.producao.filter(matchP)
      const risco = adm.pedidos.risco.filter(matchP)
      const atrasados = adm.pedidos.atrasados.filter(matchP)
      const rejeicao = adm.pedidos.rejeicao.filter(p =>
        matchC({ id: p.idCliente, nome: p.cliente })
      )

      return {
        ...adm,
        totalClientes: ids.size,
        sla: { ...slaTotals, clientes: slaClientes },
        rejeicao: {
          ...rejTotals,
          clientes: new Set(rejClientes.map(c => c.id)).size,
          clientesList: rejClientes,
        },
        alertas: {
          expFora: atrasados.length,
          alertaSep: risco.filter(x => x.tipoAlerta === 'sep').length,
          alertaCko: risco.filter(x => x.tipoAlerta === 'cko').length,
        },
        pedidos: {
          producao,
          risco,
          atrasados,
          rejeicao,
        },
      }
    },

    // Dropdowns
    onDocClick(e) {
      if (
        this.mostrarCalendario &&
        this.$refs.calendarioRef &&
        !this.$refs.calendarioRef.contains(e.target)
      ) {
        this.mostrarCalendario = false
      }
      if (
        this.mostrarFiltros &&
        this.$refs.filtrosRef &&
        !this.$refs.filtrosRef.contains(e.target)
      ) {
        this.mostrarFiltros = false
      }
    },

    isMesmoDia(d1, d2) {
      if (!d1 || !d2) return false
      const a = new Date(d1),
        b = new Date(d2)
      return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
      )
    },
    setDetailTab(admNome, tabId) {
      this.activeDetailTabs = Object.assign({}, this.activeDetailTabs, {
        [admNome]: tabId,
      })
    },
    getTabCount(adm, tabId) {
      return (adm.pedidos[tabId] || []).length
    },
    filtrarRisco(adm, tipo) {
      return (adm.pedidos.risco || []).filter(p => p.tipoAlerta === tipo)
    },
    fmtData(d) {
      if (!d) return '-'
      const dt = new Date(d)
      if (isNaN(dt.getTime())) return '-'
      return dt.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      })
    },
    computeStatusSeparacaoAdm(p) {
      const agora = new Date()
      const inicioSla = p.inicio_sla ? new Date(p.inicio_sla) : null
      const separado =
        p.separado || p.dt_conf_sep
          ? new Date(p.separado || p.dt_conf_sep)
          : null
      const corteMin = this.parseCorteMinutes(p.corte)
      if (!inicioSla || isNaN(inicioSla.getTime())) {
        return separado ? 'No Prazo' : 'Pend / No Prazo'
      }
      if (!separado) {
        const hoje = new Date(
          agora.getFullYear(),
          agora.getMonth(),
          agora.getDate()
        )
        const diaInicio = new Date(
          inicioSla.getFullYear(),
          inicioSla.getMonth(),
          inicioSla.getDate()
        )
        const horaAtualMin = agora.getHours() * 60 + agora.getMinutes()
        if (hoje < diaInicio) return 'Pend / No Prazo'
        if (hoje > diaInicio) return 'Pend / Fora do Prazo'
        return horaAtualMin < corteMin
          ? 'Pend / No Prazo'
          : 'Pend / Fora do Prazo'
      }
      const diaSep = new Date(
        separado.getFullYear(),
        separado.getMonth(),
        separado.getDate()
      )
      const diaInicio = new Date(
        inicioSla.getFullYear(),
        inicioSla.getMonth(),
        inicioSla.getDate()
      )
      return diaSep <= diaInicio ? 'No Prazo' : 'Fora do Prazo'
    },
    computeStatusExpedicaoAdm(p) {
      const agora = new Date()
      const limite = p.limite ? new Date(p.limite) : null
      const expedido =
        p.expedido || p.dt_checkout || p.dt_embarque
          ? new Date(p.expedido || p.dt_checkout || p.dt_embarque)
          : null
      if (!limite || isNaN(limite.getTime())) {
        return expedido ? 'No Prazo' : 'Pend / No Prazo'
      }
      if (!expedido) {
        const fimLimite = new Date(
          limite.getFullYear(),
          limite.getMonth(),
          limite.getDate(),
          23,
          59,
          59
        )
        return agora <= fimLimite ? 'Pend / No Prazo' : 'Pend / Fora do Prazo'
      }
      const diaExp = new Date(
        expedido.getFullYear(),
        expedido.getMonth(),
        expedido.getDate()
      )
      const diaLimite = new Date(
        limite.getFullYear(),
        limite.getMonth(),
        limite.getDate()
      )
      return diaExp <= diaLimite ? 'No Prazo' : 'Fora do Prazo'
    },
    parseCorteMinutes(corte) {
      if (corte == null) return 23 * 60 + 59
      let str = corte
      if (typeof corte === 'object') {
        if (corte.hours != null)
          return (corte.hours || 0) * 60 + (corte.minutes || 0)
        if (corte.toISOString) str = corte.toTimeString().slice(0, 5)
        else str = '23:59'
      }
      const [h = 23, m = 59] = String(str)
        .trim()
        .split(':')
        .map(x => parseInt(x, 10) || 0)
      return h * 60 + m
    },
    statusCellStyle(status) {
      const map = {
        'No Prazo': {
          backgroundColor: '#76FA65',
          color: '#0d0d0d',
          fontWeight: 600,
        },
        'Pend / No Prazo': {
          backgroundColor: '#E57373',
          color: '#0d0d0d',
          fontWeight: 600,
        },
        'Pend / Fora do Prazo': {
          backgroundColor: '#FF0000',
          color: '#ffffff',
          fontWeight: 600,
        },
        'Fora do Prazo': {
          backgroundColor: '#FF0000',
          color: '#ffffff',
          fontWeight: 600,
        },
      }
      return map[status] || {}
    },
    toggleTheme() {
      this.biTheme = this.biTheme === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem('bi-theme', this.biTheme)
      } catch {}
    },
    pct(val, total) {
      if (!total || total === 0) return '0%'
      return Math.max(2, (val / total) * 100).toFixed(1) + '%'
    },
    fmtNum(n) {
      if (n == null) return '0'
      return Number(n).toLocaleString('pt-BR')
    },
    truncar(texto, max) {
      if (!texto) return ''
      return texto.length > max ? texto.slice(0, max) + '…' : texto
    },
    abrevStatus(s) {
      if (!s) return ''
      const map = {
        'No Prazo': 'OK',
        'Pendente / No Prazo': 'Pend.',
        'Pendente / Fora do Prazo': 'Pend.F',
        'Fora do Prazo': 'Fora',
      }
      return map[s] || s
    },
  },
}
</script>

<style scoped>
.bi-adm-page {
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  flex: 1 1 auto;
  min-height: min(100%, calc(100vh - 88px));
  background: #202326;
  color: #ffffff;
  padding: 1.5rem;
  box-sizing: border-box;
  font-family: inherit;
  display: flex;
  flex-direction: column;
}
.bi-adm-page.bi-fullscreen {
  min-height: 100vh;
  height: 100vh;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.bi-fullscreen .adm-columns {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  gap: 0.5rem;
}
.bi-fullscreen .adm-col {
  max-height: 100%;
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  width: 0;
}
.bi-fullscreen .adm-columns--single-fill .adm-col {
  flex: 1 1 auto;
  width: 100%;
  max-width: 100%;
}
.bi-fullscreen .adm-col-body {
  overflow: hidden;
}
.bi-fullscreen .adm-detail-table-wrap {
  overflow-y: auto;
  overflow-x: hidden;
}
.bi-fullscreen .adm-detail-table {
  table-layout: fixed;
  width: 100%;
}
.bi-fullscreen .adm-col-header {
  padding: 0.8rem 1rem;
  gap: 0.85rem;
}
.bi-fullscreen .adm-stat {
  padding: 0.6rem 0.4rem;
}
.bi-fullscreen .adm-card-stats {
  gap: 6px;
  padding: 0 0.85rem 0.7rem;
}
.bi-fullscreen .adm-detail-table {
  font-size: 1.6rem;
}
.bi-fullscreen .adm-detail-table th {
  padding: 0.55rem 0.6rem;
  font-size: 1.4rem;
  white-space: nowrap;
}
.bi-fullscreen .adm-detail-table td {
  padding: 0.5rem 0.6rem;
  font-size: 1.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 0;
}
.bi-fullscreen .adm-detail-table td.td-status {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 1.3rem;
}
.bi-fullscreen .bi-header-title {
  font-size: clamp(26px, 2.8vw, 36px);
}
.bi-fullscreen .adm-summary-cards {
  gap: 1rem;
  margin-bottom: 0.75rem;
}
.bi-fullscreen .adm-summary-card {
  padding: 1rem 1.3rem;
}
.bi-fullscreen .adm-summary-icon {
  width: 56px;
  height: 56px;
  font-size: 1.7rem;
}
.bi-fullscreen .adm-summary-valor {
  font-size: 2.8rem;
}
.bi-fullscreen .adm-summary-label {
  font-size: 1.15rem;
}
.bi-fullscreen .bi-toolbar {
  margin-bottom: 0.5rem;
}
.bi-fullscreen .bi-tab-label {
  font-size: 1.4rem;
}
.bi-fullscreen .adm-stat-val {
  font-size: 2.8rem;
}
.bi-fullscreen .adm-stat-lbl {
  font-size: 1rem;
}
.bi-fullscreen .adm-card-nome {
  font-size: 2rem;
}
.bi-fullscreen .adm-card-clientes {
  font-size: 1.2rem;
}
.bi-fullscreen .adm-card-avatar {
  width: 56px;
  height: 56px;
  font-size: 1.6rem;
}

/* ─── Loading ─── */
.bi-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(32, 35, 38, 0.92);
  border-radius: 12px;
}
.bi-loading-canvas {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem 3rem;
  background: #272a2f;
  border: 1px solid #56595e;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.bi-loading-icon {
  font-size: 3rem;
  color: #00ffaa;
}
.bi-loading-message {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 500;
  color: #e0e0e0;
  text-align: center;
  max-width: 420px;
  line-height: 1.5;
}

/* ─── Header / Toolbar ─── */
.bi-header {
  margin-bottom: 0.5rem;
}
.bi-header-title {
  font-size: clamp(22px, 2.4vw, 30px);
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #ffffff;
  margin: 0;
}
.bi-header-title-wrap {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.bi-refresh-btn.bi-refresh-spinning i {
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
.bi-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.bi-tabs {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.bi-tab-label {
  font-size: 1.2rem;
  font-weight: 600;
  color: #8b8e94;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.bi-toolbar-right {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}
.bi-toolbar-right .bi-calendario-wrap,
.bi-toolbar-right .bi-filtros-wrap {
  display: inline-flex;
  align-items: center;
  align-self: center;
}

/* Botões toolbar */
.theme-toggle-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #56595e;
  background: #272a2f;
  color: #00ffaa;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.15s;
}
.theme-toggle-btn:hover:not(:disabled) {
  background: #00ffaa;
  color: #1a1a1a;
}
.theme-toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Calendário (layout BIPage; sem padding inferior — no ADM não há texto sob o botão) */
.bi-calendario-wrap {
  position: relative;
  width: fit-content;
}
.btn-abrir-calendario-bi {
  height: 40px;
  min-height: 40px;
  padding: 0 1rem;
  box-sizing: border-box;
  background: #272a2f;
  border: 1px solid #56595e;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #e2e4e8;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}
.btn-abrir-calendario-bi:hover {
  background: #32363b;
  border-color: #00ffaa;
  color: #00ffaa;
}
.calendario-dropdown-bi {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: #272a2f;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  border: 1px solid #56595e;
  z-index: 1000;
  min-width: 520px;
}
.calendario-layout-bi {
  display: flex;
  padding: 1rem;
  gap: 1.5rem;
}
.calendario-presets-bi {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 180px;
  padding-right: 1rem;
  border-right: 1px solid #56595e;
}
.preset-btn-bi {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 0.9rem;
  color: #e2e4e8;
  cursor: pointer;
  transition: background 0.2s;
}
.preset-btn-bi:hover {
  background: #32363b;
}
.preset-btn-bi.active {
  background: #00ffaa;
  color: #202326;
  font-weight: 500;
}
.calendario-custom-bi {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.calendario-buttons-bi {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.btn-cal-bi {
  padding: 0.4rem 0.75rem;
  border: 1px solid #56595e;
  border-radius: 6px;
  background: #202326;
  font-size: 0.85rem;
  color: #8b8e94;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cal-bi:hover {
  border-color: #00ffaa;
  color: #00ffaa;
}
.btn-cal-bi.btn-aplicar-bi {
  background: #00ffaa;
  border-color: #00ffaa;
  color: #202326;
}
.btn-cal-bi.btn-aplicar-bi:hover {
  background: #00e695;
  border-color: #00e695;
}
.calendario-inputs-bi {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}
.input-data-wrap-bi {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #56595e;
  border-radius: 8px;
  background: #202326;
}
.input-data-wrap-bi:focus-within {
  border-color: #00ffaa;
  box-shadow: 0 0 0 2px rgba(0, 255, 170, 0.15);
}
.input-data-wrap-bi i {
  color: #8b8e94;
  font-size: 0.9rem;
}
.input-data-wrap-bi input {
  background: transparent;
  border: none;
  color: #e2e4e8;
  font-size: 0.9rem;
  outline: none;
  min-width: 100px;
}
.input-data-wrap-bi input::placeholder {
  color: #56595e;
}

.bi-filtros-wrap {
  position: relative;
}
.filter-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #56595e;
  background: #272a2f;
  color: #8b8e94;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.15s;
}
.filter-btn:hover,
.filter-btn.active {
  border-color: #00ffaa;
  color: #00ffaa;
}
.filter-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  background: var(--primary, #0077ff);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.filtros-dropdown-bi {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 200;
  margin-top: 6px;
  background: #272a2f;
  border: 1px solid #56595e;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  padding: 0.75rem;
  min-width: 340px;
}
.filtros-header-bi {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #56595e;
  font-weight: 600;
  font-size: 0.95rem;
}
.btn-limpar-filtros-bi {
  border: 1px solid #56595e;
  background: transparent;
  border-radius: 6px;
  padding: 0.35rem 0.6rem;
  color: #8b8e94;
  font-size: 0.8rem;
  cursor: pointer;
  text-decoration: underline;
}
.filtros-grid-bi {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.filtro-campo-bi label {
  display: block;
  font-size: 0.75rem;
  color: #8b8e94;
  margin-bottom: 0.25rem;
}
.filtro-campo-bi label i {
  margin-right: 0.3rem;
}
.filtro-select-bi {
  width: 100%;
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  border: 1px solid #56595e;
  background: #202326;
  color: #e2e4e8;
  font-size: 0.9rem;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s;
}
.filtro-select-bi:focus {
  border-color: var(--primary, #0077ff);
}

.adm-active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
  align-items: center;
}
.adm-filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
  background: rgba(0, 119, 255, 0.15);
  color: #4da6ff;
  font-size: 0.85rem;
  font-weight: 500;
}
.adm-filter-tag-close {
  border: none;
  background: none;
  color: #4da6ff;
  font-size: 1.1rem;
  cursor: pointer;
  line-height: 1;
  padding: 0 0.1rem;
  opacity: 0.7;
}
.adm-filter-tag-close:hover {
  opacity: 1;
}
.adm-filter-clear-all {
  border: none;
  background: none;
  color: #8b8e94;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0.2rem 0.4rem;
}

/* ─── Summary Cards ─── */
.adm-summary-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.adm-summary-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem 1.1rem;
  background: #272a2f;
  border: 1px solid #3a3d42;
  border-radius: 10px;
  transition: border-color 0.2s;
  flex: 1 1 0;
  min-width: 160px;
}
.adm-summary-card:hover {
  border-color: #56595e;
}
.adm-summary-icon {
  width: 46px;
  height: 46px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  background: rgba(0, 255, 170, 0.12);
  color: #00ffaa;
  flex-shrink: 0;
}
.adm-summary-icon--sla {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}
.adm-summary-icon--exp {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}
.adm-summary-icon--alerta-sep {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}
.adm-summary-icon--rej {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}
.adm-summary-icon--cli {
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}
.adm-summary-body {
  display: flex;
  flex-direction: column;
}
.adm-summary-valor {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.2;
}
.adm-summary-label {
  font-size: 0.85rem;
  color: #8b8e94;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

/* ─── Error / Empty ─── */
.adm-error {
  padding: 1rem;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: #f87171;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}
.adm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #8b8e94;
  text-align: center;
}
.adm-empty i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #56595e;
}
.adm-empty h3 {
  margin: 0 0 0.5rem;
  color: #e0e0e0;
}
.adm-empty p {
  margin: 0;
  font-size: 0.9rem;
}

/* ─── ADM Columns ─── */
.adm-columns {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  overflow-y: hidden;
  flex: 1;
  min-height: 0;
  padding-bottom: 0.5rem;
}
.adm-columns--single-fill {
  overflow-x: hidden;
}
.adm-columns--single-fill .adm-col {
  flex: 1 1 auto;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}
.adm-col {
  flex: 0 0 auto;
  min-width: 420px;
  background: #272a2f;
  border: 1px solid #3a3d42;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  transition:
    background-color 0.5s,
    border-color 0.3s,
    box-shadow 0.3s;
}
.adm-col:hover {
  border-color: #56595e;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}
.adm-col--producao {
  background: rgba(39, 42, 47, 1);
  border-color: #3a3d42;
}
.adm-col--alertaSep {
  background: rgba(180, 83, 9, 0.15);
  border-color: rgba(251, 191, 36, 0.4);
}
.adm-col--atrasados {
  background: rgba(220, 38, 38, 0.15);
  border-color: rgba(248, 113, 113, 0.4);
}
.adm-col--alertaCko {
  background: rgba(124, 58, 237, 0.15);
  border-color: rgba(192, 132, 252, 0.4);
}
.adm-col--rejeicao {
  background: rgba(234, 88, 12, 0.15);
  border-color: rgba(251, 146, 60, 0.4);
}

/* ─── Flip animation on ADM rotation ─── */
@keyframes admFlipOut {
  0% {
    transform: perspective(1200px) rotateY(0deg);
    opacity: 1;
  }
  100% {
    transform: perspective(1200px) rotateY(90deg);
    opacity: 0;
  }
}
@keyframes admFlipIn {
  0% {
    transform: perspective(1200px) rotateY(-90deg);
    opacity: 0;
  }
  100% {
    transform: perspective(1200px) rotateY(0deg);
    opacity: 1;
  }
}
.adm-col--flip-out {
  animation: admFlipOut 0.5s ease-in forwards;
}
.adm-col--flip-in {
  animation: admFlipIn 0.6s ease-out forwards;
}

.adm-col-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  border-bottom: 1px solid #3a3d42;
}
.adm-card-avatar {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 119, 255, 0.15);
  color: #4da6ff;
  font-size: 1.25rem;
  flex-shrink: 0;
}
.adm-card-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.adm-card-nome {
  font-size: 1.2rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.adm-card-clientes {
  font-size: 0.9rem;
  color: #8b8e94;
}

/* ─── Stats compactos ─── */
.adm-card-stats {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 2px;
  padding: 0 0.4rem 0.4rem;
  margin: 0;
}
.adm-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.3rem 0.15rem;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.03);
  transition:
    background 0.2s,
    box-shadow 0.2s,
    transform 0.15s;
}
.adm-stat--clickable {
  cursor: pointer;
}
.adm-stat--clickable:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}
.adm-stat--selected {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: -2px;
}
.adm-stat-val {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
}
.adm-stat-lbl {
  font-size: 0.72rem;
  color: #8b8e94;
  text-align: center;
  margin-top: 0.1rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  line-height: 1.1;
}
.adm-stat--total .adm-stat-val {
  color: #94a3b8;
}
.adm-stat--total {
  cursor: default;
}
.adm-stat--yellow .adm-stat-val {
  color: #fbbf24;
}
.adm-stat--red .adm-stat-val {
  color: #f87171;
}
.adm-stat--purple .adm-stat-val {
  color: #c084fc;
}
.adm-stat--orange .adm-stat-val {
  color: #fb923c;
}
.adm-stat--active {
  background: rgba(255, 255, 255, 0.06);
}
.adm-stat--selected:not(.adm-stat--active) {
  background: rgba(255, 255, 255, 0.08);
  outline: 2px solid rgba(96, 165, 250, 0.6);
}
.adm-stat--yellow.adm-stat--active {
  background: #b45309;
  color: #fff;
}
.adm-stat--yellow.adm-stat--active .adm-stat-val {
  color: #fff;
}
.adm-stat--yellow.adm-stat--active .adm-stat-lbl {
  color: rgba(255, 255, 255, 0.85);
}
.adm-stat--red.adm-stat--active {
  background: #dc2626;
  color: #fff;
}
.adm-stat--red.adm-stat--active .adm-stat-val {
  color: #fff;
}
.adm-stat--red.adm-stat--active .adm-stat-lbl {
  color: rgba(255, 255, 255, 0.85);
}
.adm-stat--purple.adm-stat--active {
  background: #7c3aed;
  color: #fff;
}
.adm-stat--purple.adm-stat--active .adm-stat-val {
  color: #fff;
}
.adm-stat--purple.adm-stat--active .adm-stat-lbl {
  color: rgba(255, 255, 255, 0.85);
}
.adm-stat--orange.adm-stat--active {
  background: #ea580c;
  color: #fff;
}
.adm-stat--orange.adm-stat--active .adm-stat-val {
  color: #fff;
}
.adm-stat--orange.adm-stat--active .adm-stat-lbl {
  color: rgba(255, 255, 255, 0.85);
}

/* ─── Barra SLA compacta ─── */
.adm-card-bar {
  padding: 0 0.75rem 0.6rem;
}
.adm-sla-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: #1a1c1f;
}
.adm-sla-bar-seg {
  min-width: 2px;
  transition: width 0.3s ease;
}
.adm-sla-bar--green {
  background: #4ade80;
}
.adm-sla-bar--yellow {
  background: #fbbf24;
}
.adm-sla-bar--red {
  background: #f87171;
}
.adm-sla-bar--orange {
  background: #fb923c;
}
.adm-sla-bar--blue {
  background: #60a5fa;
}

/* ─── Column body ─── */
.adm-col-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0 0.3rem 0.3rem;
  display: flex;
  flex-direction: column;
}
.adm-col-body > div {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.adm-detail-tabs {
  display: flex;
  gap: 2px;
  padding: 0.5rem 0.5rem 0;
  flex-wrap: nowrap;
}
.adm-detail-tab {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.5rem 0.5rem;
  min-height: 38px;
  box-sizing: border-box;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid #3a3d42;
  background: transparent;
  color: #8b8e94;
  transition: all 0.2s;
  white-space: nowrap;
}
.adm-detail-tab:hover {
  border-color: #56595e;
  color: #c1c4c9;
}
.adm-detail-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.06);
  color: inherit;
}
.adm-detail-tab--producao.active {
  background: rgba(96, 165, 250, 0.12);
  border-color: #60a5fa;
  color: #60a5fa;
}
.adm-detail-tab--producao.active .adm-detail-tab-count {
  background: rgba(96, 165, 250, 0.2);
}
.adm-detail-tab--risco.active {
  background: rgba(251, 191, 36, 0.12);
  border-color: #fbbf24;
  color: #fbbf24;
}
.adm-detail-tab--risco.active .adm-detail-tab-count {
  background: rgba(251, 191, 36, 0.2);
}
.adm-detail-tab--atrasados.active {
  background: rgba(239, 68, 68, 0.12);
  border-color: #f87171;
  color: #f87171;
}
.adm-detail-tab--atrasados.active .adm-detail-tab-count {
  background: rgba(239, 68, 68, 0.2);
}
.adm-detail-tab--rejeicao.active {
  background: rgba(251, 146, 60, 0.12);
  border-color: #fb923c;
  color: #fb923c;
}
.adm-detail-tab--rejeicao.active .adm-detail-tab-count {
  background: rgba(251, 146, 60, 0.2);
}

.adm-detail-empty {
  text-align: center;
  padding: 1.5rem 1rem;
  color: #56595e;
  font-size: 0.95rem;
}

/* Tipo alerta tag */
.adm-tipo-alerta {
  display: inline-block;
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  white-space: nowrap;
}
.adm-tipo-alerta--sep {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}
.adm-tipo-alerta--cko {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
}

/* ─── Tabela de detalhes ─── */
.adm-detail-table-wrap {
  overflow-y: auto;
  border-radius: 8px;
  border: 1px solid #3a3d42;
  flex: 1;
  min-height: 0;
}
.adm-detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 1rem;
}
.adm-detail-table th {
  position: sticky;
  top: 0;
  background: #202326;
  color: #8b8e94;
  font-weight: 600;
  text-align: left;
  padding: 0.4rem 0.5rem;
  font-size: 0.95rem;
  border-bottom: 1px solid #32363b;
  white-space: nowrap;
  z-index: 1;
}
.adm-detail-table td {
  padding: 0.3rem 0.5rem;
  border-bottom: 1px solid #32363b;
  white-space: nowrap;
}
.adm-detail-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}
.td-green {
  color: #4ade80;
  font-weight: 600;
}
.td-red {
  color: #f87171;
  font-weight: 600;
}
.td-orange {
  color: #fb923c;
  font-weight: 600;
}
.td-blue {
  color: #60a5fa;
  font-weight: 600;
}

.adm-footer {
  margin-top: 1.5rem;
  padding: 0.75rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  font-size: 0.875rem;
  color: #56595e;
  border-top: 1px solid #3a3d42;
}
.adm-footer-update {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.adm-footer-countdown {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: #00ffaa;
  font-variant-numeric: tabular-nums;
}

/* ─── Light Theme ─── */
.bi-adm-page.bi-theme-light {
  background: #f0f4f8;
  color: #1a1a1a;
}
.bi-theme-light .bi-header-title {
  color: #1a1a1a;
}
.bi-theme-light .bi-tab-label {
  color: #5a6c7d;
}
.bi-theme-light .bi-loading-overlay {
  background: rgba(240, 244, 248, 0.92);
}
.bi-theme-light .bi-loading-canvas {
  background: #ffffff;
  border-color: #c5d9f0;
  box-shadow: 0 8px 32px rgba(0, 119, 255, 0.1);
}
.bi-theme-light .bi-loading-icon {
  color: var(--primary, #0077ff);
}
.bi-theme-light .bi-loading-message {
  color: #1a1a1a;
}
.bi-theme-light .theme-toggle-btn {
  background: #ffffff;
  border-color: #c5d9f0;
  color: var(--primary, #0077ff);
}
.bi-theme-light .theme-toggle-btn:hover:not(:disabled) {
  background: var(--primary, #0077ff);
  color: #ffffff;
}
.bi-theme-light .btn-abrir-calendario-bi {
  background: #ffffff;
  border-color: #c5d9f0;
  color: #1a1a1a;
}
.bi-theme-light .btn-abrir-calendario-bi:hover {
  background: #e6f2ff;
  border-color: var(--primary, #0077ff);
  color: var(--primary, #0077ff);
}
.bi-theme-light .calendario-dropdown-bi {
  background: #ffffff;
  border-color: #c5d9f0;
  box-shadow: 0 8px 24px rgba(0, 119, 255, 0.12);
}
.bi-theme-light .calendario-presets-bi {
  border-right-color: #c5d9f0;
}
.bi-theme-light .calendario-presets-bi .preset-btn-bi {
  background: #f8fbff;
  color: #5a6c7d;
}
.bi-theme-light .calendario-presets-bi .preset-btn-bi:hover,
.bi-theme-light .calendario-presets-bi .preset-btn-bi.active {
  background: var(--primary, #0077ff);
  color: #ffffff;
}
.bi-theme-light .calendario-layout-bi,
.bi-theme-light .calendario-custom-bi .btn-cal-bi {
  background: #f8fbff;
  border-color: #c5d9f0;
  color: #1a1a1a;
}
.bi-theme-light .calendario-custom-bi .btn-cal-bi:hover {
  background: #e6f2ff;
  border-color: var(--primary, #0077ff);
  color: var(--primary, #0077ff);
}
.bi-theme-light .calendario-custom-bi .btn-aplicar-bi {
  background: var(--primary, #0077ff);
  border-color: var(--primary, #0077ff);
  color: #ffffff;
}
.bi-theme-light .input-data-wrap-bi {
  background: #f8fbff;
  border-color: #c5d9f0;
}
.bi-theme-light .input-data-wrap-bi input {
  color: #1a1a1a;
}
.bi-theme-light .input-data-wrap-bi input::placeholder {
  color: #8ba3c4;
}
.bi-theme-light .input-data-wrap-bi i {
  color: #5a6c7d;
}
.bi-theme-light .filter-btn {
  background: #ffffff;
  border-color: #c5d9f0;
  color: #5a6c7d;
}
.bi-theme-light .filter-btn:hover,
.bi-theme-light .filter-btn.active {
  border-color: var(--primary, #0077ff);
  color: var(--primary, #0077ff);
}
.bi-theme-light .filtros-dropdown-bi {
  background: #ffffff;
  border-color: #c5d9f0;
  box-shadow: 0 8px 24px rgba(0, 119, 255, 0.12);
}
.bi-theme-light .filtro-select-bi {
  background: #f8fbff;
  border-color: #c5d9f0;
  color: #1a1a1a;
}
.bi-theme-light .filtro-select-bi:focus {
  border-color: var(--primary, #0077ff);
}
.bi-theme-light .filtro-campo-bi label {
  color: #5a6c7d;
}
.bi-theme-light .adm-filter-tag {
  background: rgba(0, 119, 255, 0.08);
  color: var(--primary, #0077ff);
}
.bi-theme-light .adm-filter-tag-close {
  color: var(--primary, #0077ff);
}
.bi-theme-light .adm-summary-card {
  background: #ffffff;
  border-color: #c5d9f0;
}
.bi-theme-light .adm-summary-label {
  color: #5a6c7d;
}
.bi-theme-light .adm-col {
  background: #ffffff;
  border-color: #c5d9f0;
}
.bi-theme-light .adm-col:hover {
  border-color: #93b8e0;
  box-shadow: 0 4px 20px rgba(0, 119, 255, 0.08);
}
.bi-theme-light .adm-col--producao {
  background: #ffffff;
}
.bi-theme-light .adm-col--alertaSep {
  background: rgba(245, 158, 11, 0.08);
  border-color: rgba(245, 158, 11, 0.3);
}
.bi-theme-light .adm-col--atrasados {
  background: rgba(220, 38, 38, 0.08);
  border-color: rgba(220, 38, 38, 0.3);
}
.bi-theme-light .adm-col--alertaCko {
  background: rgba(124, 58, 237, 0.08);
  border-color: rgba(124, 58, 237, 0.3);
}
.bi-theme-light .adm-col--rejeicao {
  background: rgba(234, 88, 12, 0.08);
  border-color: rgba(234, 88, 12, 0.3);
}
.bi-theme-light .adm-col-header {
  border-bottom-color: #c5d9f0;
}
.bi-theme-light .adm-card-clientes {
  color: #5a6c7d;
}
.bi-theme-light .adm-card-expand-icon {
  color: #5a6c7d;
}
.bi-theme-light .adm-stat {
  background: rgba(0, 119, 255, 0.03);
}
.bi-theme-light .adm-stat--clickable:hover {
  box-shadow: 0 2px 8px rgba(0, 119, 255, 0.15);
}
.bi-theme-light .adm-stat--selected:not(.adm-stat--active) {
  background: rgba(0, 119, 255, 0.08);
  outline: 2px solid rgba(59, 130, 246, 0.5);
}
.bi-theme-light .adm-stat-lbl {
  color: #5a6c7d;
}
.bi-theme-light .adm-stat--total .adm-stat-val {
  color: #64748b;
}
.bi-theme-light .adm-stat--yellow.adm-stat--active {
  background: #b45309;
}
.bi-theme-light .adm-stat--red.adm-stat--active {
  background: #dc2626;
}
.bi-theme-light .adm-stat--purple.adm-stat--active {
  background: #7c3aed;
}
.bi-theme-light .adm-stat--orange.adm-stat--active {
  background: #ea580c;
}
.bi-theme-light .adm-sla-bar {
  background: #e0e8f0;
}
.bi-theme-light .adm-detail-tab {
  background: #f8fbff;
  border-color: #c5d9f0;
  color: #5a6c7d;
}
.bi-theme-light .adm-detail-tab:hover {
  border-color: #93b8e0;
  color: #3a5d80;
}
.bi-theme-light .adm-detail-empty {
  color: #8ba3c4;
}
.bi-theme-light .adm-detail-table-wrap {
  border-color: #c5d9f0;
}
.bi-theme-light .adm-detail-table th {
  background: #f8fbff;
  color: #5a6c7d;
  border-bottom-color: #c5d9f0;
}
.bi-theme-light .adm-detail-table td {
  border-bottom-color: #e6f2ff;
  color: #1a1a1a;
}
.bi-theme-light .adm-detail-table tbody tr:hover {
  background: rgba(0, 119, 255, 0.04);
}
.bi-theme-light .adm-footer {
  border-top-color: #c5d9f0;
  color: #8ba3c4;
}
.bi-theme-light .adm-footer-countdown {
  color: var(--primary, #0077ff);
}
.bi-theme-light .adm-error {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.2);
}
.bi-theme-light .adm-empty {
  color: #5a6c7d;
}
.bi-theme-light .adm-empty i {
  color: #8ba3c4;
}
.bi-theme-light .adm-empty h3 {
  color: #1a1a1a;
}

/* ─── Responsive ─── */
@media (max-width: 900px) {
  .adm-card-stats {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 600px) {
  .adm-summary-cards {
    flex-wrap: wrap;
  }
  .adm-card-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .bi-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
  .calendario-dropdown-bi {
    min-width: min(520px, calc(100vw - 2rem));
    max-width: calc(100vw - 1rem);
  }
  .calendario-layout-bi {
    flex-direction: column;
  }
  .calendario-presets-bi {
    min-width: unset;
    padding-right: 0;
    padding-bottom: 0.75rem;
    border-right: none;
    border-bottom: 1px solid #56595e;
    flex-direction: row;
    flex-wrap: wrap;
  }
  .bi-theme-light .calendario-presets-bi {
    border-bottom-color: #c5d9f0;
  }
}
</style>
