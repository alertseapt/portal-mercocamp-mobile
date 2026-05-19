<template>
  <aside
    class="sidebar"
    :class="{
      'sidebar-mobile': isMobile,
      'sidebar-mobile-open': isMobile && !collapsed,
      'sidebar-mobile-closed': isMobile && collapsed,
      'sidebar-desktop-collapsed': !isMobile && collapsed && !hoverExpanded,
    }"
    @mouseenter="onSidebarMouseEnter"
    @mouseleave="onSidebarMouseLeave"
  >
    <!-- Logo Header -->
    <div class="sidebar-logo">
      <div class="logo-box logo-shine">
        <img
          src="@/assets/images/logo_mercocamp.png"
          alt="Mercocamp Logo"
          class="logo-image"
        />
      </div>
      <div class="logo-texts">
        <h2 class="logo-title">Portal<br />Mercocamp</h2>
      </div>
    </div>

    <!-- Menu -->
    <nav class="sidebar-menu">
      <div class="main-menu">
        <!-- Dashboard - oculto para níveis 4 e 8 -->
        <div
          v-if="
            showFullPortalMenu &&
            user &&
            user.level_access !== 4 &&
            user.level_access !== 8
          "
          class="menu-item"
          :class="{ active: activeMenu === 'dashboard' }"
          @click="handleMenuClick('dashboard')"
        >
          <div class="menu-main" title="Dashboard">
            <div class="icon-container">
              <i class="fa fa-home"></i>
            </div>
            <span class="menu-label">Dashboard</span>
          </div>
        </div>

        <!-- BI - níveis 0, 1, 2 e 3; demais níveis não veem a aba BI -->
        <div
          v-if="
            user &&
            (([0, 1, 2, 3].includes(Number(user.level_access)) &&
              showFullPortalMenu) ||
              isBiDiretoriaPortalOnlyUser(user) ||
              isBiArmazensPortalOnlyUser(user))
          "
          class="menu-item"
          :class="{
            active:
              activeMenu === 'bi' ||
              activeMenu === 'bi-rejeicao' ||
              activeMenu === 'bi-armazens' ||
              activeMenu === 'bi-agendamentos' ||
              activeMenu === 'bi-movimentacao-clientes' ||
              activeMenu === 'bi-diretoria' ||
              activeMenu === 'bi-painel' ||
              activeMenu === 'bi-grouplink-gerencial' ||
              activeMenu === 'bi-administradores',
            expanded: isBIExpanded,
          }"
        >
          <div class="menu-main" title="BI - Indicadores" @click="toggleBI">
            <div class="icon-container">
              <i class="fa fa-chart-bar"></i>
            </div>
            <span class="menu-label">BI</span>
            <i
              class="fa fa-chevron-down dropdown-arrow"
              :class="{ rotate: isBIExpanded }"
            ></i>
          </div>
          <div v-if="isBIExpanded" class="submenu">
            <template v-if="isBiDiretoriaPortalOnlyUser(user)">
              <div
                class="submenu-item"
                :class="{ active: activeMenu === 'bi-diretoria' }"
                @click="handleMenuClick('bi-diretoria')"
              >
                <i class="fa fa-chart-pie"></i>
                <span>Diretoria</span>
              </div>
            </template>
            <template v-else-if="isBiArmazensPortalOnlyUser(user)">
              <div
                class="submenu-item"
                :class="{ active: activeMenu === 'bi-armazens' }"
                @click="handleMenuClick('bi-armazens')"
              >
                <i class="fa fa-warehouse"></i>
                <span>Análise Armazéns</span>
              </div>
            </template>
            <template v-else>
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'bi' }"
              @click="handleMenuClick('bi')"
            >
              <i class="fa fa-clock"></i>
              <span>SLA</span>
            </div>
            <div
              v-if="user && Number(user.level_access) === 0"
              class="submenu-item"
              :class="{ active: activeMenu === 'bi-painel' }"
              @click="handleMenuClick('bi-painel')"
            >
              <i class="fa fa-tv"></i>
              <span>Painel</span>
            </div>
            <div
              v-if="user && Number(user.level_access) === 0"
              class="submenu-item"
              :class="{ active: activeMenu === 'bi-diretoria' }"
              @click="handleMenuClick('bi-diretoria')"
            >
              <i class="fa fa-chart-pie"></i>
              <span>Diretoria</span>
            </div>
            <div
              v-if="user && canAccessBiGroupLinkGerencial(user)"
              class="submenu-item"
              :class="{ active: activeMenu === 'bi-grouplink-gerencial' }"
              @click="handleMenuClick('bi-grouplink-gerencial')"
            >
              <i class="fa fa-building"></i>
              <span>Gerencial Group Link</span>
            </div>
            <div
              v-if="user && Number(user.level_access) === 0"
              class="submenu-item"
              :class="{ active: activeMenu === 'bi-rejeicao' }"
              @click="handleMenuClick('bi-rejeicao')"
            >
              <i class="fa fa-exclamation-triangle"></i>
              <span>Rejeições</span>
            </div>
            <div
              v-if="user && canAccessBiArmazensAnalise(user)"
              class="submenu-item"
              :class="{ active: activeMenu === 'bi-armazens' }"
              @click="handleMenuClick('bi-armazens')"
            >
              <i class="fa fa-warehouse"></i>
              <span>Análise Armazéns</span>
            </div>
            <div
              v-if="user && Number(user.level_access) === 0"
              class="submenu-item"
              :class="{ active: activeMenu === 'bi-movimentacao-clientes' }"
              @click="handleMenuClick('bi-movimentacao-clientes')"
            >
              <i class="fa fa-user-group"></i>
              <span>Movimentação de clientes</span>
            </div>
            <!-- BI Administradores: níveis 0, 2 e 3 (escopo por carteira no sistema) -->
            <div
              v-if="user && canAccessBiAdministradores(user)"
              class="submenu-item"
              :class="{ active: activeMenu === 'bi-administradores' }"
              @click="handleMenuClick('bi-administradores')"
            >
              <i class="fa fa-user-tie"></i>
              <span>{{
                user && Number(user.level_access) === 2
                  ? 'Visão Operacional'
                  : 'Administradores'
              }}</span>
            </div>
            <div
              v-if="
                user &&
                ![1, 2].includes(Number(user.level_access))
              "
              class="submenu-item"
              :class="{ active: activeMenu === 'bi-agendamentos' }"
              @click="handleMenuClick('bi-agendamentos')"
            >
              <i class="fa fa-calendar-alt"></i>
              <span>Análise de Agendamentos</span>
            </div>
            </template>
          </div>
        </div>

        <!-- Recebimento (Dropdown) - oculto para nível 4 -->
        <div
          v-if="showFullPortalMenu && user && user.level_access !== 4"
          class="menu-item"
          :class="{
            active:
              activeMenu === 'recebimento-agenda' ||
              activeMenu === 'recebimento-historico' ||
              activeMenu === 'reagendamento-massa' ||
              activeMenu === 'conferencia-lote' ||
              activeMenu === 'produtos' ||
              activeMenu === 'api' ||
              activeMenu === 'rejeicoes' ||
              activeMenu === 'status-por-clientes',
            expanded: isRecebimentoExpanded,
          }"
        >
          <div class="menu-main" title="Recebimento" @click="toggleRecebimento">
            <div class="icon-container">
              <i class="fa fa-truck-loading"></i>
            </div>
            <span class="menu-label">Recebimento</span>
            <i
              class="fa fa-chevron-down dropdown-arrow"
              :class="{ rotate: isRecebimentoExpanded }"
            ></i>
          </div>

          <!-- Submenu -->
          <div v-if="isRecebimentoExpanded" class="submenu">
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'recebimento-agenda' }"
              @click="handleMenuClick('recebimento-agenda')"
            >
              <i class="fa fa-calendar-check"></i>
              <span>Solicitação de Agendamento</span>
            </div>
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'recebimento-historico' }"
              @click="handleMenuClick('recebimento-historico')"
            >
              <i class="fa fa-history"></i>
              <span>Histórico de Agendamentos</span>
            </div>
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'reagendamento-massa' }"
              @click="handleMenuClick('reagendamento-massa')"
            >
              <i class="fa fa-calendar-alt"></i>
              <span>Reagendamento em massa</span>
            </div>
            <div
              v-if="
                user &&
                Number(user.level_access) !== 1 &&
                Number(user.level_access) !== 4
              "
              class="submenu-item"
              :class="{ active: activeMenu === 'status-por-clientes' }"
              @click="handleMenuClick('status-por-clientes')"
            >
              <i class="fa fa-chart-pie"></i>
              <span>Status por clientes</span>
            </div>
            <div
              v-if="
                user &&
                Number(user.level_access) !== 1 &&
                Number(user.level_access) !== 4
              "
              class="submenu-item"
              :class="{ active: activeMenu === 'conferencia-lote' }"
              @click="handleMenuClick('conferencia-lote')"
            >
              <i class="fa fa-clipboard-check"></i>
              <span>Conferência em lote</span>
            </div>
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'produtos' }"
              @click="handleMenuClick('produtos')"
            >
              <i class="fa fa-box"></i>
              <span>Produtos Cadastrados</span>
            </div>
            <div
              v-if="user && canAccessApiPage"
              class="submenu-item"
              :class="{ active: activeMenu === 'api' }"
              @click="handleMenuClick('api')"
            >
              <i class="fa fa-code"></i>
              <span>API</span>
            </div>
            <div
              v-if="user && [0, 1, 2, 3].includes(Number(user.level_access))"
              class="submenu-item"
              :class="{ active: activeMenu === 'rejeicoes' }"
              @click="handleMenuClick('rejeicoes')"
            >
              <i class="fa fa-exclamation-triangle"></i>
              <span>Rejeições</span>
            </div>
          </div>
        </div>

        <!-- Acompanhamento de Rejeições - dev, clientes (nível 1, só CNPJs do login) e gerentes -->
        <div
          v-if="
            showFullPortalMenu &&
            user &&
            [0, 1, 2, 3].includes(Number(user.level_access))
          "
          class="menu-item"
          :class="{ active: activeMenu === 'rejeicoes' }"
          @click="handleMenuClick('rejeicoes')"
        >
          <div class="menu-main" title="Acompanhamento de Rejeições">
            <div class="icon-container">
              <i class="fa fa-exclamation-triangle"></i>
            </div>
            <span class="menu-label">Acompanhamento de Rejeições</span>
          </div>
        </div>

        <!-- Crossdoc (Dropdown) - oculto para nível 4; níveis 0,1,2,3 conforme regras -->
        <div
          v-if="
            showFullPortalMenu &&
            user &&
            user.level_access !== 4 &&
            [0, 1, 2, 3].includes(user.level_access) &&
            shouldShowCrossdockingMenu
          "
          class="menu-item"
          :class="{
            active:
              activeMenu === 'criar-pedido-expedicao' ||
              activeMenu === 'pedidos-expedicao' ||
              activeMenu === 'historico-expedicao' ||
              activeMenu === 'troca-nota',
            expanded: isExpedicaoExpanded,
          }"
        >
          <div class="menu-main" title="Crossdocking" @click="toggleExpedicao">
            <div class="icon-container">
              <i class="fa fa-box-open"></i>
            </div>
            <span class="menu-label">Crossdocking</span>
            <i
              class="fa fa-chevron-down dropdown-arrow"
              :class="{ rotate: isExpedicaoExpanded }"
            ></i>
          </div>

          <!-- Submenu -->
          <div v-if="isExpedicaoExpanded" class="submenu">
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'troca-nota' }"
              @click="handleMenuClick('troca-nota')"
            >
              <i class="fa fa-exchange-alt"></i>
              <span>Criar Pedido de Saída</span>
            </div>
            <!-- Pedido de Saída Manual: Visível apenas para nível 0 -->
            <div
              v-if="user && user.level_access === 0"
              class="submenu-item"
              :class="{ active: activeMenu === 'criar-pedido-expedicao' }"
              @click="handleMenuClick('criar-pedido-expedicao')"
            >
              <i class="fa fa-plus-circle"></i>
              <span>Pedido de Saída Manual</span>
            </div>
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'pedidos-expedicao' }"
              @click="handleMenuClick('pedidos-expedicao')"
            >
              <i class="fa fa-clipboard-list"></i>
              <span>Lista de Pedidos</span>
            </div>
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'historico-expedicao' }"
              @click="handleMenuClick('historico-expedicao')"
            >
              <i class="fa fa-history"></i>
              <span>Histórico de Pedidos</span>
            </div>
          </div>
        </div>

        <!-- Grupo Oscar - nível 0 ou cli_access com CNPJ 62941819000100 -->
        <div
          v-if="showFullPortalMenu && user && canAccessApiPage"
          class="menu-item"
          :class="{ active: activeMenu === 'grupo-oscar' }"
          @click="handleMenuClick('grupo-oscar')"
        >
          <div class="menu-main" title="Grupo Oscar">
            <div class="icon-container">
              <i class="fa fa-building"></i>
            </div>
            <span class="menu-label">Grupo Oscar</span>
          </div>
        </div>

        <!-- Recepção (Dropdown) - oculto para níveis 1 e 4 -->
        <div
          v-if="
            showFullPortalMenu &&
            user &&
            user.level_access !== 1 &&
            user.level_access !== 4
          "
          class="menu-item"
          :class="{
            active:
              activeMenu === 'gestao' ||
              activeMenu === 'cargas' ||
              activeMenu === 'recepcao-clientes',
            expanded: isRecepcaoExpanded,
          }"
        >
          <div class="menu-main" title="Recepção" @click="toggleRecepcao">
            <div class="icon-container">
              <i class="fa fa-tasks"></i>
            </div>
            <span class="menu-label">Recepção</span>
            <i
              class="fa fa-chevron-down dropdown-arrow"
              :class="{ rotate: isRecepcaoExpanded }"
            ></i>
          </div>

          <!-- Submenu -->
          <div v-if="isRecepcaoExpanded" class="submenu">
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'cargas' }"
              @click="handleMenuClick('cargas')"
            >
              <i class="fa fa-truck-loading"></i>
              <span>Cargas</span>
            </div>
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'recepcao-clientes' }"
              @click="handleMenuClick('recepcao-clientes')"
            >
              <i class="fa fa-building"></i>
              <span>Clientes</span>
            </div>
          </div>
        </div>

        <!-- Carga e Descarga (Dropdown) - níveis 0 e 8 -->
        <div
          v-if="
            showFullPortalMenu &&
            user &&
            (user.level_access === 0 || user.level_access === 8)
          "
          class="menu-item"
          :class="{
            active:
              activeMenu === 'carga-descarga-agendamentos' ||
              activeMenu === 'carga-descarga-informacoes-gerais',
            expanded: isCargaDescargaExpanded,
          }"
        >
          <div
            class="menu-main"
            title="Carga e Descarga"
            @click="toggleCargaDescarga"
          >
            <div class="icon-container">
              <i class="fa fa-truck"></i>
            </div>
            <span class="menu-label">Carga e Descarga</span>
            <i
              class="fa fa-chevron-down dropdown-arrow"
              :class="{ rotate: isCargaDescargaExpanded }"
            ></i>
          </div>

          <!-- Submenu -->
          <div v-if="isCargaDescargaExpanded" class="submenu">
            <div
              class="submenu-item"
              :class="{
                active: activeMenu === 'carga-descarga-informacoes-gerais',
              }"
              @click="handleMenuClick('carga-descarga-informacoes-gerais')"
            >
              <i class="fa fa-chart-bar"></i>
              <span>Informações Gerais</span>
            </div>
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'carga-descarga-agendamentos' }"
              @click="handleMenuClick('carga-descarga-agendamentos')"
            >
              <i class="fa fa-calendar-check"></i>
              <span>Agendamentos</span>
            </div>
          </div>
        </div>

        <!-- Administração (Dropdown) - Apenas para nível 0 -->
        <div
          v-if="showFullPortalMenu && user && user.level_access === 0"
          class="menu-item"
          :class="{
            active:
              activeMenu === 'admin-usuarios' ||
              activeMenu === 'admin-clientes' ||
              activeMenu === 'admin-versao' ||
              activeMenu === 'admin-marketing' ||
              activeMenu === 'admin-armazens' ||
              activeMenu === 'admin-importacao-despesas-armazens' ||
              activeMenu === 'admin-levantamento-custos-operacionais' ||
              activeMenu === 'admin-levantamento-valores-tabela',
            expanded: isAdministracaoExpanded,
          }"
        >
          <div
            class="menu-main"
            title="Administração"
            @click="toggleAdministracao"
          >
            <div class="icon-container">
              <i class="fa fa-users-cog"></i>
            </div>
            <span class="menu-label">Administração</span>
            <i
              class="fa fa-chevron-down dropdown-arrow"
              :class="{ rotate: isAdministracaoExpanded }"
            ></i>
          </div>

          <!-- Submenu -->
          <div v-if="isAdministracaoExpanded" class="submenu">
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'admin-usuarios' }"
              @click="handleMenuClick('admin-usuarios')"
            >
              <i class="fa fa-users"></i>
              <span>Usuários</span>
            </div>
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'admin-clientes' }"
              @click="handleMenuClick('admin-clientes')"
            >
              <i class="fa fa-building"></i>
              <span>Clientes</span>
            </div>
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'admin-versao' }"
              @click="handleMenuClick('admin-versao')"
            >
              <i class="fa fa-code-branch"></i>
              <span>Versão</span>
            </div>
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'admin-marketing' }"
              @click="handleMenuClick('admin-marketing')"
            >
              <i class="fa fa-bullhorn"></i>
              <span>Marketing</span>
            </div>
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'admin-armazens' }"
              @click="handleMenuClick('admin-armazens')"
            >
              <i class="fa fa-warehouse"></i>
              <span>Armazéns</span>
            </div>
            <div
              class="submenu-item"
              :class="{
                active:
                  activeMenu === 'admin-levantamento-custos-operacionais' ||
                  activeMenu === 'admin-importacao-despesas-armazens',
              }"
              @click="handleMenuClick('admin-levantamento-custos-operacionais')"
            >
              <i class="fa fa-file-import"></i>
              <span>Importação despesas armazéns</span>
            </div>
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'admin-levantamento-valores-tabela' }"
              @click="handleMenuClick('admin-levantamento-valores-tabela')"
            >
              <i class="fa fa-table"></i>
              <span>Valores levantamento (tabela)</span>
            </div>
          </div>
        </div>

        <!-- Financeiro (Dropdown) - apenas nível 0 -->
        <div
          v-if="user && Number(user.level_access) === 0"
          class="menu-item"
          :class="{
            active:
              activeMenu === 'financeiro-faturas' ||
              activeMenu === 'financeiro-solicitacoes',
            expanded: isFinanceiroExpanded,
          }"
        >
          <div class="menu-main" title="Financeiro" @click="toggleFinanceiro">
            <div class="icon-container">
              <i class="fa fa-wallet"></i>
            </div>
            <span class="menu-label">Financeiro</span>
            <i
              class="fa fa-chevron-down dropdown-arrow"
              :class="{ rotate: isFinanceiroExpanded }"
            ></i>
          </div>

          <div v-if="isFinanceiroExpanded" class="submenu">
            <div
              v-if="user && Number(user.level_access) === 0"
              class="submenu-item"
              :class="{ active: activeMenu === 'financeiro-faturas' }"
              @click="handleMenuClick('financeiro-faturas')"
            >
              <i class="fa fa-file-invoice-dollar"></i>
              <span>Faturas</span>
            </div>
            <div
              v-if="user && Number(user.level_access) === 0"
              class="submenu-item"
              :class="{ active: activeMenu === 'financeiro-solicitacoes' }"
              @click="handleMenuClick('financeiro-solicitacoes')"
            >
              <i class="fa fa-inbox"></i>
              <span>Solicitações</span>
            </div>
          </div>
        </div>

        <!-- Manutenção (Dropdown) - Apenas para níveis 0 e 4 -->
        <div
          v-if="
            showFullPortalMenu &&
            user &&
            (user.level_access === 0 || user.level_access === 4)
          "
          class="menu-item"
          :class="{
            active: activeMenu === 'diaristas',
            expanded: isManutencaoExpanded,
          }"
        >
          <div class="menu-main" title="Manutenção" @click="toggleManutencao">
            <div class="icon-container">
              <i class="fa fa-tools"></i>
            </div>
            <span class="menu-label">Manutenção</span>
            <i
              class="fa fa-chevron-down dropdown-arrow"
              :class="{ rotate: isManutencaoExpanded }"
            ></i>
          </div>

          <!-- Submenu -->
          <div v-if="isManutencaoExpanded" class="submenu">
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'diaristas' }"
              @click="handleMenuClick('diaristas')"
            >
              <i class="fa fa-user-cog"></i>
              <span>Diaristas</span>
            </div>
          </div>
        </div>

        <!-- </DEV> (Dropdown) - Apenas nível 0 -->
        <div
          v-if="
            showFullPortalMenu && user && Number(user.level_access) === 0
          "
          class="menu-item"
          :class="{
            active:
              activeMenu === 'wtj' ||
              activeMenu === 'auto-status' ||
              activeMenu === 'status' ||
              activeMenu === 'admin-sistema' ||
              activeMenu === 'config-rejeicoes' ||
              activeMenu === 'config-pedidos' ||
              activeMenu === 'dev-whatsapp-diretoria',
            expanded: isDevExpanded,
          }"
        >
          <div class="menu-main" title="Desenvolvimento" @click="toggleDev">
            <div class="icon-container">
              <i class="fa fa-code"></i>
            </div>
            <span class="menu-label">&lt;/DEV&gt;</span>
            <i
              class="fa fa-chevron-down dropdown-arrow"
              :class="{ rotate: isDevExpanded }"
            ></i>
          </div>

          <!-- Submenu -->
          <div v-if="isDevExpanded" class="submenu">
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'wtj' }"
              @click="handleMenuClick('wtj')"
            >
              <i class="fa fa-table"></i>
              <span>WJT</span>
            </div>
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'auto-status' }"
              @click="handleMenuClick('auto-status')"
            >
              <i class="fa fa-sync-alt"></i>
              <span>Auto Status</span>
            </div>
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'status' }"
              @click="handleMenuClick('status')"
            >
              <i class="fa fa-tags"></i>
              <span>Status</span>
            </div>
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'admin-sistema' }"
              @click="handleMenuClick('admin-sistema')"
            >
              <i class="fa fa-cogs"></i>
              <span>Sistema</span>
            </div>
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'config-rejeicoes' }"
              @click="handleMenuClick('config-rejeicoes')"
            >
              <i class="fa fa-exclamation-triangle"></i>
              <span>Config. Rejeições</span>
            </div>
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'config-pedidos' }"
              @click="handleMenuClick('config-pedidos')"
            >
              <i class="fa fa-clock-o"></i>
              <span>Config. Pedidos</span>
            </div>
            <div
              class="submenu-item"
              :class="{ active: activeMenu === 'dev-whatsapp-diretoria' }"
              @click="handleMenuClick('dev-whatsapp-diretoria')"
            >
              <i class="fab fa-whatsapp"></i>
              <span>WhatsApp Diretoria</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Menu - Ajuda oculta para nível 4 -->
      <div class="bottom-menu">
        <div
          v-if="showFullPortalMenu && user && user.level_access !== 4"
          class="menu-item"
          :class="{ active: activeMenu === 'ajuda' }"
          @click="handleMenuClick('ajuda')"
        >
          <div class="menu-main" title="Ajuda">
            <div class="icon-container">
              <i class="fa fa-question-circle"></i>
            </div>
            <span class="menu-label">Ajuda</span>
          </div>
        </div>
      </div>
    </nav>
  </aside>
</template>

<script>
import { canAccessBiGroupLinkGerencial } from '@/utils/biGroupLinkAccess.js'
import { canAccessBiAdministradores } from '@/utils/biAdministradoresAccess.js'
import {
  isBiDiretoriaPortalOnlyUser,
  isBiArmazensPortalOnlyUser,
  canAccessBiArmazensAnalise,
} from '@/utils/biDiretoriaPortalAccess.js'

export default {
  name: 'SidebarComponent',
  props: {
    user: {
      type: Object,
      required: true,
    },
    activeMenu: {
      type: String,
      default: 'dashboard',
    },
    collapsed: {
      type: Boolean,
      default: false,
    },
    isMobile: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['menu-click', 'close-mobile', 'hover-expand', 'hover-leave'],
  data() {
    return {
      hoverExpanded: false,
      isCargaDescargaExpanded: false,
      isRecepcaoExpanded: false,
      isBIExpanded: false,
      isRecebimentoExpanded: false,
      isExpedicaoExpanded: false,
      isAdministracaoExpanded: false,
      isFinanceiroExpanded: false,
      isManutencaoExpanded: false,
      isDevExpanded: false,
      cacheCheckInterval: null,
      userClientsCache: null, // Cache local dos clientes do usuário
    }
  },
  computed: {
    showFullPortalMenu() {
      if (!this.user) return true
      return (
        !isBiDiretoriaPortalOnlyUser(this.user) &&
        !isBiArmazensPortalOnlyUser(this.user)
      )
    },
    // Página API/Grupo Oscar: nível 0 ou usuário com CNPJ 62941819000100 no cli_access
    // Níveis 7 e 8 nunca têm acesso, independente do cli_access
    canAccessApiPage() {
      if (!this.user) return false
      if (Number(this.user.level_access) === 0) return true
      if ([7, 8].includes(Number(this.user.level_access))) return false
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
    shouldShowCrossdockingMenu() {
      // Se não é nível 1, sempre mostrar
      if (!this.user || this.user.level_access !== 1) {
        console.log('🔍 [CROSSDOCK MENU] Usuário não é nível 1, mostrando menu')
        return true
      }

      console.log(
        '🔍 [CROSSDOCK MENU] Verificando visibilidade para usuário nível 1:',
        {
          user: this.user.user,
          cli_access: this.user.cli_access,
        }
      )

      // Para nível 1, verificar se algum cliente tem crossdocking diferente de '0'
      // Se todos os clientes tiverem crossdocking = '0', ocultar o menu

      // Obter lista de clientes do usuário através do cli_access
      if (!this.user.cli_access) {
        // Se não tem cli_access, mostrar por padrão
        console.log(
          '🔍 [CROSSDOCK MENU] Usuário sem cli_access, mostrando menu'
        )
        return true
      }

      let cliAccess = this.user.cli_access

      // Tratar cli_access se estiver como string
      if (typeof cliAccess === 'string' && cliAccess) {
        try {
          cliAccess = JSON.parse(cliAccess)
        } catch (e) {
          console.warn('🔍 [CROSSDOCK MENU] Erro ao parsear cli_access:', e)
          return true // Em caso de erro, mostrar por padrão
        }
      }

      // Se não tem clientes no cli_access, mostrar por padrão
      if (
        !cliAccess ||
        typeof cliAccess !== 'object' ||
        Object.keys(cliAccess).length === 0
      ) {
        console.log('🔍 [CROSSDOCK MENU] cli_access vazio, mostrando menu')
        return true
      }

      // Obter CNPJs dos clientes permitidos
      const allowedCNPJs = Object.keys(cliAccess).map(cnpj =>
        cnpj.replace(/[^\d]/g, '')
      )
      console.log('🔍 [CROSSDOCK MENU] CNPJs permitidos:', allowedCNPJs)

      // Buscar clientes no cache global
      // Verificar se o cache existe e tem clientes
      const cache = window.globalClientsCache
      if (!cache || !cache.clients || cache.clients.length === 0) {
        // Se não há cache ainda, mostrar por padrão
        // O menu será atualizado quando os clientes forem carregados
        console.log(
          '🔍 [CROSSDOCK MENU] Cache não disponível ainda, mostrando menu por padrão'
        )
        return true
      }

      // Usar cache local se disponível, senão usar cache global
      let userClients = this.userClientsCache

      if (!userClients || userClients.length === 0) {
        const clients = cache.clients
        console.log(
          '🔍 [CROSSDOCK MENU] Total de clientes no cache:',
          clients.length
        )

        // Filtrar apenas os clientes que o usuário tem acesso
        userClients = clients.filter(client => {
          const clientCnpj = (client.cnpj || '').replace(/[^\d]/g, '')
          const hasAccess = allowedCNPJs.includes(clientCnpj)
          if (hasAccess) {
            console.log('🔍 [CROSSDOCK MENU] Cliente encontrado:', {
              cnpj: clientCnpj,
              name: client.name,
              crossdocking: client.crossdocking,
              crossdockingType: typeof client.crossdocking,
            })
          }
          return hasAccess
        })
      } else {
        console.log(
          '🔍 [CROSSDOCK MENU] Usando cache local de clientes do usuário'
        )
      }

      console.log(
        '🔍 [CROSSDOCK MENU] Clientes do usuário encontrados:',
        userClients.length
      )

      // Se não encontrou nenhum cliente, mostrar por padrão
      if (userClients.length === 0) {
        console.log(
          '🔍 [CROSSDOCK MENU] Nenhum cliente encontrado, mostrando menu por padrão'
        )
        return true
      }

      // Verificar se algum cliente tem crossdocking diferente de '0'
      const hasCrossdockingEnabled = userClients.some(client => {
        const crossdockingValue = client.crossdocking
        const isEnabled =
          crossdockingValue !== '0' &&
          crossdockingValue !== 0 &&
          crossdockingValue !== null &&
          crossdockingValue !== undefined
        console.log('🔍 [CROSSDOCK MENU] Verificando cliente:', {
          name: client.name,
          cnpj: client.cnpj,
          crossdocking: crossdockingValue,
          crossdockingType: typeof crossdockingValue,
          isEnabled,
        })
        return isEnabled
      })

      console.log('🔍 [CROSSDOCK MENU] Resultado final:', {
        hasCrossdockingEnabled,
        shouldShow: hasCrossdockingEnabled,
      })

      // Se pelo menos um cliente tem crossdocking habilitado, mostrar o menu
      return hasCrossdockingEnabled
    },
  },
  async mounted() {
    // Para usuários nível 1, carregar clientes diretamente da API se necessário
    if (this.user && this.user.level_access === 1) {
      await this.loadUserClients()

      let lastCacheTime = window.globalClientsCache?.loadedAt || 0

      this.cacheCheckInterval = setInterval(async () => {
        const currentCache = window.globalClientsCache
        if (
          currentCache &&
          currentCache.loadedAt &&
          currentCache.loadedAt !== lastCacheTime
        ) {
          lastCacheTime = currentCache.loadedAt
          // Recarregar clientes do usuário quando o cache global for atualizado
          await this.loadUserClients()
          // Forçar atualização se o cache foi atualizado
          this.$forceUpdate()
        }
      }, 2000) // Verificar a cada 2 segundos
    }
  },
  beforeUnmount() {
    // Limpar intervalo quando o componente for destruído
    if (this.cacheCheckInterval) {
      clearInterval(this.cacheCheckInterval)
    }
  },
  watch: {
    // Expande automaticamente se um dos subitens estiver ativo
    activeMenu: {
      immediate: true,
      handler(newVal) {
        if (['gestao', 'cargas', 'recepcao-clientes'].includes(newVal)) {
          this.isRecepcaoExpanded = true
        }
        if (
          [
            'bi',
            'bi-rejeicao',
            'bi-armazens',
            'bi-agendamentos',
            'bi-movimentacao-clientes',
            'bi-diretoria',
            'bi-grouplink-gerencial',
            'bi-administradores',
            'bi-painel',
          ].includes(newVal)
        ) {
          this.isBIExpanded = true
        }
        if (
          [
            'recebimento-agenda',
            'recebimento-historico',
            'reagendamento-massa',
            'conferencia-lote',
            'produtos',
            'api',
            'rejeicoes',
          ].includes(newVal)
        ) {
          this.isRecebimentoExpanded = true
        }
        if (
          [
            'criar-pedido-expedicao',
            'pedidos-expedicao',
            'historico-expedicao',
            'troca-nota',
          ].includes(newVal)
        ) {
          this.isExpedicaoExpanded = true
        }
        if (
          [
            'admin-usuarios',
            'admin-clientes',
            'admin-versao',
            'admin-marketing',
            'admin-armazens',
            'admin-importacao-despesas-armazens',
            'admin-levantamento-custos-operacionais',
            'admin-levantamento-valores-tabela',
          ].includes(newVal)
        ) {
          this.isAdministracaoExpanded = true
        }
        if (
          ['financeiro-faturas', 'financeiro-solicitacoes'].includes(newVal)
        ) {
          this.isFinanceiroExpanded = true
        }
        if (newVal === 'diaristas') {
          this.isManutencaoExpanded = true
        }
        if (
          [
            'wtj',
            'auto-status',
            'admin-sistema',
            'status',
            'config-rejeicoes',
            'config-pedidos',
            'dev-whatsapp-diretoria',
          ].includes(newVal)
        ) {
          this.isDevExpanded = true
        }
      },
    },
  },
  methods: {
    isBiDiretoriaPortalOnlyUser,
    isBiArmazensPortalOnlyUser,
    canAccessBiArmazensAnalise,
    canAccessBiGroupLinkGerencial,
    canAccessBiAdministradores,
    async loadUserClients() {
      if (!this.user || !this.user.cli_access) {
        return
      }

      try {
        // Tentar usar o cache global primeiro
        const globalCache = window.globalClientsCache
        if (
          globalCache &&
          globalCache.clients &&
          globalCache.clients.length > 0
        ) {
          let cliAccess = this.user.cli_access
          if (typeof cliAccess === 'string' && cliAccess) {
            try {
              cliAccess = JSON.parse(cliAccess)
            } catch (e) {
              console.warn('Erro ao parsear cli_access:', e)
              return
            }
          }

          const allowedCNPJs = Object.keys(cliAccess).map(cnpj =>
            cnpj.replace(/[^\d]/g, '')
          )
          const userClients = globalCache.clients.filter(client => {
            const clientCnpj = (client.cnpj || '').replace(/[^\d]/g, '')
            return allowedCNPJs.includes(clientCnpj)
          })

          this.userClientsCache = userClients
          console.log(
            '🔍 [CROSSDOCK MENU] Clientes do usuário carregados do cache global:',
            userClients.length
          )
          return
        }

        // Se o cache não estiver disponível, buscar da API
        const apiClient = window.apiClient
        if (!apiClient) {
          return
        }

        const response = await apiClient.request('/clients', {
          method: 'GET',
        })

        if (response && response.data && response.data.data) {
          let cliAccess = this.user.cli_access
          if (typeof cliAccess === 'string' && cliAccess) {
            try {
              cliAccess = JSON.parse(cliAccess)
            } catch (e) {
              console.warn('Erro ao parsear cli_access:', e)
              return
            }
          }

          const allowedCNPJs = Object.keys(cliAccess).map(cnpj =>
            cnpj.replace(/[^\d]/g, '')
          )
          const userClients = response.data.data.filter(client => {
            const clientCnpj = (client.cnpj || '').replace(/[^\d]/g, '')
            return allowedCNPJs.includes(clientCnpj)
          })

          this.userClientsCache = userClients
          console.log(
            '🔍 [CROSSDOCK MENU] Clientes do usuário carregados da API:',
            userClients.length
          )
        }
      } catch (error) {
        console.error(
          '🔍 [CROSSDOCK MENU] Erro ao carregar clientes do usuário:',
          error
        )
      }
    },
    toggleCargaDescarga() {
      this.isCargaDescargaExpanded = !this.isCargaDescargaExpanded
    },
    toggleRecepcao() {
      this.isRecepcaoExpanded = !this.isRecepcaoExpanded
    },
    toggleRecebimento() {
      this.isRecebimentoExpanded = !this.isRecebimentoExpanded
    },
    toggleExpedicao() {
      this.isExpedicaoExpanded = !this.isExpedicaoExpanded
    },
    toggleAdministracao() {
      this.isAdministracaoExpanded = !this.isAdministracaoExpanded
    },
    toggleFinanceiro() {
      this.isFinanceiroExpanded = !this.isFinanceiroExpanded
    },
    toggleManutencao() {
      this.isManutencaoExpanded = !this.isManutencaoExpanded
    },
    toggleDev() {
      this.isDevExpanded = !this.isDevExpanded
    },
    toggleBI() {
      this.isBIExpanded = !this.isBIExpanded
    },
    onSidebarMouseEnter() {
      if (!this.isMobile && this.collapsed) {
        this.hoverExpanded = true
        this.$emit('hover-expand')
      }
    },
    onSidebarMouseLeave() {
      if (this.hoverExpanded) {
        this.hoverExpanded = false
        this.$emit('hover-leave')
      }
    },
    handleMenuClick(menu) {
      this.$emit('menu-click', menu)
      // Fechar sidebar automaticamente em mobile após clicar em um item
      if (this.isMobile && !this.collapsed) {
        this.$emit('close-mobile')
      }
    },
  },
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

.sidebar {
  background: linear-gradient(135deg, #1c44f5, #0077ff) !important;
  min-height: 100vh !important;
  height: 100vh !important;
  position: fixed !important;
  left: 0 !important;
  top: 0 !important;
  z-index: 1050 !important;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.15) !important;
  transition:
    width 0.3s ease,
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  display: flex !important;
  flex-direction: column !important;
  width: 260px !important;
  font-family: 'Poppins', sans-serif !important;
}

/* Estilos específicos para mobile */
.sidebar.sidebar-mobile {
  width: 280px !important;
  transform: translateX(-100%) !important;
}

.sidebar.sidebar-mobile.sidebar-mobile-open {
  transform: translateX(0) !important;
}

.sidebar.sidebar-mobile.sidebar-mobile-closed {
  transform: translateX(-100%) !important;
}

/* Desktop: sidebar recolhida (ex.: na página BI) */
.sidebar.sidebar-desktop-collapsed {
  width: 80px !important;
}

.sidebar.sidebar-desktop-collapsed .logo-texts,
.sidebar.sidebar-desktop-collapsed .menu-label {
  opacity: 0 !important;
  display: none !important;
}

.sidebar.sidebar-desktop-collapsed .logo-box {
  margin-right: 0 !important;
}

.sidebar-logo {
  display: flex !important;
  align-items: center !important;
  border-bottom: 1px solid #3b82f6 !important;
  padding: 24px 18px 18px !important;
  transition: all 0.3s !important;
}

.logo-box {
  background: rgba(255, 255, 255, 0.08) !important;
  border-radius: 16px !important;
  width: 48px !important;
  height: 48px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border: 1.5px solid rgba(255, 255, 255, 0.18) !important;
  margin-right: 0 !important;
}

.logo-texts {
  margin-left: 24px !important;
  flex: 1 !important;
}

.logo-title {
  font-weight: 600 !important;
  font-size: 1rem !important;
  color: #fff !important;
  font-family: 'Poppins', sans-serif !important;
  margin: 0;
  line-height: 1.3 !important;
  word-wrap: break-word !important;
}

.sidebar-menu {
  flex: 1 !important;
  padding: 18px 0 0 !important;
  overflow-y: auto !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
}

.main-menu {
  display: flex !important;
  flex-direction: column !important;
  gap: 2px !important;
}

.bottom-menu {
  display: flex !important;
  flex-direction: column !important;
  gap: 2px !important;
  padding-bottom: 18px !important;
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
  padding-top: 8px !important;
  margin-top: 8px !important;
}

.menu-item {
  display: flex !important;
  flex-direction: column !important;
  position: relative !important;
  margin: 0 8px 6px !important;
  border-radius: 12px !important;
  transition:
    background 0.2s,
    box-shadow 0.2s !important;
}

.menu-main {
  display: flex !important;
  align-items: center !important;
  cursor: pointer !important;
  padding: 13px 14px !important;
  border-radius: 12px !important;
  transition: background 0.2s !important;
}

.menu-item.active > .menu-main {
  background: rgba(255, 255, 255, 0.18) !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08) !important;
}

.menu-item:hover > .menu-main {
  background: rgba(255, 255, 255, 0.12) !important;
}

.icon-container {
  width: 36px !important;
  height: 36px !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin-right: 14px !important;
  font-size: 1.2rem !important;
  color: #fff !important;
  position: relative !important;
}

.icon-container i {
  font-size: 1.2rem !important;
  color: #fff !important;
  display: inline-block !important;
  font-style: normal !important;
  font-variant: normal !important;
  text-rendering: auto !important;
  -webkit-font-smoothing: antialiased !important;
}

.menu-label {
  font-weight: 500 !important;
  color: #fff !important;
  font-size: 1rem !important;
  letter-spacing: 0.01em !important;
  font-family: 'Poppins', sans-serif !important;
}

.logo-shine {
  position: relative !important;
  overflow: hidden !important;
  border-radius: 12px !important;
  display: inline-block !important;
}

.logo-shine::after {
  content: '' !important;
  position: absolute !important;
  top: -50% !important;
  left: -50% !important;
  width: 200% !important;
  height: 200% !important;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0) 30%,
    rgba(255, 255, 255, 0.6),
    rgba(255, 255, 255, 0) 70%
  ) !important;
  transform: translate(-100%) rotate(45deg) !important;
  animation: shine 3s infinite !important;
  z-index: 1 !important;
  pointer-events: none !important;
}

@keyframes shine {
  0% {
    transform: translate(-100%) rotate(45deg);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translate(100%) rotate(45deg);
    opacity: 0;
  }
}

.logo-icon {
  font-size: 1.8rem !important;
  color: #fff !important;
}

.logo-image {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain !important;
  padding: 4px !important;
}

.fa {
  font-family: 'Font Awesome 5 Free' !important;
  font-weight: 900 !important;
  display: inline-block !important;
  font-style: normal !important;
  font-variant: normal !important;
  text-rendering: auto !important;
  -webkit-font-smoothing: antialiased !important;
}

.badge-count {
  position: absolute !important;
  top: -6px !important;
  right: -6px !important;
  background: #ef4444 !important;
  color: #fff !important;
  font-size: 0.7rem !important;
  font-weight: 700 !important;
  min-width: 20px !important;
  height: 20px !important;
  border-radius: 10px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 5px !important;
  border: 2px solid #1c44f5 !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
  z-index: 10 !important;
  animation: badge-pulse 2s ease-in-out infinite !important;
}

@keyframes badge-pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 3px 8px rgba(239, 68, 68, 0.4);
  }
}

/* Dropdown Arrow */
.dropdown-arrow {
  margin-left: auto !important;
  font-size: 0.8rem !important;
  color: rgba(255, 255, 255, 0.7) !important;
  transition:
    transform 0.3s ease,
    color 0.2s !important;
}

.dropdown-arrow.rotate {
  transform: rotate(180deg) !important;
  color: #fff !important;
}

/* Submenu Styles */
.submenu {
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
  padding: 8px 0 8px 12px !important;
  margin-top: 4px !important;
  animation: slideDown 0.3s ease-out !important;
}

.submenu-item {
  display: flex !important;
  align-items: center !important;
  padding: 10px 14px 10px 48px !important;
  border-radius: 8px !important;
  cursor: pointer !important;
  transition: all 0.2s !important;
  color: rgba(255, 255, 255, 0.85) !important;
  font-size: 0.95rem !important;
  font-weight: 400 !important;
  position: relative !important;
}

.submenu-item::before {
  content: '' !important;
  position: absolute !important;
  left: 28px !important;
  width: 4px !important;
  height: 4px !important;
  background: rgba(255, 255, 255, 0.4) !important;
  border-radius: 50% !important;
  transition: all 0.2s !important;
}

.submenu-item:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
  padding-left: 52px !important;
}

.submenu-item:hover::before {
  background: #fff !important;
  transform: scale(1.5) !important;
}

.submenu-item.active {
  background: rgba(255, 255, 255, 0.15) !important;
  color: #fff !important;
  font-weight: 500 !important;
}

.submenu-item.active::before {
  background: #fff !important;
  width: 6px !important;
  height: 6px !important;
}

.submenu-item i {
  font-size: 0.9rem !important;
  margin-right: 10px !important;
  min-width: 16px !important;
  display: none !important; /* Ocultar ícones dos subitens para manter clean */
}

.submenu-item span {
  font-family: 'Poppins', sans-serif !important;
}

/* Animation for submenu */
@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    max-height: 300px;
    transform: translateY(0);
  }
}

/* Menu item expanded state */
.menu-item.expanded > .menu-main {
  background: rgba(255, 255, 255, 0.08) !important;
}

/* Responsividade Mobile */
@media (max-width: 768px) {
  .sidebar.sidebar-mobile {
    width: 280px !important;
    box-shadow: 2px 0 20px rgba(0, 0, 0, 0.3) !important;
  }

  /* Garantir que a sidebar mobile tenha z-index alto */
  .sidebar.sidebar-mobile-open {
    z-index: 1050 !important;
  }
}

/* Responsividade Tablet */
@media (min-width: 769px) and (max-width: 992px) {
  .sidebar:not(.sidebar-mobile) {
    width: 80px !important;
  }

  .sidebar:not(.sidebar-mobile) .logo-texts,
  .sidebar:not(.sidebar-mobile) .menu-label {
    opacity: 0 !important;
    display: none !important;
  }
}
</style>
