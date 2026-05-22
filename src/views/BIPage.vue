<template>
  <div
    ref="biPageRef"
    class="bi-page"
    :class="[
      biTheme === 'light' ? 'bi-theme-light' : 'bi-theme-dark',
      { 'bi-fullscreen': biTvLayout },
      { 'bi-embed-tv': embedTvLayout },
    ]"
  >
    <!-- Overlay de carregamento: aguardar consulta ao banco -->
    <div v-if="loading" class="bi-loading-overlay">
      <div class="bi-loading-canvas">
        <i class="fas fa-spinner fa-spin bi-loading-icon"></i>
        <p class="bi-loading-message">
          Aguarde enquanto consultamos os dados mais recentes no banco de dados.
        </p>
      </div>
    </div>
    <!-- Mensagem de sucesso: mesmo formato e lugar do "aguardar" -->
    <Transition name="bi-overlay-fade">
      <div
        v-if="showDataReadyMessage"
        class="bi-loading-overlay bi-data-ready-overlay"
        @click="showDataReadyMessage = false"
      >
        <div class="bi-loading-canvas">
          <i class="fas fa-check-circle bi-loading-icon"></i>
          <p class="bi-loading-message">
            Os dados estão prontos. Faça uma boa análise!
          </p>
        </div>
      </div>
    </Transition>
    <div class="bi-header">
      <div class="bi-header-title-wrap">
        <h1 class="bi-header-title">{{ headerTitleBI }}</h1>
        <p v-if="biSubTab === 'armazens'" class="bi-header-armazens-escopo">
          {{ labelArmazensEscopoCabecalho }}
        </p>
      </div>
    </div>

    <!-- Toolbar: SLA (calendário, filtros, etc.) ou Rejeição (apenas tema) -->
    <div class="bi-toolbar">
      <div v-if="biSubTab === 'sla'" class="bi-tabs">
        <button
          type="button"
          class="sla-flip-btn sla-flip-btn-tabs"
          :disabled="painelEmbedControlsSlaFlip"
          :title="
            painelEmbedControlsSlaFlip
              ? 'No Painel, a troca Pedidos/SLA é automática (1 min cada)'
              : slaViewFlipped
                ? 'Voltar para gráficos'
                : 'Alternar para visual em cards'
          "
          @click="slaViewFlipped = !slaViewFlipped"
        >
          <i class="fas fa-exchange-alt"></i> Alternar visual
        </button>
        <span
          v-if="
            biTvLayout &&
            viewToggleCountdown >= 0 &&
            !painelEmbedControlsSlaFlip
          "
          class="bi-countdown bi-countdown-tabs"
          :title="'Próxima alternância de visual em ' + countdownFormatted"
        >
          <i class="fas fa-clock"></i>
          Próximo visual em {{ countdownFormatted }}
        </span>
        <span
          v-if="biTvLayout && dataUpdateCountdown >= 0"
          class="bi-countdown bi-countdown-tabs"
          :title="
            'Próxima atualização dos dados em ' + dataUpdateCountdownFormatted
          "
        >
          <i class="fas fa-sync-alt"></i>
          Próxima atualização em {{ dataUpdateCountdownFormatted }}
        </span>
      </div>
      <div v-else-if="biSubTab === 'rejeicao'" class="bi-tabs bi-tabs-rejeicao">
        <span class="bi-tab-label">Dashboard de Rejeições</span>
        <div class="bi-rejeicao-presets">
          <button
            v-for="p in rejeicaoPresets"
            :key="p.id"
            type="button"
            class="bi-rejeicao-preset-btn"
            :class="{ active: rejeicaoPresetAtivo === p.id }"
            @click="aplicarRejeicaoPreset(p.id)"
          >
            {{ p.label }}
          </button>
        </div>
      </div>
      <div
        class="bi-toolbar-right"
        :class="{ 'bi-toolbar-sla-only': biSubTab === 'sla' }"
      >
        <div
          v-if="biSubTab === 'sla' || biSubTab === 'armazens'"
          class="bi-header-update-block"
        >
          <div ref="calendarioRef" class="bi-calendario-wrap">
            <button
              type="button"
              class="btn-abrir-calendario-bi"
              :title="mostrarCalendario ? 'Fechar' : 'Selecionar período'"
              @click="toggleMostrarCalendarioBi"
            >
              <i class="fa fa-calendar-alt"></i>
              {{ labelIntervaloAtual }}
            </button>
            <div
              v-if="mostrarCalendario"
              class="calendario-dropdown-bi"
              :class="{
                'calendario-dropdown-bi-armazens': biSubTab === 'armazens',
              }"
              @click.stop
            >
              <div
                v-if="biSubTab === 'armazens'"
                class="calendario-layout-bi calendario-layout-bi--armazens-unico"
              >
                <div class="cal-armazens-unico">
                  <p class="cal-presets-bi-kicker">Filtre Por:</p>
                  <div class="cal-armazens-presets-stack">
                    <button
                      v-for="p in presetsCalendarioVisiveis"
                      :key="p.id"
                      type="button"
                      class="preset-btn-bi"
                      :class="{
                        active:
                          p.id === 'customizar'
                            ? armazensCalendarioModoCustomizar
                            : presetAtivo === p.id,
                      }"
                      @click="aplicarPresetCalendario(p.id)"
                    >
                      {{ p.label }}
                    </button>
                  </div>
                  <div
                    v-if="!armazensCalendarioModoCustomizar"
                    class="cal-armazens-resumo-bi"
                  >
                    <p class="cal-armazens-resumo-periodo">
                      <span class="cal-armazens-resumo-kicker"
                        >Período atual</span
                      >
                      <span class="cal-armazens-resumo-valor">{{
                        labelArmazensPeriodoMesesFechados
                      }}</span>
                    </p>
                  </div>
                  <div v-else class="cal-armazens-inline-custom">
                    <div class="calendario-armazens-meses-bi">
                      <div class="cal-arm-mes-row">
                        <span class="cal-arm-label">De</span>
                        <div class="cal-arm-mes-selects">
                          <select
                            v-model.number="armazensCalMesIni"
                            class="select-mes-ano-arm-bi"
                            aria-label="Mês inicial"
                          >
                            <option
                              v-for="opt in opcoesMesSelectArmazensBi"
                              :key="'mi-' + opt.value"
                              :value="opt.value"
                            >
                              {{ opt.label }}
                            </option>
                          </select>
                          <select
                            v-model.number="armazensCalAnoIni"
                            class="select-mes-ano-arm-bi select-ano-arm-bi"
                            aria-label="Ano inicial"
                          >
                            <option
                              v-for="a in anosSelectCalendarioArmazensBi"
                              :key="'yi-' + a"
                              :value="a"
                            >
                              {{ a }}
                            </option>
                          </select>
                        </div>
                      </div>
                      <div class="cal-arm-mes-row">
                        <span class="cal-arm-label">Até</span>
                        <div class="cal-arm-mes-selects">
                          <select
                            v-model.number="armazensCalMesFim"
                            class="select-mes-ano-arm-bi"
                            aria-label="Mês final"
                          >
                            <option
                              v-for="opt in opcoesMesSelectArmazensBi"
                              :key="'mf-' + opt.value"
                              :value="opt.value"
                            >
                              {{ opt.label }}
                            </option>
                          </select>
                          <select
                            v-model.number="armazensCalAnoFim"
                            class="select-mes-ano-arm-bi select-ano-arm-bi"
                            aria-label="Ano final"
                          >
                            <option
                              v-for="a in anosSelectCalendarioArmazensBi"
                              :key="'yf-' + a"
                              :value="a"
                            >
                              {{ a }}
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <div class="cal-armazens-sec-btns">
                      <button
                        type="button"
                        class="btn-cal-bi"
                        @click="limparIntervaloCalendario"
                      >
                        Limpar
                      </button>
                    </div>
                    <div class="cal-armazens-aplicar-wrap">
                      <button
                        type="button"
                        class="btn-cal-bi btn-aplicar-bi btn-aplicar-bi--armazens-full"
                        @click="aplicarIntervaloCalendario"
                      >
                        Aplicar intervalo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="calendario-layout-bi">
                <div class="calendario-presets-bi">
                  <button
                    v-for="p in presetsCalendarioVisiveis"
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
        </div>
        <button
          type="button"
          class="theme-toggle-btn"
          :title="
            biTheme === 'dark' ? 'Tema claro (azul/branco)' : 'Tema escuro'
          "
          @click="toggleBiTheme"
        >
          <i :class="biTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'"></i>
        </button>
        <button
          v-if="
            (biSubTab === 'sla' ||
              biSubTab === 'rejeicao' ||
              biSubTab === 'armazens') &&
            (biUserLevel === 0 || biArmazensPortalFullscreenOk)
          "
          type="button"
          class="theme-toggle-btn bi-expand-btn"
          :title="
            isFullscreen
              ? 'Sair da tela cheia'
              : 'Expandir (tela cheia para painel)'
          "
          @click="toggleFullscreen"
        >
          <i :class="isFullscreen ? 'fas fa-compress' : 'fas fa-expand'"></i>
        </button>
        <div
          v-if="biSubTab === 'sla' || biSubTab === 'armazens'"
          ref="filtrosRef"
          class="bi-filtros-wrap"
        >
          <button
            type="button"
            class="filter-btn"
            :class="{ active: mostrarFiltros || temFiltrosForm }"
            title="Filtros"
            @click="mostrarFiltros = !mostrarFiltros"
          >
            <i class="fas fa-filter"></i>
            <span v-if="temFiltrosForm" class="filter-badge">{{
              countFiltrosAtivos
            }}</span>
          </button>
          <div v-if="mostrarFiltros" class="filtros-dropdown-bi" @click.stop>
            <div class="filtros-header-bi">
              <span>Filtros</span>
              <button
                type="button"
                class="btn-limpar-filtros-bi"
                @click="limparFiltrosForm"
              >
                Limpar
              </button>
            </div>
            <div class="filtros-grid-bi">
              <div
                v-if="canShowClienteColumn"
                class="filtro-campo-bi filtro-cliente-autocomplete"
              >
                <label><i class="fa fa-search"></i> CLIENTE</label>
                <div
                  v-if="filtroClientes.length > 0"
                  class="filtro-cliente-chips"
                >
                  <span
                    v-for="(item, i) in filtroClientes"
                    :key="'chip-' + i"
                    class="filtro-cliente-chip"
                  >
                    {{
                      typeof item === 'object'
                        ? item.nome || item.nome_cliente || ''
                        : item
                    }}
                    <button
                      type="button"
                      class="filtro-cliente-chip-remove"
                      @mousedown.prevent="removerCliente(i)"
                      title="Remover"
                    >
                      &times;
                    </button>
                  </span>
                </div>
                <div
                  class="filtro-cliente-wrap"
                  :class="{ open: mostrarClienteDropdown }"
                >
                  <input
                    v-model.trim="filtroCliente"
                    type="text"
                    autocomplete="off"
                    @focus="onClienteFocus"
                    @input="onClienteInput"
                    @blur="fecharClienteDropdown"
                  />
                  <div
                    v-if="mostrarClienteDropdown"
                    class="filtro-cliente-dropdown"
                    @click.stop
                  >
                    <div
                      v-if="clientesBuscaLoading"
                      class="filtro-cliente-empty"
                    >
                      <i class="fas fa-spinner fa-spin"></i> Buscando...
                    </div>
                    <template v-else>
                      <div
                        v-for="c in clientesBuscaResultados"
                        :key="
                          'cli-' +
                          (c.no_seq || '') +
                          '-' +
                          (c.nome_cliente || '')
                        "
                        class="filtro-cliente-opt"
                        :class="{
                          disabled: filtroClientes.some(
                            x =>
                              (typeof x === 'object' ? x.nome : x) ===
                              (c.nome_cliente || c.nome_reduzido || '').trim()
                          ),
                        }"
                        @mousedown.prevent="adicionarCliente(c)"
                      >
                        {{ c.nome_cliente || c.nome_reduzido || '' }}
                        <span class="filtro-cliente-id">({{ c.no_seq }})</span>
                        <i
                          v-if="
                            filtroClientes.some(
                              x =>
                                (typeof x === 'object' ? x.nome : x) ===
                                (c.nome_cliente || c.nome_reduzido || '').trim()
                            )
                          "
                          class="fas fa-check filtro-cliente-check"
                        ></i>
                      </div>
                      <div
                        v-if="
                          clientesBuscaResultados.length === 0 &&
                          (filtroCliente || '').trim()
                        "
                        class="filtro-cliente-empty"
                      >
                        Nenhum cliente encontrado
                      </div>
                    </template>
                  </div>
                </div>
              </div>
              <div
                v-if="showFiltroArmazem"
                class="filtro-campo-bi filtro-armazem-multiplo"
              >
                <label><i class="fa fa-warehouse"></i> ARMAZÉM</label>
                <div
                  class="filtro-armazem-dropdown"
                  :class="{ open: mostrarArmazemDropdown }"
                >
                  <button
                    type="button"
                    class="filtro-armazem-trigger"
                    @click="mostrarArmazemDropdown = !mostrarArmazemDropdown"
                    :title="labelFiltroArmazem"
                  >
                    {{ labelFiltroArmazem }}
                    <i
                      class="fas fa-chevron-down"
                      :class="{ rotated: mostrarArmazemDropdown }"
                    ></i>
                  </button>
                  <div
                    v-if="mostrarArmazemDropdown"
                    class="filtro-armazem-opcoes"
                    @click.stop
                  >
                    <label
                      v-for="a in opcoesArmazemDistintos"
                      :key="'arm-' + a"
                      class="filtro-armazem-opt"
                      :class="{ checked: filtroArmazens.includes(a) }"
                    >
                      <span class="filtro-armazem-checkbox">
                        <i
                          v-if="filtroArmazens.includes(a)"
                          class="fas fa-check"
                        ></i>
                      </span>
                      <span class="filtro-armazem-text">{{ a }}</span>
                      <input
                        type="checkbox"
                        :checked="filtroArmazens.includes(a)"
                        @change="toggleFiltroArmazem(a)"
                        class="filtro-situacao-input-sr"
                      />
                    </label>
                  </div>
                </div>
              </div>
              <template v-if="biSubTab !== 'armazens'">
                <div v-if="showFiltroGerente" class="filtro-campo-bi">
                  <label><i class="fa fa-user-tie"></i> GERENTE</label>
                  <select v-model.trim="filtroGerente" class="filtro-select-bi">
                    <option value="">Todos</option>
                    <option
                      v-for="g in listaGestores"
                      :key="g.id || g.name"
                      :value="(g.name || g.user || '').toString().trim()"
                    >
                      {{ g.name || g.user || `ID ${g.id}` }}
                    </option>
                  </select>
                </div>
                <div v-if="showFiltroAdm" class="filtro-campo-bi">
                  <label><i class="fa fa-user-cog"></i> ADM (wcl)</label>
                  <select v-model="filtroAdm" class="filtro-select-bi">
                    <option value="">Todos</option>
                    <option
                      v-for="a in opcoesAdmDistintos"
                      :key="'adm-' + (a === null ? '_vazio' : a)"
                      :value="a === null ? '__VAZIO__' : a || ''"
                    >
                      {{ a === null || a === '' ? '(vazio)' : a }}
                    </option>
                  </select>
                </div>
                <div class="filtro-campo-bi">
                  <label>NF</label>
                  <input
                    v-model.trim="filtroNF"
                    type="text"
                    placeholder="Nº nota fiscal"
                  />
                </div>
                <div class="filtro-campo-bi">
                  <label>PEDIDO</label>
                  <input
                    v-model.trim="filtroPedido"
                    type="text"
                    placeholder="Nº pedido"
                  />
                </div>
                <div class="filtro-campo-bi filtro-situacao-multiplo">
                  <label>SITUACAO</label>
                  <div
                    class="filtro-situacao-dropdown"
                    :class="{ open: mostrarSituacaoDropdown }"
                  >
                    <button
                      type="button"
                      class="filtro-situacao-trigger"
                      @click="mostrarSituacaoDropdown = !mostrarSituacaoDropdown"
                      :title="labelFiltroSituacao"
                    >
                      {{ labelFiltroSituacao }}
                      <i
                        class="fas fa-chevron-down"
                        :class="{ rotated: mostrarSituacaoDropdown }"
                      ></i>
                    </button>
                    <div
                      v-if="mostrarSituacaoDropdown"
                      class="filtro-situacao-opcoes"
                      @click.stop
                    >
                      <label
                        class="filtro-situacao-opt filtro-situacao-opt-special"
                        :class="{ checked: filtroNaoEmbarcados }"
                      >
                        <span class="filtro-situacao-checkbox">
                          <i v-if="filtroNaoEmbarcados" class="fas fa-check"></i>
                        </span>
                        <span class="filtro-situacao-text">
                          <span>Não embarcados</span>
                          <small class="filtro-situacao-hint"
                            >todos exceto Emb. Conf.</small
                          >
                        </span>
                        <input
                          type="checkbox"
                          :checked="filtroNaoEmbarcados"
                          @change="toggleFiltroNaoEmbarcados"
                          class="filtro-situacao-input-sr"
                        />
                      </label>
                      <div class="filtro-situacao-divider"></div>
                      <label
                        v-for="s in opcoesSituacaoComEspeciais"
                        :key="s"
                        class="filtro-situacao-opt"
                        :class="{
                          checked: filtroSituacoes.includes(s),
                          disabled: filtroNaoEmbarcados,
                        }"
                      >
                        <span class="filtro-situacao-checkbox">
                          <i
                            v-if="filtroSituacoes.includes(s)"
                            class="fas fa-check"
                          ></i>
                        </span>
                        <span class="filtro-situacao-text">{{ s }}</span>
                        <input
                          type="checkbox"
                          :checked="filtroSituacoes.includes(s)"
                          :disabled="filtroNaoEmbarcados"
                          @change="toggleFiltroSituacao(s)"
                          class="filtro-situacao-input-sr"
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <div class="filtro-campo-bi">
                  <label>STATUS SEPARAÇÃO</label>
                  <select v-model.trim="filtroStatusSep" class="filtro-select-bi">
                    <option value="">Todos</option>
                    <option
                      v-for="s in opcoesStatusSepDistintos"
                      :key="'sep-' + s"
                      :value="s"
                    >
                      {{ s }}
                    </option>
                  </select>
                </div>
                <div class="filtro-campo-bi">
                  <label>STATUS EXPEDIÇÃO</label>
                  <select v-model.trim="filtroStatusExp" class="filtro-select-bi">
                    <option value="">Todos</option>
                    <option
                      v-for="s in opcoesStatusExpDistintos"
                      :key="'exp-' + s"
                      :value="s"
                    >
                      {{ s }}
                    </option>
                  </select>
                </div>
                <div v-if="showFiltroSla" class="filtro-campo-bi">
                  <label>SLA (contrato)</label>
                  <select v-model.trim="filtroSla" class="filtro-select-bi">
                    <option value="">Todos</option>
                    <option v-for="s in opcoesSlaDistintos" :key="s" :value="s">
                      {{ s }}
                    </option>
                  </select>
                </div>
                <div class="filtro-campo-bi">
                  <label>TRANSPORTADORA</label>
                  <select
                    v-model.trim="filtroTransportadora"
                    class="filtro-select-bi"
                  >
                    <option value="">Todas</option>
                    <option
                      v-for="t in opcoesTransportadoraDistintos"
                      :key="t"
                      :value="t"
                    >
                      {{ t }}
                    </option>
                  </select>
                </div>
                <div v-if="showFiltroLimiteExpedicao" class="filtro-campo-bi">
                  <label><i class="fa fa-calendar"></i> LIMITE EXPEDIÇÃO</label>
                  <div class="filtro-data-wrap-bi">
                    <input
                      v-model="filtroLimiteExpedicao"
                      type="date"
                      class="filtro-input-date-bi"
                      title="Selecionar data"
                    />
                    <button
                      v-if="filtroLimiteExpedicao"
                      type="button"
                      class="filtro-limpar-data-bi"
                      title="Limpar data"
                      @click="filtroLimiteExpedicao = ''"
                    >
                      <i class="fa fa-times"></i>
                    </button>
                  </div>
                </div>
                <div class="filtro-campo-bi">
                  <label
                    title="Filtra pelo dia em que o pedido foi separado (calendário local). Ex.: integrados em 31/03 com separação em 01/04."
                  >
                    <i class="fa fa-box-open"></i> DATA SEPARADO
                  </label>
                  <div class="filtro-data-wrap-bi">
                    <input
                      v-model="filtroDataSeparado"
                      type="date"
                      class="filtro-input-date-bi"
                      title="Data de separação (dia local)"
                    />
                    <button
                      v-if="filtroDataSeparado"
                      type="button"
                      class="filtro-limpar-data-bi"
                      title="Limpar data"
                      @click="filtroDataSeparado = ''"
                    >
                      <i class="fa fa-times"></i>
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Conteúdo SLA (flipper: gráficos vs cards totalizadores) -->
    <div v-show="biSubTab === 'sla'" class="sla-content">
      <!-- Mensagem quando não há dados (ex.: cliente novo, CNPJ ainda sem movimentação) -->
      <div v-if="semDadosParaAcompanhamento" class="bi-sem-dados-message">
        <div class="bi-sem-dados-inner">
          <i class="fas fa-chart-line bi-sem-dados-icon"></i>
          <h3 class="bi-sem-dados-title">Nenhum dado no período</h3>
          <p class="bi-sem-dados-text">
            Ao iniciar a operação será possível realizar o acompanhamento dos
            indicadores.
          </p>
          <p class="bi-sem-dados-hint">
            Altere o período ou os filtros e clique em
            <strong>Atualizar</strong> quando houver movimentação.
          </p>
        </div>
      </div>
      <div
        v-else
        class="sla-flipper-wrapper"
        @click.self="slaViewFlipped = !slaViewFlipped"
      >
        <div class="sla-flipper-inner" :class="{ flipped: slaViewFlipped }">
          <!-- Face frontal: gráficos de pizza + tabela pendentes -->
          <div class="sla-face sla-face-front">
            <!-- Cards com gráficos de rosca -->
            <div class="sla-cards-grid">
              <div class="sla-card">
                <h3 class="sla-card-title">PEDIDOS POR SLA SEPARAÇÃO</h3>
                <div class="sla-card-body">
                  <div class="sla-card-chart">
                    <canvas ref="chartSepSl" width="200" height="200"></canvas>
                    <div class="sla-donut-hole-mask" aria-hidden="true"></div>
                    <div
                      class="sla-chart-center"
                      :style="slaDonutCenterNumberStyle"
                    >
                      {{ formatarNumero(slaDonutCenterCount()) }}
                    </div>
                  </div>
                  <div class="sla-legend">
                    <span
                      v-for="(item, idx) in legendSepPedidos"
                      :key="idx"
                      class="legend-item"
                      :style="{ color: item.color }"
                    >
                      {{ item.label }} ({{ formatarNumero(item.count) }},
                      {{ formatarDecimal(item.pct) }}%)
                    </span>
                  </div>
                </div>
              </div>

              <div class="sla-card">
                <h3 class="sla-card-title">STATUS POR SLA SEPARAÇÃO</h3>
                <div class="sla-card-body">
                  <div class="sla-card-chart">
                    <canvas
                      ref="chartSepStatus"
                      width="200"
                      height="200"
                    ></canvas>
                    <div class="sla-donut-hole-mask" aria-hidden="true"></div>
                    <div
                      class="sla-chart-center"
                      :style="slaDonutCenterNumberStyle"
                    >
                      {{ formatarNumero(slaDonutCenterCount()) }}
                    </div>
                  </div>
                  <div class="sla-legend">
                    <span
                      v-for="(item, idx) in legendSepStatus"
                      :key="idx"
                      class="legend-item"
                      :style="{ color: item.color }"
                    >
                      {{ item.label }} ({{ formatarNumero(item.count) }},
                      {{ formatarDecimal(item.pct) }}%)
                    </span>
                  </div>
                </div>
              </div>

              <div class="sla-card">
                <h3 class="sla-card-title">PEDIDOS POR SLA EXPEDIÇÃO</h3>
                <div class="sla-card-body">
                  <div class="sla-card-chart">
                    <canvas ref="chartExpSl" width="200" height="200"></canvas>
                    <div class="sla-donut-hole-mask" aria-hidden="true"></div>
                    <div
                      class="sla-chart-center"
                      :style="slaDonutCenterNumberStyle"
                    >
                      {{ formatarNumero(slaDonutCenterCount()) }}
                    </div>
                  </div>
                  <div class="sla-legend">
                    <span
                      v-for="(item, idx) in legendExpPedidos"
                      :key="idx"
                      class="legend-item"
                      :style="{ color: item.color }"
                    >
                      {{ item.label }} ({{ formatarNumero(item.count) }},
                      {{ formatarDecimal(item.pct) }}%)
                    </span>
                  </div>
                </div>
              </div>

              <div class="sla-card">
                <h3 class="sla-card-title">STATUS POR SLA EXPEDIÇÃO</h3>
                <div class="sla-card-body">
                  <div class="sla-card-chart">
                    <canvas
                      ref="chartExpStatus"
                      width="200"
                      height="200"
                    ></canvas>
                    <div class="sla-donut-hole-mask" aria-hidden="true"></div>
                    <div
                      class="sla-chart-center"
                      :style="slaDonutCenterNumberStyle"
                    >
                      {{ formatarNumero(slaDonutCenterCount()) }}
                    </div>
                  </div>
                  <div class="sla-legend">
                    <span
                      v-for="(item, idx) in legendExpStatus"
                      :key="idx"
                      class="legend-item"
                      :style="{ color: item.color }"
                    >
                      {{ item.label }} ({{ formatarNumero(item.count) }},
                      {{ formatarDecimal(item.pct) }}%)
                    </span>
                  </div>
                </div>
              </div>

              <div class="sla-card">
                <h3 class="sla-card-title">TOTAL DE VOLUMES</h3>
                <div class="sla-card-body">
                  <div class="sla-card-chart">
                    <canvas
                      ref="chartVolumesProntos"
                      width="200"
                      height="200"
                    ></canvas>
                    <div class="sla-donut-hole-mask" aria-hidden="true"></div>
                    <div
                      class="sla-chart-center"
                      :style="slaDonutCenterNumberStyle"
                    >
                      {{ formatarNumero(totalVolumesProntos) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tabela de pedidos pendentes de embarque -->
            <div class="sla-table-section">
              <div class="sla-table-header">
                <h3 class="sla-table-title">
                  <template v-if="chartFilterExpedicaoAtivo"
                    >PEDIDOS (SLA EXPEDIÇÃO)
                    <span class="sla-table-title-count">{{
                      formatarNumero((filteredPedidosPendentes || []).length)
                    }}</span></template
                  >
                  <template v-else
                    >PEDIDOS PENDENTES DE EMBARQUE
                    <span class="sla-table-title-count">{{
                      formatarNumero((filteredPedidosPendentes || []).length)
                    }}</span></template
                  >
                  <span v-if="chartFilter" class="sla-filter-badge">
                    (Filtro: {{ chartFilter.value }})
                    <button
                      type="button"
                      class="btn-clear-filter"
                      @click="chartFilter = null"
                      title="Limpar filtro"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </span>
                </h3>
                <button
                  class="btn-refresh"
                  @click="loadSlaData"
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
              <div ref="tableWrapperFront" class="sla-table-wrapper">
                <table class="sla-table">
                  <thead>
                    <tr>
                      <th>SLA</th>
                      <th>CORTE</th>
                      <th v-if="canShowClienteColumn">CLIENTE</th>
                      <th>DP</th>
                      <th>NF</th>
                      <th>PEDIDO</th>
                      <th>SITUACAO</th>
                      <th>INTEGRADO</th>
                      <th>INICIO SLA</th>
                      <th>SEPARAÇÃO</th>
                      <th>STATUS SEPARAÇÃO</th>
                      <th>SEPARADO</th>
                      <th>EXPEDIÇÃO</th>
                      <th>STATUS EXPEDIÇÃO</th>
                      <th>LIMITE EXPEDIÇÃO</th>
                      <th>EXPEDIDO</th>
                      <th>TRANSPORTADORA</th>
                      <th>VOLUMES</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(pedido, idx) in pedidosParaTabela"
                      :key="pedido.id || idx"
                      :class="{ 'status-fora-prazo': isForaDoPrazo(pedido) }"
                    >
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{ getSlaLabel(pedido) }}
                      </td>
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{ pedido.corte || '12:00' }}
                      </td>
                      <td
                        v-if="canShowClienteColumn"
                        :style="getCellStyle('sepStatus', pedido)"
                      >
                        {{
                          truncate(
                            pedido.cliente ||
                              pedido.nome_destinatario ||
                              pedido.armazem ||
                              '-'
                          )
                        }}
                      </td>
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{ pedido.dp || '-' }}
                      </td>
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{
                          pedido.numeroNF ||
                          pedido.numero_nf ||
                          pedido.numeroPedido ||
                          '-'
                        }}
                      </td>
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{ pedido.numeroPedido || pedido.numero_pedido || '-' }}
                      </td>
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{ pedido.situacao || '-' }}
                      </td>
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{ formatDateTime(pedido.integrado) }}
                      </td>
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{ formatDate(pedido.inicio_sla || pedido.integrado) }}
                      </td>
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{ getSlaSeparacao(pedido) }}
                      </td>
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{ computeStatusSeparacao(pedido) }}
                      </td>
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{
                          pedido.separado
                            ? formatDateTime(pedido.separado)
                            : '-'
                        }}
                      </td>
                      <td :style="getCellStyle('expStatus', pedido)">
                        {{ getSlaExpedicao(pedido) }}
                      </td>
                      <td :style="getCellStyle('expStatus', pedido)">
                        {{ computeStatusExpedicao(pedido) }}
                      </td>
                      <td :style="getCellStyle('expStatus', pedido)">
                        {{ formatDate(pedido.limite) }}
                      </td>
                      <td :style="getCellStyle('expStatus', pedido)">
                        {{
                          pedido.expedido
                            ? formatDateTime(pedido.expedido)
                            : 'Pendente'
                        }}
                      </td>
                      <td :style="getCellStyle('expStatus', pedido)">
                        {{ pedido.transportadora || '-' }}
                      </td>
                      <td :style="getCellStyle('expStatus', pedido)">
                        {{
                          pedido.volumes != null
                            ? formatarNumero(pedido.volumes)
                            : '-'
                        }}
                      </td>
                    </tr>
                    <tr
                      v-if="
                        !loading &&
                        (filteredPedidosPendentes || []).length === 0
                      "
                    >
                      <td
                        :colspan="slaTableColspan"
                        class="empty-row"
                        :class="{ 'empty-row-error': loadError }"
                      >
                        <template v-if="loadError">
                          <i class="fas fa-exclamation-triangle"></i>
                          {{ loadError }}
                          <br /><small
                            >Clique no botão atualizar para tentar
                            novamente.</small
                          >
                        </template>
                        <template v-else>{{
                          chartFilter
                            ? chartFilterExpedicaoAtivo
                              ? 'Nenhum pedido corresponde ao filtro de SLA expedição.'
                              : 'Nenhum pedido corresponde ao filtro.'
                            : 'Nenhum pedido pendente de embarque'
                        }}</template>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="sla-table-pagination">
                <div class="sla-pagination-left">
                  <template
                    v-if="(filteredPedidosPendentes || []).length > pageSize"
                  >
                    <span class="sla-pagination-label">{{
                      paginationLabel
                    }}</span>
                    <div class="sla-pagination-buttons">
                      <button
                        type="button"
                        class="btn-pag-bi"
                        :disabled="currentPage <= 1"
                        title="Página anterior"
                        @click="currentPage = Math.max(1, currentPage - 1)"
                      >
                        <i class="fas fa-chevron-left"></i> Anterior
                      </button>
                      <button
                        type="button"
                        class="btn-pag-bi"
                        :disabled="currentPage >= totalPages"
                        title="Próxima página"
                        @click="
                          currentPage = Math.min(totalPages, currentPage + 1)
                        "
                      >
                        Próxima <i class="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  </template>
                </div>
                <span class="update-info update-info-pagination">
                  <i class="fas fa-sync-alt"></i>
                  Atualizado em {{ lastUpdateFormatted }}
                </span>
              </div>
            </div>
          </div>
          <!-- Face traseira: cards totalizadores + tabela todo o período -->
          <div class="sla-face sla-face-back">
            <!-- Cards totalizadores por etapa -->
            <div class="sla-totalizadores-block">
              <h3 class="sla-etapa-label">SEPARAÇÃO</h3>
              <div class="sla-totalizadores-row">
                <div
                  v-for="item in cardsSeparacao"
                  :key="'sep-' + item.key"
                  class="sla-totalizador-card"
                  :class="{ 'sla-totalizador-card-total': item.isTotal }"
                >
                  <div
                    class="sla-totalizador-value"
                    :style="slaGeralTotalizadorValueStyle"
                  >
                    {{ formatarNumero(item.count) }}
                  </div>
                  <div class="sla-totalizador-label">{{ item.label }}</div>
                  <div class="sla-totalizador-gauge">
                    <div
                      class="sla-gauge-bar"
                      :style="{
                        width: item.pct + '%',
                        backgroundColor: item.color,
                      }"
                    ></div>
                  </div>
                  <div
                    class="sla-totalizador-pct"
                    v-if="!item.isTotal"
                    :style="slaGeralTotalizadorPctStyle"
                  >
                    {{ formatarDecimal(item.pct) }}%
                  </div>
                </div>
              </div>
            </div>
            <div class="sla-totalizadores-block">
              <h3 class="sla-etapa-label">EXPEDIÇÃO</h3>
              <div class="sla-totalizadores-row">
                <div
                  v-for="item in cardsExpedicao"
                  :key="'exp-' + item.key"
                  class="sla-totalizador-card"
                  :class="{ 'sla-totalizador-card-total': item.isTotal }"
                >
                  <div
                    class="sla-totalizador-value"
                    :style="slaGeralTotalizadorValueStyle"
                  >
                    {{ formatarNumero(item.count) }}
                  </div>
                  <div class="sla-totalizador-label">{{ item.label }}</div>
                  <div class="sla-totalizador-gauge">
                    <div
                      class="sla-gauge-bar"
                      :style="{
                        width: item.pct + '%',
                        backgroundColor: item.color,
                      }"
                    ></div>
                  </div>
                  <div
                    class="sla-totalizador-pct"
                    v-if="!item.isTotal"
                    :style="slaGeralTotalizadorPctStyle"
                  >
                    {{ formatarDecimal(item.pct) }}%
                  </div>
                </div>
              </div>
            </div>
            <!-- Tabela: todo o período (sem filtro <> Emb. Conf.) -->
            <div class="sla-table-section">
              <div class="sla-table-header">
                <h3 class="sla-table-title">
                  <i
                    class="fas fa-filter"
                    @click.stop="mostrarFiltros = !mostrarFiltros"
                    style="cursor: pointer; margin-right: 0.35rem"
                  ></i>
                  PEDIDOS DETALHADOS
                  <span class="sla-filter-badge">{{
                    formatarNumero((filteredPedidosTodosPeriodo || []).length)
                  }}</span>
                </h3>
                <button
                  class="btn-refresh"
                  @click="loadSlaData"
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
              <div ref="tableWrapperBack" class="sla-table-wrapper">
                <table class="sla-table">
                  <thead>
                    <tr>
                      <th>SLA</th>
                      <th>CORTE</th>
                      <th v-if="canShowClienteColumn">CLIENTE</th>
                      <th>DP</th>
                      <th>NF</th>
                      <th>PEDIDO</th>
                      <th>SITUACAO</th>
                      <th>INTEGRADO</th>
                      <th>INICIO SLA</th>
                      <th>SEPARAÇÃO</th>
                      <th>STATUS SEPARAÇÃO</th>
                      <th>SEPARADO</th>
                      <th>EXPEDIÇÃO</th>
                      <th>STATUS EXPEDIÇÃO</th>
                      <th>LIMITE EXPEDIÇÃO</th>
                      <th>EXPEDIDO</th>
                      <th>TRANSPORTADORA</th>
                      <th>VOLUMES</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(pedido, idx) in pedidosParaTabelaGeral"
                      :key="'g-' + (pedido.id || idx)"
                      :class="{ 'status-fora-prazo': isForaDoPrazo(pedido) }"
                    >
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{ getSlaLabel(pedido) }}
                      </td>
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{ pedido.corte || '12:00' }}
                      </td>
                      <td
                        v-if="canShowClienteColumn"
                        :style="getCellStyle('sepStatus', pedido)"
                      >
                        {{
                          truncate(
                            pedido.cliente ||
                              pedido.nome_destinatario ||
                              pedido.armazem ||
                              '-'
                          )
                        }}
                      </td>
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{ pedido.dp || '-' }}
                      </td>
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{
                          pedido.numeroNF ||
                          pedido.numero_nf ||
                          pedido.numeroPedido ||
                          '-'
                        }}
                      </td>
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{ pedido.numeroPedido || pedido.numero_pedido || '-' }}
                      </td>
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{ pedido.situacao || '-' }}
                      </td>
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{ formatDateTime(pedido.integrado) }}
                      </td>
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{ formatDate(pedido.inicio_sla || pedido.integrado) }}
                      </td>
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{ getSlaSeparacao(pedido) }}
                      </td>
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{ computeStatusSeparacao(pedido) }}
                      </td>
                      <td :style="getCellStyle('sepStatus', pedido)">
                        {{
                          pedido.separado
                            ? formatDateTime(pedido.separado)
                            : '-'
                        }}
                      </td>
                      <td :style="getCellStyle('expStatus', pedido)">
                        {{ getSlaExpedicao(pedido) }}
                      </td>
                      <td :style="getCellStyle('expStatus', pedido)">
                        {{ computeStatusExpedicao(pedido) }}
                      </td>
                      <td :style="getCellStyle('expStatus', pedido)">
                        {{ formatDate(pedido.limite) }}
                      </td>
                      <td :style="getCellStyle('expStatus', pedido)">
                        {{
                          pedido.expedido
                            ? formatDateTime(pedido.expedido)
                            : 'Pendente'
                        }}
                      </td>
                      <td :style="getCellStyle('expStatus', pedido)">
                        {{ pedido.transportadora || '-' }}
                      </td>
                      <td :style="getCellStyle('expStatus', pedido)">
                        {{
                          pedido.volumes != null
                            ? formatarNumero(pedido.volumes)
                            : '-'
                        }}
                      </td>
                    </tr>
                    <tr
                      v-if="
                        !loading &&
                        (filteredPedidosTodosPeriodo || []).length === 0
                      "
                    >
                      <td
                        :colspan="slaTableColspan"
                        class="empty-row"
                        :class="{ 'empty-row-error': loadError }"
                      >
                        <template v-if="loadError">{{ loadError }}</template>
                        <template v-else>Nenhum pedido no período</template>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="sla-table-pagination">
                <div class="sla-pagination-left">
                  <template
                    v-if="(filteredPedidosTodosPeriodo || []).length > pageSize"
                  >
                    <span class="sla-pagination-label">{{
                      paginationLabelGeral
                    }}</span>
                    <div class="sla-pagination-buttons">
                      <button
                        type="button"
                        class="btn-pag-bi"
                        :disabled="currentPageGeral <= 1"
                        title="Página anterior"
                        @click.stop="
                          currentPageGeral = Math.max(1, currentPageGeral - 1)
                        "
                      >
                        <i class="fas fa-chevron-left"></i> Anterior
                      </button>
                      <button
                        type="button"
                        class="btn-pag-bi"
                        :disabled="currentPageGeral >= totalPagesGeral"
                        title="Próxima página"
                        @click.stop="
                          currentPageGeral = Math.min(
                            totalPagesGeral,
                            currentPageGeral + 1
                          )
                        "
                      >
                        Próxima <i class="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  </template>
                </div>
                <span class="update-info update-info-pagination">
                  <i class="fas fa-sync-alt"></i>
                  Atualizado em {{ lastUpdateFormatted }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Análise Armazéns -->
    <div v-show="biSubTab === 'armazens'" class="bi-armazens-content">
      <header
        class="bi-armazens-hero"
        aria-label="Cabeçalho do painel Armazéns"
      >
        <div class="bi-armazens-hero-main">
          <p class="bi-armazens-hero-kicker">
            Painel operacional e financeiro ·
            {{ labelArmazensPeriodoMesesFechados }}
          </p>
        </div>
        <span class="bi-armazens-hero-badge" title="Período selecionado">
          {{ labelArmazensPeriodoMesesFechados }}
        </span>
      </header>
      <div class="bi-armazens-intro-card">
        <div class="bi-armazens-intro-card-header">
          <h2 class="bi-armazens-intro-card-title">
            Painel operacional e financeiro
          </h2>
          <div
            class="bi-armazens-help-wrap"
            @mouseleave="armazensAjudaLeave('intro_painel')"
          >
            <button
              type="button"
              class="bi-armazens-help-btn"
              data-armazens-ajuda="intro_painel"
              aria-label="Origem dos dados e cálculos deste painel"
              :aria-expanded="armazensAjudaPinnedKey === 'intro_painel'"
              @mouseenter="armazensAjudaEnter('intro_painel', $event)"
              @click.stop="armazensAjudaToggle('intro_painel', $event)"
            >
              <svg
                class="bi-armazens-help-ico"
                viewBox="0 0 14 14"
                width="14"
                height="14"
                aria-hidden="true"
              >
                <circle
                  cx="7"
                  cy="7"
                  r="6"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.25"
                />
                <text
                  x="7"
                  y="10.2"
                  text-anchor="middle"
                  font-size="8.5"
                  font-weight="700"
                  fill="currentColor"
                  font-family="system-ui, -apple-system, sans-serif"
                >
                  ?
                </text>
              </svg>
            </button>
            <div
              v-if="armazensAjudaBloco('intro_painel')"
              v-show="armazensAjudaHelpPainelPronto('intro_painel')"
              class="bi-armazens-help-panel"
              role="tooltip"
              :style="armazensAjudaPanelStyle('intro_painel')"
            >
              <p class="bi-armazens-help-panel-title">
                {{ armazensAjudaBloco('intro_painel').titulo }}
              </p>
              <ul class="bi-armazens-help-panel-list">
                <li
                  v-for="(txt, li) in armazensAjudaItensResolvidos(
                    'intro_painel'
                  )"
                  :key="li"
                >
                  {{ txt }}
                </li>
              </ul>
            </div>
          </div>
        </div>
        <p class="bi-armazens-intro-text">
          O período é o definido no calendário. Os cartões consolidam o
          intervalo; os gráficos mostram a
          <strong>evolução mês a mês</strong> para enxergar tendência. Custos
          vêm do levantamento mensal (sem filtro por cliente). Unidades e PP
          ocupadas respeitam armazém e cliente quando aplicável.
        </p>
      </div>

      <section
        class="bi-armazens-section"
        aria-labelledby="armazens-resumo-heading"
      >
        <h3 id="armazens-resumo-heading" class="bi-armazens-section-title">
          Resumo empresa
        </h3>
        <p class="bi-armazens-section-lead bi-armazens-resumo-lead">
          12 indicadores numa linha (largura do ecrã); 1ª = custo operação
          (período) e custo total do cliente (cliente), alinhados; blocos azuis
          e amarelos agrupados.
        </p>
        <div
          class="bi-armazens-resumo-group-cards bi-armazens-resumo-strip bi-armazens-resumo-strip--alinhado"
        >
          <div
            v-for="d in armazensResumoCelulasPeriodo"
            :key="d.id"
            class="bi-armazens-resumo-slot"
            :class="{ 'bi-armazens-resumo-slot--vazio': d.empty }"
          >
            <div
              v-if="!d.empty && d.m"
              class="bi-armazens-card"
              :class="{
                'bi-armazens-card--pp': armazensCardEhPpMetrica(d.m),
                'bi-armazens-card--fatura': armazensCardEhFaturaCliente(d.m),
                'bi-armazens-card--custo-op': armazensCardEhCustoTotalOperacao(
                  d.m
                ),
                'bi-armazens-card--unidade': armazensCardTituloMencionaUnidade(
                  d.m
                ),
                'bi-armazens-card--func-pessoa':
                  armazensCardEhFuncionarioPessoaKpi(d.m),
                'bi-armazens-card--pct-cd': armazensCardEhPctCustoClienteCd(
                  d.m
                ),
              }"
            >
              <div class="bi-armazens-card-header">
                <span class="bi-armazens-card-titulo">{{ d.m.titulo }}</span>
                <div class="bi-armazens-card-header-actions">
                  <div
                    v-if="armazensAjudaBloco(d.m.id)"
                    class="bi-armazens-help-wrap"
                    @mouseleave="armazensAjudaLeave(d.m.id)"
                  >
                    <button
                      type="button"
                      class="bi-armazens-help-btn"
                      :data-armazens-ajuda="d.m.id"
                      :aria-label="'Origem dos dados: ' + d.m.titulo"
                      :aria-expanded="armazensAjudaPinnedKey === d.m.id"
                      @mouseenter="armazensAjudaEnter(d.m.id, $event)"
                      @click.stop="armazensAjudaToggle(d.m.id, $event)"
                    >
                      <svg
                        class="bi-armazens-help-ico"
                        viewBox="0 0 14 14"
                        width="14"
                        height="14"
                        aria-hidden="true"
                      >
                        <circle
                          cx="7"
                          cy="7"
                          r="6"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.25"
                        />
                        <text
                          x="7"
                          y="10.2"
                          text-anchor="middle"
                          font-size="8.5"
                          font-weight="700"
                          fill="currentColor"
                          font-family="system-ui, -apple-system, sans-serif"
                        >
                          ?
                        </text>
                      </svg>
                    </button>
                    <div
                      v-show="armazensAjudaHelpPainelPronto(d.m.id)"
                      class="bi-armazens-help-panel"
                      role="tooltip"
                      :style="armazensAjudaPanelStyle(d.m.id)"
                    >
                      <p class="bi-armazens-help-panel-title">
                        {{ armazensAjudaBloco(d.m.id).titulo }}
                      </p>
                      <ul class="bi-armazens-help-panel-list">
                        <li
                          v-for="(txt, li) in armazensAjudaItensResolvidos(
                            d.m.id
                          )"
                          :key="li"
                        >
                          {{ txt }}
                        </li>
                      </ul>
                    </div>
                  </div>
                  <i
                    class="fas bi-armazens-card-icon"
                    :class="armazensKpiIconClass(d.m.id)"
                    aria-hidden="true"
                  ></i>
                </div>
              </div>
              <div class="bi-armazens-card-valor">
                <template v-if="d.m.id === 'custo_ops_ab'">
                  <span v-if="armazensCustoTotalOperacaoLoading"
                    ><i class="fas fa-spinner fa-spin"></i
                  ></span>
                  <template v-else-if="armazensCustoTotalOperacao != null">
                    <span class="bi-armazens-card-unidade">R$</span>
                    {{ formatarDecimal(armazensCustoTotalOperacao) }}
                  </template>
                  <span v-else>{{ d.m.valor }}</span>
                </template>
                <template v-else-if="d.m.id === 'custo_total_pp'">
                  <span v-if="armazensCustoTotalPpItensLoading"
                    ><i class="fas fa-spinner fa-spin"></i
                  ></span>
                  <template v-else-if="armazensCustoTotalPpItens != null">
                    <span class="bi-armazens-card-unidade">R$</span>
                    {{ formatarDecimal(armazensCustoTotalPpItens) }}
                  </template>
                  <span v-else>{{ d.m.valor }}</span>
                </template>
                <template v-else-if="d.m.id === 'unidades_atendidas'">
                  <span v-if="armazensTotalUnidadesLoading"
                    ><i class="fas fa-spinner fa-spin"></i
                  ></span>
                  <span v-else-if="armazensTotalUnidades != null">{{
                    formatarInteiroBr(armazensTotalUnidades)
                  }}</span>
                  <span v-else>{{ d.m.valor }}</span>
                </template>
                <template v-else-if="d.m.id === 'total_pp_ocupadas'">
                  <span v-if="armazensTotalPosicoesPaletesLoading"
                    ><i class="fas fa-spinner fa-spin"></i
                  ></span>
                  <span v-else-if="armazensTotalPosicoesPaletes != null">{{
                    formatarInteiroBr(armazensTotalPosicoesPaletes)
                  }}</span>
                  <span v-else>{{ d.m.valor }}</span>
                </template>
                <template v-else-if="d.m.id === 'custo_por_pp'">
                  <span v-if="armazensCustoPpPorUnidadeLoading"
                    ><i class="fas fa-spinner fa-spin"></i
                  ></span>
                  <template v-else-if="armazensCustoPpPorUnidadeValor != null">
                    <span class="bi-armazens-card-unidade">R$</span>
                    {{ formatarDecimal(armazensCustoPpPorUnidadeValor) }}
                  </template>
                  <span v-else>—</span>
                </template>
                <template v-else-if="d.m.id === 'func_clt'">
                  <span v-if="armazensFuncCltLoading"
                    ><i class="fas fa-spinner fa-spin"></i
                  ></span>
                  <span v-else-if="armazensFuncCltMedia != null">{{
                    formatarInteiroBr(armazensFuncCltMedia)
                  }}</span>
                  <span v-else>—</span>
                </template>
                <template v-else-if="d.m.id === 'custo_por_pessoa'">
                  <span v-if="armazensCustoPorPessoaOperacaoRhLoading"
                    ><i class="fas fa-spinner fa-spin"></i
                  ></span>
                  <template
                    v-else-if="armazensCustoPorPessoaOperacaoRh != null"
                  >
                    <span class="bi-armazens-card-unidade">R$</span>
                    {{ formatarDecimal(armazensCustoPorPessoaOperacaoRh) }}
                  </template>
                  <span v-else>—</span>
                </template>
                <template v-else-if="d.m.id === 'unid_por_func'">
                  <span v-if="armazensUnidadesPorFuncLoading"
                    ><i class="fas fa-spinner fa-spin"></i
                  ></span>
                  <span v-else-if="armazensUnidadesPorFuncValor != null">{{
                    formatarInteiroBr(armazensUnidadesPorFuncValor)
                  }}</span>
                  <span v-else>—</span>
                </template>
                <template v-else-if="d.m.id === 'custo_atend_unidade'">
                  <span v-if="armazensCustoAtendimentoPorUnidadeLoading"
                    ><i class="fas fa-spinner fa-spin"></i
                  ></span>
                  <template
                    v-else-if="armazensCustoAtendimentoPorUnidadeValor != null"
                  >
                    <span class="bi-armazens-card-unidade">R$</span>
                    {{
                      formatarDecimal(armazensCustoAtendimentoPorUnidadeValor)
                    }}
                  </template>
                  <span v-else>—</span>
                </template>
                <template v-else-if="d.m.id === 'custo_func_dedicado'">
                  <template v-if="typeof d.m.valor === 'number'">
                    <span class="bi-armazens-card-unidade">R$</span>
                    {{ formatarDecimal(d.m.valor) }}
                  </template>
                  <span v-else>—</span>
                </template>
                <template v-else-if="d.m.id === 'custo_total_cliente'">
                  <span class="bi-armazens-card-unidade">R$</span>
                  {{
                    typeof d.m.valor === 'number'
                      ? formatarDecimal(d.m.valor)
                      : d.m.valor
                  }}
                </template>
                <template v-else-if="d.m.id === 'pct_custo_cliente_cd'">
                  {{
                    typeof d.m.valor === 'number'
                      ? formatarDecimal(d.m.valor)
                      : d.m.valor
                  }}<span class="bi-armazens-card-unidade">%</span>
                </template>
                <template v-else-if="d.m.id === 'faturamento_cliente'">
                  <span v-if="armazensPeriodoFaturaLegadoLoading"
                    ><i class="fas fa-spinner fa-spin"></i
                  ></span>
                  <template
                    v-else-if="
                      armazensPeriodoFaturaLegadoLinhas > 0 &&
                      armazensPeriodoFaturaLegadoTotal != null
                    "
                  >
                    <span class="bi-armazens-card-unidade">R$</span>
                    {{ formatarDecimal(armazensPeriodoFaturaLegadoTotal) }}
                  </template>
                  <span
                    v-else-if="armazensPeriodoFaturaLegadoErro"
                    class="bi-armazens-card-erro"
                    >{{ armazensPeriodoFaturaLegadoErro }}</span
                  >
                  <span v-else>—</span>
                </template>
                <template v-else-if="d.m.unidade === '%'"
                  >{{
                    typeof d.m.valor === 'number'
                      ? formatarDecimal(d.m.valor)
                      : d.m.valor
                  }}<span class="bi-armazens-card-unidade">%</span></template
                >
                <template v-else-if="d.m.unidade === 'R$'"
                  ><span class="bi-armazens-card-unidade">R$</span>
                  {{
                    typeof d.m.valor === 'number'
                      ? formatarDecimal(d.m.valor)
                      : d.m.valor
                  }}</template
                >
                <template v-else>{{ d.m.valor }}</template>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        v-if="armazensVisaoClienteResumo"
        class="bi-armazens-section"
        aria-labelledby="armazens-resumo-cliente-heading"
      >
        <h3
          id="armazens-resumo-cliente-heading"
          class="bi-armazens-section-title"
        >
          Resumo cliente
        </h3>
        <p class="bi-armazens-section-lead bi-armazens-resumo-lead">
          Colunas alinhadas ao resumo empresa; sem dado, a célula fica vazia.
        </p>
        <div
          class="bi-armazens-resumo-group-cards bi-armazens-resumo-strip bi-armazens-resumo-strip--alinhado"
        >
          <div
            v-for="d in armazensResumoCelulasCliente"
            :key="`${d.id}-cliente-slot`"
            class="bi-armazens-resumo-slot"
            :class="{ 'bi-armazens-resumo-slot--vazio': d.empty }"
          >
            <div
              v-if="!d.empty && d.m"
              class="bi-armazens-card"
              :class="{
                'bi-armazens-card--pp': armazensCardEhPpMetrica(d.m),
                'bi-armazens-card--fatura': armazensCardEhFaturaCliente(d.m),
                'bi-armazens-card--custo-op': armazensCardEhCustoTotalOperacao(
                  d.m
                ),
                'bi-armazens-card--unidade': armazensCardTituloMencionaUnidade(
                  d.m
                ),
                'bi-armazens-card--func-pessoa':
                  armazensCardEhFuncionarioPessoaKpi(d.m),
                'bi-armazens-card--pct-cd': armazensCardEhPctCustoClienteCd(
                  d.m
                ),
              }"
            >
              <div class="bi-armazens-card-header">
                <span class="bi-armazens-card-titulo">{{ d.m.titulo }}</span>
                <i
                  class="fas bi-armazens-card-icon"
                  :class="armazensKpiIconClass(d.m.id)"
                  aria-hidden="true"
                ></i>
              </div>
              <div class="bi-armazens-card-valor">
                <template v-if="d.m.id === 'custo_ops_ab'">
                  <span>—</span>
                </template>
                <template v-else-if="d.m.id === 'custo_total_pp'">
                  <span>—</span>
                </template>
                <template v-else-if="d.m.id === 'unidades_atendidas'">
                  <span v-if="armazensClienteTotalUnidadesLoading"
                    ><i class="fas fa-spinner fa-spin"></i
                  ></span>
                  <span v-else-if="armazensClienteTotalUnidades != null">{{
                    formatarInteiroBr(armazensClienteTotalUnidades)
                  }}</span>
                  <span v-else>—</span>
                </template>
                <template v-else-if="d.m.id === 'total_pp_ocupadas'">
                  <span v-if="armazensClienteTotalPosicoesPaletesLoading"
                    ><i class="fas fa-spinner fa-spin"></i
                  ></span>
                  <span
                    v-else-if="armazensClienteTotalPosicoesPaletes != null"
                    >{{
                      formatarInteiroBr(armazensClienteTotalPosicoesPaletes)
                    }}</span
                  >
                  <span v-else>—</span>
                </template>
                <template v-else-if="d.m.id === 'custo_por_pp'">
                  <span v-if="armazensCustoTotalPpAlocadoClienteLoading"
                    ><i class="fas fa-spinner fa-spin"></i
                  ></span>
                  <template
                    v-else-if="armazensCustoTotalPpAlocadoClienteValor != null"
                  >
                    <span class="bi-armazens-card-unidade">R$</span>
                    {{
                      formatarDecimal(armazensCustoTotalPpAlocadoClienteValor)
                    }}
                  </template>
                  <span v-else>—</span>
                </template>
                <template v-else-if="d.m.id === 'func_clt'">
                  <span v-if="armazensClienteFuncCltProporcionalLoading"
                    ><i class="fas fa-spinner fa-spin"></i
                  ></span>
                  <span
                    v-else-if="armazensClienteFuncCltProporcionalValor != null"
                    >{{
                      formatarInteiroBr(armazensClienteFuncCltProporcionalValor)
                    }}</span
                  >
                  <span v-else>—</span>
                </template>
                <template v-else-if="d.m.id === 'custo_por_pessoa'">
                  <span v-if="armazensClienteCustoPorPessoaOperacaoLoading"
                    ><i class="fas fa-spinner fa-spin"></i
                  ></span>
                  <template
                    v-else-if="
                      armazensClienteCustoPorPessoaOperacaoValor != null
                    "
                  >
                    <span class="bi-armazens-card-unidade">R$</span>
                    {{
                      formatarDecimal(
                        armazensClienteCustoPorPessoaOperacaoValor
                      )
                    }}
                  </template>
                  <span v-else>—</span>
                </template>
                <template v-else-if="d.m.id === 'custo_atend_unidade'">
                  <span v-if="armazensClienteCustoAtendimentoPorUnidadeLoading"
                    ><i class="fas fa-spinner fa-spin"></i
                  ></span>
                  <template
                    v-else-if="
                      armazensClienteCustoAtendimentoPorUnidadeValor != null
                    "
                  >
                    <span class="bi-armazens-card-unidade">R$</span>
                    {{
                      formatarDecimal(
                        armazensClienteCustoAtendimentoPorUnidadeValor
                      )
                    }}
                  </template>
                  <span v-else>—</span>
                </template>
                <template v-else-if="d.m.id === 'custo_func_dedicado'">
                  <span>—</span>
                </template>
                <template v-else-if="d.m.id === 'custo_total_cliente'">
                  <span v-if="armazensClienteCustoTotalPorClienteLoading"
                    ><i class="fas fa-spinner fa-spin"></i
                  ></span>
                  <template
                    v-else-if="armazensClienteCustoTotalPorClienteValor != null"
                  >
                    <span class="bi-armazens-card-unidade">R$</span>
                    {{
                      formatarDecimal(armazensClienteCustoTotalPorClienteValor)
                    }}
                  </template>
                  <span v-else>—</span>
                </template>
                <template v-else-if="d.m.id === 'pct_custo_cliente_cd'">
                  <span v-if="armazensClientePctCustoTotalNoCdLoading"
                    ><i class="fas fa-spinner fa-spin"></i
                  ></span>
                  <template
                    v-else-if="armazensClientePctCustoTotalNoCdValor != null"
                  >
                    {{ formatarDecimal(armazensClientePctCustoTotalNoCdValor)
                    }}<span class="bi-armazens-card-unidade">%</span>
                  </template>
                  <span v-else>—</span>
                </template>
                <template v-else-if="d.m.id === 'faturamento_cliente'">
                  <span v-if="armazensClienteFaturaLegadoLoading"
                    ><i class="fas fa-spinner fa-spin"></i
                  ></span>
                  <template
                    v-else-if="
                      armazensClienteFaturaLegadoLinhas > 0 &&
                      armazensClienteFaturaLegadoTotal != null
                    "
                  >
                    <span class="bi-armazens-card-unidade">R$</span>
                    {{ formatarDecimal(armazensClienteFaturaLegadoTotal) }}
                  </template>
                  <span
                    v-else-if="armazensClienteFaturaLegadoErro"
                    class="bi-armazens-card-erro"
                    >{{ armazensClienteFaturaLegadoErro }}</span
                  >
                  <span v-else>—</span>
                </template>
                <template v-else-if="d.m.unidade === '%'"
                  >{{
                    typeof d.m.valor === 'number'
                      ? formatarDecimal(d.m.valor)
                      : d.m.valor
                  }}<span class="bi-armazens-card-unidade">%</span></template
                >
                <template v-else-if="d.m.unidade === 'R$'"
                  ><span class="bi-armazens-card-unidade">R$</span>
                  {{
                    typeof d.m.valor === 'number'
                      ? formatarDecimal(d.m.valor)
                      : d.m.valor
                  }}</template
                >
                <template v-else>{{ d.m.valor }}</template>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        class="bi-armazens-section bi-armazens-section--evolucao"
        aria-labelledby="armazens-evolucao-heading"
      >
        <h3 id="armazens-evolucao-heading" class="bi-armazens-section-title">
          Evolução mensal
        </h3>
        <p class="bi-armazens-section-lead">
          Custo da operação, paletes ocupados e unidades atendidas ao longo do
          tempo.
        </p>
        <p v-if="armazensEvolucaoErro" class="bi-armazens-evolucao-erro">
          <i class="fas fa-exclamation-circle"></i> {{ armazensEvolucaoErro }}
        </p>
        <div v-else class="bi-armazens-charts-dashboard">
          <div class="bi-armazens-chart-card bi-armazens-chart-card--line">
            <div class="bi-armazens-chart-head">
              <h4 class="bi-armazens-chart-title">Evolução mensal</h4>
              <div
                class="bi-armazens-help-wrap"
                @mouseleave="armazensAjudaLeave('chart-evolucao')"
              >
                <button
                  type="button"
                  class="bi-armazens-help-btn"
                  data-armazens-ajuda="chart-evolucao"
                  aria-label="Origem dos dados: gráfico evolução mensal"
                  :aria-expanded="armazensAjudaPinnedKey === 'chart-evolucao'"
                  @mouseenter="armazensAjudaEnter('chart-evolucao', $event)"
                  @click.stop="armazensAjudaToggle('chart-evolucao', $event)"
                >
                  <svg
                    class="bi-armazens-help-ico"
                    viewBox="0 0 14 14"
                    width="14"
                    height="14"
                    aria-hidden="true"
                  >
                    <circle
                      cx="7"
                      cy="7"
                      r="6"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.25"
                    />
                    <text
                      x="7"
                      y="10.2"
                      text-anchor="middle"
                      font-size="8.5"
                      font-weight="700"
                      fill="currentColor"
                      font-family="system-ui, -apple-system, sans-serif"
                    >
                      ?
                    </text>
                  </svg>
                </button>
                <div
                  v-if="armazensAjudaBloco('chart-evolucao')"
                  v-show="armazensAjudaHelpPainelPronto('chart-evolucao')"
                  class="bi-armazens-help-panel"
                  role="tooltip"
                  :style="armazensAjudaPanelStyle('chart-evolucao')"
                >
                  <p class="bi-armazens-help-panel-title">
                    {{ armazensAjudaBloco('chart-evolucao').titulo }}
                  </p>
                  <ul class="bi-armazens-help-panel-list">
                    <li
                      v-for="(txt, li) in armazensAjudaItensResolvidos(
                        'chart-evolucao'
                      )"
                      :key="li"
                    >
                      {{ txt }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <p class="bi-armazens-chart-sub">
              Custo da operação, paletes ocupados e unidades atendidas
            </p>
            <div
              class="bi-armazens-chart-wrap bi-armazens-chart-wrap--evolucao"
            >
              <canvas ref="chartArmazensEvolucaoMensal"></canvas>
              <div
                v-if="armazensEvolucaoLoading"
                class="bi-armazens-chart-overlay"
              >
                <i class="fas fa-spinner fa-spin"></i>
              </div>
            </div>
          </div>
          <div class="bi-armazens-chart-card bi-armazens-chart-card--donut">
            <div class="bi-armazens-chart-head">
              <h4 class="bi-armazens-chart-title">Composição de custos</h4>
              <div
                class="bi-armazens-help-wrap"
                @mouseleave="armazensAjudaLeave('chart-composicao')"
              >
                <button
                  type="button"
                  class="bi-armazens-help-btn"
                  data-armazens-ajuda="chart-composicao"
                  aria-label="Origem dos dados: composição de custos"
                  :aria-expanded="armazensAjudaPinnedKey === 'chart-composicao'"
                  @mouseenter="armazensAjudaEnter('chart-composicao', $event)"
                  @click.stop="armazensAjudaToggle('chart-composicao', $event)"
                >
                  <svg
                    class="bi-armazens-help-ico"
                    viewBox="0 0 14 14"
                    width="14"
                    height="14"
                    aria-hidden="true"
                  >
                    <circle
                      cx="7"
                      cy="7"
                      r="6"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.25"
                    />
                    <text
                      x="7"
                      y="10.2"
                      text-anchor="middle"
                      font-size="8.5"
                      font-weight="700"
                      fill="currentColor"
                      font-family="system-ui, -apple-system, sans-serif"
                    >
                      ?
                    </text>
                  </svg>
                </button>
                <div
                  v-if="armazensAjudaBloco('chart-composicao')"
                  v-show="armazensAjudaHelpPainelPronto('chart-composicao')"
                  class="bi-armazens-help-panel"
                  role="tooltip"
                  :style="armazensAjudaPanelStyle('chart-composicao')"
                >
                  <p class="bi-armazens-help-panel-title">
                    {{ armazensAjudaBloco('chart-composicao').titulo }}
                  </p>
                  <ul class="bi-armazens-help-panel-list">
                    <li
                      v-for="(txt, li) in armazensAjudaItensResolvidos(
                        'chart-composicao'
                      )"
                      :key="li"
                    >
                      {{ txt }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <p class="bi-armazens-chart-sub">
              As 5 maiores despesas no período (valores em R$; % sobre o custo
              total da operação)
            </p>
            <p
              v-if="armazensComposicaoErro"
              class="bi-armazens-composicao-erro"
            >
              <i class="fas fa-exclamation-circle"></i>
              {{ armazensComposicaoErro }}
            </p>
            <div
              v-else
              class="bi-armazens-chart-wrap bi-armazens-chart-wrap--donut"
            >
              <canvas ref="chartArmazensComposicaoCustos"></canvas>
              <div
                v-if="armazensComposicaoLoading"
                class="bi-armazens-chart-overlay"
              >
                <i class="fas fa-spinner fa-spin"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        class="bi-armazens-section bi-armazens-section--recomendadas"
        aria-labelledby="armazens-recomendadas-heading"
      >
        <h3
          id="armazens-recomendadas-heading"
          class="bi-armazens-section-title"
        >
          Análises recomendadas
        </h3>
        <p class="bi-armazens-section-lead bi-armazens-section-lead--muted">
          Complemento à evolução mensal: custo unitário e comparativo de armazéns
          (com filtro de armazém, o comparativo mostra só os selecionados; sem filtro,
          uma barra por código de estabelecimento presente no levantamento do período).
        </p>
        <div class="bi-armazens-recomendadas-grid">
          <div class="bi-armazens-chart-card bi-armazens-chart-card--rec">
            <div class="bi-armazens-chart-head">
              <h4 class="bi-armazens-chart-title">
                Custo por unidade ao longo do tempo
              </h4>
              <div
                class="bi-armazens-help-wrap"
                @mouseleave="armazensAjudaLeave('chart-custo-unidade')"
              >
                <button
                  type="button"
                  class="bi-armazens-help-btn"
                  data-armazens-ajuda="chart-custo-unidade"
                  aria-label="Origem dos dados: custo por unidade"
                  :aria-expanded="
                    armazensAjudaPinnedKey === 'chart-custo-unidade'
                  "
                  @mouseenter="armazensAjudaEnter('chart-custo-unidade', $event)"
                  @click.stop="armazensAjudaToggle('chart-custo-unidade', $event)"
                >
                  <svg
                    class="bi-armazens-help-ico"
                    viewBox="0 0 14 14"
                    width="14"
                    height="14"
                    aria-hidden="true"
                  >
                    <circle
                      cx="7"
                      cy="7"
                      r="6"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.25"
                    />
                    <text
                      x="7"
                      y="10.2"
                      text-anchor="middle"
                      font-size="8.5"
                      font-weight="700"
                      fill="currentColor"
                      font-family="system-ui, -apple-system, sans-serif"
                    >
                      ?
                    </text>
                  </svg>
                </button>
                <div
                  v-if="armazensAjudaBloco('chart-custo-unidade')"
                  v-show="armazensAjudaHelpPainelPronto('chart-custo-unidade')"
                  class="bi-armazens-help-panel"
                  role="tooltip"
                  :style="armazensAjudaPanelStyle('chart-custo-unidade')"
                >
                  <p class="bi-armazens-help-panel-title">
                    {{ armazensAjudaBloco('chart-custo-unidade').titulo }}
                  </p>
                  <ul class="bi-armazens-help-panel-list">
                    <li
                      v-for="(txt, li) in armazensAjudaItensResolvidos(
                        'chart-custo-unidade'
                      )"
                      :key="li"
                    >
                      {{ txt }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <p class="bi-armazens-chart-sub">
              Evolução do custo unitário (R$/unidade) — tendência de eficiência
            </p>
            <div class="bi-armazens-chart-wrap bi-armazens-chart-wrap--rec">
              <canvas ref="chartArmazensRecCustoUnidade"></canvas>
            </div>
          </div>
          <div class="bi-armazens-chart-card bi-armazens-chart-card--rec">
            <div class="bi-armazens-chart-head">
              <h4 class="bi-armazens-chart-title">Comparativo armazém</h4>
              <div
                class="bi-armazens-help-wrap"
                @mouseleave="armazensAjudaLeave('chart-compare-cd')"
              >
                <button
                  type="button"
                  class="bi-armazens-help-btn"
                  data-armazens-ajuda="chart-compare-cd"
                  aria-label="Origem dos dados: comparativo por armazém"
                  :aria-expanded="armazensAjudaPinnedKey === 'chart-compare-cd'"
                  @mouseenter="armazensAjudaEnter('chart-compare-cd', $event)"
                  @click.stop="armazensAjudaToggle('chart-compare-cd', $event)"
                >
                  <svg
                    class="bi-armazens-help-ico"
                    viewBox="0 0 14 14"
                    width="14"
                    height="14"
                    aria-hidden="true"
                  >
                    <circle
                      cx="7"
                      cy="7"
                      r="6"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.25"
                    />
                    <text
                      x="7"
                      y="10.2"
                      text-anchor="middle"
                      font-size="8.5"
                      font-weight="700"
                      fill="currentColor"
                      font-family="system-ui, -apple-system, sans-serif"
                    >
                      ?
                    </text>
                  </svg>
                </button>
                <div
                  v-if="armazensAjudaBloco('chart-compare-cd')"
                  v-show="armazensAjudaHelpPainelPronto('chart-compare-cd')"
                  class="bi-armazens-help-panel"
                  role="tooltip"
                  :style="armazensAjudaPanelStyle('chart-compare-cd')"
                >
                  <p class="bi-armazens-help-panel-title">
                    {{ armazensAjudaBloco('chart-compare-cd').titulo }}
                  </p>
                  <ul class="bi-armazens-help-panel-list">
                    <li
                      v-for="(txt, li) in armazensAjudaItensResolvidos(
                        'chart-compare-cd'
                      )"
                      :key="li"
                    >
                      {{ txt }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <p
              v-if="
                armazensComparativoEstab &&
                armazensComparativoEstab.meta &&
                armazensComparativoEstab.meta.aviso
              "
              class="bi-armazens-chart-foot bi-armazens-chart-foot--muted"
            >
              {{ armazensComparativoEstab.meta.aviso }}
            </p>
            <p
              v-if="
                armazensComparativoEstab &&
                armazensComparativoEstab.meta &&
                armazensComparativoEstab.meta.dica_paletes
              "
              class="bi-armazens-chart-foot bi-armazens-chart-foot--muted"
            >
              {{ armazensComparativoEstab.meta.dica_paletes }}
            </p>
            <div class="bi-armazens-chart-wrap bi-armazens-chart-wrap--rec">
              <canvas ref="chartArmazensRecCompareCd"></canvas>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Dashboard Rejeição -->
    <div v-show="biSubTab === 'rejeicao'" class="bi-rejeicao-content">
      <div
        v-if="rejeicaoLoading && rejeicaoDados.length === 0"
        class="bi-rejeicao-loading"
      >
        <i class="fas fa-spinner fa-spin"></i>
        <p>Carregando dados de rejeição...</p>
      </div>
      <div v-else-if="rejeicaoErro" class="bi-rejeicao-erro">
        <i class="fas fa-exclamation-circle"></i>
        <p>{{ rejeicaoErro }}</p>
        <button
          type="button"
          class="btn-refresh-bi-rej"
          @click="carregarRejeicoesBI"
        >
          <i class="fas fa-sync-alt"></i> Tentar novamente
        </button>
      </div>
      <div v-else-if="rejeicaoDados.length === 0" class="bi-rejeicao-vazio">
        <i class="fas fa-check-circle"></i>
        <h3>Nenhum dado de rejeição</h3>
        <p>Não há registros de rejeição no período.</p>
      </div>
      <div v-else class="bi-rejeicao-dashboard">
        <div class="bi-rejeicao-dashboard-body">
          <!-- Conteúdo principal + Sidebar lado a lado -->
          <div class="bi-rejeicao-main-with-sidebar">
            <div class="bi-rejeicao-main-content">
              <!-- Cards de métricas -->
              <div class="bi-rejeicao-cards-grid">
                <div class="bi-rejeicao-card-stovest bi-rejeicao-card-total">
                  <div class="bi-rejeicao-card-header">
                    <span class="bi-rejeicao-card-title"
                      >Total de Pedidos em Rejeição</span
                    >
                    <span class="bi-rejeicao-card-periodo">{{
                      labelRejeicaoPeriodo
                    }}</span>
                  </div>
                  <div class="bi-rejeicao-card-valor-grande">
                    {{ formatarNumero(rejeicaoTotalPedidos) }}
                  </div>
                </div>
                <div class="bi-rejeicao-card-stovest">
                  <div class="bi-rejeicao-card-header">
                    <span class="bi-rejeicao-card-title"
                      >Total de Clientes com Pedidos em Rejeição</span
                    >
                  </div>
                  <div class="bi-rejeicao-card-valor-grande">
                    {{ formatarNumero(rejeicaoTotalClientes) }}
                  </div>
                </div>
                <div class="bi-rejeicao-card-stovest">
                  <div class="bi-rejeicao-card-header">
                    <span class="bi-rejeicao-card-title"
                      >Tempo Médio Resolução D+0</span
                    >
                  </div>
                  <div class="bi-rejeicao-card-valor-grande">
                    <span class="bi-rejeicao-card-valor-num">{{
                      rejeicaoTempoMedioResolucaoD0
                    }}</span
                    ><span class="bi-rejeicao-card-unidade"> dias</span>
                  </div>
                  <div class="bi-rejeicao-card-sub">
                    {{ rejeicaoCountResolvidosD0 }} resolvido(s) ·
                    {{ rejeicaoCountEmRejeicaoD0 }} em rejeição
                  </div>
                </div>
                <div class="bi-rejeicao-card-stovest">
                  <div class="bi-rejeicao-card-header">
                    <span class="bi-rejeicao-card-title"
                      >Tempo Médio Resolução D+1</span
                    >
                  </div>
                  <div class="bi-rejeicao-card-valor-grande">
                    <span class="bi-rejeicao-card-valor-num">{{
                      rejeicaoTempoMedioResolucaoD1
                    }}</span
                    ><span class="bi-rejeicao-card-unidade"> dias</span>
                  </div>
                  <div class="bi-rejeicao-card-sub">
                    {{ rejeicaoCountResolvidosD1 }} resolvido(s) ·
                    {{ rejeicaoCountEmRejeicaoD1 }} em rejeição
                  </div>
                </div>
              </div>
              <!-- Gráfico Rejeições por Armazém -->
              <div class="bi-rejeicao-evolucao-wrap">
                <div class="bi-rejeicao-evolucao-header">
                  <h3 class="bi-rejeicao-tabela-titulo">
                    <i class="fas fa-warehouse"></i> Rejeições por Armazém
                  </h3>
                  <div class="bi-rejeicao-chart-filters">
                    <span
                      v-for="p in rejeicaoPresets"
                      :key="'ch-' + p.id"
                      class="bi-rejeicao-chart-filter"
                      :class="{ active: rejeicaoPresetAtivo === p.id }"
                      @click="aplicarRejeicaoPreset(p.id)"
                      >{{ p.label }}</span
                    >
                  </div>
                </div>
                <div class="bi-rejeicao-chart-container">
                  <canvas ref="chartRejeicaoEvolucao"></canvas>
                  <div
                    v-for="lbl in rejeicaoBarCanvasLabels"
                    :key="lbl.key"
                    class="bi-rejeicao-bar-label"
                    :style="{
                      left: lbl.x + 'px',
                      top: lbl.y + 'px',
                      '--rj-lbl': lbl.fill,
                    }"
                  >
                    <span class="bi-rejeicao-bar-label-inner">{{
                      lbl.text
                    }}</span>
                  </div>
                </div>
                <p
                  v-if="rejeicaoPorArmazemLabels.length === 0"
                  class="bi-rejeicao-metrica-vazio"
                >
                  Sem dados para exibir por armazém
                </p>
              </div>

              <!-- Tabela Ranking -->
              <div class="bi-rejeicao-table-section">
                <div class="bi-rejeicao-table-main">
                  <div class="bi-rejeicao-table-header">
                    <h3 class="bi-rejeicao-tabela-titulo">
                      <i class="fas fa-users"></i> Ranking de clientes com
                      pedidos em rejeição
                      <span
                        v-if="rejeicaoFiltroAdm"
                        class="bi-rejeicao-filtro-adm-tag"
                        @click.stop="
                          rejeicaoFiltroAdm = null;
                          rejeicaoClienteExpandido = null;
                          $nextTick(() => renderRejeicaoCharts());
                        "
                      >
                        <i class="fas fa-user-tie"></i> {{ rejeicaoFiltroAdm }}
                        <i
                          class="fas fa-times"
                          style="margin-left: 0.4em; opacity: 0.7"
                        ></i>
                      </span>
                    </h3>
                    <div class="bi-rejeicao-table-filters">
                      <button
                        type="button"
                        class="bi-rejeicao-filter-btn"
                        :class="{ active: rejeicaoFiltroTabela === 'all' }"
                        @click="rejeicaoFiltroTabela = 'all'"
                      >
                        Todos
                      </button>
                      <button
                        type="button"
                        class="bi-rejeicao-filter-btn"
                        :class="{
                          active: rejeicaoFiltroTabela === 'em_rejeicao',
                        }"
                        @click="rejeicaoFiltroTabela = 'em_rejeicao'"
                      >
                        Em Rejeição
                      </button>
                      <button
                        type="button"
                        class="bi-rejeicao-filter-btn"
                        :class="{
                          active: rejeicaoFiltroTabela === 'resolvidos',
                        }"
                        @click="rejeicaoFiltroTabela = 'resolvidos'"
                      >
                        Resolvidos
                      </button>
                    </div>
                  </div>
                  <div
                    ref="rejeicaoTabelaScroll"
                    class="bi-rejeicao-tabela-scroll"
                  >
                    <table class="bi-rejeicao-tabela">
                      <thead>
                        <tr>
                          <th>Cliente</th>
                          <th>ID</th>
                          <th>SLA</th>
                          <th>Armazém</th>
                          <th>Total</th>
                          <th>Em rejeição</th>
                        </tr>
                      </thead>
                      <tbody>
                        <template
                          v-for="g in rejeicaoClientesFiltrados"
                          :key="`${g.id_cliente ?? ''}|${g.cliente}`"
                        >
                          <tr
                            class="bi-rejeicao-row-clickable"
                            :class="{
                              'bi-rejeicao-row-active':
                                rejeicaoClienteExpandido ===
                                `${g.id_cliente ?? ''}|${g.cliente}`,
                            }"
                            @click="toggleClienteExpandido(g)"
                          >
                            <td>
                              <i
                                class="fas"
                                :class="
                                  rejeicaoClienteExpandido ===
                                  `${g.id_cliente ?? ''}|${g.cliente}`
                                    ? 'fa-chevron-down'
                                    : 'fa-chevron-right'
                                "
                                style="
                                  margin-right: 0.5em;
                                  font-size: 0.8em;
                                  opacity: 0.5;
                                "
                              ></i>
                              <strong>{{ g.cliente }}</strong>
                            </td>
                            <td>{{ g.id_cliente || '-' }}</td>
                            <td>
                              <span class="bi-rejeicao-sla-badge">{{
                                g.sla || 'D+0'
                              }}</span>
                            </td>
                            <td>{{ g.estabelecimento || '-' }}</td>
                            <td>
                              <span
                                class="bi-rejeicao-badge bi-rejeicao-badge-total"
                                >{{ formatarNumero(g.totalPedidos || 0) }}</span
                              >
                            </td>
                            <td>
                              <span
                                class="bi-rejeicao-badge"
                                :class="{
                                  'bi-rejeicao-badge-alert':
                                    (g.pedidosEmRejeicao || 0) > 0,
                                }"
                                >{{
                                  formatarNumero(g.pedidosEmRejeicao || 0)
                                }}</span
                              >
                            </td>
                          </tr>
                          <tr
                            v-if="
                              rejeicaoClienteExpandido ===
                              `${g.id_cliente ?? ''}|${g.cliente}`
                            "
                            class="bi-rejeicao-row-expanded"
                          >
                            <td colspan="6">
                              <div class="bi-rejeicao-pedidos-expand">
                                <table class="bi-rejeicao-pedidos-table">
                                  <thead>
                                    <tr>
                                      <th>Pedido</th>
                                      <th>Motivo</th>
                                      <th>Status</th>
                                      <th>Data</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr
                                      v-for="p in rejeicaoPedidosClienteExpandido"
                                      :key="p.pedido"
                                    >
                                      <td>
                                        <strong>{{ p.pedido }}</strong>
                                      </td>
                                      <td>{{ truncarMotivo(p.motivo, 50) }}</td>
                                      <td>
                                        <span
                                          class="bi-rejeicao-badge"
                                          :class="{
                                            'bi-rejeicao-badge-alert':
                                              p.status === 'C/ Rejeições',
                                            'bi-rejeicao-badge-ok':
                                              p.status === 'Integrado',
                                          }"
                                          >{{ p.status }}</span
                                        >
                                      </td>
                                      <td>{{ formatDateTime(p.data) }}</td>
                                    </tr>
                                    <tr
                                      v-if="
                                        rejeicaoPedidosClienteExpandido.length ===
                                        0
                                      "
                                    >
                                      <td
                                        colspan="4"
                                        style="text-align: center; opacity: 0.6"
                                      >
                                        Nenhum pedido encontrado
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        </template>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div class="bi-rejeicao-sidebar">
              <div class="bi-rejeicao-portfolio-wrap">
                <h3 class="bi-rejeicao-tabela-titulo">
                  <i class="fas fa-user-tie"></i> ADMs com mais rejeições
                </h3>
                <div
                  v-if="rejeicaoPorAdm.length === 0"
                  class="bi-rejeicao-metrica-vazio"
                >
                  Nenhum ADM
                </div>
                <div v-else class="bi-rejeicao-portfolio-cards">
                  <div
                    v-for="(item, idx) in rejeicaoPorAdm"
                    :key="item.adm || 'vazio-' + idx"
                    class="bi-rejeicao-portfolio-card"
                    :class="{
                      'bi-rejeicao-portfolio-card--active':
                        rejeicaoFiltroAdm === item.adm,
                    }"
                    style="cursor: pointer"
                    @click="toggleFiltroAdm(item.adm)"
                  >
                    <span class="bi-rejeicao-portfolio-num"
                      >{{ idx + 1 }}º</span
                    >
                    <span class="bi-rejeicao-portfolio-nome">{{
                      item.adm || '(sem ADM)'
                    }}</span>
                    <span class="bi-rejeicao-portfolio-valor">{{
                      formatarNumero(item.pedidos)
                    }}</span>
                    <span class="bi-rejeicao-portfolio-sub"
                      >{{ formatarNumero(item.clientes) }} cliente(s)</span
                    >
                  </div>
                </div>
              </div>

              <div class="bi-rejeicao-motivos-wrap">
                <h3 class="bi-rejeicao-tabela-titulo">
                  <i class="fas fa-chart-pie"></i> Motivos mais frequentes
                </h3>
                <div
                  v-if="rejeicaoMotivosTop.length === 0"
                  class="bi-rejeicao-metrica-vazio"
                >
                  Nenhum motivo
                </div>
                <div v-else class="bi-rejeicao-motivos-lista">
                  <div
                    v-for="(item, idx) in rejeicaoMotivosTop.slice(0, 6)"
                    :key="idx"
                    class="bi-rejeicao-motivo-item"
                    :title="item.motivo"
                  >
                    <span class="bi-rejeicao-motivo-num">{{ idx + 1 }}º</span>
                    <span class="bi-rejeicao-motivo-texto">{{
                      truncarMotivo(item.motivo, 28)
                    }}</span>
                    <span class="bi-rejeicao-motivo-count">{{
                      formatarNumero(item.count)
                    }}</span>
                  </div>
                </div>
              </div>

              <div class="bi-rejeicao-watchlist">
                <h3 class="bi-rejeicao-tabela-titulo">
                  <i class="fas fa-exclamation-triangle"></i> Em Destaque
                </h3>
                <div class="bi-rejeicao-watchlist-filters">
                  <button
                    type="button"
                    class="bi-rejeicao-watch-btn"
                    :class="{ active: rejeicaoWatchFiltro === 'urgentes' }"
                    @click="rejeicaoWatchFiltro = 'urgentes'"
                  >
                    Urgentes
                  </button>
                  <button
                    type="button"
                    class="bi-rejeicao-watch-btn"
                    :class="{
                      active: rejeicaoWatchFiltro === 'mais_rejeicoes',
                    }"
                    @click="rejeicaoWatchFiltro = 'mais_rejeicoes'"
                  >
                    Mais Rejeições
                  </button>
                </div>
                <div
                  v-if="rejeicaoWatchlist.length === 0"
                  class="bi-rejeicao-metrica-vazio"
                >
                  Nenhum em destaque
                </div>
                <div v-else class="bi-rejeicao-watchlist-items">
                  <template v-if="rejeicaoWatchFiltro === 'urgentes'">
                    <div
                      v-for="w in rejeicaoWatchlist"
                      :key="`${w.pedido}|${w.id_cliente}`"
                      class="bi-rejeicao-watchlist-item bi-rejeicao-watchlist-urgente"
                      :class="{
                        'bi-rejeicao-watchlist-critico': w.nivel_critico,
                      }"
                    >
                      <span class="bi-rejeicao-watchlist-nome">{{
                        w.cliente
                      }}</span>
                      <span class="bi-rejeicao-watchlist-pedido"
                        >Pedido {{ w.pedido }}</span
                      >
                      <span class="bi-rejeicao-watchlist-msg">
                        <template v-if="w.nivel_critico">
                          <strong>Nível crítico:</strong>
                          {{ w.dias_em_rejeicao }} dia(s) em rejeição,
                          impactando SLA {{ w.sla }}. Deveria sair em
                          {{ formatarDataLimite(w.data_limite) }} ({{
                            w.dias_atraso
                          }}
                          dia(s) em atraso).
                        </template>
                        <template v-else>
                          {{ w.dias_em_rejeicao }} dia(s) em rejeição. SLA
                          {{ w.sla }}. Data limite:
                          {{ formatarDataLimite(w.data_limite) }}.
                        </template>
                      </span>
                    </div>
                  </template>
                  <template v-else>
                    <div
                      v-for="w in rejeicaoWatchlist"
                      :key="`${w.id_cliente}|${w.cliente}`"
                      class="bi-rejeicao-watchlist-item"
                    >
                      <span class="bi-rejeicao-watchlist-nome">{{
                        w.cliente
                      }}</span>
                      <span class="bi-rejeicao-watchlist-valor">{{
                        formatarNumero(w.totalPedidos || 0)
                      }}</span>
                      <span class="bi-rejeicao-watchlist-badge"
                        >em rejeição</span
                      >
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="bi-rejeicao-footer">
          <button
            type="button"
            class="btn-refresh-bi-rej"
            @click="carregarRejeicoesBI"
            :disabled="rejeicaoLoading"
          >
            <i
              class="fas fa-sync-alt"
              :class="{ 'fa-spin': rejeicaoLoading }"
            ></i>
            {{ rejeicaoLoading ? 'Atualizando...' : 'Atualizar dados' }}
          </button>
          <span v-if="rejeicaoLastUpdate" class="bi-rejeicao-update">
            <i class="fas fa-clock"></i> Última atualização:
            {{ rejeicaoLastUpdate }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Chart, ArcElement, Tooltip, Legend, registerables } from 'chart.js'
import axios from 'axios'
import { rejeicaoService } from '@/services/api'
import { isBiArmazensPortalOnlyUser } from '@/utils/biDiretoriaPortalAccess.js'

Chart.register(ArcElement, Tooltip, Legend, ...registerables)

// Cores do dashboard (pedidos e status)
// Pedidos: D+0 = verde no prazo, Pendente = vermelho, Antecipado = verde forte, OUT = vermelho. D+1 = verde suave.
// Status: No Prazo, Pendente/No Prazo, Fora do Prazo conforme definido abaixo.
const COLORS = {
  d0: '#76FA65',
  d1: '#5BE8C4',
  d2: '#FFD93D',
  pendente: '#FF0000',
  antecipado: '#00FF00',
  noPrazo: '#76FA65',
  pendenteNoPrazo: '#ED9C9C',
  foraPrazo: '#FF0000',
  pendenteFora: '#FF0000',
  out: '#FF0000',
  text: '#FFFFFF',
  textMuted: '#8B8E94',
  volumesProntos: '#5BE8C4',
  volumesProntosEmpty: '#3a3d42',
}
/** Cores vivas para células da tabela - hex 100%, mesma intensidade dos gráficos. */
const TABLE_STATUS_COLORS = {
  noPrazo: '#76FA65',
  pendenteNoPrazo: '#E57373',
  pendenteFora: '#FF0000',
  foraPrazo: '#FF0000',
}

/**
 * Tokens HSL do dashboard de referência (shadcn / Tailwind):
 * github.com/AssisEvaristo/logistica-clean — uso em Chart.js + CSS da Análise Armazéns.
 */
const BI_AG = {
  primary: 'hsl(168 80% 50%)',
  paletes: 'hsl(120 60% 50%)',
  unidades: 'hsl(38 90% 55%)',
  muted: 'hsl(215 15% 55%)',
  grid: 'hsl(220 14% 20%)',
}
/** Cores «Evolução mensal»: custo op. = vermelho intenso; paletes = vermelho-acastanhado suave (distinto). */
const BI_AG_EVO_LINE = {
  light: {
    custoOperacao: 'hsl(0 78% 40%)',
    paletes: 'hsl(8 36% 52%)',
    unidades: 'hsl(210 45% 52%)' /* = .bi-armazens-card--unidade border */,
  },
  dark: {
    custoOperacao: 'hsl(0 82% 60%)',
    paletes: 'hsl(12 40% 58%)',
    unidades: 'hsl(210 55% 60%)' /* tom da família do card--unidade, legível no gráfico escuro */,
  },
}
const BI_AG_DONUT_BG = [
  'hsl(168 80% 50%)',
  'hsl(38 90% 55%)',
  'hsl(210 70% 55%)',
  'hsl(280 60% 55%)',
  'hsl(340 65% 55%)',
  'hsl(215 18% 45%)',
]

/** Refresh automático e contagem “próxima atualização” no modo TV / Painel (SLA). */
const SLA_PANEL_DATA_REFRESH_SEC = 5 * 60

/** Filtro sintético de situação (BI SLA): dt_conf_sep preenchida + vols > 0. */
const SITUACAO_FILTRO_SEPARADOS_COM_VOLUME = 'Separados Com Volume'

/** Ano mínimo de referência na Análise Armazéns (custos / filtro). */
const ANO_MIN_REF_ARMAZENS_BI = 2025

/**
 * Textos do ícone «?» (origem dos dados / cálculo) — Análise Armazéns.
 * Chaves = id do KPI em armazensMetricas ou prefixo chart-* para gráficos.
 */
const ARMAZENS_AJUDA = {
  intro_painel: {
    titulo: 'Sobre este painel',
    /** Preenchido em armazensAjudaMontarIntroPainelItens. */
    itens: [],
  },
  custo_ops_ab: {
    titulo: 'Custo total da operação',
    /** Texto: armazensAjudaMontarCustoOperacaoItens. */
    itens: [],
  },
  custo_total_pp: {
    titulo: 'Custo total PP',
    itens: [],
  },
  total_pp_ocupadas: {
    titulo: 'Total PP ocupadas',
    itens: [],
  },
  custo_por_pp: {
    titulo: 'Custo por PP',
    itens: [],
  },
  unidades_atendidas: {
    titulo: 'Total de unidades atendidos',
    itens: [],
  },
  func_clt: {
    titulo: 'Total de funcionários ativos CLT',
    itens: [],
  },
  custo_por_pessoa: {
    titulo: 'Custo por pessoa — operação',
    itens: [],
  },
  unid_por_func: {
    titulo: 'Unidades / funcionário',
    itens: [],
  },
  custo_func_dedicado: {
    titulo: 'Custo funcionário dedicado',
    itens: [],
  },
  custo_atend_unidade: {
    titulo: 'Custo do atendimento por unidade',
    itens: [],
  },
  custo_total_cliente: {
    titulo: 'Custo total do cliente',
    itens: [],
  },
  pct_custo_cliente_cd: {
    titulo: '% custo cliente × custo CD',
    itens: [],
  },
  faturamento_cliente: {
    titulo: 'Fatura cliente',
    itens: [],
  },
  'chart-evolucao': {
    titulo: 'Gráfico: evolução mensal',
    itens: [],
  },
  'chart-composicao': {
    titulo: 'Gráfico: composição de custos',
    itens: [],
  },
  'chart-custo-unidade': {
    titulo: 'Gráfico: custo por unidade no tempo',
    itens: [],
  },
  'chart-compare-cd': {
    titulo: 'Gráfico: comparativo armazém',
    itens: [],
  },
}

/** Presets do calendário na aba Análise Armazéns (mês fechado / ano civil). */
const PRESETS_CALENDARIO_ARMAZENS = [
  { id: 'este_ano', label: 'Este ano' },
  { id: 'ano_anterior', label: 'Ano anterior' },
  { id: 'este_mes', label: 'Este mês' },
  { id: 'mes_passado', label: 'Mês passado' },
  { id: 'customizar', label: 'Customizar' },
]
const PRESET_ATIVO_ARMAZENS_VALIDOS = new Set(
  PRESETS_CALENDARIO_ARMAZENS.map(p => p.id)
)

/** Nomes de mês (pt-BR) — filtro por períodos fechados na Análise Armazéns. */
const MESES_NOME_PT_BR = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]

function parseIsoDataParaMesAno(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-\d{2}/)
  if (!m) return null
  const ano = parseInt(m[1], 10)
  const mes = parseInt(m[2], 10)
  if (mes < 1 || mes > 12) return null
  return { ano, mes }
}

export default {
  name: 'BIPage',
  emits: ['page-ready'],
  props: {
    biSubTab: { type: String, default: 'sla' },
    /** Quando true, aplica layout de painel/TV em container pai (ex.: `BIPainelPage` em FS). */
    embedTvLayout: { type: Boolean, default: false },
    /** Documento em FS no `BIPainelPage` (mantém refresh/contagem ao alternar para Diretoria). */
    painelFsActive: { type: Boolean, default: false },
    /** No Painel em FS, o pai alterna Pedidos/SLA a cada minuto (não usar flip interno). */
    painelEmbedControlsSlaFlip: { type: Boolean, default: false },
    /** Quando `painelEmbedControlsSlaFlip`: false = face Pedidos em aberto, true = face SLA (cards). */
    painelEmbedSlaFlipped: { type: Boolean, default: false },
  },
  data() {
    return {
      _slaBgLoadInFlight: false,
      loading: false,
      loadError: null,
      showDataReadyMessage: false,
      _dataReadyTimer: null,
      lastUpdate: null,
      pedidosPendentes: [],
      pedidosTotais: [],
      statsSepPedidos: {
        d0: 0,
        pendente: 0,
        d1: 0,
        d2: 0,
        antecipado: 0,
        out: 0,
      },
      statsSepStatus: {
        noPrazo: 0,
        pendenteFora: 0,
        foraPrazo: 0,
        d0: 0,
        d2: 0,
      },
      statsExpPedidos: {
        pendente: 0,
        d0: 0,
        d1: 0,
        d2: 0,
        antecipado: 0,
        out: 0,
      },
      statsExpStatus: {
        pendenteNoPrazo: 0,
        noPrazo: 0,
        pendenteFora: 0,
        foraPrazo: 0,
        out: 0,
      },
      charts: {},
      chartFilter: null, // { chart: 'sepPedidos'|'sepStatus'|'expPedidos'|'expStatus', value: string }
      mostrarCalendario: false,
      dataInicio: (() => {
        const d = new Date()
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
      })(),
      dataFim: (() => {
        const d = new Date()
        const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
        return last.toISOString().slice(0, 10)
      })(),
      /** true quando usuário escolheu intervalo (preset ou custom); false = lista usa ano atual */
      userHasSelectedInterval: false,
      presetAtivo: 'este_mes',
      dataInicioDisplay: '',
      dataFimDisplay: '',
      /** Calendário Análise Armazéns: mês/ano (períodos fechados), sincronizado com dataInicio/dataFim. */
      armazensCalMesIni: (() => new Date().getMonth() + 1)(),
      armazensCalAnoIni: (() =>
        Math.max(ANO_MIN_REF_ARMAZENS_BI, new Date().getFullYear()))(),
      armazensCalMesFim: (() => new Date().getMonth() + 1)(),
      armazensCalAnoFim: (() =>
        Math.max(ANO_MIN_REF_ARMAZENS_BI, new Date().getFullYear()))(),
      currentPage: 1,
      pageSize: 50,
      presetsCalendario: [
        { id: 'ontem', label: 'Ontem' },
        { id: 'hoje', label: 'Hoje' },
        { id: 'esta_semana', label: 'Esta Semana' },
        { id: 'semana_passada', label: 'Semana Passada' },
        { id: 'este_mes', label: 'Este Mês' },
        { id: 'mes_passado', label: 'Mês Passado' },
      ],
      mostrarFiltros: false,
      filtroCliente: '',
      filtroClientes: [],
      filtroArmazens: [],
      filtroGerente: '',
      filtroAdm: '',
      listaGestores: [],
      /** Armazéns (storage) com manager para mapear gerente → estabelecimentos */
      listaStorages: [],
      filtroNF: '',
      filtroPedido: '',
      filtroSituacoes: [],
      filtroNaoEmbarcados: false,
      filtroStatusSep: '',
      filtroStatusExp: '',
      filtroSla: '',
      filtroTransportadora: '',
      filtroLimiteExpedicao: '',
      /** Dia (YYYY-MM-DD) em que o pedido foi separado — filtro local, independente do período de integração. */
      filtroDataSeparado: '',
      mostrarSituacaoDropdown: false,
      mostrarClienteDropdown: false,
      mostrarArmazemDropdown: false,
      clientesBuscaResultados: [],
      clientesBuscaLoading: false,
      _clientesBuscaTimer: null,
      biTheme: (() => {
        try {
          return localStorage.getItem('bi-theme') || 'light'
        } catch {
          return 'light'
        }
      })(),
      /** true = mostra face de cards totalizadores + tabela todo período */
      slaViewFlipped: false,
      /** Paginação da tabela "todo o período" (face traseira) */
      currentPageGeral: 1,
      /** Tela cheia ativa (apenas nível 0) */
      isFullscreen: false,
      _intervalViewToggle: null,
      _intervalScroll: null,
      _intervalRejeicaoScroll: null,
      _intervalCountdown: null,
      viewToggleCountdown: 0,
      dataUpdateCountdown: 0,
      /** Dashboard Rejeição */
      rejeicaoDados: [],
      rejeicaoMotivosTop: [],
      rejeicaoUrgentes: [],
      rejeicaoLoading: false,
      rejeicaoErro: null,
      rejeicaoLastUpdate: null,
      rejeicaoPresets: [
        { id: 'hoje', label: 'Hoje' },
        { id: 'esta_semana', label: 'Esta Semana' },
        { id: 'este_mes', label: 'Este Mês' },
        { id: 'mes_passado', label: 'Mês Passado' },
        { id: '6m', label: '6M' },
        { id: '1y', label: '1Y' },
        { id: 'todo', label: 'Todo' },
      ],
      rejeicaoPresetAtivo: 'este_mes',
      rejeicaoDataInicio: null,
      rejeicaoDataFim: null,
      rejeicaoFiltroTabela: 'all',
      rejeicaoFiltroAdm: null,
      rejeicaoClienteExpandido: null,
      rejeicaoWatchFiltro: 'urgentes',
      rejeicaoBarCanvasLabels: [],
      /** Análise Armazéns - métricas mockadas */
      armazensMetricas: [
        {
          id: 'custo_ops_ab',
          titulo: 'Custo TOT. operação',
          valor: '—',
          unidade: 'R$',
        },
        {
          id: 'custo_total_pp',
          titulo: 'Custo TOT. PP',
          valor: '—',
          unidade: 'R$',
        },
        {
          id: 'total_pp_ocupadas',
          titulo: 'TOT. PP ocupadas',
          valor: '—',
          unidade: '',
        },
        {
          id: 'custo_por_pp',
          titulo: 'Custo por PP',
          valor: '—',
          unidade: 'R$',
        },
        {
          id: 'unidades_atendidas',
          titulo: 'TOT. UNI. atendidos',
          valor: '12.500',
          unidade: '',
        },
        {
          id: 'func_clt',
          titulo: 'TOT. FUNC. ativos CLT',
          valor: '—',
          unidade: '',
        },
        {
          id: 'custo_por_pessoa',
          titulo: 'Custo por pessoa - operação',
          valor: '—',
          unidade: 'R$',
        },
        {
          id: 'unid_por_func',
          titulo: 'TOT. UNI. / TOT. FUNC.',
          valor: '—',
          unidade: '',
        },
        {
          id: 'custo_func_dedicado',
          titulo: 'Custo FUNC. dedicado',
          valor: '—',
          unidade: 'R$',
        },
        {
          id: 'custo_atend_unidade',
          titulo: 'Custo atendimento por UNI.',
          valor: '—',
          unidade: 'R$',
        },
        {
          id: 'custo_total_cliente',
          titulo: 'Custo TOT. do cliente',
          valor: 35000,
          unidade: 'R$',
        },
        {
          id: 'pct_custo_cliente_cd',
          titulo: '% TOT. CLI × TOT. CD',
          valor: 12.5,
          unidade: '%',
        },
        {
          id: 'faturamento_cliente',
          titulo: 'Fatura cliente',
          valor: '—',
          unidade: 'R$',
        },
      ],
      armazensTotalUnidades: null,
      armazensTotalUnidadesLoading: false,
      armazensTotalUnidadesErro: null,
      armazensTotalPosicoesPaletes: null,
      armazensTotalPosicoesPaletesLoading: false,
      armazensTotalPosicoesPaletesErro: null,
      /** Resumo cliente: totais com filtro de cliente (período/armazém iguais ao resumo empresa). */
      armazensClienteTotalUnidades: null,
      armazensClienteTotalUnidadesLoading: false,
      armazensClienteTotalUnidadesErro: null,
      armazensClienteTotalPosicoesPaletes: null,
      armazensClienteTotalPosicoesPaletesLoading: false,
      armazensClienteTotalPosicoesPaletesErro: null,
      /** lev_fatura_cliente_legado: soma FATURA no período (resumo do cliente). */
      armazensClienteFaturaLegadoTotal: null,
      armazensClienteFaturaLegadoLinhas: null,
      armazensClienteFaturaLegadoLoading: false,
      armazensClienteFaturaLegadoErro: null,
      /** lev_fatura_cliente_legado: soma de todas as faturas do período (card resumo do período). */
      armazensPeriodoFaturaLegadoTotal: null,
      armazensPeriodoFaturaLegadoLinhas: null,
      armazensPeriodoFaturaLegadoLoading: false,
      armazensPeriodoFaturaLegadoErro: null,
      /** De GET /bi/armazens/fatura-cliente-legado: meses_legado vs meses_cobrancas — texto do «?» Fatura cliente. */
      armazensFaturaResumoMeta: null,
      /** Soma lev_custo_valor.valor no período (Análise Armazéns). */
      armazensCustoTotalOperacao: null,
      armazensCustoTotalOperacaoLoading: false,
      armazensCustoTotalOperacaoErro: null,
      /** Extras de GET /bi/armazens/custo-total-operacao (meses_ref, filtro) — texto do «?». */
      armazensCustoTotalOperacaoMeta: null,
      /** Detalhamento por rubrica (incluir_rubricas=1) — soma = custo total do cartão. */
      armazensCustoOperacaoRubricas: null,
      /** Soma lev_custo_valor dos itens que compõem custo PP (ids fixos no backend). */
      armazensCustoTotalPpItens: null,
      /** Detalhe por item de custo PP (incluir_itens=1) — mesma soma que o cartão. */
      armazensCustoTotalPpItensDetalhe: null,
      armazensCustoTotalPpItensLoading: false,
      armazensCustoTotalPpItensErro: null,
      /** Opções de armazém da dbcobrancas (Análise Armazéns) - carregadas da API */
      opcoesArmazemCobrancas: [],
      opcoesArmazemCobrancasLoading: false,
      /** lev_operacao_funcionario: média mensal de qtd no período (Análise Armazéns). */
      armazensFuncCltMedia: null,
      armazensFuncCltLoading: false,
      armazensFuncCltErro: null,
      /** Média ponderada custo unitário (q×unit / q) no período. */
      armazensCustoPorPessoaOperacaoRh: null,
      armazensCustoPorPessoaOperacaoRhLoading: false,
      armazensCustoPorPessoaOperacaoRhErro: null,
      /** Série mensal para gráficos (GET /bi/armazens/evolucao-mensal). */
      armazensEvolucaoPontos: [],
      armazensEvolucaoLoading: false,
      armazensEvolucaoErro: null,
      /** Top 5 despesas + demais (GET /bi/armazens/composicao-custos-top). */
      armazensComposicaoCustosPayload: null,
      armazensComposicaoLoading: false,
      armazensComposicaoErro: null,
      /** Comparativo por armazém (GET /bi/armazens/comparativo-estabelecimentos). */
      armazensComparativoEstab: null,
      /** Tooltip «?» na Análise Armazéns: hover ou clique para manter aberto. */
      armazensAjudaHoverKey: null,
      armazensAjudaPinnedKey: null,
      /** Posição do painel de ajuda (fixed) — evita corte por overflow do strip de KPIs. */
      armazensAjudaPanelPos: null,
    }
  },
  computed: {
    /** Tela cheia própria ou painel pai em document fullscreen. */
    biTvLayout() {
      return this.isFullscreen || this.embedTvLayout
    },
    headerTitleBI() {
      if (this.biSubTab === 'rejeicao')
        return 'DASHBOARD DE PEDIDOS EM REJEIÇÃO'
      if (this.biSubTab === 'armazens') return 'ANÁLISE ARMAZÉNS'
      return this.slaViewFlipped
        ? 'ACOMPANHAMENTO DE SLA'
        : 'ACOMPANHAMENTO DE PEDIDOS EM ABERTO'
    },
    /** Tamanho do total no centro dos donuts SLA: inline para vencer CSS global e refletir isFullscreen com certeza. */
    slaDonutCenterNumberStyle() {
      return {
        fontSize: this.biTvLayout ? '45px' : '25px',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }
    },
    /** SLA-GERAL: mesmos tamanhos do total nos donuts (25px / 45px). */
    slaGeralTotalizadorValueStyle() {
      return {
        fontSize: this.biTvLayout ? '45px' : '25px',
        lineHeight: 1.15,
      }
    },
    /** Percentuais nos cards SLA-GERAL: proporção similar à antiga relação pct/valor. */
    slaGeralTotalizadorPctStyle() {
      return {
        fontSize: this.biTvLayout ? '24px' : '13px',
        lineHeight: 1.15,
      }
    },
    /** Exibe mensagem amigável quando não há dados (ex.: cliente novo sem movimentação no período). */
    semDadosParaAcompanhamento() {
      if (this.loading || this.loadError) return false
      const pendentes = (this.pedidosPendentes || []).length
      const totais = (this.pedidosTotais || []).length
      return pendentes === 0 && totais === 0
    },
    labelFiltroSituacao() {
      if (this.filtroNaoEmbarcados) return 'Não embarcados'
      if (!this.filtroSituacoes || this.filtroSituacoes.length === 0)
        return 'Todas'
      if (this.filtroSituacoes.length === 1) return this.filtroSituacoes[0]
      return `${this.filtroSituacoes.length} selecionadas`
    },
    labelFiltroArmazem() {
      if (!this.filtroArmazens || this.filtroArmazens.length === 0)
        return 'Todos'
      if (this.filtroArmazens.length === 1) return this.filtroArmazens[0]
      return `${this.filtroArmazens.length} selecionados`
    },
    /** Linha abaixo do título na Análise Armazéns: armazém (Geral ou nomes) e, se houver, cliente(s) filtrado(s). Com cliente e sem armazém filtrado, «Geral» vira «Cliente». */
    labelArmazensEscopoCabecalho() {
      if (this.biSubTab !== 'armazens') return ''
      const fa = this.filtroArmazens || []
      const semArmazemFiltrado = fa.length === 0
      const armazemPart = semArmazemFiltrado
        ? 'Geral'
        : fa
            .map(a => String(a || '').trim())
            .filter(Boolean)
            .join(', ')
      const fc = this.canShowClienteColumn ? this.filtroClientes || [] : []
      const clientNames = fc
        .map(c => {
          if (typeof c === 'object' && c != null) {
            return String((c.nome || c.nome_cliente || '').trim())
          }
          return String(c || '').trim()
        })
        .filter(Boolean)
      const clientePart =
        clientNames.length === 0
          ? ''
          : clientNames.length === 1
            ? clientNames[0]
            : clientNames.join(', ')
      if (!clientePart) return armazemPart
      const prefixo = semArmazemFiltrado ? 'Cliente' : armazemPart
      return `${prefixo} · ${clientePart}`
    },
    /** Valores de clientes para enviar à API (nomes e/ou IDs). Cada item pode ser { nome, no_seq } ou string. */
    filtroClientesValoresParaApi() {
      const list = this.filtroClientes || []
      return list
        .map(c => {
          if (typeof c === 'object' && c != null && c.no_seq != null)
            return String(c.no_seq)
          const nome =
            typeof c === 'object' && c != null
              ? (c.nome || c.nome_cliente || '').trim()
              : String(c || '').trim()
          return nome
        })
        .filter(Boolean)
        .join(',')
    },
    temFiltrosForm() {
      if (this.biSubTab === 'armazens') {
        return (
          (this.canShowClienteColumn && this.filtroClientes.length > 0) ||
          (this.showFiltroArmazem && this.filtroArmazens.length > 0)
        )
      }
      let base = !!(
        (this.canShowClienteColumn && this.filtroClientes.length > 0) ||
        this.filtroNF ||
        this.filtroPedido ||
        (this.filtroSituacoes && this.filtroSituacoes.length > 0) ||
        this.filtroNaoEmbarcados ||
        this.filtroStatusSep ||
        this.filtroStatusExp ||
        this.filtroTransportadora
      )
      if (this.showFiltroArmazem && this.filtroArmazens.length > 0) base = true
      if (this.showFiltroGerente && this.filtroGerente) base = true
      if (this.showFiltroAdm && this.filtroAdm) base = true
      if (this.showFiltroSla && this.filtroSla) base = true
      if (this.showFiltroLimiteExpedicao && this.filtroLimiteExpedicao)
        base = true
      if ((this.filtroDataSeparado || '').trim()) base = true
      return base
    },
    countFiltrosAtivos() {
      if (this.biSubTab === 'armazens') {
        let n = 0
        if (this.canShowClienteColumn && this.filtroClientes.length > 0) n++
        if (this.showFiltroArmazem && this.filtroArmazens.length > 0) n++
        return n
      }
      let n = 0
      if (this.canShowClienteColumn && this.filtroClientes.length > 0) n++
      if (this.showFiltroArmazem && this.filtroArmazens.length > 0) n++
      if (this.showFiltroGerente && this.filtroGerente) n++
      if (this.showFiltroAdm && this.filtroAdm) n++
      if (this.filtroNF) n++
      if (this.filtroPedido) n++
      if (
        (this.filtroSituacoes && this.filtroSituacoes.length > 0) ||
        this.filtroNaoEmbarcados
      )
        n++
      if (this.filtroStatusSep) n++
      if (this.filtroStatusExp) n++
      if (this.showFiltroSla && this.filtroSla) n++
      if (this.filtroTransportadora) n++
      if (this.showFiltroLimiteExpedicao && this.filtroLimiteExpedicao) n++
      if ((this.filtroDataSeparado || '').trim()) n++
      return n
    },
    /**
     * Base da lista SLA antes do formulário (mesma lógica que filteredPedidosPendentes),
     * para derivar opções de transportadora sem incluir o filtro de transportadora.
     */
    pedidosBaseParaFiltrosSla() {
      if (this.chartFilterExpedicaoAtivo) {
        return this.pedidosFiltradosPorGrafico || []
      }
      let list = (this.pedidosPendentes || []).filter(
        p => !this.pedidoOsangDeveExcluirPorAjuste(p)
      )
      if (this.chartFilter && list.length) {
        const { chart, value } = this.chartFilter
        list = list.filter(p => {
          if (chart === 'sepStatus')
            return this.computeStatusSeparacao(p) === value
          if (chart === 'expStatus')
            return this.computeStatusExpedicao(p) === value
          if (chart === 'sepPedidos') return this.getSlaSeparacao(p) === value
          if (chart === 'expPedidos') return this.getSlaExpedicao(p) === value
          return true
        })
      }
      return list
    },
    /** Transportadoras distintas só entre pedidos que passam pelos demais filtros (ex.: cliente). */
    opcoesTransportadoraDistintos() {
      const list = this.pedidosBaseParaFiltrosSla || []
      if (!list.length) return []
      let filtered
      try {
        filtered = this.applyFiltrosForm(list, { skipTransportadora: true })
      } catch (e) {
        console.warn('[BI] opcoesTransportadoraDistintos:', e)
        filtered = list
      }
      const set = new Set()
      for (const p of filtered || []) {
        const t =
          p.transportadora != null && String(p.transportadora).trim() !== ''
            ? String(p.transportadora).trim()
            : null
        if (t) set.add(t)
      }
      return Array.from(set).sort((a, b) =>
        (a || '').localeCompare(b || '', 'pt-BR')
      )
    },
    /** Valores distintos de SLA de contrato (D+0, D+1, etc.) nos pedidos carregados, ordenados. */
    opcoesSlaDistintos() {
      const set = new Set()
      for (const p of this.pedidosPendentes || []) {
        const s = this.getSlaLabel(p) || 'D+0'
        if (s) set.add(s)
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
    },
    /** Análise Armazéns: opções vindas da dbcobrancas (armazem.nome) + Matriz A/B (só esta aba). SLA: pedidos + storages. */
    opcoesArmazemDistintos() {
      if (this.biSubTab === 'armazens') {
        const base = [...(this.opcoesArmazemCobrancas || [])]
        const extras = ['Matriz A', 'Matriz B']
        const lower = new Set(
          base.map(x =>
            String(x || '')
              .trim()
              .toLowerCase()
          )
        )
        for (const x of extras) {
          const k = x.toLowerCase()
          if (!lower.has(k)) {
            base.push(x)
            lower.add(k)
          }
        }
        return base.sort((a, b) => (a || '').localeCompare(b || '', 'pt-BR'))
      }
      const set = new Set()
      for (const p of this.pedidosPendentes || []) {
        const e =
          p.estabelecimento != null && String(p.estabelecimento).trim() !== ''
            ? String(p.estabelecimento).trim()
            : null
        if (e) set.add(e)
      }
      const storages = this.listaStorages || []
      for (const s of storages) {
        const c =
          s.corpem != null && String(s.corpem).trim() !== ''
            ? String(s.corpem).trim()
            : null
        if (c) set.add(c)
      }
      return Array.from(set).sort((a, b) =>
        (a || '').localeCompare(b || '', 'pt-BR')
      )
    },
    /** Valores distintos de situacao (sit_fase) nos pedidos carregados, ordenados. */
    opcoesSituacaoDistintos() {
      const set = new Set()
      for (const p of this.pedidosPendentes || []) {
        const s =
          p.situacao != null && p.situacao !== ''
            ? String(p.situacao).trim()
            : null
        if (s) set.add(s)
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
    },
    /** sit_fase distintos + opções especiais (ex.: Separados Com Volume). */
    opcoesSituacaoComEspeciais() {
      const rest = (this.opcoesSituacaoDistintos || []).filter(
        x => x !== SITUACAO_FILTRO_SEPARADOS_COM_VOLUME
      )
      return [SITUACAO_FILTRO_SEPARADOS_COM_VOLUME, ...rest]
    },
    /** Valores distintos de status de Separação nos pedidos carregados, ordenados. */
    opcoesStatusSepDistintos() {
      const set = new Set()
      for (const p of this.pedidosPendentes || []) {
        const s = this.computeStatusSeparacao(p)
        if (s) set.add(s)
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
    },
    /** Valores distintos de status de Expedição nos pedidos carregados, ordenados. */
    opcoesStatusExpDistintos() {
      const set = new Set()
      for (const p of this.pedidosPendentes || []) {
        const s = this.computeStatusExpedicao(p)
        if (s) set.add(s)
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
    },
    /** Pedidos totais do período (incl. Emb. Conf.) filtrados - para os cards de pizza. */
    filteredPedidosTotais() {
      const list = this.pedidosTotais || []
      if (!list.length) return []
      if (!this.temFiltrosForm) {
        return list.filter(p => !this.pedidoOsangDeveExcluirPorAjuste(p))
      }
      try {
        const fn = this.applyFiltrosForm
        if (typeof fn !== 'function')
          return list.filter(p => !this.pedidoOsangDeveExcluirPorAjuste(p))
        const out = fn.call(this, list)
        return Array.isArray(out) ? out : list
      } catch (e) {
        console.warn('[BI] applyFiltrosForm (totais) erro:', e)
        return list.filter(p => !this.pedidoOsangDeveExcluirPorAjuste(p))
      }
    },
    /**
     * Pendentes de embarque com os mesmos filtros do formulário que a tabela (data separado, limite exp., etc.).
     * Base dos donuts SLA — alinhada à lista de pendentes; não usa pedidosTotais (exceto fatia expedição).
     */
    pedidosPendentesAposFiltrosForm() {
      const list = this.pedidosPendentes || []
      if (!list.length) return []
      if (!this.temFiltrosForm) {
        return list.filter(p => !this.pedidoOsangDeveExcluirPorAjuste(p))
      }
      try {
        const fn = this.applyFiltrosForm
        if (typeof fn !== 'function')
          return list.filter(p => !this.pedidoOsangDeveExcluirPorAjuste(p))
        const out = fn.call(this, list)
        return Array.isArray(out) ? out : list
      } catch (e) {
        console.warn('[BI] applyFiltrosForm (pendentes) erro:', e)
        return list.filter(p => !this.pedidoOsangDeveExcluirPorAjuste(p))
      }
    },
    /**
     * Base da tabela de pendentes e filtros: pendentes (ou totais se fatia de expedição),
     * depois a fatia do donut. Gráficos de rosca usam `pedidosBaseGraficosSla` (total no período).
     */
    pedidosFiltradosPorGrafico() {
      const all = this.chartFilterExpedicaoAtivo
        ? this.filteredPedidosTotais || []
        : this.pedidosPendentesAposFiltrosForm || []
      const cf = this.chartFilter
      if (!cf || cf.value == null || cf.value === '') return all
      const { chart, value } = cf
      if (chart === 'sepPedidos')
        return all.filter(p => this.getSlaSeparacao(p) === value)
      if (chart === 'sepStatus')
        return all.filter(p => this.computeStatusSeparacao(p) === value)
      if (chart === 'expPedidos') {
        return all.filter(p => this.getSlaExpedicao(p) === value)
      }
      if (chart === 'expStatus') {
        return all.filter(p => this.computeStatusExpedicao(p) === value)
      }
      return all
    },
    /**
     * Donuts SLA: pedidos integrados no período (mesma base de `filteredPedidosTodosPeriodo`, incl. Emb. Conf.),
     * mais a fatia selecionada no gráfico.
     */
    pedidosBaseGraficosSla() {
      let all = this.filteredPedidosTodosPeriodo || []
      const cf = this.chartFilter
      if (!cf || cf.value == null || cf.value === '') return all
      const { chart, value } = cf
      if (chart === 'sepPedidos')
        return all.filter(p => this.getSlaSeparacao(p) === value)
      if (chart === 'sepStatus')
        return all.filter(p => this.computeStatusSeparacao(p) === value)
      if (chart === 'expPedidos') {
        return all.filter(p => this.getSlaExpedicao(p) === value)
      }
      if (chart === 'expStatus') {
        return all.filter(p => this.computeStatusExpedicao(p) === value)
      }
      return all
    },
    /** Filtro ativo veio dos donuts de expedição: tabela usa totais do período na fatia (não só pendentes de embarque). */
    chartFilterExpedicaoAtivo() {
      const c = this.chartFilter && this.chartFilter.chart
      return c === 'expPedidos' || c === 'expStatus'
    },
    /**
     * Soma de volumes dos pedidos integrados no período (mesma base que filteredPedidosTodosPeriodo /
     * cards de acompanhamento). A tabela de pendentes continua com sua própria coluna de volumes.
     */
    totalVolumesProntos() {
      const list = this.filteredPedidosTodosPeriodo || []
      return list.reduce((acc, p) => acc + (Number(p.volumes) || 0), 0)
    },
    /** Pedidos PENDENTES de embarque (exclui Emb. Conf.) com filtros. Usado na tabela. */
    filteredPedidosPendentes() {
      if (this.chartFilterExpedicaoAtivo) {
        let list = this.pedidosFiltradosPorGrafico || []
        try {
          const out = this.applyFiltrosForm(list)
          return Array.isArray(out) ? out : list
        } catch (e) {
          console.warn('[BI] applyFiltrosForm (exp ativo) erro:', e)
          return list
        }
      }
      return this.pedidosFiltradosPorGrafico || []
    },
    _filteredPedidosPendentesLegacy() {
      let list = this.pedidosPendentes
      if (this.chartFilter && list.length) {
        const { chart, value } = this.chartFilter
        list = list.filter(p => {
          if (chart === 'sepStatus')
            return this.computeStatusSeparacao(p) === value
          if (chart === 'expStatus')
            return this.computeStatusExpedicao(p) === value
          if (chart === 'sepPedidos') return this.getSlaSeparacao(p) === value
          if (chart === 'expPedidos') return this.getSlaExpedicao(p) === value
          return true
        })
      }
      if (!this.temFiltrosForm) return list
      const clientesFiltro = this.canShowClienteColumn
        ? this.filtroClientes || []
        : []
      const armazensFiltro = this.showFiltroArmazem
        ? this.filtroArmazens || []
        : []
      const gerente = this.showFiltroGerente
        ? (this.filtroGerente || '').trim()
        : ''
      const adm = this.showFiltroAdm ? (this.filtroAdm || '').trim() : ''
      const nf = (this.filtroNF || '').toLowerCase()
      const ped = (this.filtroPedido || '').toLowerCase()
      const situacoes = this.filtroSituacoes || []
      const naoEmbarcados = this.filtroNaoEmbarcados
      const stSep = (this.filtroStatusSep || '').trim()
      const stExp = (this.filtroStatusExp || '').trim()
      const limiteDate = this.showFiltroLimiteExpedicao
        ? this.filtroLimiteExpedicao || ''
        : ''
      const dataSeparadoFiltro = (this.filtroDataSeparado || '').trim()
      const filtroSlaAtivo = this.showFiltroSla
        ? (this.filtroSla || '').trim()
        : ''
      return list.filter(p => {
        if (clientesFiltro.length > 0) {
          if (!this.pedidoPassaFiltroClientes(p, clientesFiltro)) return false
        }
        if (armazensFiltro.length > 0) {
          const est =
            (p.estabelecimento != null
              ? String(p.estabelecimento).trim()
              : '') || ''
          if (!armazensFiltro.includes(est)) return false
        }
        if (gerente) {
          const gerenteKey = gerente.trim().toLowerCase()
          const estabelecimentosDoGerente =
            this.estabelecimentosPorGerente[gerenteKey] ||
            this.estabelecimentosPorGerente[gerente.trim()] ||
            []
          const est =
            (p.estabelecimento != null
              ? String(p.estabelecimento).trim()
              : '') || ''
          const estNorm = est.toLowerCase()
          let pertence = false
          if (estabelecimentosDoGerente.length > 0) {
            pertence = estabelecimentosDoGerente.some(
              e => (e || '').toLowerCase() === estNorm
            )
          } else {
            pertence =
              (p.adm != null ? String(p.adm).trim() : '').toLowerCase() ===
              gerenteKey
          }
          if (!pertence) return false
        }
        if (adm) {
          if (adm === '__VAZIO__') {
            const pAdm = (p.adm != null ? String(p.adm).trim() : '') || ''
            if (pAdm !== '') return false
          } else {
            const pAdm = (p.adm != null ? String(p.adm).trim() : '') || ''
            if (pAdm.toLowerCase() !== adm.toLowerCase()) return false
          }
        }
        if (
          nf &&
          !String(p.numero_nf || p.numeroNF || '')
            .toLowerCase()
            .includes(nf)
        )
          return false
        if (
          ped &&
          !String(p.numero_pedido || p.numeroPedido || '')
            .toLowerCase()
            .includes(ped)
        )
          return false
        if (!this.pedidoPassaFiltroSituacoes(p, situacoes, naoEmbarcados))
          return false
        if (stSep) {
          const statusSep = this.computeStatusSeparacao(p) || ''
          if (statusSep !== stSep) return false
        }
        if (stExp) {
          const statusExp = this.computeStatusExpedicao(p) || ''
          if (statusExp !== stExp) return false
        }
        if (filtroSlaAtivo) {
          const slaPedido = this.getSlaLabel(p) || 'D+0'
          if (slaPedido !== filtroSlaAtivo) return false
        }
        if (this.filtroTransportadora) {
          const trans =
            (p.transportadora != null ? String(p.transportadora).trim() : '') ||
            ''
          if (trans !== this.filtroTransportadora.trim()) return false
        }
        if (limiteDate && p.limite) {
          const limStr = p.limite.slice(0, 10)
          if (limStr !== limiteDate) return false
        }
        if (dataSeparadoFiltro) {
          const diaSep = this.pedidoDiaLocalSeparadoISO(p)
          if (!diaSep || diaSep !== dataSeparadoFiltro) return false
        }
        return true
      })
    },
    totalPedidos() {
      const s = this.statsSepPedidos
      return (
        (s.d0 || 0) +
          (s.pendente || 0) +
          (s.d1 || 0) +
          (s.d2 || 0) +
          (s.antecipado || 0) +
          (s.out || 0) || 0
      )
    },
    /** Gráficos de rosca (separação): total integrado no período; fatia do donut se houver. */
    displayStatsSeparacao() {
      return this.computeStatsFromOrders(this.pedidosBaseGraficosSla || [])
    },
    /** Gráficos de rosca (expedição): mesma base; fora de Emb. Conf. → Pendente no SLA realizado. */
    displayStatsExpedicao() {
      return this.computeStatsFromOrders(this.pedidosBaseGraficosSla || [])
    },
    /**
     * Estatísticas SLA para os cards da face traseira (acompanhamento + tabela "todo o período").
     * Mesma ideia de `pedidosBaseGraficosSla` (integrados no período, incl. Emb. Conf.).
     */
    displayStatsSlaTodosPeriodo() {
      return this.computeStatsFromOrders(this.filteredPedidosTodosPeriodo || [])
    },
    lastUpdateFormatted() {
      if (!this.lastUpdate) return '-'
      const d = new Date(this.lastUpdate)
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
    /** Cronômetro para próxima alternância de visual (modo painel, tela cheia). Formato M:SS */
    countdownFormatted() {
      const s = Math.max(0, Math.floor(this.viewToggleCountdown))
      const m = Math.floor(s / 60)
      const seg = s % 60
      return `${m}:${String(seg).padStart(2, '0')}`
    },
    /** Cronômetro para próxima atualização dos dados (modo painel, tela cheia). Formato M:SS */
    dataUpdateCountdownFormatted() {
      const s = Math.max(0, Math.floor(this.dataUpdateCountdown))
      const m = Math.floor(s / 60)
      const seg = s % 60
      return `${m}:${String(seg).padStart(2, '0')}`
    },
    legendSepPedidos() {
      const s = this.displayStatsSeparacao.sepPedidos
      return this.buildLegend(s, {
        d0: { label: 'D+0', color: COLORS.d0 },
        pendente: { label: 'Pendente', color: COLORS.pendente },
        d1: { label: 'D+1', color: COLORS.d1 },
        d2: { label: 'D+2', color: COLORS.d2 },
        antecipado: { label: 'Antecipado', color: COLORS.antecipado },
        out: { label: 'OUT', color: COLORS.out },
      })
    },
    legendSepStatus() {
      const s = this.displayStatsSeparacao.sepStatus
      return this.buildLegend(s, {
        pendenteNoPrazo: {
          label: 'Pendente / No Prazo',
          color: COLORS.pendenteNoPrazo,
        },
        pendenteFora: {
          label: 'Pendente / Fora do Prazo',
          color: COLORS.pendenteFora,
        },
        noPrazo: { label: 'No Prazo', color: COLORS.noPrazo },
        foraPrazo: { label: 'Fora do Prazo', color: COLORS.foraPrazo },
      })
    },
    legendExpPedidos() {
      const s = this.displayStatsExpedicao.expPedidos
      return this.buildLegend(s, {
        pendente: { label: 'Pendente', color: COLORS.pendente },
        d0: { label: 'D+0', color: COLORS.d0 },
        d1: { label: 'D+1', color: COLORS.d1 },
        d2: { label: 'D+2', color: COLORS.d2 },
        antecipado: { label: 'Antecipado', color: COLORS.antecipado },
        out: { label: 'OUT', color: COLORS.out },
      })
    },
    legendExpStatus() {
      const s = this.displayStatsExpedicao.expStatus
      return this.buildLegend(s, {
        pendenteNoPrazo: {
          label: 'Pendente / No Prazo',
          color: COLORS.pendenteNoPrazo,
        },
        pendenteFora: {
          label: 'Pendente / Fora do Prazo',
          color: COLORS.pendenteFora,
        },
        noPrazo: { label: 'No Prazo', color: COLORS.noPrazo },
        foraPrazo: { label: 'Fora do Prazo', color: COLORS.foraPrazo },
      })
    },
    /**
     * Nível do usuário (0, 1, 2, 3) para regras de filtros e colunas no BI.
     * Nível 0: todos os filtros e coluna cliente. Nível 1: sem armazém, gerente, SLA, limite expedição; coluna cliente só se >1 CNPJ liberado.
     * Nível 2: sem armazém e gerente. Nível 3: sem gerente. Demais níveis não veem a aba BI (controlando no Sidebar).
     */
    biUserLevel() {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return null
        const user = JSON.parse(userData)
        const level = user.level_access
        return level != null ? Number(level) : null
      } catch {
        return null
      }
    },
    /** Perfil portal: só Análise Armazéns — regras de filtro/calendário como nível 0 na aba armazens. */
    isPortalArmazensOnlyUser() {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return false
        return isBiArmazensPortalOnlyUser(JSON.parse(userData))
      } catch {
        return false
      }
    },
    /** Tela cheia do BI: nível 0 ou Análise Armazéns (perfil exclusivo). */
    biArmazensPortalFullscreenOk() {
      return (
        this.biSubTab === 'armazens' &&
        this.isPortalArmazensOnlyUser
      )
    },
    /** Filtro Armazém: nível 0 e 3; oculto para 1 e 2. */
    showFiltroArmazem() {
      if (this.biSubTab === 'armazens' && this.isPortalArmazensOnlyUser) {
        return true
      }
      const l = this.biUserLevel
      return l === 0 || l === 3
    },
    /** Filtro Gerente: apenas nível 0; oculto para 1, 2 e 3. */
    showFiltroGerente() {
      return this.biUserLevel === 0
    },
    /** Filtro ADM (wcl): apenas nível 0 e 3 (dev e gerentes); oculto para 1 e 2. */
    showFiltroAdm() {
      const l = this.biUserLevel
      return l === 0 || l === 3
    },
    /** Valores distintos de adm (wcl): quando armazém ou gerente está selecionado, apenas ADMs que pertencem a esse contexto; senão, todos. */
    opcoesAdmDistintos() {
      const set = new Set()
      const list = [
        ...(this.pedidosPendentes || []),
        ...(this.pedidosTotais || []),
      ]
      const armazens =
        this.showFiltroArmazem && this.filtroArmazens.length > 0
          ? this.filtroArmazens
          : []
      const gerente = this.showFiltroGerente
        ? (this.filtroGerente || '').trim()
        : ''
      for (const p of list) {
        if (armazens.length > 0) {
          const est =
            (p.estabelecimento != null
              ? String(p.estabelecimento).trim()
              : '') || ''
          if (!armazens.includes(est)) continue
        }
        if (gerente) {
          const gerenteKey = gerente.trim().toLowerCase()
          const estabelecimentosDoGerente =
            this.estabelecimentosPorGerente[gerenteKey] ||
            this.estabelecimentosPorGerente[gerente.trim()] ||
            []
          const est =
            (p.estabelecimento != null
              ? String(p.estabelecimento).trim()
              : '') || ''
          const estNorm = est.toLowerCase()
          let pertence = false
          if (estabelecimentosDoGerente.length > 0) {
            pertence = estabelecimentosDoGerente.some(
              e => (e || '').toLowerCase() === estNorm
            )
          } else {
            pertence =
              (p.adm != null ? String(p.adm).trim() : '').toLowerCase() ===
              gerenteKey
          }
          if (!pertence) continue
        }
        const a = (p.adm != null ? String(p.adm).trim() : '') || ''
        set.add(a === '' ? null : a)
      }
      return Array.from(set).sort((a, b) =>
        (a || '').localeCompare(b || '', 'pt-BR')
      )
    },
    /** Filtro SLA (contrato): nível 0, 2 e 3; oculto para 1. */
    showFiltroSla() {
      const l = this.biUserLevel
      return l === 0 || l === 2 || l === 3
    },
    /** Filtro Limite Expedição: nível 0, 2 e 3; oculto para 1. */
    showFiltroLimiteExpedicao() {
      const l = this.biUserLevel
      return l === 0 || l === 2 || l === 3
    },
    /** Mapa: nome do gerente (valor do dropdown, normalizado) → lista de corpem dos armazéns que ele gerencia (ML, C2, etc.).
     * Em wcl o campo estabelecimento é o corpem (ML, C2); storage.manager = id do gerente. Chave em minúsculas para lookup seguro. */
    estabelecimentosPorGerente() {
      const map = {}
      const gestores = this.listaGestores || []
      const storages = this.listaStorages || []
      for (const g of gestores) {
        const key = (g.name || g.user || '').toString().trim()
        if (!key) continue
        const gerenteId = g.id != null ? String(g.id) : ''
        const corpems = storages
          .filter(s => {
            const m = s.manager
            if (m == null || String(m).trim() === '') return false
            return String(m).trim() === gerenteId || Number(m) === Number(g.id)
          })
          .map(s =>
            s.corpem != null && String(s.corpem).trim() !== ''
              ? String(s.corpem).trim()
              : s.name != null
                ? String(s.name).trim()
                : ''
          )
          .filter(Boolean)
        map[key] = corpems
        map[key.toLowerCase()] = corpems
      }
      return map
    },
    /** Coluna CLIENTE: nível 0 sempre; nível 1 só se tiver mais de 1 CNPJ liberado; níveis 2 e 3 sempre. */
    canShowClienteColumn() {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return false
        const user = JSON.parse(userData)
        if (
          this.biSubTab === 'armazens' &&
          isBiArmazensPortalOnlyUser(user)
        ) {
          return true
        }
        const level =
          user.level_access != null ? Number(user.level_access) : null
        if (level === 0 || level === 2 || level === 3) return true
        if (level === 1) {
          let cli = user.cli_access
          if (typeof cli === 'string' && cli) {
            try {
              cli = JSON.parse(cli)
            } catch {
              cli = {}
            }
          }
          if (!cli || typeof cli !== 'object') return false
          return Object.keys(cli).length > 1
        }
        return false
      } catch {
        return false
      }
    },
    slaTableColspan() {
      return this.canShowClienteColumn ? 18 : 17
    },
    /**
     * Lista ordenada por prioridade:
     * 1) Expedição fora do prazo → topo (entre esses, mais atrasados primeiro = integração mais antiga)
     * 2) Separação fora do prazo → segundo (idem)
     * 3) Demais → mais recente integrado primeiro
     */
    pedidosPendentesOrdenados() {
      const list = [...(this.filteredPedidosPendentes || [])]
      return list.sort((a, b) => {
        const expA = this.computeStatusExpedicao(a)
        const expB = this.computeStatusExpedicao(b)
        const expForaA =
          expA === 'Fora do Prazo' || expA === 'Pendente / Fora do Prazo'
        const expForaB =
          expB === 'Fora do Prazo' || expB === 'Pendente / Fora do Prazo'
        if (expForaA && !expForaB) return -1
        if (!expForaA && expForaB) return 1
        const sepA = this.computeStatusSeparacao(a)
        const sepB = this.computeStatusSeparacao(b)
        const sepForaA =
          sepA === 'Fora do Prazo' || sepA === 'Pendente / Fora do Prazo'
        const sepForaB =
          sepB === 'Fora do Prazo' || sepB === 'Pendente / Fora do Prazo'
        if (sepForaA && !sepForaB) return -1
        if (!sepForaA && sepForaB) return 1
        const dtA = a.integrado ? new Date(a.integrado).getTime() : 0
        const dtB = b.integrado ? new Date(b.integrado).getTime() : 0
        const foraA = expForaA || sepForaA
        const foraB = expForaB || sepForaB
        if (foraA && foraB) return dtA - dtB
        if (!foraA && !foraB) return dtB - dtA
        return 0
      })
    },
    /** Lista exibida na tabela: página atual (50 por página). Gráficos usam o total (filteredPedidosPendentes). */
    pedidosParaTabela() {
      const list = this.pedidosPendentesOrdenados || []
      const start = (this.currentPage - 1) * this.pageSize
      return list.slice(start, start + this.pageSize)
    },
    totalPages() {
      const total = (this.filteredPedidosPendentes || []).length
      return total === 0 ? 1 : Math.ceil(total / this.pageSize)
    },
    paginationLabel() {
      const total = (this.filteredPedidosPendentes || []).length
      if (total === 0) return 'Nenhum registro'
      const start = (this.currentPage - 1) * this.pageSize + 1
      const end = Math.min(this.currentPage * this.pageSize, total)
      return `${this.formatarNumero(start)} - ${this.formatarNumero(end)} de ${this.formatarNumero(total)}`
    },
    labelIntervaloAtual() {
      if (!this.dataInicio && !this.dataFim) return 'Período'
      if (this.biSubTab === 'armazens' && this.dataInicio && this.dataFim) {
        return this.labelArmazensPeriodoMesesFechados
      }
      if (this.dataInicio && this.dataFim)
        return `${this.formatarDataCalendario(this.dataInicio)} - ${this.formatarDataCalendario(this.dataFim)}`
      return this.dataInicio
        ? this.formatarDataCalendario(this.dataInicio)
        : this.formatarDataCalendario(this.dataFim)
    },
    /** Ex.: «janeiro – março de 2025» ou «novembro de 2025 – fevereiro de 2026». */
    labelArmazensPeriodoMesesFechados() {
      const pi = parseIsoDataParaMesAno(this.dataInicio)
      const pf = parseIsoDataParaMesAno(this.dataFim)
      if (!pi || !pf) return 'Período'
      const n = i => MESES_NOME_PT_BR[i - 1] || ''
      if (pi.ano === pf.ano && pi.mes === pf.mes) {
        return `${n(pi.mes)} de ${pi.ano}`
      }
      if (pi.ano === pf.ano) {
        return `${n(pi.mes)} – ${n(pf.mes)} de ${pi.ano}`
      }
      return `${n(pi.mes)} de ${pi.ano} – ${n(pf.mes)} de ${pf.ano}`
    },
    opcoesMesSelectArmazensBi() {
      return MESES_NOME_PT_BR.map((nome, i) => ({
        value: i + 1,
        label: nome.charAt(0).toUpperCase() + nome.slice(1),
      }))
    },
    /** Anos de 2025 até o ano civil atual (2027 só entra quando o relógio for 2027). */
    anosSelectCalendarioArmazensBi() {
      const anoMin = ANO_MIN_REF_ARMAZENS_BI
      const y = new Date().getFullYear()
      const anoMax = Math.max(y, anoMin)
      const out = []
      for (let a = anoMin; a <= anoMax; a++) out.push(a)
      return out
    },
    /** Com filtro de cliente: KPIs de visão cliente (proporção no CD). */
    armazensVisaoClienteResumo() {
      return (
        this.biSubTab === 'armazens' &&
        this.canShowClienteColumn &&
        (this.filtroClientes || []).length > 0
      )
    },
    /** R$/PP no resumo do período: custo PP do CD / PP totais do CD (sempre visão geral). */
    armazensCustoPpPorUnidadeLoading() {
      return (
        this.armazensCustoTotalPpItensLoading ||
        this.armazensTotalPosicoesPaletesLoading
      )
    },
    armazensCustoPpPorUnidadeValor() {
      if (this.armazensCustoPpPorUnidadeLoading) return null
      const c = this.armazensCustoTotalPpItens
      if (c == null) return null
      const cn = Number(c)
      if (!Number.isFinite(cn)) return null
      const p = this.armazensTotalPosicoesPaletes
      if (p == null) return null
      const pn = Number(p)
      if (!Number.isFinite(pn) || pn <= 0) return null
      return cn / pn
    },
    /**
     * Com filtro cliente: custo total PP = PP cliente × (R$/PP do período com 2 decimais),
     * alinhado ao valor exibido em «Custo por PP» do resumo do período.
     */
    armazensCustoTotalPpAlocadoClienteLoading() {
      if (!this.armazensVisaoClienteResumo) return false
      return (
        this.armazensCustoTotalPpItensLoading ||
        this.armazensTotalPosicoesPaletesLoading ||
        this.armazensClienteTotalPosicoesPaletesLoading
      )
    },
    armazensCustoTotalPpAlocadoClienteValor() {
      if (!this.armazensVisaoClienteResumo) return null
      if (this.armazensCustoTotalPpAlocadoClienteLoading) return null
      const c = this.armazensCustoTotalPpItens
      const ppCd = this.armazensTotalPosicoesPaletes
      const ppCli = this.armazensClienteTotalPosicoesPaletes
      if (c == null || ppCd == null || ppCli == null) return null
      const cn = Number(c)
      const pcd = Number(ppCd)
      const pcl = Number(ppCli)
      if (
        !Number.isFinite(cn) ||
        !Number.isFinite(pcd) ||
        pcd <= 0 ||
        !Number.isFinite(pcl)
      ) {
        return null
      }
      const taxaPeriodo2 = Math.round((cn / pcd) * 100) / 100
      return Math.round(pcl * taxaPeriodo2 * 100) / 100
    },
    /** Funcionários CLT rateados ao cliente: (unid. cliente / unid. período) × CLT período. */
    armazensClienteFuncCltProporcionalLoading() {
      if (!this.armazensVisaoClienteResumo) return false
      return (
        this.armazensClienteTotalUnidadesLoading ||
        this.armazensTotalUnidadesLoading ||
        this.armazensFuncCltLoading
      )
    },
    armazensClienteFuncCltProporcionalValor() {
      if (!this.armazensVisaoClienteResumo) return null
      if (this.armazensClienteFuncCltProporcionalLoading) return null
      const uCli = this.armazensClienteTotalUnidades
      const uTot = this.armazensTotalUnidades
      const f = this.armazensFuncCltMedia
      if (uCli == null || uTot == null || f == null) return null
      const cli = Number(uCli)
      const tot = Number(uTot)
      const fn = Number(f)
      if (
        !Number.isFinite(cli) ||
        !Number.isFinite(tot) ||
        !Number.isFinite(fn) ||
        tot <= 0 ||
        fn < 0
      ) {
        return null
      }
      return (cli / tot) * fn
    },
    /**
     * Custo por pessoa (operação) no cliente: CLT proporcional × custo por pessoa do período.
     */
    armazensClienteCustoPorPessoaOperacaoLoading() {
      if (!this.armazensVisaoClienteResumo) return false
      return (
        this.armazensClienteFuncCltProporcionalLoading ||
        this.armazensCustoPorPessoaOperacaoRhLoading
      )
    },
    armazensClienteCustoPorPessoaOperacaoValor() {
      if (!this.armazensVisaoClienteResumo) return null
      if (this.armazensClienteCustoPorPessoaOperacaoLoading) return null
      const fProp = this.armazensClienteFuncCltProporcionalValor
      const cpp = this.armazensCustoPorPessoaOperacaoRh
      if (fProp == null || cpp == null) return null
      const fp = Number(fProp)
      const c = Number(cpp)
      if (!Number.isFinite(fp) || !Number.isFinite(c)) return null
      return fp * c
    },
    /**
     * Custo de atendimento no cliente: unidades do cliente × R$/unidade do período
     * (mesmo custo por unidade do resumo geral).
     */
    armazensClienteCustoAtendimentoPorUnidadeLoading() {
      if (!this.armazensVisaoClienteResumo) return false
      return (
        this.armazensClienteTotalUnidadesLoading ||
        this.armazensCustoAtendimentoPorUnidadeLoading
      )
    },
    armazensClienteCustoAtendimentoPorUnidadeValor() {
      if (this.armazensClienteCustoAtendimentoPorUnidadeLoading) return null
      const u = this.armazensClienteTotalUnidades
      const r = this.armazensCustoAtendimentoPorUnidadeValor
      if (u == null || r == null) return null
      const un = Number(u)
      const rn = Number(r)
      if (!Number.isFinite(un) || !Number.isFinite(rn)) return null
      return un * rn
    },
    /**
     * Custo total do cliente: custo PP (card) + custo por pessoa operação + custo atendimento (× unid.).
     */
    armazensClienteCustoTotalPorClienteLoading() {
      if (!this.armazensVisaoClienteResumo) return false
      return (
        this.armazensCustoTotalPpAlocadoClienteLoading ||
        this.armazensClienteCustoPorPessoaOperacaoLoading ||
        this.armazensClienteCustoAtendimentoPorUnidadeLoading
      )
    },
    armazensClienteCustoTotalPorClienteValor() {
      if (!this.armazensVisaoClienteResumo) return null
      if (this.armazensClienteCustoTotalPorClienteLoading) return null
      const pp = this.armazensCustoTotalPpAlocadoClienteValor
      const pess = this.armazensClienteCustoPorPessoaOperacaoValor
      const at = this.armazensClienteCustoAtendimentoPorUnidadeValor
      if (pp == null || pess == null || at == null) return null
      return Number(pp) + Number(pess) + Number(at)
    },
    /**
     * % = (custo total do cliente / custo total operação do período) × 100.
     */
    armazensClientePctCustoTotalNoCdLoading() {
      if (!this.armazensVisaoClienteResumo) return false
      return (
        this.armazensClienteCustoTotalPorClienteLoading ||
        this.armazensCustoTotalOperacaoLoading
      )
    },
    armazensClientePctCustoTotalNoCdValor() {
      if (!this.armazensVisaoClienteResumo) return null
      if (this.armazensClientePctCustoTotalNoCdLoading) return null
      const t = this.armazensClienteCustoTotalPorClienteValor
      const op = this.armazensCustoTotalOperacao
      if (t == null || op == null) return null
      const tn = Number(t)
      const opn = Number(op)
      if (!Number.isFinite(tn) || !Number.isFinite(opn) || opn <= 0) return null
      return (tn / opn) * 100
    },
    /** Total unidades atendidas ÷ média de funcionários CLT (mesmos filtros/período das duas APIs). */
    armazensUnidadesPorFuncLoading() {
      return this.armazensTotalUnidadesLoading || this.armazensFuncCltLoading
    },
    armazensUnidadesPorFuncValor() {
      if (this.armazensUnidadesPorFuncLoading) return null
      const u = this.armazensTotalUnidades
      const f = this.armazensFuncCltMedia
      if (u == null || f == null) return null
      const un = Number(u)
      const fn = Number(f)
      if (!Number.isFinite(un) || !Number.isFinite(fn) || fn <= 0) return null
      return Math.round(un / fn)
    },
    /** (Custo total operação − custo total posições paletes) ÷ total unidades atendidas. */
    armazensCustoAtendimentoPorUnidadeLoading() {
      return (
        this.armazensCustoTotalOperacaoLoading ||
        this.armazensCustoTotalPpItensLoading ||
        this.armazensTotalUnidadesLoading
      )
    },
    armazensCustoAtendimentoPorUnidadeValor() {
      if (this.armazensCustoAtendimentoPorUnidadeLoading) return null
      const op = this.armazensCustoTotalOperacao
      const pp = this.armazensCustoTotalPpItens
      const u = this.armazensTotalUnidades
      if (op == null || pp == null || u == null) return null
      const opn = Number(op)
      const ppn = Number(pp)
      const un = Number(u)
      if (
        !Number.isFinite(opn) ||
        !Number.isFinite(ppn) ||
        !Number.isFinite(un) ||
        un <= 0
      ) {
        return null
      }
      const diff = opn - ppn
      if (!Number.isFinite(diff)) return null
      return diff / un
    },
    /**
     * 12 células (1 linha × 12 colunas): período e cliente partilham a mesma grelha. Coluna 1: na
     * linha de cima é «Custo TOT. operação», embaixo «Custo TOT. do cliente»
     * (o mesmo recorte visual vermelho, um de baixo do outro). UNI.
     * atendidos + UNI./FUNC. + atend. por UNI. (azul) seguidos. Depois
     * amarelo, depois %.
     */
    armazensResumoDefColunas() {
      return [
        { period: 'custo_ops_ab', cliente: 'custo_total_cliente' },
        { period: 'faturamento_cliente', cliente: 'faturamento_cliente' },
        { period: 'custo_total_pp', cliente: 'custo_total_pp' },
        { period: 'total_pp_ocupadas', cliente: 'total_pp_ocupadas' },
        { period: 'custo_por_pp', cliente: 'custo_por_pp' },
        { period: 'unidades_atendidas', cliente: 'unidades_atendidas' },
        { period: 'unid_por_func', cliente: 'unid_por_func' },
        { period: 'custo_atend_unidade', cliente: 'custo_atend_unidade' },
        { period: 'func_clt', cliente: 'func_clt' },
        { period: 'custo_func_dedicado', cliente: 'custo_func_dedicado' },
        { period: 'custo_por_pessoa', cliente: 'custo_por_pessoa' },
        { period: 'pct_custo_cliente_cd', cliente: 'pct_custo_cliente_cd' },
      ]
    },
    /**
     * Cada coluna: { id (métrica exibida no período), m, def, empty }.
     */
    armazensResumoCelulasPeriodo() {
      const list = this.armazensMetricas || []
      const pick = id => list.find(x => x.id === id)
      return this.armazensResumoDefColunas.map(def => {
        const id = def.period
        const m = pick(id)
        return { id, def, empty: !m, m: m || null }
      })
    },
    /** Cada coluna: id = métrica exibida no cliente; alinhada às defs. */
    armazensResumoCelulasCliente() {
      if (!this.armazensVisaoClienteResumo) return []
      const list = this.armazensMetricas || []
      const pick = id => list.find(x => x.id === id)
      return this.armazensResumoDefColunas.map(def => {
        const id = def.cliente
        const m = pick(id)
        if (!m) return { id, def, empty: true, m: null }
        return {
          id,
          def,
          empty: !this.armazensClienteResumoIdVisivel(id),
          m,
        }
      })
    },
    /**
     * Resumo empresa: KPIs em ordem lógica; faixa alinhada à grade de colunas.
     */
    armazensMetricasResumoGrid() {
      return this.armazensResumoCelulasPeriodo
        .filter(c => !c.empty)
        .map(c => c.m)
    },
    /**
     * Resumo cliente: mesma coluna do resumo empresa; lista só células com card.
     */
    armazensMetricasResumoGridCliente() {
      if (!this.armazensVisaoClienteResumo) return []
      return this.armazensResumoCelulasCliente
        .filter(c => !c.empty)
        .map(c => c.m)
    },
    /** Análise Armazéns: ano / mês / customizar (custos por ref. mensal). */
    presetsCalendarioVisiveis() {
      if (this.biSubTab === 'armazens') {
        const y = new Date().getFullYear()
        return PRESETS_CALENDARIO_ARMAZENS.filter(
          p => p.id !== 'ano_anterior' || y - 1 >= ANO_MIN_REF_ARMAZENS_BI
        )
      }
      return this.presetsCalendario || []
    },
    /** Painel De/Até + atalhos extras só no preset Customizar (Armazéns). */
    armazensCalendarioModoCustomizar() {
      return this.biSubTab === 'armazens' && this.presetAtivo === 'customizar'
    },
    /** Pedidos do período com filtros aplicados, sem excluir Emb. Conf. (para lista da face cards). */
    filteredPedidosTodosPeriodo() {
      const list = this.pedidosTotais || []
      if (!list.length) return []
      const semOsangAjuste = list.filter(
        p => !this.pedidoOsangDeveExcluirPorAjuste(p)
      )
      try {
        const out = this.applyFiltrosFormTodosPeriodo(list)
        return Array.isArray(out) ? out : semOsangAjuste
      } catch (e) {
        console.warn('[BI] applyFiltrosFormTodosPeriodo erro:', e)
        return semOsangAjuste
      }
    },
    /** Cards da etapa Separação (PENDENTE, ANTECIPADO, D+0, D+1, D+2, OUT, TOTAL) para a face totalizadores. */
    cardsSeparacao() {
      const s = this.displayStatsSlaTodosPeriodo.sepPedidos || {}
      const total = (this.filteredPedidosTodosPeriodo || []).length
      const items = [
        {
          key: 'pendente',
          label: 'PENDENTE',
          count: s.pendente || 0,
          color: COLORS.pendente,
        },
        {
          key: 'antecipado',
          label: 'ANTECIPADO',
          count: s.antecipado || 0,
          color: COLORS.antecipado,
        },
        { key: 'd0', label: 'D+0', count: s.d0 || 0, color: COLORS.d0 },
        { key: 'd1', label: 'D+1', count: s.d1 || 0, color: COLORS.d1 },
        { key: 'd2', label: 'D+2', count: s.d2 || 0, color: COLORS.d2 },
        { key: 'out', label: 'OUT', count: s.out || 0, color: COLORS.out },
        {
          key: 'total',
          label: 'TOTAL PEDIDOS',
          count: total,
          color: '#4A90D9',
          isTotal: true,
        },
      ]
      const slices = items.filter(i => !i.isTotal)
      const sumSlices =
        slices.reduce((a, i) => a + (Number(i.count) || 0), 0) || 0
      const denom = sumSlices > 0 ? sumSlices : Math.max(1, Number(total) || 0)
      return items.map(i => ({
        ...i,
        pct: i.isTotal
          ? 100
          : denom
            ? ((Number(i.count) || 0) / denom) * 100
            : 0,
      }))
    },
    /** Cards da etapa Expedição (PENDENTE, ANTECIPADO, D+0, D+1, D+2, OUT, TOTAL) para a face totalizadores. */
    cardsExpedicao() {
      const s = this.displayStatsSlaTodosPeriodo.expPedidos || {}
      const total = (this.filteredPedidosTodosPeriodo || []).length
      const items = [
        {
          key: 'pendente',
          label: 'PENDENTE',
          count: s.pendente || 0,
          color: COLORS.pendente,
        },
        {
          key: 'antecipado',
          label: 'ANTECIPADO',
          count: s.antecipado || 0,
          color: COLORS.antecipado,
        },
        { key: 'd0', label: 'D+0', count: s.d0 || 0, color: COLORS.d0 },
        { key: 'd1', label: 'D+1', count: s.d1 || 0, color: COLORS.d1 },
        { key: 'd2', label: 'D+2', count: s.d2 || 0, color: COLORS.d2 },
        { key: 'out', label: 'OUT', count: s.out || 0, color: COLORS.out },
        {
          key: 'total',
          label: 'TOTAL PEDIDOS',
          count: total,
          color: '#4A90D9',
          isTotal: true,
        },
      ]
      const slicesExp = items.filter(i => !i.isTotal)
      const sumSlicesExp =
        slicesExp.reduce((a, i) => a + (Number(i.count) || 0), 0) || 0
      const denomExp =
        sumSlicesExp > 0 ? sumSlicesExp : Math.max(1, Number(total) || 0)
      return items.map(i => ({
        ...i,
        pct: i.isTotal
          ? 100
          : denomExp
            ? ((Number(i.count) || 0) / denomExp) * 100
            : 0,
      }))
    },
    /** Lista ordenada para tabela "todo o período" (por intervalo/data de integração, sem prioridade). */
    pedidosTotaisOrdenados() {
      const list = [...(this.filteredPedidosTodosPeriodo || [])]
      return list.sort((a, b) => {
        const dtA = a.integrado ? new Date(a.integrado).getTime() : 0
        const dtB = b.integrado ? new Date(b.integrado).getTime() : 0
        return (
          dtA - dtB
        ) /* ordem cronológica do intervalo: mais antigo primeiro */
      })
    },
    pedidosParaTabelaGeral() {
      const list = this.pedidosTotaisOrdenados || []
      const start = (this.currentPageGeral - 1) * this.pageSize
      return list.slice(start, start + this.pageSize)
    },
    totalPagesGeral() {
      const total = (this.filteredPedidosTodosPeriodo || []).length
      return total === 0 ? 1 : Math.ceil(total / this.pageSize)
    },
    paginationLabelGeral() {
      const total = (this.filteredPedidosTodosPeriodo || []).length
      if (total === 0) return 'Nenhum registro'
      const start = (this.currentPageGeral - 1) * this.pageSize + 1
      const end = Math.min(this.currentPageGeral * this.pageSize, total)
      return `${this.formatarNumero(start)} - ${this.formatarNumero(end)} de ${this.formatarNumero(total)}`
    },
    /** Dashboard Rejeição: clientes com pedidos em rejeição (agrupados). */
    rejeicaoClientesComRejeicao() {
      const dados = this.rejeicaoDados || []
      const isRejeicao = r => {
        if (!r?.sit_arquivo) return false
        const sit = String(r.sit_arquivo).trim()
        if (sit === 'S/ Rejeições') return false
        const sitLower = sit.toLowerCase()
        if (
          sitLower.includes('rejeição') ||
          sitLower.includes('rejeicao') ||
          sitLower.includes('reje')
        )
          return true
        if (sit.includes('C/') || sit.includes('c/')) return true
        return false
      }
      const grupos = {}
      dados.forEach(r => {
        const nomeRaw = r.nome_cliente || 'Sem Cliente'
        const idCliente = r.id_cliente ?? ''
        const keyNorm = `${idCliente}|${(nomeRaw.trim() || 'sem cliente').toUpperCase()}`
        if (!grupos[keyNorm]) {
          grupos[keyNorm] = {
            cliente: (nomeRaw.trim() || 'Sem Cliente').toUpperCase(),
            id_cliente: r.id_cliente,
            estabelecimento: r.estabelecimento,
            pedidosEmRejeicao: 0,
          }
        }
        const key = `${r.pedido}_${idCliente}`
        if (!grupos[keyNorm]._seen) grupos[keyNorm]._seen = new Set()
        if (!grupos[keyNorm]._seen.has(key) && isRejeicao(r)) {
          grupos[keyNorm]._seen.add(key)
          grupos[keyNorm].pedidosEmRejeicao++
        }
      })
      return Object.values(grupos)
        .filter(g => (g.pedidosEmRejeicao || 0) > 0)
        .sort((a, b) => (b.pedidosEmRejeicao || 0) - (a.pedidosEmRejeicao || 0))
    },
    rejeicaoTotalClientes() {
      return this.rejeicaoClientesComRejeicao.length
    },
    rejeicaoTotalPedidos() {
      return this.rejeicaoClientesComRejeicao.reduce(
        (acc, g) => acc + (g.pedidosEmRejeicao || 0),
        0
      )
    },
    /** Tempo médio em dias entre rejeição e resolução (apenas pedidos integrados). */
    rejeicaoTempoMedioResolucao() {
      const dados = this.rejeicaoDados || []
      const resolvidos = dados.filter(
        r =>
          r.status_exibicao === 'Integrado' &&
          r.dt_inclusao &&
          r.dt_integrado_em
      )
      if (resolvidos.length === 0) return '—'
      let totalDias = 0
      resolvidos.forEach(r => {
        const dtRej = new Date(r.dt_inclusao).getTime()
        const dtRes = new Date(r.dt_integrado_em).getTime()
        totalDias += (dtRes - dtRej) / (1000 * 60 * 60 * 24)
      })
      const media = totalDias / resolvidos.length
      return media.toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
    },
    /** Tempo médio resolução para pedidos com SLA D+0 (efetividade da casa D+0). */
    rejeicaoTempoMedioResolucaoD0() {
      const dados = this.rejeicaoDados || []
      const slaNorm = s => (s || 'D+0').toString().trim().toUpperCase()
      const resolvidos = dados.filter(
        r =>
          r.status_exibicao === 'Integrado' &&
          r.dt_inclusao &&
          r.dt_integrado_em &&
          slaNorm(r.sla) === 'D+0'
      )
      if (resolvidos.length === 0) return '—'
      let totalDias = 0
      resolvidos.forEach(r => {
        const dtRej = new Date(r.dt_inclusao).getTime()
        const dtRes = new Date(r.dt_integrado_em).getTime()
        totalDias += (dtRes - dtRej) / (1000 * 60 * 60 * 24)
      })
      const media = totalDias / resolvidos.length
      return media.toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
    },
    /** Tempo médio resolução para pedidos com SLA D+1 (efetividade da casa D+1). */
    rejeicaoTempoMedioResolucaoD1() {
      const dados = this.rejeicaoDados || []
      const slaNorm = s => (s || '').toString().trim().toUpperCase()
      const resolvidos = dados.filter(
        r =>
          r.status_exibicao === 'Integrado' &&
          r.dt_inclusao &&
          r.dt_integrado_em &&
          slaNorm(r.sla) === 'D+1'
      )
      if (resolvidos.length === 0) return '—'
      let totalDias = 0
      resolvidos.forEach(r => {
        const dtRej = new Date(r.dt_inclusao).getTime()
        const dtRes = new Date(r.dt_integrado_em).getTime()
        totalDias += (dtRes - dtRej) / (1000 * 60 * 60 * 24)
      })
      const media = totalDias / resolvidos.length
      return media.toLocaleString('pt-BR', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      })
    },
    rejeicaoCountResolvidosD0() {
      const dados = this.rejeicaoDados || []
      const slaNorm = s => (s || 'D+0').toString().trim().toUpperCase()
      return dados.filter(
        r =>
          r.status_exibicao === 'Integrado' &&
          r.dt_inclusao &&
          r.dt_integrado_em &&
          slaNorm(r.sla) === 'D+0'
      ).length
    },
    rejeicaoCountResolvidosD1() {
      const dados = this.rejeicaoDados || []
      const slaNorm = s => (s || '').toString().trim().toUpperCase()
      return dados.filter(
        r =>
          r.status_exibicao === 'Integrado' &&
          r.dt_inclusao &&
          r.dt_integrado_em &&
          slaNorm(r.sla) === 'D+1'
      ).length
    },
    /** Pedidos em rejeição (não resolvidos) com SLA D+0. */
    rejeicaoCountEmRejeicaoD0() {
      const dados = this.rejeicaoDados || []
      const slaNorm = s => (s || 'D+0').toString().trim().toUpperCase()
      const emRej = r => r.status_exibicao === 'C/ Rejeições'
      const seen = new Set()
      return dados.filter(r => {
        if (!emRej(r) || slaNorm(r.sla) !== 'D+0') return false
        const key = `${r.pedido}|${r.id_cliente || ''}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      }).length
    },
    /** Pedidos em rejeição (não resolvidos) com SLA D+1. */
    rejeicaoCountEmRejeicaoD1() {
      const dados = this.rejeicaoDados || []
      const slaNorm = s => (s || '').toString().trim().toUpperCase()
      const emRej = r => r.status_exibicao === 'C/ Rejeições'
      const seen = new Set()
      return dados.filter(r => {
        if (!emRej(r) || slaNorm(r.sla) !== 'D+1') return false
        const key = `${r.pedido}|${r.id_cliente || ''}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      }).length
    },
    /** Dados para gráfico de colunas: rejeições por armazém. */
    rejeicaoPorArmazemLabels() {
      const dados = this.rejeicaoPorArmazemData
      return dados.map(d => d.armazem || '(sem armazém)')
    },
    rejeicaoPorArmazemData() {
      let dados = this.rejeicaoDados || []
      if (this.rejeicaoFiltroAdm) {
        const adm = this.rejeicaoFiltroAdm
        dados = dados.filter(r => {
          const rAdm = (r.adm || '').trim() || '(sem ADM)'
          return rAdm === adm
        })
      }
      const isEmRejeicao = r => r.status_exibicao === 'C/ Rejeições'
      const porArmazem = {}
      dados.filter(isEmRejeicao).forEach(r => {
        const arm = (r.estabelecimento || '').trim() || '(sem armazém)'
        if (!porArmazem[arm]) {
          porArmazem[arm] = {
            armazem: arm,
            pedidos: new Set(),
            clientes: new Set(),
          }
        }
        porArmazem[arm].pedidos.add(`${r.pedido}_${r.id_cliente || ''}`)
        porArmazem[arm].clientes.add(
          String(r.id_cliente || r.nome_cliente || '')
        )
      })
      return Object.values(porArmazem)
        .map(p => ({
          armazem: p.armazem,
          totalPedidos: p.pedidos.size,
          totalClientes: p.clientes.size,
        }))
        .filter(p => p.totalPedidos > 0)
        .sort((a, b) => b.totalPedidos - a.totalPedidos)
    },
    /** ADM agregado: clientes e pedidos rejeitados por ADM, ordenado por pedidos. */
    rejeicaoPorAdm() {
      const dados = this.rejeicaoDados || []
      const porAdm = {}
      dados.forEach(r => {
        const adm = (r.adm || '').trim() || '(sem ADM)'
        if (!porAdm[adm])
          porAdm[adm] = {
            adm: adm || '(sem ADM)',
            clientes: new Set(),
            pedidos: new Set(),
          }
        porAdm[adm].clientes.add(String(r.id_cliente || r.nome_cliente || ''))
        porAdm[adm].pedidos.add(`${r.pedido}_${r.id_cliente || ''}`)
      })
      return Object.values(porAdm)
        .map(p => ({
          adm: p.adm,
          clientes: p.clientes.size,
          pedidos: p.pedidos.size,
        }))
        .filter(p => p.pedidos > 0)
        .sort((a, b) => b.pedidos - a.pedidos)
        .slice(0, 10)
    },
    /** Clientes ordenados por total de pedidos rejeitados (histórico + em rejeição). */
    rejeicaoClientesPorFrequencia() {
      const dados = this.rejeicaoDados || []
      const isRejeicao = r => {
        if (!r?.sit_arquivo) return false
        const sit = String(r.sit_arquivo).trim()
        if (sit === 'S/ Rejeições') return false
        const sitLower = sit.toLowerCase()
        if (
          sitLower.includes('rejeição') ||
          sitLower.includes('rejeicao') ||
          sitLower.includes('reje')
        )
          return true
        if (sit.includes('C/') || sit.includes('c/')) return true
        return false
      }
      const grupos = {}
      dados.forEach(r => {
        const nomeRaw = r.nome_cliente || 'Sem Cliente'
        const idCliente = r.id_cliente ?? ''
        const keyNorm = `${idCliente}|${(nomeRaw.trim() || 'sem cliente').toUpperCase()}`
        if (!grupos[keyNorm]) {
          const slaNorm = s => (s || 'D+0').toString().trim().toUpperCase()
          grupos[keyNorm] = {
            cliente: (nomeRaw.trim() || 'Sem Cliente').toUpperCase(),
            id_cliente: r.id_cliente,
            estabelecimento: r.estabelecimento,
            sla: slaNorm(r.sla),
            totalPedidos: 0,
            pedidosEmRejeicao: 0,
            _seenTotal: new Set(),
            _seenRej: new Set(),
            _adms: new Set(),
          }
        }
        const adm = (r.adm || '').trim() || '(sem ADM)'
        grupos[keyNorm]._adms.add(adm)
        const key = `${r.pedido}_${idCliente}`
        if (!grupos[keyNorm]._seenTotal.has(key)) {
          grupos[keyNorm]._seenTotal.add(key)
          grupos[keyNorm].totalPedidos++
        }
        if (isRejeicao(r) && !grupos[keyNorm]._seenRej.has(key)) {
          grupos[keyNorm]._seenRej.add(key)
          grupos[keyNorm].pedidosEmRejeicao++
        }
      })
      return Object.values(grupos)
        .filter(g => (g.totalPedidos || 0) > 0)
        .map(g => {
          const { _seenTotal, _seenRej, _adms, ...rest } = g
          return { ...rest, adms: [..._adms] }
        })
        .sort((a, b) => (b.totalPedidos || 0) - (a.totalPedidos || 0))
    },
    labelRejeicaoPeriodo() {
      const p = this.rejeicaoPresets.find(
        x => x.id === this.rejeicaoPresetAtivo
      )
      return p ? p.label : 'Período'
    },
    rejeicaoClientesFiltrados() {
      const lista = this.rejeicaoClientesPorFrequencia || []
      const filtro = this.rejeicaoFiltroTabela
      let filtrada = lista
      if (this.rejeicaoFiltroAdm) {
        const adm = this.rejeicaoFiltroAdm
        filtrada = filtrada.filter(g => (g.adms || []).includes(adm))
      }
      if (filtro === 'em_rejeicao')
        filtrada = filtrada.filter(g => (g.pedidosEmRejeicao || 0) > 0)
      else if (filtro === 'resolvidos')
        filtrada = filtrada.filter(
          g => (g.pedidosEmRejeicao || 0) === 0 && (g.totalPedidos || 0) > 0
        )
      return filtrada
        .sort(
          (a, b) =>
            (b.pedidosEmRejeicao || 0) - (a.pedidosEmRejeicao || 0) ||
            (b.totalPedidos || 0) - (a.totalPedidos || 0)
        )
        .slice(0, 10)
    },
    rejeicaoPedidosClienteExpandido() {
      if (!this.rejeicaoClienteExpandido) return []
      const dados = this.rejeicaoDados || []
      const cKey = this.rejeicaoClienteExpandido
      const seen = new Set()
      return dados
        .filter(r => {
          const idCliente = r.id_cliente ?? ''
          const nome = (r.nome_cliente || 'Sem Cliente').trim().toUpperCase()
          const k = `${idCliente}|${nome}`
          if (k !== cKey) return false
          const pedidoKey = `${r.pedido}_${idCliente}`
          if (seen.has(pedidoKey)) return false
          seen.add(pedidoKey)
          return true
        })
        .map(r => ({
          pedido: r.pedido,
          motivo: (r.rejeicao || '').trim() || '(sem motivo)',
          status: r.status_exibicao || r.sit_arquivo || '-',
          data: r.dt_inclusao,
          sla: r.sla || 'D+0',
          armazem: r.estabelecimento || '-',
        }))
        .sort((a, b) => {
          const da = a.data ? new Date(a.data).getTime() : 0
          const db = b.data ? new Date(b.data).getTime() : 0
          return db - da
        })
    },
    rejeicaoWatchlist() {
      const filtro = this.rejeicaoWatchFiltro
      if (filtro === 'urgentes') {
        let urgentes = this.rejeicaoUrgentes || []
        if (this.rejeicaoFiltroAdm) {
          const adm = this.rejeicaoFiltroAdm
          const dados = this.rejeicaoDados || []
          const keysDoAdm = new Set()
          dados.forEach(r => {
            const rAdm = (r.adm || '').trim() || '(sem ADM)'
            if (rAdm === adm) keysDoAdm.add(`${r.pedido}|${r.id_cliente || ''}`)
          })
          urgentes = urgentes.filter(u =>
            keysDoAdm.has(`${u.pedido}|${u.id_cliente || ''}`)
          )
        }
        return urgentes.slice(0, 10)
      }
      const lista = this.rejeicaoClientesPorFrequencia || []
      let filtrada = lista.filter(g => (g.totalPedidos || 0) > 0)
      if (this.rejeicaoFiltroAdm) {
        const adm = this.rejeicaoFiltroAdm
        filtrada = filtrada.filter(g => (g.adms || []).includes(adm))
      }
      return filtrada
        .sort((a, b) => (b.totalPedidos || 0) - (a.totalPedidos || 0))
        .slice(0, 5)
    },
  },
  watch: {
    biTvLayout(isFs) {
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          Object.values(this.charts).forEach(
            c => c && typeof c.resize === 'function' && c.resize()
          )
          if (this.biSubTab === 'rejeicao') {
            const recrear = () => {
              if (this.charts.rejeicaoEvolucao) {
                this.rejeicaoBarCanvasLabels = []
                this.charts.rejeicaoEvolucao.destroy()
                this.charts.rejeicaoEvolucao = null
              }
              this.$nextTick(() => {
                setTimeout(() => this.renderRejeicaoCharts(), 100)
              })
            }
            setTimeout(recrear, isFs ? 300 : 100)
          }
          if (this.biSubTab === 'armazens') {
            const recrearAz = () => {
              this.destroyArmazensEvolucaoCharts()
              this.$nextTick(() => {
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    setTimeout(() => this.renderArmazensEvolucaoCharts(), 80)
                  })
                })
              })
            }
            setTimeout(recrearAz, isFs ? 480 : 100)
          }
        })
      })
      if (isFs && this.biSubTab === 'rejeicao') {
        this.$nextTick(() => this.ensureRejeicaoScrollInterval())
      } else {
        this.stopRejeicaoScrollInterval()
      }
    },
    chartFilter() {
      this.currentPage = 1
      this.$nextTick(() => this.renderCharts())
    },
    dataInicio() {
      this.syncDataDisplayFromModel()
    },
    dataFim() {
      this.syncDataDisplayFromModel()
    },
    filteredPedidosPendentes() {
      this.currentPage = 1
    },
    filteredPedidosTodosPeriodo() {
      this.currentPageGeral = 1
    },
    /** Ao selecionar armazéns, validar ADM e recarregar dados da Análise Armazéns. */
    filtroArmazens: {
      handler() {
        if (this.showFiltroAdm && this.filtroAdm) {
          const opts = this.opcoesAdmDistintos || []
          const current = this.filtroAdm.trim()
          const valid =
            current === ''
              ? true
              : current === '__VAZIO__'
                ? opts.some(o => o === null)
                : opts.some(o => (o || '').trim() === current)
          if (!valid) this.filtroAdm = ''
        }
        if (this.biSubTab === 'armazens') {
          this.carregarArmazensTotalUnidades()
          this.carregarArmazensTotalPosicoesPaletes()
          this.carregarArmazensCustoTotalOperacao()
          this.carregarArmazensCustoTotalPpItens()
          this.carregarArmazensQuadroFuncionarios()
          this.carregarArmazensEvolucaoMensal()
          this.carregarArmazensFaturaLegadoResumoPeriodo()
          this.carregarArmazensDadosClienteResumo()
        }
      },
      deep: true,
    },
    /** Ao selecionar clientes, recarregar dados da Análise Armazéns. */
    filtroClientes: {
      handler() {
        if (this.biSubTab === 'armazens') {
          this.carregarArmazensDadosClienteResumo()
          this.carregarArmazensEvolucaoMensal()
        }
      },
      deep: true,
    },
    /** Com DATA SEPARADO, o GET /bi/sla passa a filtrar por separação no banco (alinhado aos gráficos). */
    filtroDataSeparado(nv, ov) {
      if (this.biSubTab !== 'sla') return
      if ((nv || '').trim() === (ov || '').trim()) return
      this.$nextTick(() => this.loadSlaData({ silent: true }))
    },
    /**
     * Donuts: base em `pedidosBaseGraficosSla` + tabela em `pedidosFiltradosPorGrafico`.
     * Redesenhar ao mudar o contexto dos gráficos ou da lista pendentes.
     */
    pedidosFiltradosPorGrafico() {
      if (this.biSubTab !== 'sla') return
      this.$nextTick(() => {
        try {
          this.renderCharts()
        } catch (e) {
          console.warn('[BI] renderCharts após contexto gráficos:', e)
        }
      })
    },
    pedidosBaseGraficosSla() {
      if (this.biSubTab !== 'sla') return
      this.$nextTick(() => {
        try {
          this.renderCharts()
        } catch (e) {
          console.warn('[BI] renderCharts após pedidosBaseGraficosSla:', e)
        }
      })
    },
    /** Donut "Total de volumes" acompanha o total do período; redesenha quando a soma muda. */
    totalVolumesProntos() {
      if (this.biSubTab !== 'sla') return
      this.$nextTick(() => {
        try {
          this.renderCharts()
        } catch (e) {
          console.warn('[BI] renderCharts após totalVolumesProntos:', e)
        }
      })
    },
    /** Se a transportadora escolhida sumir das opções (ex.: mudou cliente), limpar. */
    opcoesTransportadoraDistintos: {
      handler(opts) {
        if (this.biSubTab !== 'sla') return
        const cur = (this.filtroTransportadora || '').trim()
        if (cur && !(opts || []).includes(cur)) this.filtroTransportadora = ''
      },
      immediate: true,
    },
    filtroGerente() {
      if (!this.showFiltroAdm || !this.filtroAdm) return
      const opts = this.opcoesAdmDistintos || []
      const current = this.filtroAdm.trim()
      const valid =
        current === ''
          ? true
          : current === '__VAZIO__'
            ? opts.some(o => o === null)
            : opts.some(o => (o || '').trim() === current)
      if (!valid) this.filtroAdm = ''
    },
    biSubTab(val, oldVal) {
      if (oldVal === 'armazens' && val !== 'armazens') {
        this.destroyArmazensEvolucaoCharts()
        this.armazensPeriodoFaturaLegadoTotal = null
        this.armazensPeriodoFaturaLegadoLinhas = null
        this.armazensPeriodoFaturaLegadoErro = null
        this.armazensPeriodoFaturaLegadoLoading = false
        this.armazensFaturaResumoMeta = null
      }
      if (val === 'rejeicao') {
        if (this.rejeicaoDataInicio == null && this.rejeicaoDataFim == null) {
          this.aplicarRejeicaoPreset('este_mes')
        } else {
          this.carregarRejeicoesBI()
        }
        if (this.biTvLayout) {
          this.$nextTick(() => this.ensureRejeicaoScrollInterval())
        }
      } else {
        this.stopRejeicaoScrollInterval()
        if (val === 'sla') this.loadSlaData()
        else if (val === 'armazens') {
          this.filtroArmazens = []
          this.normalizarPeriodoArmazensMesesInteiros({ ajustarPreset: true })
          this.syncArmazensCalSelectsFromDatas()
          this.carregarOpcoesArmazemCobrancas()
          this.carregarArmazensTotalUnidades()
          this.carregarArmazensTotalPosicoesPaletes()
          this.carregarArmazensFaturaLegadoResumoPeriodo()
          this.carregarArmazensDadosClienteResumo()
          this.carregarArmazensCustoTotalOperacao()
          this.carregarArmazensCustoTotalPpItens()
          this.carregarArmazensQuadroFuncionarios()
          this.carregarArmazensEvolucaoMensal()
        }
        if (val !== 'rejeicao' && this.charts.rejeicaoEvolucao) {
          this.rejeicaoBarCanvasLabels = []
          this.charts.rejeicaoEvolucao.destroy()
          this.charts.rejeicaoEvolucao = null
        }
      }
      this.syncSlaAutoPanelModeFromFullscreenState()
    },
    embedTvLayout: {
      handler() {
        this.syncSlaAutoPanelModeFromFullscreenState()
      },
      immediate: true,
    },
    painelFsActive() {
      this.syncSlaAutoPanelModeFromFullscreenState()
    },
    painelEmbedControlsSlaFlip: {
      handler() {
        this.applyPainelEmbedSlaFlipSync()
        this.syncSlaAutoPanelModeFromFullscreenState()
      },
      immediate: true,
    },
    painelEmbedSlaFlipped: {
      handler() {
        this.applyPainelEmbedSlaFlipSync()
      },
      immediate: true,
    },
  },
  activated() {
    this.$nextTick(() => {
      this.applySlaAutoPanelModeSync()
      if (this.biTvLayout && this.biSubTab === 'rejeicao') {
        this.ensureRejeicaoScrollInterval()
      }
      this.$emit('page-ready')
    })
  },
  async mounted() {
    console.log('📊 Página de BI carregada')
    await this.loadGestores()
    this.syncDataDisplayFromModel()
    if (this.biSubTab === 'sla') this.loadSlaData()
    else if (this.biSubTab === 'rejeicao') {
      if (this.rejeicaoDataInicio == null && this.rejeicaoDataFim == null) {
        this.aplicarRejeicaoPreset('este_mes')
      } else {
        this.carregarRejeicoesBI()
      }
    } else if (this.biSubTab === 'armazens') {
      this.normalizarPeriodoArmazensMesesInteiros({ ajustarPreset: true })
      this.syncArmazensCalSelectsFromDatas()
      this.carregarOpcoesArmazemCobrancas()
      this.carregarArmazensTotalUnidades()
      this.carregarArmazensTotalPosicoesPaletes()
      this.carregarArmazensFaturaLegadoResumoPeriodo()
      this.carregarArmazensDadosClienteResumo()
      this.carregarArmazensCustoTotalOperacao()
      this.carregarArmazensCustoTotalPpItens()
      this.carregarArmazensQuadroFuncionarios()
      this.carregarArmazensEvolucaoMensal()
    }
    this.closeCalendarioAoClicarFora = e => {
      if (
        this.mostrarCalendario &&
        this.$refs.calendarioRef &&
        !this.$refs.calendarioRef.contains(e.target)
      ) {
        this.mostrarCalendario = false
      }
    }
    document.addEventListener('click', this.closeCalendarioAoClicarFora)
    this._closeFiltrosArmazensAoClicarFora = e => {
      if (!this.mostrarFiltros || this.biSubTab !== 'armazens') return
      const root = this.$refs.filtrosRef
      if (!root) return
      if (root.contains && root.contains(e.target)) return
      this.mostrarFiltros = false
      this.mostrarArmazemDropdown = false
    }
    document.addEventListener('click', this._closeFiltrosArmazensAoClicarFora)
    this._armazensAjudaDocClick = e => {
      if (this.armazensAjudaPinnedKey == null) return
      const t = e && e.target
      if (
        t &&
        typeof t.closest === 'function' &&
        t.closest('.bi-armazens-help-wrap')
      ) {
        return
      }
      this.armazensAjudaPinnedKey = null
      this.$nextTick(() => this.syncArmazensAjudaPanelPos())
    }
    document.addEventListener('click', this._armazensAjudaDocClick)
    this._armazensAjudaSyncOnScroll = () => {
      if (this.biSubTab !== 'armazens') return
      if (
        this.armazensAjudaHoverKey == null &&
        this.armazensAjudaPinnedKey == null
      ) {
        return
      }
      this.syncArmazensAjudaPanelPos()
    }
    window.addEventListener('scroll', this._armazensAjudaSyncOnScroll, true)
    window.addEventListener('resize', this._armazensAjudaSyncOnScroll)
    this._fullscreenChangeHandler = () => this.onFullscreenChange()
    document.addEventListener('fullscreenchange', this._fullscreenChangeHandler)
    this.$nextTick(() => {
      this.applySlaAutoPanelModeSync()
      if (this.biTvLayout && this.biSubTab === 'rejeicao') {
        this.ensureRejeicaoScrollInterval()
      }
      this.$emit('page-ready')
    })
  },
  beforeUnmount() {
    if (this._fullscreenChangeHandler) {
      document.removeEventListener(
        'fullscreenchange',
        this._fullscreenChangeHandler
      )
    }
    if (this._dataReadyTimer) {
      clearTimeout(this._dataReadyTimer)
      this._dataReadyTimer = null
    }
    this.stopAutoPanelMode()
    this.stopRejeicaoScrollInterval()
    {
      const root = this.biFullscreenRootEl()
      const fs = document.fullscreenElement
      if (this.isOurFullscreenElement(fs, root)) {
        document.exitFullscreen().catch(() => {})
      }
    }
    this.destroyCharts()
    if (this.closeCalendarioAoClicarFora) {
      document.removeEventListener('click', this.closeCalendarioAoClicarFora)
    }
    if (this._closeFiltrosArmazensAoClicarFora) {
      document.removeEventListener(
        'click',
        this._closeFiltrosArmazensAoClicarFora
      )
    }
    if (this._armazensAjudaDocClick) {
      document.removeEventListener('click', this._armazensAjudaDocClick)
    }
    if (this._armazensAjudaSyncOnScroll) {
      window.removeEventListener('scroll', this._armazensAjudaSyncOnScroll, true)
      window.removeEventListener('resize', this._armazensAjudaSyncOnScroll)
    }
    this._armazensAjudaAnchorEl = null
  },
  methods: {
    /** dt_conf_sep (campo separado) preenchida e volumes (vols) > 0. */
    pedidoAtendeSeparadosComVolume(p) {
      const sep = p && p.separado
      if (sep == null) return false
      let s = ''
      if (typeof sep === 'string') s = sep.trim()
      else if (sep instanceof Date && !Number.isNaN(sep.getTime()))
        s = sep.toISOString()
      else s = String(sep).trim()
      if (!s || /^0000-00-00/i.test(s) || s.toLowerCase() === 'null')
        return false
      const vols = Number(p.volumes)
      if (Number.isNaN(vols) || vols <= 0) return false
      return true
    },
    /**
     * Situação (checkboxes): OR entre sit_fase selecionadas e o filtro "Separados Com Volume".
     * Com "Não embarcados", ignora situação e exclui Emb. Conf.
     */
    pedidoPassaFiltroSituacoes(p, situacoes, naoEmbarcados) {
      if (naoEmbarcados) {
        const sitPedido = String(p.situacao || '')
          .trim()
          .toUpperCase()
        return sitPedido !== 'EMB. CONF.'
      }
      const sit = situacoes || []
      if (sit.length === 0) return true
      const magic = SITUACAO_FILTRO_SEPARADOS_COM_VOLUME
      const outros = sit.filter(x => x !== magic)
      const temMagic = sit.includes(magic)
      const matchMagic = temMagic && this.pedidoAtendeSeparadosComVolume(p)
      const sitPedido = String(p.situacao || '').trim()
      const matchOutros = outros.length > 0 && outros.includes(sitPedido)
      if (temMagic && outros.length === 0) return matchMagic
      if (!temMagic && outros.length > 0) return matchOutros
      if (temMagic && outros.length > 0) return matchMagic || matchOutros
      return true
    },
    /**
     * Filtro por cliente(s): prioriza igualdade de ID (no_seq ↔ id_cliente).
     * Evita extrair dígitos do nome (ex.: "A2F" → "2") e dar match em qualquer id que contenha "2".
     */
    pedidoPassaFiltroClientes(p, clientesFiltro) {
      if (!clientesFiltro || clientesFiltro.length === 0) return true
      const nome = String(p.cliente || p.nome_destinatario || '')
        .toLowerCase()
        .trim()
      const idStr = String(p.id_cliente ?? '').trim()
      const idDigits = idStr.replace(/\D/g, '')
      return clientesFiltro.some(c => {
        const cNome =
          (typeof c === 'object' && c ? c.nome || c.nome_cliente || '' : c) ||
          ''
        const cLower = cNome.toLowerCase().trim()
        const cIdRaw =
          typeof c === 'object' && c && c.no_seq != null
            ? String(c.no_seq).trim()
            : ''
        const cIdDigits = cIdRaw.replace(/\D/g, '')
        if (cIdDigits) {
          if (idDigits && idDigits === cIdDigits) return true
          if (idStr === cIdRaw) return true
        }
        if (cLower && nome.includes(cLower)) return true
        return false
      })
    },
    /**
     * OSANG: não exibir no BI quando wgu.obs_resumida contém "AJUSTE" (só cliente 669 / nome Osang; espelho do back-end).
     */
    pedidoOsangDeveExcluirPorAjuste(p) {
      if (!p) return false
      const OSANG_NO_SEQ = 669
      const idNum =
        p.id_cliente != null && p.id_cliente !== '' ? Number(p.id_cliente) : NaN
      const blob =
        `${p.cliente || ''} ${p.nome_destinatario || ''} ${p.armazem || ''}`.toUpperCase()
      const isOsang =
        (!Number.isNaN(idNum) && idNum === OSANG_NO_SEQ) ||
        blob.includes('OSANG')
      if (!isOsang) return false
      const raw = p.obs_resumida ?? p.obsResumida ?? p.OBS_RESUMIDA
      let obs = String(raw != null ? raw : '')
      try {
        obs = obs.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      } catch {
        /* ignore */
      }
      return obs.toUpperCase().includes('AJUSTE')
    },
    /** Data (YYYY-MM-DD) do separado no fuso local; '' se não houver separação válida. */
    pedidoDiaLocalSeparadoISO(p) {
      if (!p || p.separado == null || p.separado === false) return ''
      const d = p.separado instanceof Date ? p.separado : new Date(p.separado)
      if (isNaN(d.getTime())) return ''
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    },
    /** Aplica filtros do formulário a uma lista. Usado em filteredPedidosPendentes e filteredPedidosTotais. */
    applyFiltrosForm(list, opts = {}) {
      const skipTransportadora = opts.skipTransportadora === true
      if (!list || !Array.isArray(list)) return []
      if (!list.length) return [...list]
      const base = list.filter(p => !this.pedidoOsangDeveExcluirPorAjuste(p))
      if (!base.length) return []
      if (!this.temFiltrosForm) return [...base]
      const clientesFiltro = this.canShowClienteColumn
        ? this.filtroClientes || []
        : []
      const armazensFiltro = this.showFiltroArmazem
        ? this.filtroArmazens || []
        : []
      const gerente = this.showFiltroGerente
        ? (this.filtroGerente || '').trim()
        : ''
      const adm = this.showFiltroAdm ? (this.filtroAdm || '').trim() : ''
      const nf = (this.filtroNF || '').toLowerCase()
      const ped = (this.filtroPedido || '').toLowerCase()
      const situacoes = this.filtroSituacoes || []
      const naoEmbarcados = this.filtroNaoEmbarcados
      const stSep = (this.filtroStatusSep || '').trim()
      const stExp = (this.filtroStatusExp || '').trim()
      const limiteDate = this.showFiltroLimiteExpedicao
        ? this.filtroLimiteExpedicao || ''
        : ''
      const dataSeparadoFiltro = (this.filtroDataSeparado || '').trim()
      const filtroSlaAtivo = this.showFiltroSla
        ? (this.filtroSla || '').trim()
        : ''
      return base.filter(p => {
        if (clientesFiltro.length > 0) {
          if (!this.pedidoPassaFiltroClientes(p, clientesFiltro)) return false
        }
        if (armazensFiltro.length > 0) {
          const est =
            (p.estabelecimento != null
              ? String(p.estabelecimento).trim()
              : '') || ''
          if (!armazensFiltro.includes(est)) return false
        }
        if (gerente) {
          const gerenteKey = gerente.trim().toLowerCase()
          const estabelecimentosDoGerente =
            this.estabelecimentosPorGerente[gerenteKey] ||
            this.estabelecimentosPorGerente[gerente.trim()] ||
            []
          const est =
            (p.estabelecimento != null
              ? String(p.estabelecimento).trim()
              : '') || ''
          const estNorm = est.toLowerCase()
          let pertence = false
          if (estabelecimentosDoGerente.length > 0) {
            pertence = estabelecimentosDoGerente.some(
              e => (e || '').toLowerCase() === estNorm
            )
          } else {
            pertence =
              (p.adm != null ? String(p.adm).trim() : '').toLowerCase() ===
              gerenteKey
          }
          if (!pertence) return false
        }
        if (adm) {
          if (adm === '__VAZIO__') {
            const pAdm = (p.adm != null ? String(p.adm).trim() : '') || ''
            if (pAdm !== '') return false
          } else {
            const pAdm = (p.adm != null ? String(p.adm).trim() : '') || ''
            if (pAdm.toLowerCase() !== adm.toLowerCase()) return false
          }
        }
        if (
          nf &&
          !String(p.numero_nf || p.numeroNF || '')
            .toLowerCase()
            .includes(nf)
        )
          return false
        if (
          ped &&
          !String(p.numero_pedido || p.numeroPedido || '')
            .toLowerCase()
            .includes(ped)
        )
          return false
        if (!this.pedidoPassaFiltroSituacoes(p, situacoes, naoEmbarcados))
          return false
        if (stSep) {
          const statusSep = this.computeStatusSeparacao(p) || ''
          if (statusSep !== stSep) return false
        }
        if (stExp) {
          const statusExp = this.computeStatusExpedicao(p) || ''
          if (statusExp !== stExp) return false
        }
        if (filtroSlaAtivo) {
          const slaPedido = this.getSlaLabel(p) || 'D+0'
          if (slaPedido !== filtroSlaAtivo) return false
        }
        if (!skipTransportadora && this.filtroTransportadora) {
          const trans =
            (p.transportadora != null ? String(p.transportadora).trim() : '') ||
            ''
          if (trans !== this.filtroTransportadora.trim()) return false
        }
        if (limiteDate && p.limite) {
          const limStr = p.limite.slice(0, 10)
          if (limStr !== limiteDate) return false
        }
        if (dataSeparadoFiltro) {
          const diaSep = this.pedidoDiaLocalSeparadoISO(p)
          if (!diaSep || diaSep !== dataSeparadoFiltro) return false
        }
        return true
      })
    },
    /** Aplica os mesmos filtros do form à lista, mas NUNCA exclui Emb. Conf. (para lista "todo o período"). */
    applyFiltrosFormTodosPeriodo(list) {
      if (!list || !Array.isArray(list)) return []
      if (!list.length) return [...list]
      const base = list.filter(p => !this.pedidoOsangDeveExcluirPorAjuste(p))
      if (!base.length) return []
      if (!this.temFiltrosForm) return [...base]
      const clientesFiltro = this.canShowClienteColumn
        ? this.filtroClientes || []
        : []
      const armazensFiltro = this.showFiltroArmazem
        ? this.filtroArmazens || []
        : []
      const gerente = this.showFiltroGerente
        ? (this.filtroGerente || '').trim()
        : ''
      const adm = this.showFiltroAdm ? (this.filtroAdm || '').trim() : ''
      const nf = (this.filtroNF || '').toLowerCase()
      const ped = (this.filtroPedido || '').toLowerCase()
      const situacoes = this.filtroSituacoes || []
      const stSep = (this.filtroStatusSep || '').trim()
      const stExp = (this.filtroStatusExp || '').trim()
      const limiteDate = this.showFiltroLimiteExpedicao
        ? (this.filtroLimiteExpedicao || '').trim()
        : ''
      const dataSeparadoFiltro = (this.filtroDataSeparado || '').trim()
      const filtroSlaAtivo = this.showFiltroSla
        ? (this.filtroSla || '').trim()
        : ''
      return base.filter(p => {
        if (clientesFiltro.length > 0) {
          if (!this.pedidoPassaFiltroClientes(p, clientesFiltro)) return false
        }
        if (armazensFiltro.length > 0) {
          const est =
            (p.estabelecimento != null
              ? String(p.estabelecimento).trim()
              : '') || ''
          if (!armazensFiltro.includes(est)) return false
        }
        if (gerente) {
          const gerenteKey = gerente.trim().toLowerCase()
          const estabelecimentosDoGerente =
            this.estabelecimentosPorGerente[gerenteKey] ||
            this.estabelecimentosPorGerente[gerente.trim()] ||
            []
          const est =
            (p.estabelecimento != null
              ? String(p.estabelecimento).trim()
              : '') || ''
          const estNorm = est.toLowerCase()
          let pertence = false
          if (estabelecimentosDoGerente.length > 0) {
            pertence = estabelecimentosDoGerente.some(
              e => (e || '').toLowerCase() === estNorm
            )
          } else {
            pertence =
              (p.adm != null ? String(p.adm).trim() : '').toLowerCase() ===
              gerenteKey
          }
          if (!pertence) return false
        }
        if (adm) {
          if (adm === '__VAZIO__') {
            const pAdm = (p.adm != null ? String(p.adm).trim() : '') || ''
            if (pAdm !== '') return false
          } else {
            const pAdm = (p.adm != null ? String(p.adm).trim() : '') || ''
            if (pAdm.toLowerCase() !== adm.toLowerCase()) return false
          }
        }
        if (
          nf &&
          !String(p.numero_nf || p.numeroNF || '')
            .toLowerCase()
            .includes(nf)
        )
          return false
        if (
          ped &&
          !String(p.numero_pedido || p.numeroPedido || '')
            .toLowerCase()
            .includes(ped)
        )
          return false
        if (!this.pedidoPassaFiltroSituacoes(p, situacoes, false)) return false
        if (stSep) {
          const statusSep = this.computeStatusSeparacao(p) || ''
          if (statusSep !== stSep) return false
        }
        if (stExp) {
          const statusExp = this.computeStatusExpedicao(p) || ''
          if (statusExp !== stExp) return false
        }
        if (filtroSlaAtivo) {
          const slaPedido = this.getSlaLabel(p) || 'D+0'
          if (slaPedido !== filtroSlaAtivo) return false
        }
        if (this.filtroTransportadora) {
          const trans =
            (p.transportadora != null ? String(p.transportadora).trim() : '') ||
            ''
          if (trans !== this.filtroTransportadora.trim()) return false
        }
        if (limiteDate && p.limite) {
          const limStr = p.limite.slice(0, 10)
          if (limStr !== limiteDate) return false
        }
        if (dataSeparadoFiltro) {
          const diaSep = this.pedidoDiaLocalSeparadoISO(p)
          if (!diaSep || diaSep !== dataSeparadoFiltro) return false
        }
        return true
      })
    },
    async loadGestores() {
      try {
        const token = localStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const [resGestores, resStorages] = await Promise.all([
          axios.get('/storage/managers', { headers }),
          axios.get('/storage', { headers }).catch(() => ({ data: [] })),
        ])
        this.listaGestores = Array.isArray(resGestores?.data)
          ? resGestores.data
          : resGestores?.data?.data || []
        this.listaStorages = Array.isArray(resStorages?.data)
          ? resStorages.data
          : []
      } catch (e) {
        console.warn('[BI] Erro ao carregar gestores:', e?.message || e)
        this.listaGestores = []
        this.listaStorages = []
      }
    },
    /**
     * Parâmetros GET /bi/sla: com DATA SEPARADO preenchida, o back filtra por dt_conf_sep
     * (ignora período de integração) para alinhar gráficos e tabelas.
     */
    buildSlaApiQueryParams() {
      const params = {}
      const ds = (this.filtroDataSeparado || '').trim().slice(0, 10)
      if (/^\d{4}-\d{2}-\d{2}$/.test(ds)) {
        params.data_separado = ds
        return params
      }
      if (this.dataInicio) params.data_inicio = this.dataInicio
      if (this.dataFim) params.data_fim = this.dataFim
      if (this.userHasSelectedInterval && this.dataInicio && this.dataFim) {
        params.data_inicio_lista = this.dataInicio
        params.data_fim_lista = this.dataFim
      }
      return params
    },
    async loadSlaData(opts = {}) {
      const silent = opts.silent === true
      if (silent && this._slaBgLoadInFlight) return
      if (silent) this._slaBgLoadInFlight = true
      else this.loading = true
      this.loadError = null
      try {
        const token = localStorage.getItem('token')
        const params = this.buildSlaApiQueryParams()
        const response = await axios.get('/bi/sla', {
          params,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        let orders = []
        if (response?.data?.pedidos) {
          orders = response.data.pedidos
        } else if (response?.data?.orders) {
          orders = response.data.orders
        } else if (Array.isArray(response?.data)) {
          orders = response.data
        }

        this.pedidosTotais = Array.isArray(response?.data?.pedidosTotais)
          ? response.data.pedidosTotais
          : []
        this.pedidosPendentes = Array.isArray(orders) ? orders : []
        const normBiPedidoObs = p => {
          if (!p || typeof p !== 'object') return p
          const o = p.obs_resumida ?? p.obsResumida ?? p.OBS_RESUMIDA
          if (o != null && p.obs_resumida == null) p.obs_resumida = o
          return p
        }
        this.pedidosTotais = (this.pedidosTotais || []).map(normBiPedidoObs)
        this.pedidosPendentes = (this.pedidosPendentes || []).map(
          normBiPedidoObs
        )
        console.log(
          '[BI] Dados recebidos: pedidosPendentes=',
          this.pedidosPendentes.length,
          ', pedidosTotais=',
          this.pedidosTotais.length
        )

        // Fallback: se pedidos veio vazio mas backend retornou count > 0 ou temos totais, derivar pendentes de pedidosTotais
        const count = response?.data?.count ?? 0
        if (
          this.pedidosPendentes.length === 0 &&
          (count > 0 || this.pedidosTotais.length > 0)
        ) {
          this.pedidosPendentes = (this.pedidosTotais || []).filter(
            p =>
              String(p.situacao || '')
                .trim()
                .toUpperCase() !== 'EMB. CONF.'
          )
          if (this.pedidosPendentes.length > 0) {
            console.warn(
              '[BI] pedidos vazio na resposta - usando fallback: ' +
                this.pedidosPendentes.length +
                ' pendentes derivados de pedidosTotais'
            )
          }
        }
        this.currentPage = 1

        // Stats persistidos: respeitam filtros do formulário (ex.: cliente), não só exclusão Osang/ajuste
        let forStats = (this.pedidosPendentes || []).filter(
          p => !this.pedidoOsangDeveExcluirPorAjuste(p)
        )
        if (this.temFiltrosForm) {
          try {
            const filtered = this.applyFiltrosForm(forStats)
            if (Array.isArray(filtered)) forStats = filtered
          } catch (e) {
            console.warn('[BI] recalc stats + filtros:', e)
          }
        }
        this.recalcStatsFromOrders(forStats)
        // Usar dt_modificacao do backend (última alteração nos dados) ou fallback para agora
        const dtMod = response?.data?.dt_modificacao
        this.lastUpdate = dtMod
          ? typeof dtMod === 'string'
            ? dtMod
            : new Date(dtMod).toISOString()
          : new Date().toISOString()

        this.$nextTick(() => {
          this.renderCharts()
        })
        if (!silent) {
          this.showDataReadyMessage = true
          if (this._dataReadyTimer) clearTimeout(this._dataReadyTimer)
          this._dataReadyTimer = setTimeout(() => {
            this.showDataReadyMessage = false
            this._dataReadyTimer = null
          }, 4500)
        }
        // Reset do temporalizador de próxima atualização (5 min) no modo TV / Painel
        if (this.biTvLayout || this.painelFsActive) {
          this.dataUpdateCountdown = SLA_PANEL_DATA_REFRESH_SEC
        }
      } catch (err) {
        const msg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message
        this.loadError = msg || 'Erro ao carregar dados de SLA'
        console.warn('BI SLA: erro ao carregar dados wgu/wcl:', msg)
        this.pedidosPendentes = []
        this.pedidosTotais = []
        this.recalcStatsFromOrders([])
        this.$nextTick(() => {
          this.renderCharts()
        })
        if (this.slaAutoRefreshShouldRun()) {
          this.dataUpdateCountdown = Math.min(180, SLA_PANEL_DATA_REFRESH_SEC)
        }
      } finally {
        if (silent) this._slaBgLoadInFlight = false
        else this.loading = false
      }
    },
    toggleBiTheme() {
      this.biTheme = this.biTheme === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem('bi-theme', this.biTheme)
      } catch (_) {}
      if (this.biSubTab === 'sla') this.$nextTick(() => this.renderCharts())
      if (this.biSubTab === 'armazens')
        this.$nextTick(() => this.renderArmazensEvolucaoCharts())
    },
    aplicarRejeicaoPreset(id) {
      this.rejeicaoPresetAtivo = id
      const now = new Date()
      let inicio = null
      let fim = null
      if (id === 'todo') {
        this.rejeicaoDataInicio = null
        this.rejeicaoDataFim = null
      } else {
        if (id === 'hoje') {
          inicio = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          fim = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        } else if (id === 'esta_semana') {
          const dia = now.getDay()
          const seg = new Date(now)
          seg.setDate(now.getDate() - (dia === 0 ? 6 : dia - 1))
          seg.setHours(0, 0, 0, 0)
          inicio = seg
          fim = new Date()
        } else if (id === 'este_mes') {
          inicio = new Date(now.getFullYear(), now.getMonth(), 1)
          fim = new Date()
        } else if (id === 'mes_passado') {
          inicio = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          fim = new Date(now.getFullYear(), now.getMonth(), 0)
        } else if (id === '6m') {
          inicio = new Date(now.getFullYear(), now.getMonth() - 6, 1)
          fim = new Date()
        } else if (id === '1y') {
          inicio = new Date(
            now.getFullYear() - 1,
            now.getMonth(),
            now.getDate()
          )
          fim = new Date()
        }
        this.rejeicaoDataInicio = inicio
          ? inicio.toISOString().slice(0, 10)
          : null
        this.rejeicaoDataFim = fim ? fim.toISOString().slice(0, 10) : null
      }
      this.carregarRejeicoesBI()
    },
    /** Carrega dados de rejeição para o dashboard BI. */
    async carregarRejeicoesBI() {
      this.rejeicaoLoading = true
      this.rejeicaoErro = null
      try {
        const params = {}
        if (
          this.rejeicaoPresetAtivo === 'todo' ||
          (!this.rejeicaoDataInicio && !this.rejeicaoDataFim)
        ) {
          params.todo_periodo = '1'
        } else {
          if (this.rejeicaoDataInicio)
            params.data_inicio = this.rejeicaoDataInicio
          if (this.rejeicaoDataFim) params.data_fim = this.rejeicaoDataFim
        }
        // Dashboard: só rejeições ainda pendentes (não listar / contar integradas; ignorar já filtrado no back)
        params.excluir_resolvidos = '1'
        // 1) Lista primeiro (igual ao Acompanhamento): assim que chegar, rejeicaoDados preenche e some o overlay de loading.
        const paramsUrgentes = { ...params }
        let resLista
        try {
          resLista = await rejeicaoService.getRejeicoes(params)
        } catch (e) {
          throw e
        }
        const data = resLista?.data
        this.rejeicaoDados = Array.isArray(data) ? data : []
        await this.$nextTick()

        const [biMotivosRes, biUrgentesRes] = await Promise.all([
          rejeicaoService.getBiMotivos(params).catch(e => {
            console.warn(
              '[BI Rejeição] Erro ao carregar motivos da wbh:',
              e?.message || e
            )
            return { motivos: [] }
          }),
          rejeicaoService.getBiUrgentes(paramsUrgentes).catch(e => {
            console.warn(
              '[BI Rejeição] Erro ao carregar urgentes:',
              e?.message || e
            )
            return { urgentes: [] }
          }),
        ])
        let motivos = Array.isArray(biMotivosRes?.motivos)
          ? biMotivosRes.motivos
          : []
        if (motivos.length === 0 && this.rejeicaoDados.length > 0) {
          motivos = this.extrairMotivosFallback(this.rejeicaoDados)
        }
        // Excluir "(sem motivo)" - itens sem motivo de rejeição não devem aparecer
        this.rejeicaoMotivosTop = motivos.filter(
          m =>
            m &&
            String(m.motivo || '').trim() &&
            !/^\(sem motivo\)$/i.test(String(m.motivo || '').trim())
        )
        this.rejeicaoUrgentes = Array.isArray(biUrgentesRes?.urgentes)
          ? biUrgentesRes.urgentes
          : []
        this.$nextTick(() => this.renderRejeicaoCharts())
        this.rejeicaoLastUpdate = new Date().toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      } catch (err) {
        console.error('Erro ao carregar rejeições no BI:', err)
        this.rejeicaoErro =
          err.response?.data?.error ||
          err.message ||
          'Erro ao carregar dados de rejeição'
      } finally {
        this.rejeicaoLoading = false
      }
    },
    /** Carrega opções de armazém da dbcobrancas para o filtro na Análise Armazéns. */
    async carregarOpcoesArmazemCobrancas() {
      this.opcoesArmazemCobrancasLoading = true
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('/bi/armazens/opcoes', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (response?.data?.success && Array.isArray(response.data.opcoes)) {
          this.opcoesArmazemCobrancas = response.data.opcoes
        } else {
          this.opcoesArmazemCobrancas = []
        }
      } catch (err) {
        console.error('[BI Armazéns] Erro ao carregar opções de armazém:', err)
        this.opcoesArmazemCobrancas = []
      } finally {
        this.opcoesArmazemCobrancasLoading = false
      }
    },
    /** Carrega total de unidades atendidos (wvu + wcl) para Análise Armazéns. */
    async carregarArmazensTotalUnidades() {
      this.armazensTotalUnidadesLoading = true
      this.armazensTotalUnidadesErro = null
      try {
        const params = {}
        if (this.dataInicio) params.data_inicio = this.dataInicio
        if (this.dataFim) params.data_fim = this.dataFim
        if (this.showFiltroArmazem && this.filtroArmazens.length > 0)
          params.estabelecimento = this.filtroArmazens.join(',')
        const token = localStorage.getItem('token')
        const response = await axios.get('/bi/armazens/total-unidades', {
          params,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (response?.data?.success) {
          this.armazensTotalUnidades = response.data.total_unidades ?? 0
        } else {
          this.armazensTotalUnidadesErro =
            response?.data?.error || 'Erro ao carregar'
        }
      } catch (err) {
        console.error('[BI Armazéns] Erro ao carregar total unidades:', err)
        this.armazensTotalUnidadesErro =
          err.response?.data?.error ||
          err.message ||
          'Erro ao carregar total de unidades'
      } finally {
        this.armazensTotalUnidadesLoading = false
      }
    },
    /** Carrega total de posições paletes ocupadas (soma do pico MAX qt_servico por cliente em wf1_armazenagem_palete). */
    async carregarArmazensTotalPosicoesPaletes() {
      this.armazensTotalPosicoesPaletesLoading = true
      this.armazensTotalPosicoesPaletesErro = null
      try {
        const params = {}
        if (this.dataInicio) params.data_inicio = this.dataInicio
        if (this.dataFim) params.data_fim = this.dataFim
        if (this.showFiltroArmazem && this.filtroArmazens.length > 0)
          params.estabelecimento = this.filtroArmazens.join(',')
        const token = localStorage.getItem('token')
        const response = await axios.get(
          '/bi/armazens/total-posicoes-paletes',
          {
            params,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        )
        if (response?.data?.success) {
          this.armazensTotalPosicoesPaletes =
            response.data.total_posicoes_paletes ?? 0
        } else {
          this.armazensTotalPosicoesPaletesErro =
            response?.data?.error || 'Erro ao carregar'
        }
      } catch (err) {
        console.error(
          '[BI Armazéns] Erro ao carregar total posições paletes:',
          err
        )
        this.armazensTotalPosicoesPaletesErro =
          err.response?.data?.error ||
          err.message ||
          'Erro ao carregar total de posições paletes'
      } finally {
        this.armazensTotalPosicoesPaletesLoading = false
      }
    },
    /** Com filtro de cliente: totais de unidades e PP só do(s) cliente(s) (mesmo período/armazém). */
    async carregarArmazensTotaisCliente() {
      if (
        this.biSubTab !== 'armazens' ||
        !this.canShowClienteColumn ||
        this.filtroClientes.length === 0
      ) {
        this.armazensClienteTotalUnidades = null
        this.armazensClienteTotalUnidadesErro = null
        this.armazensClienteTotalPosicoesPaletes = null
        this.armazensClienteTotalPosicoesPaletesErro = null
        this.armazensClienteTotalUnidadesLoading = false
        this.armazensClienteTotalPosicoesPaletesLoading = false
        return
      }
      this.armazensClienteTotalUnidadesLoading = true
      this.armazensClienteTotalPosicoesPaletesLoading = true
      this.armazensClienteTotalUnidadesErro = null
      this.armazensClienteTotalPosicoesPaletesErro = null
      const token = localStorage.getItem('token')
      const baseParams = {}
      if (this.dataInicio) baseParams.data_inicio = this.dataInicio
      if (this.dataFim) baseParams.data_fim = this.dataFim
      if (this.showFiltroArmazem && this.filtroArmazens.length > 0)
        baseParams.estabelecimento = this.filtroArmazens.join(',')
      baseParams.clientes = this.filtroClientesValoresParaApi
      try {
        const [resU, resPp] = await Promise.all([
          axios.get('/bi/armazens/total-unidades', {
            params: baseParams,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
          axios.get('/bi/armazens/total-posicoes-paletes', {
            params: baseParams,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
        ])
        if (resU?.data?.success) {
          this.armazensClienteTotalUnidades = resU.data.total_unidades ?? 0
        } else {
          this.armazensClienteTotalUnidadesErro =
            resU?.data?.error || 'Erro ao carregar'
          this.armazensClienteTotalUnidades = null
        }
        if (resPp?.data?.success) {
          this.armazensClienteTotalPosicoesPaletes =
            resPp.data.total_posicoes_paletes ?? 0
        } else {
          this.armazensClienteTotalPosicoesPaletesErro =
            resPp?.data?.error || 'Erro ao carregar'
          this.armazensClienteTotalPosicoesPaletes = null
        }
      } catch (err) {
        console.error('[BI Armazéns] Erro ao carregar totais do cliente:', err)
        const msg =
          err.response?.data?.error ||
          err.message ||
          'Erro ao carregar totais do cliente'
        this.armazensClienteTotalUnidadesErro = msg
        this.armazensClienteTotalPosicoesPaletesErro = msg
        this.armazensClienteTotalUnidades = null
        this.armazensClienteTotalPosicoesPaletes = null
      } finally {
        this.armazensClienteTotalUnidadesLoading = false
        this.armazensClienteTotalPosicoesPaletesLoading = false
      }
    },
    /**
     * Unidades/PP do cliente e fatura legado em paralelo (mesmo gatilho de filtros/período).
     */
    async carregarArmazensDadosClienteResumo() {
      await Promise.all([
        this.carregarArmazensTotaisCliente(),
        this.carregarArmazensFaturaClienteLegado(),
      ])
    },
    /**
     * Soma lev_fatura_cliente_legado no período para **todos** os clientes (sem filtro codigo_corpem).
     * Usado só no card «Fatura cliente» do resumo do período.
     */
    async carregarArmazensFaturaLegadoResumoPeriodo() {
      if (this.biSubTab !== 'armazens') {
        this.armazensPeriodoFaturaLegadoTotal = null
        this.armazensPeriodoFaturaLegadoLinhas = null
        this.armazensPeriodoFaturaLegadoErro = null
        this.armazensFaturaResumoMeta = null
        this.armazensPeriodoFaturaLegadoLoading = false
        return
      }
      this.armazensPeriodoFaturaLegadoLoading = true
      this.armazensPeriodoFaturaLegadoErro = null
      const token = localStorage.getItem('token')
      const params = { totais_periodo: '1' }
      if (this.dataInicio) params.data_inicio = this.dataInicio
      if (this.dataFim) params.data_fim = this.dataFim
      if (this.showFiltroArmazem && this.filtroArmazens.length > 0)
        params.estabelecimento = this.filtroArmazens.join(',')
      try {
        const response = await axios.get('/bi/armazens/fatura-cliente-legado', {
          params,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (response?.data?.success) {
          const nLeg = response.data.linhas_legado
          const nCob = response.data.linhas_cobrancas
          const partLeg =
            nLeg != null && Number.isFinite(Number(nLeg)) ? Number(nLeg) : 0
          const partCob =
            nCob != null && Number.isFinite(Number(nCob)) ? Number(nCob) : 0
          this.armazensPeriodoFaturaLegadoLinhas = partLeg + partCob
          const t = response.data.fatura_total
          this.armazensPeriodoFaturaLegadoTotal =
            t != null && Number.isFinite(Number(t)) ? Number(t) : null
          this.armazensFaturaResumoMeta = {
            meses_legado: Array.isArray(response.data.meses_legado)
              ? response.data.meses_legado
              : [],
            meses_cobrancas: Array.isArray(response.data.meses_cobrancas)
              ? response.data.meses_cobrancas
              : [],
          }
        } else {
          this.armazensPeriodoFaturaLegadoErro =
            response?.data?.error ||
            'Erro ao carregar fatura do período (legado)'
          this.armazensPeriodoFaturaLegadoTotal = null
          this.armazensPeriodoFaturaLegadoLinhas = null
          this.armazensFaturaResumoMeta = null
        }
      } catch (err) {
        console.error('[BI Armazéns] Erro fatura legado (período):', err)
        this.armazensPeriodoFaturaLegadoErro =
          err.response?.data?.error ||
          err.message ||
          'Erro ao carregar fatura do período (legado)'
        this.armazensPeriodoFaturaLegadoTotal = null
        this.armazensPeriodoFaturaLegadoLinhas = null
        this.armazensFaturaResumoMeta = null
      } finally {
        this.armazensPeriodoFaturaLegadoLoading = false
      }
    },
    /** Soma lev_fatura_cliente_legado no período (codigo_corpem = filtro cliente). */
    async carregarArmazensFaturaClienteLegado() {
      if (
        this.biSubTab !== 'armazens' ||
        !this.canShowClienteColumn ||
        this.filtroClientes.length === 0
      ) {
        this.armazensClienteFaturaLegadoTotal = null
        this.armazensClienteFaturaLegadoLinhas = null
        this.armazensClienteFaturaLegadoErro = null
        this.armazensClienteFaturaLegadoLoading = false
        return
      }
      this.armazensClienteFaturaLegadoLoading = true
      this.armazensClienteFaturaLegadoErro = null
      const token = localStorage.getItem('token')
      const params = {}
      if (this.dataInicio) params.data_inicio = this.dataInicio
      if (this.dataFim) params.data_fim = this.dataFim
      if (this.showFiltroArmazem && this.filtroArmazens.length > 0)
        params.estabelecimento = this.filtroArmazens.join(',')
      params.clientes = this.filtroClientesValoresParaApi
      try {
        const response = await axios.get('/bi/armazens/fatura-cliente-legado', {
          params,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (response?.data?.success) {
          const nLeg = response.data.linhas_legado
          const nCob = response.data.linhas_cobrancas
          const partLeg =
            nLeg != null && Number.isFinite(Number(nLeg)) ? Number(nLeg) : 0
          const partCob =
            nCob != null && Number.isFinite(Number(nCob)) ? Number(nCob) : 0
          this.armazensClienteFaturaLegadoLinhas = partLeg + partCob
          const t = response.data.fatura_total
          this.armazensClienteFaturaLegadoTotal =
            t != null && Number.isFinite(Number(t)) ? Number(t) : null
        } else {
          this.armazensClienteFaturaLegadoErro =
            response?.data?.error || 'Erro ao carregar fatura (legado)'
          this.armazensClienteFaturaLegadoTotal = null
          this.armazensClienteFaturaLegadoLinhas = null
        }
      } catch (err) {
        console.error('[BI Armazéns] Erro fatura cliente legado:', err)
        this.armazensClienteFaturaLegadoErro =
          err.response?.data?.error ||
          err.message ||
          'Erro ao carregar fatura (legado)'
        this.armazensClienteFaturaLegadoTotal = null
        this.armazensClienteFaturaLegadoLinhas = null
      } finally {
        this.armazensClienteFaturaLegadoLoading = false
      }
    },
    /** Soma custos (lev_custo_valor) no período do calendário; filtro armazém → codigo_estabelecimento. */
    async carregarArmazensCustoTotalOperacao() {
      this.armazensCustoTotalOperacaoLoading = true
      this.armazensCustoTotalOperacaoErro = null
      this.armazensCustoOperacaoRubricas = null
      try {
        const params = {}
        if (this.dataInicio) params.data_inicio = this.dataInicio
        if (this.dataFim) params.data_fim = this.dataFim
        if (this.showFiltroArmazem && this.filtroArmazens.length > 0)
          params.estabelecimento = this.filtroArmazens.join(',')
        params.incluir_rubricas = 1
        const token = localStorage.getItem('token')
        const response = await axios.get('/bi/armazens/custo-total-operacao', {
          params,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (response?.data?.success) {
          const t = response.data.custo_total_operacao
          this.armazensCustoTotalOperacao =
            t != null && Number.isFinite(Number(t)) ? Number(t) : 0
          this.armazensCustoTotalOperacaoMeta = {
            meses_ref: Array.isArray(response.data.meses_ref)
              ? response.data.meses_ref
              : [],
            data_inicio: response.data.data_inicio || null,
            data_fim: response.data.data_fim || null,
            estabelecimento: response.data.estabelecimento || null,
          }
          this.armazensCustoOperacaoRubricas = Array.isArray(
            response.data.rubricas
          )
            ? response.data.rubricas
            : []
        } else {
          this.armazensCustoTotalOperacaoErro =
            response?.data?.error || 'Erro ao carregar'
          this.armazensCustoTotalOperacao = null
          this.armazensCustoTotalOperacaoMeta = null
          this.armazensCustoOperacaoRubricas = null
        }
      } catch (err) {
        console.error(
          '[BI Armazéns] Erro ao carregar custo total operação:',
          err
        )
        this.armazensCustoTotalOperacaoErro =
          err.response?.data?.error ||
          err.message ||
          'Erro ao carregar custo total da operação'
        this.armazensCustoTotalOperacao = null
        this.armazensCustoTotalOperacaoMeta = null
        this.armazensCustoOperacaoRubricas = null
      } finally {
        this.armazensCustoTotalOperacaoLoading = false
      }
    },
    /** Soma lev_custo_valor só dos itens de custo que compõem «Custo total posições paletes» (ids no backend). */
    async carregarArmazensCustoTotalPpItens() {
      this.armazensCustoTotalPpItensLoading = true
      this.armazensCustoTotalPpItensErro = null
      this.armazensCustoTotalPpItensDetalhe = null
      try {
        const params = { incluir_itens: 1 }
        if (this.dataInicio) params.data_inicio = this.dataInicio
        if (this.dataFim) params.data_fim = this.dataFim
        if (this.showFiltroArmazem && this.filtroArmazens.length > 0)
          params.estabelecimento = this.filtroArmazens.join(',')
        const token = localStorage.getItem('token')
        const response = await axios.get(
          '/bi/armazens/custo-total-posicoes-paletes',
          {
            params,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        )
        if (response?.data?.success) {
          const t = response.data.custo_total_posicoes_paletes
          this.armazensCustoTotalPpItens =
            t != null && Number.isFinite(Number(t)) ? Number(t) : 0
          this.armazensCustoTotalPpItensDetalhe = Array.isArray(
            response.data.itens
          )
            ? response.data.itens
            : []
        } else {
          this.armazensCustoTotalPpItensErro =
            response?.data?.error || 'Erro ao carregar'
          this.armazensCustoTotalPpItens = null
          this.armazensCustoTotalPpItensDetalhe = null
        }
      } catch (err) {
        console.error(
          '[BI Armazéns] Erro ao carregar custo total posições paletes (itens):',
          err
        )
        this.armazensCustoTotalPpItensErro =
          err.response?.data?.error ||
          err.message ||
          'Erro ao carregar custo posições paletes'
        this.armazensCustoTotalPpItens = null
        this.armazensCustoTotalPpItensDetalhe = null
      } finally {
        this.armazensCustoTotalPpItensLoading = false
      }
    },
    /** Quadro RH (lev_operacao_funcionario): média de headcount por mês e custo unitário ponderado. */
    async carregarArmazensQuadroFuncionarios() {
      this.armazensFuncCltLoading = true
      this.armazensCustoPorPessoaOperacaoRhLoading = true
      this.armazensFuncCltErro = null
      this.armazensCustoPorPessoaOperacaoRhErro = null
      try {
        const params = {}
        if (this.dataInicio) params.data_inicio = this.dataInicio
        if (this.dataFim) params.data_fim = this.dataFim
        if (this.showFiltroArmazem && this.filtroArmazens.length > 0)
          params.estabelecimento = this.filtroArmazens.join(',')
        const token = localStorage.getItem('token')
        const response = await axios.get('/bi/armazens/quadro-funcionarios', {
          params,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (response?.data?.success) {
          const mq = response.data.media_qtd_funcionarios
          const cp = response.data.custo_medio_por_pessoa
          this.armazensFuncCltMedia =
            mq != null && Number.isFinite(Number(mq))
              ? Math.round(Number(mq))
              : null
          this.armazensCustoPorPessoaOperacaoRh =
            cp != null && Number.isFinite(Number(cp)) ? Number(cp) : null
        } else {
          this.armazensFuncCltErro = response?.data?.error || 'Erro ao carregar'
          this.armazensCustoPorPessoaOperacaoRhErro = this.armazensFuncCltErro
          this.armazensFuncCltMedia = null
          this.armazensCustoPorPessoaOperacaoRh = null
        }
      } catch (err) {
        console.error(
          '[BI Armazéns] Erro ao carregar quadro funcionários:',
          err
        )
        const msg =
          err.response?.data?.error ||
          err.message ||
          'Erro ao carregar quadro de funcionários'
        this.armazensFuncCltErro = msg
        this.armazensCustoPorPessoaOperacaoRhErro = msg
        this.armazensFuncCltMedia = null
        this.armazensCustoPorPessoaOperacaoRh = null
      } finally {
        this.armazensFuncCltLoading = false
        this.armazensCustoPorPessoaOperacaoRhLoading = false
      }
    },
    /** PP (posições paletes): fundo vermelho. */
    armazensCardEhPpMetrica(m) {
      return (
        m &&
        ['custo_total_pp', 'total_pp_ocupadas', 'custo_por_pp'].includes(m.id)
      )
    },
    /** Fatura cliente: fundo verde. */
    armazensCardEhFaturaCliente(m) {
      return m && m.id === 'faturamento_cliente'
    },
    /** Custo total operação e custo total do cliente: mesma cor (vermelho). */
    armazensCardEhCustoTotalOperacao(m) {
      return m && ['custo_ops_ab', 'custo_total_cliente'].includes(m.id)
    },
    /** Indicadores com UNI. no recorte: fundo azul. */
    armazensCardTituloMencionaUnidade(m) {
      if (!m || !m.id) return false
      return (
        m.id === 'unidades_atendidas' ||
        m.id === 'unid_por_func' ||
        m.id === 'custo_atend_unidade'
      )
    },
    /** CLT, custo dedicado, custo por pessoa — fundo amarelo (período e cliente). */
    armazensCardEhFuncionarioPessoaKpi(m) {
      return (
        m &&
        ['func_clt', 'custo_func_dedicado', 'custo_por_pessoa'].includes(m.id)
      )
    },
    /** % custo total cliente × custo total CD: fundo laranja. */
    armazensCardEhPctCustoClienteCd(m) {
      return m && m.id === 'pct_custo_cliente_cd'
    },
    /**
     * Se o KPI do resumo do cliente pode mostrar card (alinhado a coluna).
     */
    armazensClienteResumoIdVisivel(id) {
      if (!id) return false
      switch (id) {
        case 'custo_ops_ab':
        case 'custo_total_pp':
        case 'custo_func_dedicado':
          return false
        case 'faturamento_cliente':
          return (
            this.armazensClienteFaturaLegadoLoading ||
            (this.armazensClienteFaturaLegadoLinhas != null &&
              this.armazensClienteFaturaLegadoLinhas > 0)
          )
        case 'unidades_atendidas':
          return (
            this.armazensClienteTotalUnidadesLoading ||
            this.armazensClienteTotalUnidades != null
          )
        case 'total_pp_ocupadas':
          return (
            this.armazensClienteTotalPosicoesPaletesLoading ||
            this.armazensClienteTotalPosicoesPaletes != null
          )
        case 'custo_por_pp':
          return (
            this.armazensCustoTotalPpAlocadoClienteLoading ||
            this.armazensCustoTotalPpAlocadoClienteValor != null
          )
        case 'func_clt':
          return (
            this.armazensClienteFuncCltProporcionalLoading ||
            this.armazensClienteFuncCltProporcionalValor != null
          )
        case 'custo_por_pessoa':
          return (
            this.armazensClienteCustoPorPessoaOperacaoLoading ||
            this.armazensClienteCustoPorPessoaOperacaoValor != null
          )
        case 'unid_por_func':
          /* Mantido no resumo empresa; coluna alinhada fica vazia no resumo cliente. */
          return false
        case 'custo_atend_unidade':
          return (
            this.armazensClienteCustoAtendimentoPorUnidadeLoading ||
            this.armazensClienteCustoAtendimentoPorUnidadeValor != null
          )
        case 'custo_total_cliente':
          return (
            this.armazensClienteCustoTotalPorClienteLoading ||
            this.armazensClienteCustoTotalPorClienteValor != null
          )
        case 'pct_custo_cliente_cd':
          return (
            this.armazensClientePctCustoTotalNoCdLoading ||
            this.armazensClientePctCustoTotalNoCdValor != null
          )
        default:
          return true
      }
    },
    armazensAjudaBloco(key) {
      return ARMAZENS_AJUDA[key] || null
    },
    /** Linha padrão «Período — …» (Análise Armazéns). */
    armazensAjudaPeriodoTexto() {
      return `Período — ${this.labelIntervaloAtual || '—'}`
    },
    /** Linha padrão «Armazéns — …» (filtrado ou lista completa de nomes). */
    armazensAjudaArmazensTexto() {
      if (this.showFiltroArmazem && (this.filtroArmazens || []).length) {
        return `Armazéns — ${(this.filtroArmazens || []).join(', ')}.`
      }
      const todos = (this.opcoesArmazemDistintos || []).filter(Boolean)
      if (todos.length) {
        return `Armazéns — ${todos.join(', ')}.`
      }
      return 'Armazéns — (lista de armazéns a carregar).'
    },
    /**
     * Linhas do painel «?»: padrão Origem / Período / Armazéns / Cálculo (montagens por bloco).
     */
    armazensAjudaItensResolvidos(key) {
      const map = {
        intro_painel: 'armazensAjudaMontarIntroPainelItens',
        custo_ops_ab: 'armazensAjudaMontarCustoOperacaoItens',
        custo_total_pp: 'armazensAjudaMontarCustoTotalPpItens',
        total_pp_ocupadas: 'armazensAjudaMontarTotalPpOcupadasItens',
        custo_por_pp: 'armazensAjudaMontarCustoPorPpItens',
        unidades_atendidas: 'armazensAjudaMontarUnidadesAtendidasItens',
        func_clt: 'armazensAjudaMontarFuncCltItens',
        custo_por_pessoa: 'armazensAjudaMontarCustoPorPessoaItens',
        unid_por_func: 'armazensAjudaMontarUnidPorFuncItens',
        custo_func_dedicado: 'armazensAjudaMontarCustoFuncDedicadoItens',
        custo_atend_unidade: 'armazensAjudaMontarCustoAtendUnidadeItens',
        custo_total_cliente: 'armazensAjudaMontarCustoTotalClienteItens',
        pct_custo_cliente_cd: 'armazensAjudaMontarPctCustoClienteCdItens',
        faturamento_cliente: 'armazensAjudaMontarFaturamentoClienteItens',
        'chart-evolucao': 'armazensAjudaMontarChartEvolucaoItens',
        'chart-composicao': 'armazensAjudaMontarChartComposicaoItens',
        'chart-custo-unidade': 'armazensAjudaMontarChartCustoUnidadeItens',
        'chart-compare-cd': 'armazensAjudaMontarChartCompareCdItens',
      }
      const fn = map[key]
      if (fn && typeof this[fn] === 'function') return this[fn]()
      const b = this.armazensAjudaBloco(key)
      return b && Array.isArray(b.itens) ? b.itens : []
    },
    armazensAjudaMontarIntroPainelItens() {
      return [
        'Visão geral: custos, unidades, posições paletes e fatura no recorte selecionado. Cada cartão e gráfico traz tabela e cálculo no respectivo «?».',
        this.armazensAjudaPeriodoTexto() + '.',
        this.armazensAjudaArmazensTexto(),
        'Cálculo — varia por indicador; use o «?» do cartão desejado.',
      ]
    },
    /** Custo total PP: mesma lógica do custo total operação (soma acima, lista de itens abaixo). */
    armazensAjudaMontarCustoTotalPpItens() {
      const out = []
      out.push('Origem — lev_custo_valor.')
      out.push(this.armazensAjudaPeriodoTexto() + '.')
      out.push(this.armazensAjudaArmazensTexto())
      if (this.armazensCustoTotalPpItensLoading) {
        out.push('Cálculo — a carregar…')
        return out
      }
      const list = this.armazensCustoTotalPpItensDetalhe
      const tot = this.armazensCustoTotalPpItens
      if (Array.isArray(list) && list.length > 0) {
        out.push(
          'Cálculo — soma dos itens de custo de posições paletes (lista abaixo).'
        )
        const partes = list.map(x =>
          this.formatarDecimal(x.valor != null ? Number(x.valor) : 0)
        )
        if (tot != null && Number.isFinite(Number(tot))) {
          const somaR = list.reduce(
            (s, x) => s + (x.valor != null ? Number(x.valor) : 0),
            0
          )
          const dif = Math.abs(somaR - Number(tot))
          if (partes.length <= 10) {
            out.push(
              `Soma dos valores: ${partes.join(' + ')} = R$ ${this.formatarDecimal(tot)}.`
            )
          } else {
            const ini = partes.slice(0, 3).join(' + ')
            const fim = partes.slice(-2).join(' + ')
            out.push(
              `Soma dos valores: ${ini} + … + ${fim} = R$ ${this.formatarDecimal(tot)}.`
            )
          }
          if (list.length <= 8) {
            const nomes = list.map(x => {
              const raw = (x.titulo != null && String(x.titulo).trim() !== '')
                ? String(x.titulo).trim()
                : 'Item'
              return raw.length > 40 ? raw.slice(0, 37) + '…' : raw
            })
            out.push(`Nomes: ${nomes.join(' + ')}.`)
          }
          if (dif > 0.02) {
            out.push(
              'Nota: diferença mínima de arredondamento; use o total do cartão como referência.'
            )
          }
        }
        const maxLinhas = 25
        const exibir = list.slice(0, maxLinhas)
        for (const r of exibir) {
          const raw = (r.titulo != null && String(r.titulo).trim() !== '')
            ? String(r.titulo).trim()
            : 'Item'
          const t = raw.length > 55 ? raw.slice(0, 52) + '…' : raw
          out.push(
            `• ${t} — R$ ${this.formatarDecimal(r.valor != null ? Number(r.valor) : 0)}`
          )
        }
        if (list.length > maxLinhas) {
          out.push(
            `… e mais ${list.length - maxLinhas} itens (já na soma).`
          )
        }
      } else if (tot != null && Number.isFinite(Number(tot)) && tot !== 0) {
        out.push(
          'Cálculo — detalhe por item indisponível; total no cartão (soma dos itens de PP no período).'
        )
        out.push(`Total — R$ ${this.formatarDecimal(tot)}.`)
      } else {
        out.push('Cálculo — sem lançamento no recorte (ou total zero).')
      }
      return out
    },
    armazensAjudaMontarTotalPpOcupadasItens() {
      return [
        'Origem — wf1_armazenagem_palete.',
        this.armazensAjudaPeriodoTexto() + '.',
        this.armazensAjudaArmazensTexto(),
        'Cálculo — soma do pico de posições paletes (PP).',
      ]
    },
    /** Custo por PP = (custo de PP) / (quantidade de PP), conforme tabelas em Origem. */
    armazensAjudaMontarCustoPorPpItens() {
      const out = []
      out.push('Origem — lev_custo_valor, wf1_armazenagem_palete.')
      out.push(this.armazensAjudaPeriodoTexto() + '.')
      out.push(this.armazensAjudaArmazensTexto())
      out.push('Cálculo — custo de PP / quantidade de PP.')
      const load =
        this.armazensCustoTotalPpItensLoading || this.armazensTotalPosicoesPaletesLoading
      if (load) {
        out.push('Conta — a carregar (custo de PP e total de PP ocupadas)…')
        return out
      }
      const ctp = this.armazensCustoTotalPpItens
      const pp = this.armazensTotalPosicoesPaletes
      if (ctp == null || pp == null) {
        out.push('Conta — indisponível (falta custo de PP e/ou total de PP ocupadas).')
        return out
      }
      const cn = Number(ctp)
      const pn = Number(pp)
      if (!Number.isFinite(cn) || !Number.isFinite(pn) || pn <= 0) {
        out.push('Conta — PP total zero ou inválido; não dá para dividir.')
        return out
      }
      const q = cn / pn
      out.push(
        `Conta: custo de PP = R$ ${this.formatarDecimal(cn)}; PP ocupadas = ${this.formatarInteiroBr(pn)}. Custo por PP = R$ ${this.formatarDecimal(cn)} ÷ ${this.formatarInteiroBr(pn)} = R$ ${this.formatarDecimal(q)} por PP.`
      )
      return out
    },
    armazensAjudaMontarUnidadesAtendidasItens() {
      return [
        'Origem — wvu.',
        this.armazensAjudaPeriodoTexto() + '.',
        this.armazensAjudaArmazensTexto(),
        'Cálculo — soma de unidades (qt_reserva) no intervalo.',
      ]
    },
    armazensAjudaMontarFuncCltItens() {
      return [
        'Origem — lev_operacao_funcionario.',
        this.armazensAjudaPeriodoTexto() + '.',
        this.armazensAjudaArmazensTexto(),
        'Cálculo — soma da coluna qtd_funcionarios (lev_operacao_funcionario) por mês. Com mais de um mês no recorte, média do período.',
      ]
    },
    armazensAjudaMontarCustoPorPessoaItens() {
      return [
        'Origem — lev_operacao_funcionario.',
        this.armazensAjudaPeriodoTexto() + '.',
        this.armazensAjudaArmazensTexto(),
        'Cálculo — custo médio por pessoa: soma (quantidade × custo unitário) dividida pela soma das quantidades, mês a mês no recorte.',
      ]
    },
    armazensAjudaMontarUnidPorFuncItens() {
      return [
        'Origem — wvu, lev_operacao_funcionario.',
        this.armazensAjudaPeriodoTexto() + '.',
        this.armazensAjudaArmazensTexto(),
        'Cálculo — (total de unidades atendidos) ÷ (média de funcionários CLT), arredondado a inteiro.',
      ]
    },
    armazensAjudaMontarCustoFuncDedicadoItens() {
      return [
        'Origem — (valor de referência de layout, não amarrado a uma tabela nesta tela).',
        this.armazensAjudaPeriodoTexto() + '.',
        this.armazensAjudaArmazensTexto(),
        'Cálculo — ilustrativo no painel; confirme com a gestão o critério desejado.',
      ]
    },
    armazensAjudaMontarCustoAtendUnidadeItens() {
      return [
        'Origem — lev_custo_valor, wvu.',
        this.armazensAjudaPeriodoTexto() + '.',
        this.armazensAjudaArmazensTexto(),
        'Cálculo — (custo total da operação − custo total de posições paletes) ÷ (total de unidades atendidos).',
      ]
    },
    armazensAjudaMontarCustoTotalClienteItens() {
      return [
        'Origem — (indicador ilustrativo no painel; sem tabela fixa).',
        this.armazensAjudaPeriodoTexto() + '.',
        this.armazensAjudaArmazensTexto(),
        'Cálculo — valor de referência de layout; valide o critério com a gestão.',
      ]
    },
    armazensAjudaMontarPctCustoClienteCdItens() {
      return [
        'Origem — (indicador ilustrativo no painel; sem tabela fixa).',
        this.armazensAjudaPeriodoTexto() + '.',
        this.armazensAjudaArmazensTexto(),
        'Cálculo — percentual de referência; valide o critério com a gestão.',
      ]
    },
    /**
     * Fatura cliente: uma única tabela em Origem quando o recorte cai só em legado ou só em cobranças;
     * Cálculo mínimo (coluna), sem jargem de «recorte»/filtros.
     */
    armazensAjudaMontarFaturamentoClienteItens() {
      const p = this.armazensAjudaPeriodoTexto() + '.'
      const arm = this.armazensAjudaArmazensTexto()
      const m = this.armazensFaturaResumoMeta
      const nL =
        m && Array.isArray(m.meses_legado) ? m.meses_legado.length : 0
      const nC =
        m && Array.isArray(m.meses_cobrancas) ? m.meses_cobrancas.length : 0
      if (nL > 0 && nC === 0) {
        return [
          'Origem — lev_fatura_cliente_legado.',
          p,
          arm,
          'Cálculo — o valor do cartão vem da coluna fatura, somada no período.',
        ]
      }
      if (nC > 0 && nL === 0) {
        return [
          'Origem — dbcobrancas.cobrancas.',
          p,
          arm,
          'Cálculo — o valor do cartão vem da coluna valor_total_cobranca, somada no período.',
        ]
      }
      if (nL > 0 && nC > 0) {
        return [
          'Origem — soma de faturas do período selecionado.',
          p,
          arm,
          'Cálculo — cada mês usa uma fonte: coluna fatura em lev_fatura_cliente_legado (até 04/2026) ou coluna valor_total_cobranca em dbcobrancas.cobrancas (a partir de 05/2026). O cartão mostra a soma.',
        ]
      }
      return [
        'Origem — a carregar.',
        p,
        arm,
        'Cálculo — após carregar, o valor vem da coluna fatura (legado) ou valor_total_cobranca (cobranças), conforme o mês.',
      ]
    },
    armazensAjudaMontarChartEvolucaoItens() {
      return [
        'Origem — três séries: custo mensal (lev_custo_valor), posições paletes (wf1_armazenagem_palete), unidades (wvu).',
        this.armazensAjudaPeriodoTexto() + '.',
        this.armazensAjudaArmazensTexto(),
        'Cálculo — curva por mês: mesmas regras dos cartões de custo total, PP e unidades, até 36 meses. Respeita filtros de armazém e de cliente na série de unidades/PP.',
      ]
    },
    armazensAjudaMontarChartComposicaoItens() {
      return [
        'Origem — lev_custo_valor e cadastro de nomes (lev_custo_item).',
        this.armazensAjudaPeriodoTexto() + '.',
        this.armazensAjudaArmazensTexto(),
        'Cálculo — as cinco maiores despesas por nome no período, mais a fatia «demais»; as percentagens são em relação ao custo total da operação (mesma base do cartão).',
      ]
    },
    armazensAjudaMontarChartCustoUnidadeItens() {
      return [
        'Origem — custo e unidades mês a mês (evolução / mesmos critérios do painel).',
        this.armazensAjudaPeriodoTexto() + '.',
        this.armazensAjudaArmazensTexto(),
        'Cálculo — em cada ponto, custo da operação do mês ÷ unidades atendidas naquele mês; se faltar dado, o gráfico pode usar trecho de apoio só para a forma da curva.',
      ]
    },
    armazensAjudaMontarChartCompareCdItens() {
      return [
        'Origem — custos por estabelecimento (lev_custo_valor) e, para paletes, ligação com clientes e armazéns.',
        this.armazensAjudaPeriodoTexto() + '.',
        this.armazensAjudaArmazensTexto(),
        'Cálculo — compara totais (custo, paletes, etc.) por armazém / código, conforme a série ativa. Com filtro de armazém, mostra a ordem escolhida; com filtro de cliente, restringe os dados.',
      ]
    },
    /** Resumo do cartão «Custo total da operação»: tabela, período, armazéns, soma (acima) + detalhe por item. */
    armazensAjudaMontarCustoOperacaoItens() {
      const out = []
      out.push('Origem — lev_custo_valor.')
      out.push(this.armazensAjudaPeriodoTexto() + '.')
      out.push(this.armazensAjudaArmazensTexto())
      if (this.armazensCustoTotalOperacaoLoading) {
        out.push('Cálculo — a carregar…')
        return out
      }
      const list = this.armazensCustoOperacaoRubricas
      const tot = this.armazensCustoTotalOperacao
      if (Array.isArray(list) && list.length > 0) {
        out.push('Cálculo — soma dos itens de custo (cada um com nome e valor).')
        const partes = list.map(x =>
          this.formatarDecimal(x.valor != null ? Number(x.valor) : 0)
        )
        if (tot != null && Number.isFinite(Number(tot))) {
          const somaR = list.reduce(
            (s, x) => s + (x.valor != null ? Number(x.valor) : 0),
            0
          )
          const dif = Math.abs(somaR - Number(tot))
          if (partes.length <= 10) {
            out.push(
              `Soma dos valores: ${partes.join(' + ')} = R$ ${this.formatarDecimal(tot)}.`
            )
          } else {
            const ini = partes.slice(0, 3).join(' + ')
            const fim = partes.slice(-2).join(' + ')
            out.push(
              `Soma dos valores: ${ini} + … + ${fim} = R$ ${this.formatarDecimal(tot)}.`
            )
          }
          if (list.length <= 8) {
            const nomes = list.map(x => {
              const raw = (x.titulo != null && String(x.titulo).trim() !== '')
                ? String(x.titulo).trim()
                : 'Item'
              return raw.length > 40 ? raw.slice(0, 37) + '…' : raw
            })
            out.push(`Nomes: ${nomes.join(' + ')}.`)
          }
          if (dif > 0.02) {
            out.push(
              'Nota: diferença mínima de arredondamento; use o total do cartão como referência.'
            )
          }
        }
        const maxLinhas = 25
        const exibir = list.slice(0, maxLinhas)
        for (const r of exibir) {
          const raw = (r.titulo != null && String(r.titulo).trim() !== '')
            ? String(r.titulo).trim()
            : 'Item'
          const t = raw.length > 55 ? raw.slice(0, 52) + '…' : raw
          out.push(
            `• ${t} — R$ ${this.formatarDecimal(r.valor != null ? Number(r.valor) : 0)}`
          )
        }
        if (list.length > maxLinhas) {
          out.push(
            `… e mais ${list.length - maxLinhas} itens (já incluídos na soma).`
          )
        }
      } else if (tot != null && Number.isFinite(Number(tot)) && tot !== 0) {
        out.push(
          'Cálculo — detalhamento por item indisponível; total do período e armazéns no cartão.'
        )
        out.push(`Total — R$ ${this.formatarDecimal(tot)}.`)
      } else {
        out.push('Cálculo — sem lançamento no recorte (ou total zero).')
      }
      return out
    },
    armazensAjudaVisivel(key) {
      return (
        this.armazensAjudaHoverKey === key ||
        this.armazensAjudaPinnedKey === key
      )
    },
    /** Painel pronto a mostrar (já com posição fixed calculada; evita flash fora do sítio). */
    armazensAjudaHelpPainelPronto(key) {
      if (!this.armazensAjudaVisivel(key)) return false
      const p = this.armazensAjudaPanelPos
      return !!(p && p.key === key)
    },
    syncArmazensAjudaPanelPos() {
      const key = this.armazensAjudaHoverKey || this.armazensAjudaPinnedKey
      if (!key) {
        this.armazensAjudaPanelPos = null
        return
      }
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          const root = this.$el
          if (!root || typeof root.querySelector !== 'function') {
            this.armazensAjudaPanelPos = null
            return
          }
          const k = String(key)
          let btn = null
          const anchor = this._armazensAjudaAnchorEl
          if (anchor) {
            try {
              if (
                root.contains(anchor) &&
                anchor.getAttribute('data-armazens-ajuda') === k
              ) {
                btn = anchor
              }
            } catch (_) {
              /* ignore */
            }
          }
          if (!btn) {
            btn = root.querySelector(
              '[data-armazens-ajuda="' + k.replace(/"/g, '\\"') + '"]'
            )
            if (btn) this._armazensAjudaAnchorEl = btn
          }
          if (!btn || typeof btn.getBoundingClientRect !== 'function') {
            this.armazensAjudaPanelPos = null
            return
          }
          const r = btn.getBoundingClientRect()
          const m = 8
          const gap = 8
          const vh = window.innerHeight
          const maxW = Math.min(352, window.innerWidth - 2 * m)
          let left = r.right - maxW
          left = Math.max(m, Math.min(left, window.innerWidth - m - maxW))
          const spaceBelow = vh - r.bottom - gap - m
          const spaceAbove = r.top - m - gap
          const wantMin = 64
          let top
          let transform = 'none'
          let maxH
          if (spaceBelow >= wantMin) {
            top = r.bottom + gap
            transform = 'none'
            maxH = Math.min(vh * 0.7, spaceBelow)
          } else if (spaceAbove >= wantMin) {
            top = r.top - gap
            transform = 'translateY(-100%)'
            maxH = Math.min(vh * 0.7, spaceAbove)
          } else {
            top = r.bottom + gap
            transform = 'none'
            maxH = Math.max(100, Math.min(vh * 0.5, spaceBelow, 240))
          }
          this.armazensAjudaPanelPos = {
            key,
            top,
            left,
            maxW,
            transform,
            maxH,
          }
        })
      })
    },
    armazensAjudaPanelStyle(key) {
      if (!this.armazensAjudaHelpPainelPronto(key)) return {}
      const p = this.armazensAjudaPanelPos
      if (!p || p.key !== key) return {}
      const s = {
        position: 'fixed',
        top: `${p.top}px`,
        left: `${p.left}px`,
        right: 'auto',
        zIndex: 10050,
        transform: p.transform != null && p.transform !== 'none' ? p.transform : 'none',
      }
      if (p.maxH != null) s.maxHeight = `${Math.round(p.maxH)}px`
      else s.maxHeight = '70vh'
      if (p.maxW != null) s.maxWidth = `${p.maxW}px`
      return s
    },
    armazensAjudaEnter(key, e) {
      this.armazensAjudaHoverKey = key
      if (e && e.currentTarget) this._armazensAjudaAnchorEl = e.currentTarget
      this.$nextTick(() => this.syncArmazensAjudaPanelPos())
    },
    armazensAjudaLeave(key) {
      if (this.armazensAjudaHoverKey === key) this.armazensAjudaHoverKey = null
      this.$nextTick(() => this.syncArmazensAjudaPanelPos())
    },
    armazensAjudaToggle(key, e) {
      this.armazensAjudaPinnedKey =
        this.armazensAjudaPinnedKey === key ? null : key
      if (e && e.currentTarget) this._armazensAjudaAnchorEl = e.currentTarget
      this.$nextTick(() => this.syncArmazensAjudaPanelPos())
    },
    /** Ícone Font Awesome por KPI (canto do card — referência Análise Armazéns). */
    armazensKpiIconClass(id) {
      const map = {
        custo_ops_ab: 'fa-coins',
        custo_total_pp: 'fa-pallet',
        total_pp_ocupadas: 'fa-th-large',
        custo_por_pp: 'fa-divide',
        unidades_atendidas: 'fa-boxes',
        func_clt: 'fa-users',
        custo_func_dedicado: 'fa-user-tie',
        custo_por_pessoa: 'fa-user-clock',
        unid_por_func: 'fa-chart-line',
        custo_atend_unidade: 'fa-hand-holding-usd',
        custo_total_cliente: 'fa-file-invoice-dollar',
        pct_custo_cliente_cd: 'fa-percentage',
        faturamento_cliente: 'fa-file-invoice',
      }
      return map[id] || 'fa-chart-bar'
    },
    destroyArmazensEvolucaoCharts() {
      const keys = [
        'armazensEvolucao',
        'armazensComposicaoCustos',
        'armazensRecCustoUnidade',
        'armazensRecCompareCd',
      ]
      for (const k of keys) {
        const c = this.charts[k]
        if (c && typeof c.destroy === 'function') {
          try {
            c.destroy()
          } catch (_) {
            /* ignore */
          }
        }
        if (
          this.charts &&
          Object.prototype.hasOwnProperty.call(this.charts, k)
        ) {
          delete this.charts[k]
        }
      }
    },
    async carregarArmazensEvolucaoMensal() {
      if (this.biSubTab !== 'armazens') return
      this.armazensEvolucaoLoading = true
      this.armazensComposicaoLoading = true
      this.armazensEvolucaoErro = null
      this.armazensComposicaoErro = null
      const params = {}
      if (this.dataInicio) params.data_inicio = this.dataInicio
      if (this.dataFim) params.data_fim = this.dataFim
      if (this.showFiltroArmazem && this.filtroArmazens.length > 0)
        params.estabelecimento = this.filtroArmazens.join(',')
      if (this.canShowClienteColumn && this.filtroClientes.length > 0)
        params.clientes = this.filtroClientesValoresParaApi
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      try {
        const [evoSettled, compSettled, compEstSettled] =
          await Promise.allSettled([
            axios.get('/bi/armazens/evolucao-mensal', { params, headers }),
            axios.get('/bi/armazens/composicao-custos-top', {
              params,
              headers,
            }),
            axios.get('/bi/armazens/comparativo-estabelecimentos', {
              params,
              headers,
            }),
          ])

        if (
          evoSettled.status === 'fulfilled' &&
          evoSettled.value?.data?.success
        ) {
          this.armazensEvolucaoPontos = Array.isArray(
            evoSettled.value.data.pontos
          )
            ? evoSettled.value.data.pontos
            : []
          this.armazensEvolucaoErro = null
        } else {
          this.armazensEvolucaoErro =
            evoSettled.status === 'fulfilled'
              ? evoSettled.value?.data?.error ||
                'Erro ao carregar evolução mensal'
              : evoSettled.reason?.response?.data?.error ||
                evoSettled.reason?.message ||
                'Erro ao carregar evolução mensal'
          this.armazensEvolucaoPontos = []
        }

        if (
          compSettled.status === 'fulfilled' &&
          compSettled.value?.data?.success
        ) {
          const d = compSettled.value.data
          this.armazensComposicaoCustosPayload = {
            custo_total: Number(d.custo_total) || 0,
            itens: Array.isArray(d.itens) ? d.itens : [],
            demais_valor: Number(d.demais_valor) || 0,
            demais_pct: Number(d.demais_pct) || 0,
          }
          this.armazensComposicaoErro = null
        } else {
          this.armazensComposicaoCustosPayload = null
          this.armazensComposicaoErro =
            compSettled.status === 'fulfilled'
              ? compSettled.value?.data?.error ||
                'Erro ao carregar composição de custos'
              : compSettled.reason?.response?.data?.error ||
                compSettled.reason?.message ||
                'Erro ao carregar composição de custos'
        }

        if (
          compEstSettled.status === 'fulfilled' &&
          compEstSettled.value?.data?.success
        ) {
          const d = compEstSettled.value.data
          this.armazensComparativoEstab = {
            itens: Array.isArray(d.itens) ? d.itens : [],
            meta: d.meta && typeof d.meta === 'object' ? d.meta : null,
          }
        } else {
          this.armazensComparativoEstab = null
        }
      } catch (err) {
        console.error('[BI Armazéns] Erro evolução / composição:', err)
        this.armazensEvolucaoErro =
          err.response?.data?.error ||
          err.message ||
          'Erro ao carregar evolução mensal'
        this.armazensEvolucaoPontos = []
        this.armazensComposicaoCustosPayload = null
        this.armazensComposicaoErro =
          err.response?.data?.error ||
          err.message ||
          'Erro ao carregar composição de custos'
        this.armazensComparativoEstab = null
      } finally {
        this.armazensEvolucaoLoading = false
        this.armazensComposicaoLoading = false
        this.$nextTick(() => this.renderArmazensEvolucaoCharts())
      }
    },
    renderArmazensEvolucaoCharts() {
      this.destroyArmazensEvolucaoCharts()
      if (this.biSubTab !== 'armazens') return
      const pts = this.armazensEvolucaoPontos || []
      const vm = this
      const text = this.biTheme === 'light' ? '#5a6c7d' : BI_AG.muted
      const isTv = this.biTvLayout

      if (pts.length) {
        const canvas = this.$refs.chartArmazensEvolucaoMensal
        const labels = pts.map(p => p.label)
        const grid = this.biTheme === 'light' ? 'rgba(0,0,0,0.08)' : BI_AG.grid
        const gridDash = [3, 3]

        const custoOp = pts.map(p => Number(p.custo_operacao) || 0)
        const posPp = pts.map(p => Number(p.posicoes_paletes) || 0)
        const unidades = pts.map(p => Number(p.unidades_atendidas) || 0)
        const evoPal =
          this.biTheme === 'light' ? BI_AG_EVO_LINE.light : BI_AG_EVO_LINE.dark
        const evoCusto = evoPal.custoOperacao
        const evoPp = evoPal.paletes
        const evoUnid = evoPal.unidades

        const armazensEvolucaoPontoLabelsPlugin = {
          id: 'armazensEvolucaoPontoLabels',
          afterDatasetsDraw(chart) {
            const { ctx, data, chartArea } = chart
            const halo =
              vm.biTheme === 'light'
                ? 'rgba(255,255,255,0.94)'
                : 'rgba(18,20,24,0.92)'
            /**
             * Custos / paletes acima do ponto; unidades abaixo.
             * Offsets maiores + dx alternado reduzem sobreposição quando as linhas ficam
             * próximas no mesmo mês; clamp horizontal evita cortar no fim do eixo.
             */
            const offsAbove = isTv ? [40, 68, 0] : [24, 44, 0]
            const offBelowUnid = isTv ? 36 : 22
            const dxAbove = isTv ? [-14, 14, 0] : [-9, 9, 0]
            const fontPx = isTv ? 16 : 10
            const padX = 4
            ctx.save()
            ctx.font = `${fontPx}px system-ui, sans-serif`
            ctx.textAlign = 'center'
            data.datasets.forEach((dataset, di) => {
              const meta = chart.getDatasetMeta(di)
              if (meta.hidden) return
              const below = dataset.yAxisID === 'yUnid'
              const stackOff = below
                ? offBelowUnid
                : (offsAbove[di] ?? offsAbove[0])
              const dx = below ? 0 : (dxAbove[di] ?? 0)
              meta.data.forEach((el, i) => {
                if (!el || el.skip) return
                const v = Number(dataset.data[i])
                if (!Number.isFinite(v) || v === 0) return
                let txt = ''
                if (dataset.yAxisID === 'yCusto') {
                  txt = vm.formatarMoedaEixoM(v)
                } else {
                  txt = vm.formatarVolumeEixoM(v)
                }
                if (!txt) return
                const x = el.x
                const y = el.y
                let drawX = x + dx
                const tw = ctx.measureText(txt).width
                const half = tw / 2 + padX
                if (drawX + half > chartArea.right) {
                  drawX = chartArea.right - half
                }
                if (drawX - half < chartArea.left) {
                  drawX = chartArea.left + half
                }
                ctx.strokeStyle = halo
                ctx.lineWidth = 4
                ctx.lineJoin = 'round'
                ctx.fillStyle =
                  typeof dataset.borderColor === 'string'
                    ? dataset.borderColor
                    : text
                if (below) {
                  ctx.textBaseline = 'top'
                  ctx.strokeText(txt, drawX, y + stackOff)
                  ctx.fillText(txt, drawX, y + stackOff)
                } else {
                  ctx.textBaseline = 'bottom'
                  ctx.strokeText(txt, drawX, y - stackOff)
                  ctx.fillText(txt, drawX, y - stackOff)
                }
              })
            })
            ctx.restore()
          },
        }

        this.charts.armazensEvolucao = new Chart(canvas, {
          type: 'line',
          plugins: [armazensEvolucaoPontoLabelsPlugin],
          data: {
            labels,
            datasets: [
              {
                label: 'Custo operação',
                data: custoOp,
                yAxisID: 'yCusto',
                borderColor: evoCusto,
                backgroundColor: evoCusto.replace(/\)$/, ' / 0.14)'),
                fill: false,
                tension: 0.45,
                cubicInterpolationMode: 'monotone',
                pointRadius: isTv ? 5 : 3,
                pointHoverRadius: isTv ? 7 : 5,
                pointBackgroundColor: evoCusto,
              },
              {
                label: 'Paletes',
                data: posPp,
                yAxisID: 'yVol',
                borderColor: evoPp,
                backgroundColor: evoPp.replace(/\)$/, ' / 0.12)'),
                fill: false,
                tension: 0.45,
                cubicInterpolationMode: 'monotone',
                pointRadius: isTv ? 5 : 3,
                pointHoverRadius: isTv ? 7 : 5,
                pointBackgroundColor: evoPp,
              },
              {
                label: 'Unidades',
                data: unidades,
                yAxisID: 'yUnid',
                borderColor: evoUnid,
                backgroundColor: evoUnid.replace(/\)$/, ' / 0.12)'),
                fill: false,
                tension: 0.45,
                cubicInterpolationMode: 'monotone',
                pointRadius: isTv ? 5 : 3,
                pointHoverRadius: isTv ? 7 : 5,
                pointBackgroundColor: evoUnid,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            layout: {
              padding: {
                left: isTv ? 8 : 4,
                right: isTv ? 40 : 18,
                bottom: isTv ? 52 : 14,
                top: isTv ? 72 : 44,
              },
            },
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: {
                display: true,
                position: 'bottom',
                align: 'center',
                labels: {
                  color: text,
                  font: { size: isTv ? 19 : 11 },
                  boxWidth: isTv ? 16 : 11,
                  padding: isTv ? 20 : 12,
                  usePointStyle: true,
                  pointStyle: 'circle',
                },
              },
              tooltip: {
                callbacks: {
                  label(ctx) {
                    const ds = ctx.dataset
                    const v = ctx.parsed.y
                    if (ds.yAxisID === 'yCusto') {
                      const abbr = vm.formatarMoedaEixoM(v)
                      const full = `R$ ${vm.formatarDecimal(v)}`
                      return Math.abs(Number(v)) >= 1e3
                        ? `${ds.label}: ${abbr} (${full})`
                        : `${ds.label}: ${full}`
                    }
                    const abbr = vm.formatarVolumeEixoM(v)
                    const full =
                      Number(v).toLocaleString('pt-BR', {
                        maximumFractionDigits: 0,
                      }) || ''
                    return Math.abs(Number(v)) >= 1e3
                      ? `${ds.label}: ${abbr} (${full})`
                      : `${ds.label}: ${full || abbr}`
                  },
                },
              },
              biAgBarValueLabels: { display: false },
              biAgCompareCdLabels: { display: false },
            },
            scales: {
              x: {
                ticks: {
                  color: text,
                  maxRotation: isTv ? 0 : 45,
                  font: { size: isTv ? 16 : 11 },
                },
                grid: { color: grid, borderDash: gridDash },
              },
              yCusto: {
                type: 'linear',
                position: 'left',
                grace: '14%',
                title: {
                  display: false,
                },
                ticks: {
                  display: false,
                },
                grid: { color: grid, borderDash: gridDash },
              },
              yVol: {
                type: 'linear',
                position: 'right',
                grace: '10%',
                title: {
                  display: false,
                },
                ticks: {
                  display: false,
                },
                grid: { drawOnChartArea: false },
              },
              /** Escala própria: unidades são ordens menor que paletes — sem isto a linha some no eixo. */
              yUnid: {
                type: 'linear',
                position: 'right',
                offset: true,
                grace: '12%',
                title: {
                  display: false,
                },
                ticks: {
                  display: false,
                },
                grid: { drawOnChartArea: false },
              },
            },
          },
        })
        this.$nextTick(() => {
          const ch = this.charts.armazensEvolucao
          if (ch && typeof ch.resize === 'function') {
            ch.resize()
            ch.update('none')
          }
        })
      }

      this.renderArmazensComposicaoDonutChart(text, isTv)
      this.$nextTick(() => this.renderArmazensRecomendadasCharts())
    },
    /**
     * Rosca: 5 maiores itens de lev_custo_item + fatia «Demais» (resto do custo total).
     */
    renderArmazensComposicaoDonutChart(text, isTv) {
      if (this.biSubTab !== 'armazens') return
      if (this.armazensComposicaoErro) return
      const donutEl = this.$refs.chartArmazensComposicaoCustos
      if (!donutEl) return

      const vm = this
      const pay = this.armazensComposicaoCustosPayload
      const itens = pay?.itens || []
      const demais = pay?.demais_valor ?? 0
      const custoTotal = pay?.custo_total ?? 0

      const labels = []
      const data = []
      const bg = []

      for (let i = 0; i < itens.length; i++) {
        const it = itens[i]
        const valor = Number(it.valor) || 0
        const pct =
          it.pct != null
            ? Number(it.pct)
            : custoTotal > 0
              ? (valor / custoTotal) * 100
              : 0
        labels.push(`${it.titulo} (${vm.formatarDecimal(pct)}%)`)
        data.push(valor)
        bg.push(BI_AG_DONUT_BG[i % BI_AG_DONUT_BG.length])
      }
      if (demais > 0.005) {
        const dp =
          pay?.demais_pct != null
            ? Number(pay.demais_pct)
            : custoTotal > 0
              ? (demais / custoTotal) * 100
              : 0
        labels.push(`Demais (${vm.formatarDecimal(dp)}%)`)
        data.push(demais)
        bg.push(BI_AG_DONUT_BG[5])
      }

      if (data.length === 0 || custoTotal <= 0) {
        labels.push('Sem dados no período')
        data.push(1)
        bg.push('hsl(220 14% 28%)')
      }

      this.charts.armazensComposicaoCustos = new Chart(donutEl, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data,
              backgroundColor: bg,
              borderColor:
                this.biTheme === 'light' ? '#ffffff' : 'hsl(220 18% 13%)',
              borderWidth: 2,
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: {
              top: isTv ? 4 : 2,
              bottom: isTv ? 20 : 10,
            },
          },
          cutout: '58%',
          animation: { animateRotate: false, animateScale: false },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: text,
                font: { size: isTv ? 17 : 10 },
                padding: isTv ? 14 : 8,
              },
            },
            tooltip: {
              callbacks: {
                label(ctx) {
                  const raw = Number(ctx.raw) || 0
                  const nome = String(ctx.label || '').split(' (')[0] || ''
                  if (custoTotal <= 0 || nome === 'Sem dados no período') {
                    return nome ? `${nome}` : ''
                  }
                  const pct = Math.round((raw / custoTotal) * 1000) / 10
                  return `${nome}: R$ ${vm.formatarDecimal(raw)} (${pct}%)`
                },
              },
            },
            biAgBarValueLabels: { display: false },
            biAgCompareCdLabels: { display: false },
          },
        },
      })
    },
    /**
     * Gráficos complementares (grade em duas colunas). Usa evolução mensal quando disponível;
     * caso contrário, série ilustrativa.
     */
    renderArmazensRecomendadasCharts() {
      if (this.biSubTab !== 'armazens') return
      for (const k of ['armazensRecCustoUnidade', 'armazensRecCompareCd']) {
        const c = this.charts[k]
        if (c && typeof c.destroy === 'function') {
          try {
            c.destroy()
          } catch (_) {
            /* ignore */
          }
        }
        if (
          this.charts &&
          Object.prototype.hasOwnProperty.call(this.charts, k)
        ) {
          delete this.charts[k]
        }
      }
      const vm = this
      const pts = this.armazensEvolucaoPontos || []
      const grid = this.biTheme === 'light' ? 'rgba(0,0,0,0.08)' : BI_AG.grid
      const gridDash = [3, 3]
      const text = this.biTheme === 'light' ? '#5a6c7d' : BI_AG.muted
      const isTv = this.biTvLayout
      const agRecTickSz = isTv ? 15 : 11
      const agRecLegSz = isTv ? 17 : 10
      const agRecAxisTitleSz = isTv ? 14 : 10
      const teal = BI_AG.primary
      const orange = BI_AG.unidades

      const mesCurto = (ano, mes) => {
        const abrev = [
          'Jan',
          'Fev',
          'Mar',
          'Abr',
          'Mai',
          'Jun',
          'Jul',
          'Ago',
          'Set',
          'Out',
          'Nov',
          'Dez',
        ]
        const m = Number(mes)
        const a = Number(ano)
        if (!m || m < 1 || m > 12 || !Number.isFinite(a)) return ''
        return `${abrev[m - 1]}/${String(a).slice(-2)}`
      }

      const mockMeses12 = () => {
        const out = []
        let y = 2025
        let m = 1
        for (let i = 0; i < 12; i++) {
          out.push(mesCurto(y, m))
          m++
          if (m > 12) {
            m = 1
            y++
          }
        }
        return out
      }

      let labels = []
      let custoOp = []
      let posPp = []
      let unidades = []
      if (pts.length) {
        labels = pts.map(p => p.label)
        custoOp = pts.map(p => Number(p.custo_operacao) || 0)
        posPp = pts.map(p => Number(p.posicoes_paletes) || 0)
        unidades = pts.map(p => Number(p.unidades_atendidas) || 0)
      } else {
        labels = mockMeses12()
        const base = 2.35e6
        custoOp = labels.map((_, i) => base * (0.85 + 0.03 * Math.sin(i * 0.5)))
        posPp = labels.map((_, i) => 11800 + ((i * 1370) % 15000))
        unidades = labels.map((_, i) => 13.4e6 + i * 340000)
      }

      const custoPorUnidade = custoOp.map((c, i) => {
        const u = unidades[i] || 0
        return u > 0 ? c / u : null
      })

      const compEstRows =
        this.armazensComparativoEstab &&
        Array.isArray(this.armazensComparativoEstab.itens)
          ? this.armazensComparativoEstab.itens
          : []
      let cdLabels
      let custoCdBars
      let paletesCdBars
      if (compEstRows.length > 0) {
        cdLabels = compEstRows.map(x => x.rotulo || x.codigo_estabelecimento)
        custoCdBars = compEstRows.map(x => Number(x.custo_operacao) || 0)
        paletesCdBars = compEstRows.map(x => Number(x.posicoes_paletes) || 0)
      } else {
        /** Sem resposta com linhas: placeholder neutro (ex.: ainda a carregar ou sem levantamento). */
        cdLabels = ['(sem dados)']
        custoCdBars = [0]
        paletesCdBars = [0]
      }

      const compareCdSemValores =
        !custoCdBars.some(v => Number(v) > 0) &&
        !paletesCdBars.some(v => Number(v) > 0)

      const commonOpts = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        layout: {
          padding: {
            left: isTv ? 4 : 2,
            right: isTv ? 8 : 4,
            bottom: isTv ? 46 : 12,
            top: isTv ? 6 : 2,
          },
        },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: text,
              font: { size: agRecLegSz },
              boxWidth: isTv ? 14 : 10,
              padding: isTv ? 14 : 8,
              usePointStyle: true,
            },
          },
          tooltip: {
            callbacks: {
              label(ctx) {
                const v = ctx.parsed.y
                if (v == null || Number.isNaN(v))
                  return `${ctx.dataset.label}: —`
                if (ctx.dataset.yAxisID === 'yPct')
                  return `${ctx.dataset.label}: ${v.toFixed(1)}%`
                return `${ctx.dataset.label}: ${vm.formatarDecimal(v)}`
              },
            },
          },
          biAgBarValueLabels: { display: false },
          biAgCompareCdLabels: { display: false },
        },
      }

      const c1 = this.$refs.chartArmazensRecCustoUnidade
      if (c1) {
        this.charts.armazensRecCustoUnidade = new Chart(c1, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'R$ / unidade',
                data: custoPorUnidade,
                borderColor: teal,
                backgroundColor: 'rgba(45, 212, 191, 0.12)',
                fill: false,
                tension: 0.45,
                cubicInterpolationMode: 'monotone',
                pointRadius: isTv ? 4 : 3,
                pointBackgroundColor: teal,
              },
            ],
          },
          options: {
            ...commonOpts,
            scales: {
              x: {
                ticks: {
                  color: text,
                  maxRotation: 45,
                  font: { size: agRecTickSz },
                },
                grid: { color: grid, borderDash: gridDash },
              },
              y: {
                ticks: {
                  color: teal,
                  font: { size: agRecTickSz },
                  callback: v =>
                    `R$ ${Number(v).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}`,
                },
                grid: { color: grid, borderDash: gridDash },
              },
            },
            plugins: {
              ...commonOpts.plugins,
              tooltip: {
                callbacks: {
                  label(ctx) {
                    const v = ctx.parsed.y
                    if (v == null) return `${ctx.dataset.label}: —`
                    return `${ctx.dataset.label}: R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
                  },
                },
              },
            },
          },
        })
      }

      const c2 = this.$refs.chartArmazensRecCompareCd
      if (c2) {
        this.charts.armazensRecCompareCd = new Chart(c2, {
          type: 'bar',
          data: {
            labels: cdLabels,
            datasets: [
              {
                label: 'Custo operação',
                data: custoCdBars,
                yAxisID: 'yCusto',
                backgroundColor: 'hsla(168 80% 50% / 0.88)',
                borderColor: teal,
                borderWidth: 1,
              },
              {
                label: 'Paletes',
                data: paletesCdBars,
                yAxisID: 'yPal',
                backgroundColor: 'hsla(38 90% 55% / 0.88)',
                borderColor: orange,
                borderWidth: 1,
              },
            ],
          },
          options: {
            ...commonOpts,
            scales: {
              x: {
                ticks: {
                  color: text,
                  maxRotation: 25,
                  font: { size: agRecTickSz },
                },
                grid: { display: false },
              },
              yCusto: {
                type: 'linear',
                position: 'left',
                title: {
                  display: true,
                  text: 'R$',
                  color: text,
                  font: { size: agRecAxisTitleSz },
                },
                min: 0,
                suggestedMax: compareCdSemValores ? 1 : undefined,
                ticks: {
                  color: teal,
                  font: { size: agRecTickSz },
                  maxTicksLimit: compareCdSemValores ? 3 : 8,
                  callback: v => vm.formatarMoedaEixoM(v),
                },
                grid: { color: grid, borderDash: gridDash },
              },
              yPal: {
                type: 'linear',
                position: 'right',
                title: {
                  display: true,
                  text: 'Paletes',
                  color: text,
                  font: { size: agRecAxisTitleSz },
                },
                min: 0,
                suggestedMax: compareCdSemValores ? 1 : undefined,
                ticks: {
                  color: orange,
                  font: { size: agRecTickSz },
                  maxTicksLimit: compareCdSemValores ? 3 : 8,
                  callback: v =>
                    Number(v).toLocaleString('pt-BR', {
                      maximumFractionDigits: 0,
                    }),
                },
                grid: { drawOnChartArea: false },
              },
            },
            plugins: {
              ...commonOpts.plugins,
              tooltip: {
                callbacks: {
                  label(ctx) {
                    const v = ctx.parsed.y
                    const name = ctx.dataset.label || ''
                    if (name === 'Paletes')
                      return `${name}: ${Number(v).toLocaleString('pt-BR')}`
                    return `${name}: R$ ${vm.formatarDecimal(v)}`
                  },
                },
              },
            },
          },
        })
      }
    },
    /**
     * Elemento DOM da raiz `.bi-page` para fullscreen.
     * Usa `ref="biPageRef"` neste componente; fallback `this.$el`.
     * No App.vue o `<BIPage ref="biPageComponentRef">` aponta para a instância Vue — nunca usar esse ref como nó DOM; a lógica de fullscreen só roda aqui.
     */
    biFullscreenRootEl() {
      const r = this.$refs.biPageRef
      if (r instanceof Element) return r
      return this.$el instanceof Element ? this.$el : null
    },
    /** True se o elemento em tela cheia é a raiz BI ou está contido nela (robusto a variações do DOM). */
    isOurFullscreenElement(fs, root) {
      return !!(fs && root && (fs === root || root.contains(fs)))
    },
    /** Alternar tela cheia (apenas nível 0) — útil para exibir em painel. */
    async toggleFullscreen() {
      const el = this.biFullscreenRootEl()
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
        console.warn('[BI] Fullscreen:', e?.message || e)
        this.isFullscreen = false
      }
    },
    /** Atualiza estado de tela cheia ao sair por ESC ou API. Inicia/para modo painel (auto-scroll + alternar visual). */
    onFullscreenChange() {
      const fs = document.fullscreenElement
      const el = this.biFullscreenRootEl()
      this.isFullscreen = this.isOurFullscreenElement(fs, el)
      this.syncSlaAutoPanelModeFromFullscreenState()
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          ;[
            'armazensEvolucao',
            'armazensComposicaoCustos',
            'armazensRecCustoUnidade',
            'armazensRecCompareCd',
          ].forEach(key => {
            const ch = this.charts?.[key]
            if (ch && typeof ch.resize === 'function') ch.resize()
          })
          if (this.biSubTab === 'armazens') {
            requestAnimationFrame(() => {
              const evo = this.charts?.armazensEvolucao
              if (evo && typeof evo.resize === 'function') evo.resize()
            })
          }
        })
      })
    },
    /**
     * Modo painel do SLA: fullscreen próprio do BI ou embed no `BIPainelPage`.
     * Importante: com FS no documento em outro nó (Painel), `isFullscreen` fica false —
     * não parar animações só por isso.
     */
    syncSlaAutoPanelModeFromFullscreenState() {
      this.$nextTick(() => this.applySlaAutoPanelModeSync())
    },
    applySlaAutoPanelModeSync() {
      if (this.biSubTab !== 'sla') {
        this.stopAutoPanelMode()
        return
      }
      const slaTvVisible = this.isFullscreen || this.embedTvLayout
      const painelSlaEmSegundoPlano = this.painelFsActive && !slaTvVisible

      if (slaTvVisible) {
        this.ensureSlaTvIntervalsAllActive()
      } else if (painelSlaEmSegundoPlano) {
        this.ensureSlaPainelBackgroundIntervals()
      } else {
        this.stopAutoPanelMode()
      }
    },
    /** Sincroniza face Pedidos/SLA quando o `BIPainelPage` comanda a rotação. */
    applyPainelEmbedSlaFlipSync() {
      if (!this.painelEmbedControlsSlaFlip || !this.embedTvLayout) return
      this.slaViewFlipped = !!this.painelEmbedSlaFlipped
      this.$nextTick(() => this.resetTableWrappersScroll())
    },
    /** Refresh automático: face SLA em TV ou Painel do documento em FS (qualquer face). */
    slaAutoRefreshShouldRun() {
      return this.biSubTab === 'sla' && (this.biTvLayout || this.painelFsActive)
    },
    /** Contagem “próxima atualização” segue em andamento no Painel FS mesmo na face Diretoria. */
    slaDataCountdownShouldTick() {
      if (this.biSubTab !== 'sla') return false
      if (this.biTvLayout) return true
      return !!this.painelFsActive
    },
    stopSlaVisualOnlyIntervals() {
      if (this._intervalViewToggle) {
        clearInterval(this._intervalViewToggle)
        this._intervalViewToggle = null
      }
      if (this._intervalScroll) {
        clearInterval(this._intervalScroll)
        this._intervalScroll = null
      }
    },
    ensureSlaDataRefreshAndCountdownTick() {
      if (!this._intervalCountdown) {
        this._intervalCountdown = setInterval(() => {
          if (
            this.biTvLayout &&
            this.viewToggleCountdown > 0 &&
            !this.painelEmbedControlsSlaFlip
          ) {
            this.viewToggleCountdown--
          }
          if (!this.slaDataCountdownShouldTick()) return

          if (this.dataUpdateCountdown > 0) {
            this.dataUpdateCountdown--
          }
          if (
            this.dataUpdateCountdown <= 0 &&
            this.slaAutoRefreshShouldRun() &&
            !this.loading &&
            !this._slaBgLoadInFlight
          ) {
            this.loadSlaData({ silent: true })
          }
        }, 1000)
      }
    },
    ensureSlaViewFlipInterval() {
      if (this.painelEmbedControlsSlaFlip) {
        if (this._intervalViewToggle) {
          clearInterval(this._intervalViewToggle)
          this._intervalViewToggle = null
        }
        return
      }
      if (this._intervalViewToggle) return
      this._intervalViewToggle = setInterval(() => {
        if (!this.biTvLayout) return
        this.slaViewFlipped = !this.slaViewFlipped
        this.viewToggleCountdown = 60
        this.$nextTick(() => this.resetTableWrappersScroll())
      }, 60000)
    },
    ensureSlaScrollInterval() {
      if (this._intervalScroll) return
      const scrollStep = 1
      const scrollIntervalMs = 50
      this._intervalScroll = setInterval(() => {
        if (!this.biTvLayout) return
        const flipped = this.slaViewFlipped
        let el = null
        if (flipped && this.$el) {
          const backWrapper = this.$el.querySelector(
            '.sla-face-back .sla-table-wrapper'
          )
          el =
            backWrapper ||
            (this.$refs.tableWrapperBack &&
              (this.$refs.tableWrapperBack.$el || this.$refs.tableWrapperBack))
        } else {
          const w = this.$refs.tableWrapperFront
          el = w && (w.$el || w)
        }
        if (!el || typeof el.scrollTop === 'undefined') return
        if (el.scrollHeight <= el.clientHeight) return
        el.scrollTop += scrollStep
        const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2
        if (atBottom) {
          el.scrollTop = 0
          if (flipped) {
            if (this.currentPageGeral < this.totalPagesGeral)
              this.currentPageGeral++
            else this.currentPageGeral = 1
          } else {
            if (this.currentPage < this.totalPages) this.currentPage++
            else this.currentPage = 1
          }
        }
      }, scrollIntervalMs)
    },
    /** SLA visível (fullscreen próprio ou face SLA no Painel): animações + refresh. */
    ensureSlaTvIntervalsAllActive() {
      this.ensureSlaDataRefreshAndCountdownTick()
      this.ensureSlaViewFlipInterval()
      this.ensureSlaScrollInterval()
      if (this.dataUpdateCountdown <= 0 && this.slaAutoRefreshShouldRun()) {
        if (!this.loading && !this._slaBgLoadInFlight)
          this.loadSlaData({ silent: true })
        else this.dataUpdateCountdown = SLA_PANEL_DATA_REFRESH_SEC
      }
      if (this.viewToggleCountdown <= 0 && !this.painelEmbedControlsSlaFlip) {
        this.viewToggleCountdown = 60
      }
    },
    /** Painel em FS na face Diretoria: pausa flip/scroll; mantém contagem e refresh via cronômetro. */
    ensureSlaPainelBackgroundIntervals() {
      this.stopSlaVisualOnlyIntervals()
      this.ensureSlaDataRefreshAndCountdownTick()
      if (this.dataUpdateCountdown <= 0 && this.slaAutoRefreshShouldRun()) {
        if (!this.loading && !this._slaBgLoadInFlight)
          this.loadSlaData({ silent: true })
        else this.dataUpdateCountdown = SLA_PANEL_DATA_REFRESH_SEC
      }
    },
    /** Zera o scroll das duas tabelas para a rolagem continuar do topo após alternar o visual. */
    resetTableWrappersScroll() {
      const front =
        this.$refs.tableWrapperFront &&
        (this.$refs.tableWrapperFront.$el || this.$refs.tableWrapperFront)
      let back =
        this.$el && this.$el.querySelector('.sla-face-back .sla-table-wrapper')
      if (!back)
        back =
          this.$refs.tableWrapperBack &&
          (this.$refs.tableWrapperBack.$el || this.$refs.tableWrapperBack)
      if (front && typeof front.scrollTop !== 'undefined') front.scrollTop = 0
      if (back && typeof back.scrollTop !== 'undefined') back.scrollTop = 0
    },
    stopAutoPanelMode() {
      if (this._intervalViewToggle) {
        clearInterval(this._intervalViewToggle)
        this._intervalViewToggle = null
      }
      if (this._intervalScroll) {
        clearInterval(this._intervalScroll)
        this._intervalScroll = null
      }
      if (this._intervalCountdown) {
        clearInterval(this._intervalCountdown)
        this._intervalCountdown = null
      }
      this.viewToggleCountdown = 0
      this.dataUpdateCountdown = 0
    },
    ensureRejeicaoScrollInterval() {
      if (this._intervalRejeicaoScroll) return
      const step = 1
      this._intervalRejeicaoScroll = setInterval(() => {
        if (!this.biTvLayout || this.biSubTab !== 'rejeicao') return
        if ((this.rejeicaoClientesFiltrados || []).length <= 5) return
        const el = this.$refs.rejeicaoTabelaScroll
        if (!el || el.scrollHeight <= el.clientHeight) return
        el.scrollTop += step
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
          el.scrollTop = 0
        }
      }, 50)
    },
    stopRejeicaoScrollInterval() {
      if (this._intervalRejeicaoScroll) {
        clearInterval(this._intervalRejeicaoScroll)
        this._intervalRejeicaoScroll = null
      }
    },
    toggleFiltroAdm(adm) {
      this.rejeicaoFiltroAdm = this.rejeicaoFiltroAdm === adm ? null : adm
      this.rejeicaoClienteExpandido = null
      this.$nextTick(() => this.renderRejeicaoCharts())
    },
    toggleClienteExpandido(g) {
      const idCliente = g.id_cliente ?? ''
      const nome = (g.cliente || '').trim().toUpperCase()
      const key = `${idCliente}|${nome}`
      this.rejeicaoClienteExpandido =
        this.rejeicaoClienteExpandido === key ? null : key
    },
    /** Calcula as estatísticas a partir de uma lista de pedidos (sem mutar estado). Usado para dados totais e para o conjunto filtrado. */
    computeStatsFromOrders(orders) {
      const empty = {
        sepPedidos: { d0: 0, pendente: 0, d1: 0, d2: 0, antecipado: 0, out: 0 },
        sepStatus: {
          pendenteNoPrazo: 0,
          pendenteFora: 0,
          noPrazo: 0,
          foraPrazo: 0,
        },
        expPedidos: { pendente: 0, d0: 0, d1: 0, d2: 0, antecipado: 0, out: 0 },
        expStatus: {
          pendenteNoPrazo: 0,
          pendenteFora: 0,
          noPrazo: 0,
          foraPrazo: 0,
        },
      }
      if (!orders || !orders.length) return empty

      const sepStatusCounts = {
        pendenteNoPrazo: 0,
        pendenteFora: 0,
        noPrazo: 0,
        foraPrazo: 0,
      }
      const expStatusCounts = {
        pendenteNoPrazo: 0,
        pendenteFora: 0,
        noPrazo: 0,
        foraPrazo: 0,
      }

      const sepSlaCounts = {
        d0: 0,
        d1: 0,
        d2: 0,
        out: 0,
        pendente: 0,
        antecipado: 0,
      }
      // SLA de Expedição realizado (igual à coluna EXPEDIÇÃO da tabela): data real da expedição vs limite
      const expSlaRealizedCounts = {
        d0: 0,
        d1: 0,
        d2: 0,
        pendente: 0,
        antecipado: 0,
        out: 0,
      }

      orders.forEach(o => {
        // SLA de Separação: baseado na data real da separação vs inicio_sla (Antecipado, D+0, D+1, D+2, Pendente)
        const slaSep = this.getSlaSeparacao(o)
        if (slaSep === 'Antecipado') sepSlaCounts.antecipado++
        else if (slaSep === 'D+0') sepSlaCounts.d0++
        else if (slaSep === 'D+1') sepSlaCounts.d1++
        else if (slaSep === 'D+2') sepSlaCounts.d2++
        else if (slaSep === 'OUT') sepSlaCounts.out++
        else sepSlaCounts.pendente++

        // SLA de Expedição: getSlaExpedicao (= coluna EXPEDIÇÃO); fora de Emb. Conf. → Pendente
        const slaExp = this.getSlaExpedicao(o)
        if (slaExp === 'Pendente') expSlaRealizedCounts.pendente++
        else if (slaExp === 'Antecipado') expSlaRealizedCounts.antecipado++
        else if (slaExp === 'D+0') expSlaRealizedCounts.d0++
        else if (slaExp === 'D+1') expSlaRealizedCounts.d1++
        else if (slaExp === 'D+2') expSlaRealizedCounts.d2++
        else if (slaExp === 'OUT') expSlaRealizedCounts.out++
        else expSlaRealizedCounts.pendente++

        const statusSep = this.computeStatusSeparacao(o)
        const statusExp = this.computeStatusExpedicao(o)
        sepStatusCounts[
          statusSep === 'Pendente / No Prazo'
            ? 'pendenteNoPrazo'
            : statusSep === 'Pendente / Fora do Prazo'
              ? 'pendenteFora'
              : statusSep === 'No Prazo'
                ? 'noPrazo'
                : 'foraPrazo'
        ]++
        expStatusCounts[
          statusExp === 'Pendente / No Prazo'
            ? 'pendenteNoPrazo'
            : statusExp === 'Pendente / Fora do Prazo'
              ? 'pendenteFora'
              : statusExp === 'No Prazo'
                ? 'noPrazo'
                : 'foraPrazo'
        ]++
      })

      const {
        d0: eD0,
        d1: eD1,
        d2: eD2,
        pendente: ePendente,
        antecipado: eAntecipado,
        out: eOut,
      } = expSlaRealizedCounts
      const {
        d0: sD0,
        d1: sD1,
        d2: sD2,
        out: sOut,
        pendente: sPendente,
        antecipado: sAntecipado,
      } = sepSlaCounts
      return {
        sepPedidos: {
          d0: sD0,
          pendente: sPendente,
          d1: sD1,
          d2: sD2,
          antecipado: sAntecipado,
          out: sOut,
        },
        sepStatus: sepStatusCounts,
        expPedidos: {
          pendente: ePendente,
          d0: eD0,
          d1: eD1,
          d2: eD2,
          antecipado: eAntecipado,
          out: eOut,
        },
        expStatus: expStatusCounts,
      }
    },
    recalcStatsFromOrders(orders) {
      const stats = this.computeStatsFromOrders(orders)
      this.statsSepPedidos = stats.sepPedidos
      this.statsSepStatus = stats.sepStatus
      this.statsExpPedidos = stats.expPedidos
      this.statsExpStatus = stats.expStatus
    },
    buildLegend(stats, config) {
      const total = Object.values(stats).reduce((a, b) => a + b, 0)
      if (total === 0) return []
      return Object.entries(stats)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({
          label: (config[k] && config[k].label) || k,
          color: (config[k] && config[k].color) || COLORS.textMuted,
          count: v,
          pct: ((v / total) * 100).toFixed(2),
        }))
    },
    /** Escapa texto injetado no tooltip HTML dos donuts SLA. */
    escapeSlaDonutTooltipHtml(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    },
    slaDonutTooltipSwatchBg(hex) {
      return /^#[0-9A-Fa-f]{3,8}$/.test(String(hex || '').trim())
        ? String(hex).trim()
        : '#888888'
    },
    /**
     * Tooltip em HTML acima do canvas (z-index acima do miolo e do total central),
     * mesmo padrão visual do donut SLA do BI Group Link Gerencial.
     */
    buildSlaDonutHtmlTooltipExternal(canvas) {
      const parent = canvas?.parentNode
      if (!parent) {
        return () => {}
      }
      const tooltipEl = document.createElement('div')
      tooltipEl.className = 'bi-sla-donut-tooltip-html'
      tooltipEl.setAttribute('role', 'tooltip')
      parent.appendChild(tooltipEl)
      return context => {
        const { chart, tooltip: tip } = context
        if (!tooltipEl.parentNode) parent.appendChild(tooltipEl)
        if (!tip || tip.opacity === 0) {
          tooltipEl.style.opacity = '0'
          tooltipEl.style.visibility = 'hidden'
          return
        }
        const dp = tip.dataPoints?.[0]
        const active = chart?.getActiveElements?.() || []
        const ae = active[0]
        let idx =
          typeof dp?.dataIndex === 'number'
            ? dp.dataIndex
            : typeof ae?.index === 'number'
              ? ae.index
              : null
        const labels = chart.data?.labels || []
        const ds0 = chart.data?.datasets?.[0]
        const dataArr = Array.isArray(ds0?.data) ? ds0.data : []
        const colors = ds0?.backgroundColor
        const colorAt = i =>
          (Array.isArray(colors) ? colors[i] : colors) || '#888888'

        let html = ''
        if (idx != null && idx >= 0 && idx < dataArr.length) {
          const title = String(labels[idx] != null ? labels[idx] : '')
          const bg = this.slaDonutTooltipSwatchBg(colorAt(idx))
          const raw = dp?.raw != null ? dp.raw : dataArr[idx]
          const valStr = this.formatarNumero(Number(raw) || 0)
          html = `<div class="bi-sla-donut-tooltip-html__title">${this.escapeSlaDonutTooltipHtml(title)}</div>`
          html += `<div class="bi-sla-donut-tooltip-html__row">`
          html += `<span class="bi-sla-donut-tooltip-html__swatch" style="background-color:${bg}"></span>`
          html += `<span class="bi-sla-donut-tooltip-html__value">${this.escapeSlaDonutTooltipHtml(valStr)}</span>`
          html += `</div>`
        } else {
          const titles = Array.isArray(tip.title)
            ? tip.title.filter(Boolean)
            : []
          const bodies = []
          if (tip.body?.length) {
            tip.body.forEach(b => (b.lines || []).forEach(l => bodies.push(l)))
          }
          titles.forEach(t => {
            html += `<div class="bi-sla-donut-tooltip-html__title">${this.escapeSlaDonutTooltipHtml(t)}</div>`
          })
          bodies.forEach(l => {
            html += `<div class="bi-sla-donut-tooltip-html__row">`
            html += `<span class="bi-sla-donut-tooltip-html__value bi-sla-donut-tooltip-html__value--solo">${this.escapeSlaDonutTooltipHtml(l)}</span>`
            html += `</div>`
          })
        }
        tooltipEl.innerHTML =
          html || `<div class="bi-sla-donut-tooltip-html__value">—</div>`
        const x = tip.caretX ?? 0
        const y = tip.caretY ?? 0
        tooltipEl.style.left = `${x}px`
        tooltipEl.style.top = `${y}px`
        tooltipEl.style.transform = 'translate(-50%, calc(-100% - 10px))'
        tooltipEl.style.opacity = '1'
        tooltipEl.style.visibility = 'visible'
      }
    },
    chartOptionsWithClick(chartId, canvas) {
      const chartAreaBg = this.biTheme === 'light' ? '#ffffff' : '#272a2f'
      const base = {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        /* Cobre o miolo: sem isto o cutout é transparente e números da face traseira
           do flipper (ou outras camadas) vazam por baixo do overlay HTML. */
        backgroundColor: chartAreaBg,
        onClick: (event, elements, chart) => {
          if (elements.length) {
            const idx = elements[0].index
            const label = chart.data.labels[idx]
            this.applyChartFilter(chartId, label)
          }
        },
        onHover: (event, elements) => {
          if (event.native && event.native.target) {
            event.native.target.style.cursor = elements.length
              ? 'pointer'
              : 'default'
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: this.buildSlaDonutHtmlTooltipExternal(canvas),
            callbacks: {
              title: items => {
                const it = items?.[0]
                return it?.label != null && it.label !== ''
                  ? [String(it.label)]
                  : []
              },
              label: ctx => this.formatarNumero(Number(ctx.raw) || 0),
            },
          },
        },
      }
      return base
    },
    /** Donut apenas informativo (sem filtro por clique). */
    chartOptionsSomenteLeitura(canvas) {
      const chartAreaBg = this.biTheme === 'light' ? '#ffffff' : '#272a2f'
      return {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        backgroundColor: chartAreaBg,
        onHover: (event, elements) => {
          if (event.native && event.native.target) {
            event.native.target.style.cursor = 'default'
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: this.buildSlaDonutHtmlTooltipExternal(canvas),
            callbacks: {
              title: items => {
                const it = items?.[0]
                return it?.label != null && it.label !== ''
                  ? [String(it.label)]
                  : []
              },
              label: ctx => this.formatarNumero(Number(ctx.raw) || 0),
            },
          },
        },
      }
    },
    renderCharts() {
      this.destroyCharts()
      const sepPedidosData = this.chartDataSepPedidos()
      const sepStatusData = this.chartDataSepStatus()
      const expPedidosData = this.chartDataExpPedidos()
      const expStatusData = this.chartDataExpStatus()
      const volumesProntosData = this.chartDataVolumesProntos()

      if (this.$refs.chartSepSl)
        this.charts.sepSl = new Chart(this.$refs.chartSepSl, {
          type: 'doughnut',
          data: sepPedidosData,
          options: this.chartOptionsWithClick(
            'sepPedidos',
            this.$refs.chartSepSl
          ),
        })
      if (this.$refs.chartSepStatus)
        this.charts.sepStatus = new Chart(this.$refs.chartSepStatus, {
          type: 'doughnut',
          data: sepStatusData,
          options: this.chartOptionsWithClick(
            'sepStatus',
            this.$refs.chartSepStatus
          ),
        })
      if (this.$refs.chartExpSl)
        this.charts.expSl = new Chart(this.$refs.chartExpSl, {
          type: 'doughnut',
          data: expPedidosData,
          options: this.chartOptionsWithClick(
            'expPedidos',
            this.$refs.chartExpSl
          ),
        })
      if (this.$refs.chartExpStatus)
        this.charts.expStatus = new Chart(this.$refs.chartExpStatus, {
          type: 'doughnut',
          data: expStatusData,
          options: this.chartOptionsWithClick(
            'expStatus',
            this.$refs.chartExpStatus
          ),
        })
      if (this.$refs.chartVolumesProntos)
        this.charts.volumesProntos = new Chart(this.$refs.chartVolumesProntos, {
          type: 'doughnut',
          data: volumesProntosData,
          options: this.chartOptionsSomenteLeitura(
            this.$refs.chartVolumesProntos
          ),
        })
    },
    chartDataSepPedidos() {
      const s = this.displayStatsSeparacao.sepPedidos
      return {
        labels: ['D+0', 'Pendente', 'D+1', 'D+2', 'Antecipado', 'OUT'],
        datasets: [
          {
            data: [
              s.d0 || 0,
              s.pendente || 0,
              s.d1 || 0,
              s.d2 || 0,
              s.antecipado || 0,
              s.out || 0,
            ],
            backgroundColor: [
              COLORS.d0,
              COLORS.pendente,
              COLORS.d1,
              COLORS.d2,
              COLORS.antecipado,
              COLORS.out,
            ],
            borderWidth: 0,
          },
        ],
      }
    },
    chartDataSepStatus() {
      const s = this.displayStatsSeparacao.sepStatus
      return {
        labels: [
          'Pendente / No Prazo',
          'Pendente / Fora do Prazo',
          'No Prazo',
          'Fora do Prazo',
        ],
        datasets: [
          {
            data: [
              s.pendenteNoPrazo || 0,
              s.pendenteFora || 0,
              s.noPrazo || 0,
              s.foraPrazo || 0,
            ],
            backgroundColor: [
              COLORS.pendenteNoPrazo,
              COLORS.pendenteFora,
              COLORS.noPrazo,
              COLORS.foraPrazo,
            ],
            borderWidth: 0,
          },
        ],
      }
    },
    chartDataExpPedidos() {
      const s = this.displayStatsExpedicao.expPedidos
      return {
        labels: ['Pendente', 'D+0', 'D+1', 'D+2', 'Antecipado', 'OUT'],
        datasets: [
          {
            data: [
              s.pendente || 0,
              s.d0 || 0,
              s.d1 || 0,
              s.d2 || 0,
              s.antecipado || 0,
              s.out || 0,
            ],
            backgroundColor: [
              COLORS.pendente,
              COLORS.d0,
              COLORS.d1,
              COLORS.d2,
              COLORS.antecipado,
              COLORS.out,
            ],
            borderWidth: 0,
          },
        ],
      }
    },
    chartDataExpStatus() {
      const s = this.displayStatsExpedicao.expStatus
      return {
        labels: [
          'Pendente / No Prazo',
          'Pendente / Fora do Prazo',
          'No Prazo',
          'Fora do Prazo',
        ],
        datasets: [
          {
            data: [
              s.pendenteNoPrazo || 0,
              s.pendenteFora || 0,
              s.noPrazo || 0,
              s.foraPrazo || 0,
            ],
            backgroundColor: [
              COLORS.pendenteNoPrazo,
              COLORS.pendenteFora,
              COLORS.noPrazo,
              COLORS.foraPrazo,
            ],
            borderWidth: 0,
          },
        ],
      }
    },
    chartDataVolumesProntos() {
      const total = Math.max(0, Number(this.totalVolumesProntos) || 0)
      if (total <= 0) {
        return {
          labels: ['Sem volumes'],
          datasets: [
            {
              data: [1],
              backgroundColor: [COLORS.volumesProntosEmpty],
              borderWidth: 0,
            },
          ],
        }
      }
      return {
        labels: ['Volumes no período'],
        datasets: [
          {
            data: [total],
            backgroundColor: [COLORS.volumesProntos],
            borderWidth: 0,
          },
        ],
      }
    },
    destroyCharts() {
      if (this.charts.rejeicaoEvolucao) {
        this.rejeicaoBarCanvasLabels = []
        this.charts.rejeicaoEvolucao.destroy()
        this.charts.rejeicaoEvolucao = null
      }
      if (this.$el && typeof this.$el.querySelectorAll === 'function') {
        this.$el
          .querySelectorAll('.bi-sla-donut-tooltip-html')
          .forEach(n => n.remove())
      }
      Object.values(this.charts).forEach(c => c && c.destroy && c.destroy())
      this.charts = {}
    },
    updateRejeicaoBarLabels(chart) {
      if (!chart) {
        this.rejeicaoBarCanvasLabels = []
        return
      }
      const items = []
      chart.data.datasets.forEach((dataset, i) => {
        const meta = chart.getDatasetMeta(i)
        if (meta.hidden) return
        const fill =
          typeof dataset.borderColor === 'string'
            ? dataset.borderColor
            : i === 0
              ? '#ffc107'
              : '#00FFAA'
        meta.data.forEach((bar, index) => {
          const value = dataset.data[index]
          if (value == null || value === '') return
          items.push({
            key: `${i}-${index}`,
            text: String(value),
            x: bar.x,
            y: bar.y - 4,
            fill,
          })
        })
      })
      this.rejeicaoBarCanvasLabels = items
    },
    renderRejeicaoCharts() {
      if (this.charts.rejeicaoEvolucao) {
        this.rejeicaoBarCanvasLabels = []
        this.charts.rejeicaoEvolucao.destroy()
        this.charts.rejeicaoEvolucao = null
      }
      const labels = this.rejeicaoPorArmazemLabels
      const data = this.rejeicaoPorArmazemData
      if (!this.$refs.chartRejeicaoEvolucao) return
      if (!labels.length) {
        this.rejeicaoBarCanvasLabels = []
        return
      }
      const textColor = this.biTheme === 'light' ? '#5a6c7d' : '#8B8E94'
      const isFs = this.biTvLayout
      const chartFontSize = isFs ? 30 : 17
      const vm = this
      this.charts.rejeicaoEvolucao = new Chart(
        this.$refs.chartRejeicaoEvolucao,
        {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                label: 'Pedidos rejeitados',
                data: data.map(d => d.totalPedidos),
                backgroundColor: 'rgba(255, 193, 7, 0.7)',
                borderColor: '#ffc107',
                borderWidth: 1,
              },
              {
                label: 'Clientes com rejeição',
                data: data.map(d => d.totalClientes),
                backgroundColor: 'rgba(0, 255, 170, 0.7)',
                borderColor: '#00FFAA',
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            layout: {
              padding: {
                top: isFs ? 44 : 32,
                right: 20,
                bottom: isFs ? 32 : 24,
                left: 14,
              },
            },
            datasets: {
              bar: {
                maxBarThickness: isFs ? 96 : 72,
                categoryPercentage: 0.72,
                barPercentage: 0.9,
              },
            },
            onResize(chart) {
              vm.updateRejeicaoBarLabels(chart)
            },
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  font: { size: chartFontSize },
                  padding: isFs ? 28 : 20,
                  boxWidth: isFs ? 22 : 16,
                  boxHeight: isFs ? 22 : 16,
                },
              },
              biAgBarValueLabels: { display: false },
              biAgCompareCdLabels: false,
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: {
                  color: textColor,
                  maxRotation: 45,
                  minRotation: 0,
                  font: { size: chartFontSize },
                },
              },
              y: {
                display: false,
                beginAtZero: true,
                min: 0,
                grace: '12%',
              },
            },
          },
        }
      )
      const chartRef = this.charts.rejeicaoEvolucao
      vm.updateRejeicaoBarLabels(chartRef)
      /* Layout/DPR: uma segunda passagem alinha rótulos ao meta definitivo do Chart.js. */
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          vm.updateRejeicaoBarLabels(chartRef)
        })
      })
    },
    truncate(s, max = 25) {
      if (!s) return '-'
      const str = String(s).trim()
      return str.length > max ? str.slice(0, max) + '...' : str
    },
    formatCNPJ(cnpj) {
      if (!cnpj) return ''
      const n = String(cnpj).replace(/\D/g, '')
      if (n.length < 14) return cnpj
      return n.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
      )
    },
    formatarNumero(n) {
      return (Number(n) || 0).toLocaleString('pt-BR')
    },
    truncarMotivo(texto, max = 60) {
      const s = String(texto || '').trim()
      if (!s) return '—'
      if (s.length <= max) return s
      return s.slice(0, max) + '…'
    },
    /** Fallback: extrai motivos do campo rejeicao quando bi-motivos retorna vazio. */
    extrairMotivosFallback(dados) {
      const countByMotivo = {}
      ;(dados || []).forEach(r => {
        const motivo = (r.rejeicao || '').trim() || '(sem motivo)'
        countByMotivo[motivo] = (countByMotivo[motivo] || 0) + 1
      })
      return Object.entries(countByMotivo)
        .map(([motivo, count]) => ({ motivo, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    },
    formatarDecimal(n) {
      return (Number(n) || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    },
    /** Inteiros (paletes, unidades, headcount) — sem casas decimais. */
    formatarInteiroBr(n) {
      const x = Number(n)
      if (!Number.isFinite(x)) return '0'
      return Math.round(x).toLocaleString('pt-BR', {
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      })
    },
    /** Eixo Y de gráficos de custo: compacto + prefixo R$ (pt-BR). */
    formatarMoedaEixoCompacta(v) {
      const n = Number(v)
      if (!Number.isFinite(n)) return ''
      const compact = n.toLocaleString('pt-BR', {
        notation: 'compact',
        compactDisplay: 'short',
      })
      return `R$ ${compact}`
    },
    /** Eixo Y custo no gráfico Armazéns: R$ 500K, R$ 1,5M (K = milhares, M = milhões). */
    formatarMoedaEixoM(v) {
      const n = Number(v)
      if (!Number.isFinite(n)) return ''
      const abs = Math.abs(n)
      if (abs >= 1e6) {
        const m = n / 1e6
        const whole = Math.round(m)
        if (Math.abs(m - whole) < 1e-4) return `R$ ${whole}M`
        const rounded = Math.round(m * 10) / 10
        return `R$ ${String(rounded).replace('.', ',')}M`
      }
      if (abs >= 1e3) {
        const k = n / 1e3
        const wholeK = Math.round(k)
        if (Math.abs(wholeK) >= 1000) {
          const m = n / 1e6
          const rounded = Math.round(m * 10) / 10
          return `R$ ${String(rounded).replace('.', ',')}M`
        }
        if (Math.abs(k - wholeK) < 1e-3) return `R$ ${wholeK}K`
        const rounded = Math.round(k * 10) / 10
        return `R$ ${String(rounded).replace('.', ',')}K`
      }
      return `R$ ${n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
    },
    /** Eixo Y volume (paletes / unidades): 46K, 12M; mesma regra K/M que a moeda, sem prefixo R$. */
    formatarVolumeEixoM(v) {
      const n = Number(v)
      if (!Number.isFinite(n)) return ''
      const abs = Math.abs(n)
      if (abs >= 1e6) {
        const m = n / 1e6
        const whole = Math.round(m)
        if (Math.abs(m - whole) < 1e-4) return `${whole}M`
        const rounded = Math.round(m * 10) / 10
        return `${String(rounded).replace('.', ',')}M`
      }
      if (abs >= 1e3) {
        const k = n / 1e3
        const wholeK = Math.round(k)
        if (Math.abs(wholeK) >= 1000) {
          const m = n / 1e6
          const rounded = Math.round(m * 10) / 10
          return `${String(rounded).replace('.', ',')}M`
        }
        if (Math.abs(k - wholeK) < 1e-3) return `${wholeK}K`
        const rounded = Math.round(k * 10) / 10
        return `${String(rounded).replace('.', ',')}K`
      }
      return n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
    },
    formatDateTime(d) {
      if (!d) return '-'
      return new Date(d).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
    formatDate(d) {
      if (!d) return '-'
      return new Date(d).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    },
    getSlaLabel(p) {
      return p.sla || 'D+0'
    },
    /**
     * SLA de Separação (baseado na data real da separação vs inicio_sla):
     * - Separado antes do início do SLA → Antecipado
     * - Separado no mesmo dia do inicio_sla → D+0
     * - Separado 1 dia depois do inicio_sla → D+1
     * - Separado 2 dias depois → D+2; 3+ dias → OUT
     * - Não separado → Pendente
     */
    getSlaSeparacao(p) {
      const inicioSla = p.inicio_sla ? new Date(p.inicio_sla) : null
      const separado = p.separado ? new Date(p.separado) : null
      if (!separado || isNaN(separado.getTime())) return 'Pendente'
      if (!inicioSla || isNaN(inicioSla.getTime())) return 'D+0'

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
      const diffMs = diaSep.getTime() - diaInicio.getTime()
      const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000))

      if (diffDays < 0) return 'Antecipado'
      if (diffDays === 0) return 'D+0'
      if (diffDays === 1) return 'D+1'
      if (diffDays === 2) return 'D+2'
      return 'OUT'
    },
    /**
     * SLA de Expedição realizado (data real da expedição vs limite), alinhado à coluna EXPEDIÇÃO e ao status:
     * - Com data de expedição válida: Antecipado / D+0 / D+1 / D+2 / OUT (mesmo se sit_fase ainda não for Emb. Conf.)
     * - Sem expedição: Pendente; fora de Emb. Conf. também Pendente (ainda não na etapa de expedição com data própria)
     */
    getSlaExpedicao(p) {
      const limite = p.limite ? new Date(p.limite) : null
      const expedido = p.expedido ? new Date(p.expedido) : null
      const temExpedido = expedido && !isNaN(expedido.getTime())

      if (temExpedido) {
        if (!limite || isNaN(limite.getTime())) return 'D+0'
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
        const diffMs = diaExp.getTime() - diaLimite.getTime()
        const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000))
        if (diffDays < 0) return 'Antecipado'
        if (diffDays === 0) return 'D+0'
        if (diffDays === 1) return 'D+1'
        if (diffDays === 2) return 'D+2'
        return 'OUT'
      }

      return 'Pendente'
    },
    /** Situação (sit_fase) Emb. Conf. — a partir daqui o SLA realizado de expedição usa data de expedição vs limite. */
    isSituacaoEmbConf(p) {
      if (!p) return false
      const norm = String(p.situacao || '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, ' ')
      return norm === 'EMB. CONF.'
    },
    pedidoTemSeparacaoRegistrada(p) {
      if (!p || p.separado == null || p.separado === false) return false
      const d = p.separado instanceof Date ? p.separado : new Date(p.separado)
      return !isNaN(d.getTime())
    },
    /** Vol. para acompanhamento/coleta: pendentes de embarque OU com data de separação válida. */
    pedidoContabilizaVolumesProntos(p) {
      if (!p) return false
      if (this.pedidoTemSeparacaoRegistrada(p)) return true
      return !this.isSituacaoEmbConf(p)
    },
    /**
     * Número central dos donuts SLA: total de pedidos na base do gráfico (integrados no período
     * + fatia selecionada), alinhado às fatias e aos %.
     */
    slaDonutCenterCount() {
      return (this.pedidosBaseGraficosSla || []).length
    },
    applyChartFilter(chartId, label) {
      if (
        this.chartFilter &&
        this.chartFilter.chart === chartId &&
        this.chartFilter.value === label
      ) {
        this.chartFilter = null
      } else {
        this.chartFilter = { chart: chartId, value: label }
      }
    },
    toggleMostrarCalendarioBi() {
      this.mostrarCalendario = !this.mostrarCalendario
      if (this.mostrarCalendario && this.biSubTab === 'armazens') {
        this.$nextTick(() => this.syncArmazensCalSelectsFromDatas())
      }
    },
    syncArmazensCalSelectsFromDatas() {
      const yMax = new Date().getFullYear()
      const clampAno = a => Math.min(Math.max(ANO_MIN_REF_ARMAZENS_BI, a), yMax)
      const pi = parseIsoDataParaMesAno(this.dataInicio)
      const pf = parseIsoDataParaMesAno(this.dataFim)
      if (pi) {
        this.armazensCalMesIni = pi.mes
        this.armazensCalAnoIni = clampAno(pi.ano)
      }
      if (pf) {
        this.armazensCalMesFim = pf.mes
        this.armazensCalAnoFim = clampAno(pf.ano)
      }
    },
    getHojeCalendario() {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      return d
    },
    toISOCalendario(d) {
      return d.toISOString().slice(0, 10)
    },
    /** YYYY-MM-DD no fuso local (evita deslocamento UTC de toISOString). */
    isoDateLocal(d) {
      if (!(d instanceof Date) || Number.isNaN(d.getTime())) return ''
      const y = d.getFullYear()
      const mo = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${mo}-${day}`
    },
    /**
     * 1º dia do mês da data inicial × último dia do mês da data final (ordem corrigida se invertida).
     * Usado na Análise Armazéns (custos por ref. mensal).
     */
    normalizarPeriodoMesesInteirosArmazens(isoIni, isoFim) {
      const parse = iso => {
        const x = String(iso || '')
          .trim()
          .match(/^(\d{4})-(\d{2})-(\d{2})$/)
        if (!x) return null
        return { y: parseInt(x[1], 10), m: parseInt(x[2], 10) - 1 }
      }
      let a = parse(isoIni)
      let b = parse(isoFim)
      if (!a && !b) return null
      if (!a) a = { ...b }
      if (!b) b = { ...a }
      let y1 = a.y
      let m1 = a.m
      let y2 = b.y
      let m2 = b.m
      const t1 = y1 * 12 + m1
      const t2 = y2 * 12 + m2
      if (t1 > t2) {
        const ty = y1
        const tm = m1
        y1 = y2
        m1 = m2
        y2 = ty
        m2 = tm
      }
      y1 = Math.max(ANO_MIN_REF_ARMAZENS_BI, y1)
      y2 = Math.max(ANO_MIN_REF_ARMAZENS_BI, y2)
      const yAtual = new Date().getFullYear()
      y1 = Math.min(y1, yAtual)
      y2 = Math.min(y2, yAtual)
      {
        const ta = y1 * 12 + m1
        const tb = y2 * 12 + m2
        if (ta > tb) {
          const ty = y1
          const tm = m1
          y1 = y2
          m1 = m2
          y2 = ty
          m2 = tm
        }
      }
      const dIni = new Date(y1, m1, 1)
      const dFim = new Date(y2, m2 + 1, 0)
      return {
        ini: this.isoDateLocal(dIni),
        fim: this.isoDateLocal(dFim),
      }
    },
    /**
     * Ajusta dataInicio/dataFim para meses completos na aba Armazéns.
     * @returns {boolean} se as datas foram alteradas
     */
    normalizarPeriodoArmazensMesesInteiros(opts = {}) {
      if (this.biSubTab !== 'armazens') return false
      const n = this.normalizarPeriodoMesesInteirosArmazens(
        this.dataInicio,
        this.dataFim
      )
      if (!n || !n.ini || !n.fim) return false
      let mudou = false
      if (n.ini !== this.dataInicio || n.fim !== this.dataFim) {
        this.dataInicio = n.ini
        this.dataFim = n.fim
        this.syncDataDisplayFromModel()
        mudou = true
      }
      if (opts.ajustarPreset) {
        if (!PRESET_ATIVO_ARMAZENS_VALIDOS.has(this.presetAtivo)) {
          this.presetAtivo = 'este_mes'
        }
      }
      return mudou
    },
    formatarDataCalendario(iso) {
      if (!iso) return ''
      const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/)
      return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
    },
    formatarDataLimite(iso) {
      if (!iso) return '—'
      return this.formatarDataCalendario(iso)
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
    },
    onDataFimInput(e) {
      const formatado = this.formatarParaInputCalendario(e.target.value)
      e.target.value = formatado
      this.dataFimDisplay = formatado
      this.dataFim = this.parseDDMMYYYY(formatado)
    },
    aplicarPresetCalendario(id) {
      if (id === 'customizar' && this.biSubTab === 'armazens') {
        this.presetAtivo = 'customizar'
        this.syncArmazensCalSelectsFromDatas()
        this.userHasSelectedInterval = true
        return
      }
      if (
        id === 'ano_anterior' &&
        this.biSubTab === 'armazens' &&
        this.getHojeCalendario().getFullYear() - 1 < ANO_MIN_REF_ARMAZENS_BI
      ) {
        return
      }
      this.presetAtivo = id
      const hoje = this.getHojeCalendario()
      let ini = ''
      let fim = ''
      switch (id) {
        case 'este_ano': {
          const yUso = Math.max(ANO_MIN_REF_ARMAZENS_BI, hoje.getFullYear())
          ini = `${yUso}-01-01`
          fim = this.isoDateLocal(new Date(yUso, 12, 0))
          break
        }
        case 'ano_anterior': {
          const y = hoje.getFullYear() - 1
          ini = `${y}-01-01`
          fim = this.isoDateLocal(new Date(y, 12, 0))
          break
        }
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
      if (this.biSubTab === 'armazens') {
        const n = this.normalizarPeriodoMesesInteirosArmazens(ini, fim)
        if (n && n.ini && n.fim) {
          ini = n.ini
          fim = n.fim
        }
      }
      this.dataInicio = ini
      this.dataFim = fim
      this.userHasSelectedInterval = true
      this.mostrarCalendario = false
      if (this.biSubTab === 'armazens') {
        this.syncArmazensCalSelectsFromDatas()
        this.carregarArmazensTotalUnidades()
        this.carregarArmazensTotalPosicoesPaletes()
        this.carregarArmazensFaturaLegadoResumoPeriodo()
        this.carregarArmazensDadosClienteResumo()
        this.carregarArmazensCustoTotalOperacao()
        this.carregarArmazensCustoTotalPpItens()
        this.carregarArmazensQuadroFuncionarios()
        this.carregarArmazensEvolucaoMensal()
      } else this.loadSlaData()
    },
    aplicarIntervaloCalendario(opts = {}) {
      this.userHasSelectedInterval = true
      this.mostrarCalendario = false
      if (this.biSubTab === 'armazens') {
        let m1 = Number(this.armazensCalMesIni)
        let y1 = Number(this.armazensCalAnoIni)
        let m2 = Number(this.armazensCalMesFim)
        let y2 = Number(this.armazensCalAnoFim)
        if (
          !Number.isFinite(m1) ||
          !Number.isFinite(y1) ||
          !Number.isFinite(m2) ||
          !Number.isFinite(y2) ||
          m1 < 1 ||
          m1 > 12 ||
          m2 < 1 ||
          m2 > 12
        ) {
          this.syncArmazensCalSelectsFromDatas()
        } else {
          const t1 = y1 * 12 + m1 - 1
          const t2 = y2 * 12 + m2 - 1
          if (t1 > t2) {
            const tm = m1
            const ty = y1
            m1 = m2
            y1 = y2
            m2 = tm
            y2 = ty
            this.armazensCalMesIni = m1
            this.armazensCalAnoIni = y1
            this.armazensCalMesFim = m2
            this.armazensCalAnoFim = y2
          }
          this.dataInicio = this.isoDateLocal(new Date(y1, m1 - 1, 1))
          this.dataFim = this.isoDateLocal(new Date(y2, m2, 0))
        }
        this.syncDataDisplayFromModel()
        if ('presetMarcador' in opts) {
          this.presetAtivo = opts.presetMarcador
        } else {
          this.presetAtivo = 'customizar'
        }
        this.carregarArmazensTotalUnidades()
        this.carregarArmazensTotalPosicoesPaletes()
        this.carregarArmazensFaturaLegadoResumoPeriodo()
        this.carregarArmazensDadosClienteResumo()
        this.carregarArmazensCustoTotalOperacao()
        this.carregarArmazensCustoTotalPpItens()
        this.carregarArmazensQuadroFuncionarios()
        this.carregarArmazensEvolucaoMensal()
      } else this.loadSlaData()
    },
    limparIntervaloCalendario() {
      const hoje = this.getHojeCalendario()
      const y =
        this.biSubTab === 'armazens'
          ? Math.max(ANO_MIN_REF_ARMAZENS_BI, hoje.getFullYear())
          : hoje.getFullYear()
      this.dataInicio = `${y}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
      this.dataFim = this.isoDateLocal(new Date(y, hoje.getMonth() + 1, 0))
      this.presetAtivo = 'este_mes'
      this.userHasSelectedInterval = false
      this.mostrarCalendario = false
      if (this.biSubTab === 'armazens') {
        this.syncArmazensCalSelectsFromDatas()
        this.carregarArmazensTotalUnidades()
        this.carregarArmazensTotalPosicoesPaletes()
        this.carregarArmazensFaturaLegadoResumoPeriodo()
        this.carregarArmazensDadosClienteResumo()
        this.carregarArmazensCustoTotalOperacao()
        this.carregarArmazensCustoTotalPpItens()
        this.carregarArmazensQuadroFuncionarios()
        this.carregarArmazensEvolucaoMensal()
      } else this.loadSlaData()
    },
    irParaHojeCalendario() {
      if (this.biSubTab === 'armazens') {
        const h = this.getHojeCalendario()
        const hy = Math.max(ANO_MIN_REF_ARMAZENS_BI, h.getFullYear())
        const ini = new Date(hy, h.getMonth(), 1)
        const fim = new Date(hy, h.getMonth() + 1, 0)
        this.dataInicio = this.isoDateLocal(ini)
        this.dataFim = this.isoDateLocal(fim)
        this.armazensCalMesIni = h.getMonth() + 1
        this.armazensCalAnoIni = Math.min(
          Math.max(ANO_MIN_REF_ARMAZENS_BI, h.getFullYear()),
          new Date().getFullYear()
        )
        this.armazensCalMesFim = h.getMonth() + 1
        this.armazensCalAnoFim = Math.min(
          Math.max(ANO_MIN_REF_ARMAZENS_BI, h.getFullYear()),
          new Date().getFullYear()
        )
        this.presetAtivo = 'este_mes'
        this.syncDataDisplayFromModel()
        this.carregarArmazensTotalUnidades()
        this.carregarArmazensTotalPosicoesPaletes()
        this.carregarArmazensFaturaLegadoResumoPeriodo()
        this.carregarArmazensDadosClienteResumo()
        this.carregarArmazensCustoTotalOperacao()
        this.carregarArmazensCustoTotalPpItens()
        this.carregarArmazensQuadroFuncionarios()
        this.carregarArmazensEvolucaoMensal()
        return
      }
      this.dataInicio = this.toISOCalendario(this.getHojeCalendario())
      this.dataFim = this.toISOCalendario(this.getHojeCalendario())
    },
    adicionarCliente(c) {
      const nome =
        c && (c.nome_cliente || c.nome_reduzido)
          ? String(c.nome_cliente || c.nome_reduzido).trim()
          : ''
      if (!nome) return
      const noSeq = c && c.no_seq != null ? c.no_seq : null
      const jaExiste = this.filtroClientes.some(
        x => (typeof x === 'object' ? x.nome : x) === nome
      )
      if (jaExiste) return
      this.filtroClientes = [...this.filtroClientes, { nome, no_seq: noSeq }]
      this.filtroCliente = ''
      this.mostrarClienteDropdown = false
    },
    removerCliente(index) {
      this.filtroClientes = this.filtroClientes.filter((_, i) => i !== index)
    },
    onClienteFocus() {
      this.mostrarClienteDropdown = true
      this.buscarClientes()
    },
    onClienteInput() {
      this.mostrarClienteDropdown = true
      if (this._clientesBuscaTimer) clearTimeout(this._clientesBuscaTimer)
      this._clientesBuscaTimer = setTimeout(() => this.buscarClientes(), 300)
    },
    async buscarClientes() {
      const busca = (this.filtroCliente || '').trim()
      if (!busca) {
        this.clientesBuscaResultados = []
        return
      }
      this.clientesBuscaLoading = true
      try {
        const params = { busca }
        if (this.showFiltroArmazem && this.filtroArmazens.length > 0)
          params.estabelecimento = this.filtroArmazens.join(',')
        if (this.biSubTab === 'armazens') params.armazens = '1'
        const token = localStorage.getItem('token')
        const response = await axios.get('/bi/clientes', {
          params,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (response?.data?.success) {
          this.clientesBuscaResultados = response.data.clientes || []
        } else {
          this.clientesBuscaResultados = []
        }
      } catch (err) {
        console.error('[BI] Erro ao buscar clientes:', err)
        this.clientesBuscaResultados = []
      } finally {
        this.clientesBuscaLoading = false
      }
    },
    fecharClienteDropdown() {
      this.$nextTick(() => {
        setTimeout(() => {
          this.mostrarClienteDropdown = false
        }, 150)
      })
    },
    limparFiltrosForm() {
      if (this.biSubTab === 'armazens') {
        this.filtroCliente = ''
        this.filtroClientes = []
        this.mostrarClienteDropdown = false
        this.filtroArmazens = []
        this.mostrarArmazemDropdown = false
        return
      }
      this.filtroCliente = ''
      this.filtroClientes = []
      this.mostrarClienteDropdown = false
      this.filtroArmazens = []
      this.mostrarArmazemDropdown = false
      this.filtroGerente = ''
      this.filtroAdm = ''
      this.filtroNF = ''
      this.filtroPedido = ''
      this.filtroSituacoes = []
      this.filtroNaoEmbarcados = false
      this.filtroStatusSep = ''
      this.filtroStatusExp = ''
      this.filtroSla = ''
      this.filtroTransportadora = ''
      this.filtroLimiteExpedicao = ''
      this.filtroDataSeparado = ''
    },
    toggleFiltroNaoEmbarcados() {
      this.filtroNaoEmbarcados = !this.filtroNaoEmbarcados
      if (this.filtroNaoEmbarcados) this.filtroSituacoes = []
    },
    toggleFiltroArmazem(a) {
      const idx = this.filtroArmazens.indexOf(a)
      if (idx >= 0) {
        this.filtroArmazens = this.filtroArmazens.filter(x => x !== a)
      } else {
        this.filtroArmazens = [...this.filtroArmazens, a].sort((x, y) =>
          (x || '').localeCompare(y || '', 'pt-BR')
        )
      }
    },
    toggleFiltroSituacao(s) {
      if (this.filtroNaoEmbarcados) {
        this.filtroNaoEmbarcados = false
      }
      const idx = this.filtroSituacoes.indexOf(s)
      if (idx >= 0) {
        this.filtroSituacoes = this.filtroSituacoes.filter(x => x !== s)
      } else {
        this.filtroSituacoes = [...this.filtroSituacoes, s].sort((a, b) =>
          a.localeCompare(b, 'pt-BR')
        )
      }
    },
    isSituacaoSelecionada(s) {
      if (this.filtroNaoEmbarcados) return false
      return this.filtroSituacoes.includes(s)
    },
    /** Retorna minutos desde meia-noite a partir de corte (ex: "12:00" ou objeto MySQL) */
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
    /**
     * Status de Separação (4 tipos):
     * - Pendente / No Prazo: não separado, horário atual < corte no dia do inicio_sla
     * - Pendente / Fora do Prazo: não separado, horário atual >= corte ou passou o dia
     * - No Prazo: separado dentro do dia do inicio_sla
     * - Fora do Prazo: separado fora do dia do inicio_sla
     */
    computeStatusSeparacao(p) {
      const agora = new Date()
      const inicioSla = p.inicio_sla ? new Date(p.inicio_sla) : null
      const separado = p.separado ? new Date(p.separado) : null
      const corteMin = this.parseCorteMinutes(p.corte)

      if (!inicioSla || isNaN(inicioSla.getTime())) {
        return separado ? 'No Prazo' : 'Pendente / No Prazo'
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

        if (hoje < diaInicio) return 'Pendente / No Prazo'
        if (hoje > diaInicio) return 'Pendente / Fora do Prazo'
        return horaAtualMin < corteMin
          ? 'Pendente / No Prazo'
          : 'Pendente / Fora do Prazo'
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
    /**
     * Status de Expedição (4 tipos, usando data limite):
     * - Pendente / No Prazo: não expedido, data/hora atual <= fim do dia limite
     * - Pendente / Fora do Prazo: não expedido, passou o dia limite
     * - No Prazo: expedido até o dia limite
     * - Fora do Prazo: expedido após o dia limite
     */
    computeStatusExpedicao(p) {
      const agora = new Date()
      const limite = p.limite ? new Date(p.limite) : null
      const expedido = p.expedido ? new Date(p.expedido) : null

      if (!limite || isNaN(limite.getTime())) {
        return expedido ? 'No Prazo' : 'Pendente / No Prazo'
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
        return agora <= fimLimite
          ? 'Pendente / No Prazo'
          : 'Pendente / Fora do Prazo'
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
    isForaDoPrazo(p) {
      const status = this.computeStatusExpedicao(p)
      return status === 'Pendente / Fora do Prazo' || status === 'Fora do Prazo'
    },
    /** Retorna estilo (backgroundColor, color) para pintar células conforme status.
     * sepStatus: colunas SLA até SEPARADO usam cor do Status Separação.
     * expStatus: colunas EXPEDIÇÃO até VOLUMES usam cor do Status Expedição. */
    getCellStyle(type, pedido) {
      const map = {
        'No Prazo': 'noPrazo',
        'Pendente / No Prazo': 'pendenteNoPrazo',
        'Pendente / Fora do Prazo': 'pendenteFora',
        'Fora do Prazo': 'foraPrazo',
      }
      const status =
        type === 'sepStatus'
          ? this.computeStatusSeparacao(pedido) || ''
          : this.computeStatusExpedicao(pedido) || ''
      const colorKey = map[status] || ''
      if (!colorKey || !TABLE_STATUS_COLORS[colorKey]) return {}
      const hex = TABLE_STATUS_COLORS[colorKey]
      /* Cores vivas: hex 100% opaco, intensidade total. Texto branco em vermelhos, escuro em verdes/rosa. */
      const needsWhiteText = ['foraPrazo', 'pendenteFora'].includes(colorKey)
      return {
        backgroundColor: hex,
        color: needsWhiteText ? '#ffffff' : '#0d0d0d',
        fontWeight: 600,
      }
    },
    mapStatusToSituacao(status) {
      if (!status) return '-'
      const s = String(status).toUpperCase()
      const map = {
        INTEGRADO: 'EM DIGITACAO',
        SEPARANDO: 'A SEPARAR',
        SEPARADO: 'SEPARADO',
        EMBARCADO: 'EMBARCADO',
      }
      return map[s] || status || '-'
    },
    mapStatusSep(status) {
      if (!status) return 'Pendente'
      const s = String(status).toLowerCase()
      if (s.includes('embarcado')) return 'Concluído'
      if (s.includes('separado')) return 'Separado'
      if (s.includes('separando')) return 'Em andamento'
      return 'Pendente'
    },
    mapStatusSepDetalhe(status) {
      if (!status) return 'Pendente / No Prazo'
      const s = String(status).toLowerCase()
      if (s.includes('fora') || s.includes('out'))
        return 'Pendente / Fora do Prazo'
      if (s.includes('embarcado') || s.includes('separado')) return 'No Prazo'
      return 'Pendente / No Prazo'
    },
    mapStatusExp(status) {
      if (!status) return 'Pendente'
      const s = String(status).toLowerCase()
      if (s.includes('embarcado')) return 'Embarcado'
      return 'Pendente'
    },
    mapStatusExpDetalhe(status) {
      if (!status) return 'Pendente / No Prazo'
      const s = String(status).toLowerCase()
      if (s.includes('fora') || s.includes('out')) return 'Fora do Prazo'
      if (s.includes('embarcado')) return 'No Prazo'
      return 'Pendente / No Prazo'
    },
  },
}
</script>

<style scoped>
.bi-page {
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  flex: 1 1 auto;
  min-height: min(100%, calc(100vh - 88px));
  background: #202326;
  color: #ffffff;
  /* Laterais enxutas: mais largura útil para grelha e gráficos (o content-area-bi também reduz o padding). */
  padding: 1.5rem clamp(0.4rem, 1.2vw, 0.9rem);
  box-sizing: border-box;
  font-family: inherit;
}

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
  justify-content: center;
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

.bi-data-ready-overlay {
  cursor: pointer;
}

.bi-overlay-fade-enter-active,
.bi-overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}
.bi-overlay-fade-enter-from,
.bi-overlay-fade-leave-to {
  opacity: 0;
}

.bi-page.bi-fullscreen {
  min-height: 100vh;
  height: 100%;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}
/** Armazéns em tela cheia: rolagem vertical + gráfico com altura mínima maior (eixo X visível). */
.bi-page.bi-fullscreen:has(.bi-armazens-content) {
  max-height: 100vh;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  /* Respiro no topo: título grande + sombra não encostam no limite do viewport */
  padding: 1.35rem 1rem 1rem;
}
/**
 * Tela cheia: altura = conteúdo (sem comprimir no viewport). A rolagem fica no `.bi-page`;
 * não usar flex-grow no filho, senão o flex-shrink esprema os gráficos e o texto sobrepõe.
 */
.bi-page.bi-fullscreen:has(.bi-armazens-content) .bi-armazens-content {
  flex: 0 0 auto;
  min-height: auto;
  display: flex;
  flex-direction: column;
  max-width: none;
  width: 100%;
  box-sizing: border-box;
  padding-bottom: 2.5rem;
  gap: 0;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content)
  .bi-armazens-section--evolucao {
  flex: 0 0 auto;
  min-height: auto;
  display: flex;
  flex-direction: column;
  margin-bottom: 2.5rem;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content)
  .bi-armazens-section--recomendadas {
  margin-top: 0;
  padding-top: 0.75rem;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content) .bi-armazens-section-lead,
.bi-page.bi-fullscreen:has(.bi-armazens-content)
  .bi-armazens-section-lead--muted {
  max-width: none;
}

/** Análise Armazéns em tela cheia: tipografia maior para leitura à distância. */
.bi-page.bi-fullscreen:has(.bi-armazens-content) .bi-armazens-section-title {
  font-size: 1.2rem;
  margin-bottom: 0.85rem;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content) .bi-armazens-section-lead {
  font-size: 1.35rem;
  margin-bottom: 1.1rem;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content)
  .bi-armazens-section-lead--muted {
  font-size: 1.18rem;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content) .bi-armazens-evolucao-erro {
  font-size: 1.2rem;
  padding: 1.15rem 1.35rem;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content) .bi-armazens-composicao-erro {
  font-size: 1.12rem;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content) .bi-armazens-chart-title {
  font-size: 1.35rem;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content) .bi-armazens-chart-sub {
  font-size: 1.12rem;
  margin-bottom: 1.1rem;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content) .bi-armazens-chart-foot {
  font-size: 1.05rem;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content) .bi-armazens-chart-overlay {
  font-size: 2rem;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content) .bi-armazens-chart-card {
  padding: 1.35rem 1.6rem;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content) .bi-armazens-card {
  padding: 1.15rem 1.2rem;
  gap: 0.5rem;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content) .bi-armazens-card-titulo {
  font-size: 1.12rem;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content) .bi-armazens-card-icon {
  font-size: 1.35rem;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content) .bi-armazens-card-valor {
  font-size: 2.55rem;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content)
  .bi-armazens-card-valor
  .bi-armazens-card-unidade {
  font-size: 1.35rem;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content) .bi-armazens-card-legenda {
  font-size: 1.02rem;
}
/* Barra de ferramentas: alinhada ao mesmo patamar do rótulo da aba */
.bi-page.bi-fullscreen:has(.bi-armazens-content) .btn-abrir-calendario-bi {
  min-height: 48px;
  height: 48px;
  padding: 0 1.15rem;
  font-size: 1.3rem;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content) .update-info,
.bi-page.bi-fullscreen:has(.bi-armazens-content) .bi-countdown {
  font-size: 1.25rem;
  padding: 0.4rem 0.65rem;
}
/**
 * BI embutido no Painel (fullscreen do documento no ancestral): evitar `min-height: 100vh`,
 * que é maior que o slot útil e quebra o flex — cortando paginação e “Atualizado em”.
 */
.bi-page.bi-fullscreen.bi-embed-tv {
  min-height: 0;
  height: 100%;
  max-height: 100%;
  overflow: hidden;
  box-sizing: border-box;
}
.bi-page.bi-fullscreen.bi-embed-tv .sla-face-front {
  min-height: 0;
  overflow: hidden;
}
.bi-page.bi-fullscreen .sla-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.bi-page.bi-fullscreen .sla-flipper-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.bi-page.bi-fullscreen .sla-flipper-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.bi-page.bi-fullscreen .sla-face {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
.bi-page.bi-fullscreen .sla-face .sla-cards-grid {
  flex-shrink: 0;
  grid-template-columns: repeat(auto-fit, minmax(min(380px, 100%), 1fr));
  gap: 2rem;
}
.bi-page.bi-fullscreen .sla-card {
  padding: 2rem;
}
.bi-page.bi-fullscreen .sla-card-body {
  gap: 1.5rem;
}
.bi-page.bi-fullscreen .sla-card-chart {
  width: 320px;
  height: 320px;
}
.bi-page.bi-fullscreen .sla-etapa-label {
  font-size: calc(2.5rem + 10px);
}
.bi-page.bi-fullscreen .sla-card-title {
  font-size: 2.5rem;
}
.bi-page.bi-fullscreen .sla-legend {
  font-size: 2.4rem;
  gap: 0.5rem 1rem;
  line-height: 1.35;
}
.bi-page.bi-fullscreen .sla-table-title {
  font-size: 2.5rem;
}
.bi-page.bi-fullscreen .sla-filter-badge {
  font-size: 2.5rem;
}
.bi-page.bi-fullscreen .sla-table {
  font-size: 1.5rem;
}
.bi-page.bi-fullscreen .sla-table th,
.bi-page.bi-fullscreen .sla-table td {
  padding: 0.6rem 0.8rem;
}
.bi-page.bi-fullscreen .sla-pagination-label,
.bi-page.bi-fullscreen .sla-pagination-page {
  font-size: 2.4rem;
}
.bi-page.bi-fullscreen .sla-table-pagination .update-info {
  font-size: 2.35rem;
  line-height: 1.3;
  gap: 0.65rem;
  padding: 0.5rem 0.85rem;
}
.bi-page.bi-fullscreen .empty-row {
  font-size: 2.15rem;
}
.bi-page.bi-fullscreen .sla-table-section .btn-refresh,
.bi-page.bi-fullscreen .sla-table-section .btn-pag-bi {
  font-size: 1.5rem;
  padding: 0.5rem 1rem;
}
.bi-page.bi-fullscreen .sla-filter-badge .btn-clear-filter {
  font-size: 1.5rem;
  padding: 0.25rem 0.5rem;
}
.bi-page.bi-fullscreen .sla-table-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.bi-page.bi-fullscreen .sla-table-section .sla-table-header {
  flex-shrink: 0;
}
.bi-page.bi-fullscreen .sla-table-section .sla-table-wrapper {
  flex: 1;
  /* min-height: 0 — com flex, o default (auto) usa a altura intrínseca da tabela
     e impede encolher: o wrapper “cresce” com todas as linhas e o fundo da secção fica curto. */
  min-height: 0;
  max-height: none;
}
.bi-page.bi-fullscreen .sla-table-section .sla-table-pagination {
  flex-shrink: 0;
}
/* Dashboard Rejeição em tela cheia */
.bi-page.bi-fullscreen .bi-rejeicao-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: 1.25rem clamp(1rem, 2.5vw, 2.5rem);
}
.bi-page.bi-fullscreen .bi-rejeicao-dashboard {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
.bi-page.bi-fullscreen .bi-rejeicao-dashboard-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.bi-page.bi-fullscreen .bi-rejeicao-main-with-sidebar {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  align-items: stretch;
  align-content: stretch;
  grid-template-rows: minmax(0, 1fr);
}
.bi-page.bi-fullscreen .bi-rejeicao-main-content,
.bi-page.bi-fullscreen .bi-rejeicao-sidebar {
  min-height: 0;
  height: 100%;
  overflow: hidden;
}
.bi-page.bi-fullscreen .bi-rejeicao-evolucao-wrap {
  flex-shrink: 0;
}
.bi-page.bi-fullscreen .bi-rejeicao-chart-container {
  width: 100%;
  max-width: none;
  height: clamp(300px, 42vh, 560px);
  min-height: 280px;
  flex-shrink: 0;
}
.bi-page.bi-fullscreen .bi-rejeicao-bar-label {
  font-size: 38px;
}
.bi-page.bi-fullscreen .bi-rejeicao-tabela-scroll {
  max-height: none;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.bi-page.bi-fullscreen .bi-rejeicao-table-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.bi-page.bi-fullscreen .bi-rejeicao-table-main {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* Rejeição em tela cheia: tipografia maior para leitura à distância (painel/TV) */
.bi-page.bi-fullscreen .bi-tabs-rejeicao .bi-tab-label {
  font-size: 2rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-preset-btn {
  font-size: 1.9rem;
  padding: 0.7rem 1.4rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-card-title {
  font-size: 1.85rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-card-periodo {
  font-size: 1.55rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-card-valor-grande {
  font-size: 4rem;
}
.bi-page.bi-fullscreen
  .bi-rejeicao-card-valor-grande
  .bi-rejeicao-card-unidade {
  font-size: 2rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-card-sub {
  font-size: 1.8rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-chart-filter {
  font-size: 1.8rem;
  padding: 0.6rem 1.05rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-tabela-titulo {
  font-size: 2.2rem;
  padding: 1.2rem 1.4rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-table-header .bi-rejeicao-tabela-titulo {
  padding: 0;
}
.bi-page.bi-fullscreen .bi-rejeicao-filter-btn {
  font-size: 1.85rem;
  padding: 0.7rem 1.25rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-tabela th {
  font-size: 1.85rem;
  padding: 1.1rem 1.25rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-tabela td {
  font-size: 2.1rem;
  padding: 1.1rem 1.25rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-pedidos-table th {
  font-size: 1.5rem;
  padding: 0.7rem 1rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-pedidos-table td {
  font-size: 1.65rem;
  padding: 0.65rem 1rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-pedidos-expand {
  padding-left: 3.5rem;
  max-height: 400px;
}
.bi-page.bi-fullscreen .bi-rejeicao-filtro-adm-tag {
  font-size: 0.65em;
  padding: 0.3em 0.8em;
}
.bi-page.bi-fullscreen .bi-rejeicao-sla-badge {
  font-size: 1.2em;
  padding: 0.42rem 0.85rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-badge,
.bi-page.bi-fullscreen .bi-rejeicao-badge-total {
  font-size: 1.2em;
  padding: 0.45rem 0.9rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-portfolio-num,
.bi-page.bi-fullscreen .bi-rejeicao-portfolio-nome {
  font-size: 2rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-portfolio-valor {
  font-size: 2.15rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-portfolio-sub {
  font-size: 1.65rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-motivo-item {
  font-size: 1.9rem;
  padding: 0.85rem 1.15rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-motivo-num,
.bi-page.bi-fullscreen .bi-rejeicao-motivo-count {
  font-size: 2rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-watch-btn {
  font-size: 1.75rem;
  padding: 0.65rem 1.15rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-watchlist-item {
  font-size: 1.9rem;
  padding: 0.9rem 1.1rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-watchlist-pedido {
  font-size: 1.8rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-watchlist-msg {
  font-size: 1.75rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-watchlist-badge {
  font-size: 1.6rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-metrica-vazio {
  font-size: 1.9rem;
}
.bi-page.bi-fullscreen .btn-refresh-bi-rej {
  font-size: 1.9rem;
  padding: 0.85rem 1.6rem;
}
.bi-page.bi-fullscreen .bi-rejeicao-update {
  font-size: 1.8rem;
}

/* Face traseira (SLA-GERAL): altura fixa e overflow para o wrapper da tabela poder rolar */
.bi-page.bi-fullscreen .sla-face-back {
  height: 100%;
  max-height: 100%;
  overflow: hidden;
}
.bi-page.bi-fullscreen .sla-face-back .sla-table-wrapper {
  overflow-y: auto;
  overflow-x: auto;
}
/* Ao sair da tela cheia: resetar layout para o container da tabela voltar ao tamanho normal */
.bi-page:not(.bi-fullscreen) .sla-content,
.bi-page:not(.bi-fullscreen) .sla-flipper-wrapper,
.bi-page:not(.bi-fullscreen) .sla-face,
.bi-page:not(.bi-fullscreen) .sla-table-section {
  flex: none;
  min-height: auto;
  height: auto;
}
/**
 * Fora da tela cheia: flipper em grid com as duas faces na mesma célula.
 * Assim a altura do bloco é max(frente, verso). Com position:absolute no verso,
 * só a frente definia altura — ao filtrar a frente encolhia, o verso “vazava”
 * (overflow-y: visible) e aparecia fundo branco atrás da lista.
 */
.bi-page:not(.bi-fullscreen) .sla-flipper-wrapper {
  background: #202326;
  border-radius: 18px;
}
.bi-page:not(.bi-fullscreen) .sla-flipper-inner {
  flex: none;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  min-height: 320px;
  height: auto;
  background: #202326;
  border-radius: 18px;
}
.bi-page:not(.bi-fullscreen) .sla-flipper-inner > .sla-face-front,
.bi-page:not(.bi-fullscreen) .sla-flipper-inner > .sla-face-back {
  grid-column: 1;
  grid-row: 1;
  align-self: start;
  justify-self: stretch;
  width: 100%;
  max-width: 100%;
}
.bi-page.bi-theme-light:not(.bi-fullscreen) .sla-flipper-inner,
.bi-page.bi-theme-light:not(.bi-fullscreen) .sla-flipper-wrapper {
  background: var(--gray-50);
}
.bi-page:not(.bi-fullscreen) .sla-table-section .sla-table-wrapper {
  flex: none;
  min-height: 0;
  max-height: min(60vh, 520px);
  height: auto;
}
.bi-page:not(.bi-fullscreen) .sla-face-back {
  position: relative;
  top: auto;
  left: auto;
  min-height: 0;
  height: auto;
  max-height: none;
  overflow-x: clip;
  overflow-y: hidden;
}
/* Duas faces na mesma célula: a traseira vem depois no DOM e ficava por cima;
   o miolo transparente do Chart.js deixava vazar totais da face de trás. */
.bi-page:not(.bi-fullscreen)
  .sla-flipper-inner:not(.flipped)
  > .sla-face-front {
  z-index: 2;
}
.bi-page:not(.bi-fullscreen) .sla-flipper-inner:not(.flipped) > .sla-face-back {
  z-index: 1;
}
.bi-page:not(.bi-fullscreen) .sla-flipper-inner.flipped > .sla-face-front {
  z-index: 1;
}
.bi-page:not(.bi-fullscreen) .sla-flipper-inner.flipped > .sla-face-back {
  z-index: 2;
}
.bi-expand-btn {
  margin-left: 0;
}

.bi-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
  min-height: 3rem;
  padding: 0.5rem 0;
  z-index: 10;
  overflow: visible;
}
/* Com subtítulo: layout em fluxo (não absoluto) para o bloco crescer com vários armazéns em2+ linhas sem cortar o topo */
.bi-header:has(.bi-header-armazens-escopo) {
  flex-shrink: 0;
  min-height: 0;
  align-items: flex-start;
  padding: 0.45rem 0 0.6rem;
}
.bi-page.bi-fullscreen .bi-header:has(.bi-header-armazens-escopo) {
  min-height: 0;
  padding: 0.5rem 0 0.65rem;
}

.bi-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  z-index: 10;
}

.bi-toolbar-right {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
}

/* Análise Armazéns: sem bloco à esquerda na toolbar — empurra calendário/filtros para a direita como nas outras abas */
.bi-toolbar:has(> .bi-toolbar-right:only-child) .bi-toolbar-right {
  margin-left: auto;
}

.bi-toolbar .bi-tabs {
  margin-bottom: 0;
}

.bi-toolbar .bi-header-update-block {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.bi-toolbar .bi-calendario-wrap {
  flex-direction: row;
  align-items: center;
  padding-bottom: 0;
}

/* Título fora do fluxo flex (como o número central dos gráficos): overlay absoluto para o tamanho da fonte não ser limitado pelo container */
/* font-size no wrap: o subtítulo usa em em cima deste valor (evita calc(clamp()-10px), que pode ser ignorado e herdar fonte minúscula). */
.bi-header-title-wrap {
  font-size: clamp(19px, 2.1vw, 26px);
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  pointer-events: none;
}
.bi-header:has(.bi-header-armazens-escopo) .bi-header-title-wrap {
  position: static;
  left: auto;
  right: auto;
  top: auto;
  bottom: auto;
  width: 100%;
  justify-content: flex-start;
  box-sizing: border-box;
}

.bi-header-armazens-escopo {
  margin: 0 auto;
  max-width: 100%;
  width: max-content;
  padding: 0 0.5rem;
  box-sizing: border-box;
  /* Quase o mesmo tamanho do título (1em = font-size do wrap); ~6% menor para hierarquia */
  font-size: max(18px, 0.94em);
  font-weight: 600;
  line-height: 1.2;
  color: rgba(226, 232, 240, 0.88);
  text-align: center;
  letter-spacing: 0.04em;
  text-transform: none;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  pointer-events: auto;
}

.bi-header-title {
  margin: 0;
  font-size: 1em;
  line-height: 1.2;
  font-weight: 700;
  color: #00ffaa;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-shadow: 0 0 12px rgba(0, 255, 170, 0.25);
  white-space: nowrap;
  pointer-events: none;
}
/* Tela cheia: título em destaque (BI incl. rejeições à distância) */
.bi-page.bi-fullscreen .bi-header-title-wrap {
  font-size: clamp(32px, 3.2vw, 54px);
}
/* Tela cheia: linha «Cliente · …» visível, porém claramente secundária ao título (modo normal mantém 0.94em) */
.bi-page.bi-fullscreen .bi-header-armazens-escopo {
  font-size: max(17px, 0.78em);
}

.bi-header-right {
  flex: 0 0 auto;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 7px;
}

.bi-header-update-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex-shrink: 0;
}

.bi-countdown {
  font-size: 0.875rem;
  color: #00ffaa;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.6rem;
  background: rgba(0, 255, 170, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(0, 255, 170, 0.3);
  font-variant-numeric: tabular-nums;
}
.update-info {
  font-size: 0.875rem;
  color: #8b8e94;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.filter-btn {
  background: #272a2f;
  border: 1px solid #56595e;
  color: #8b8e94;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #32363b;
  color: #00ffaa;
}

.filter-btn.active {
  border-color: #00ffaa;
  color: #00ffaa;
}

.theme-toggle-btn {
  background: #272a2f;
  border: 1px solid #56595e;
  color: #8b8e94;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.theme-toggle-btn:hover {
  background: #32363b;
  color: #00ffaa;
}

.filter-btn {
  position: relative;
}

.filter-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 9px;
  background: #00ffaa;
  color: #202326;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bi-filtros-wrap {
  position: relative;
}

.filtros-dropdown-bi {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: #272a2f;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  border: 1px solid #56595e;
  z-index: 1000;
  min-width: 320px;
  padding: 1rem;
}

.filtros-header-bi {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #56595e;
}

.filtros-header-bi span {
  font-weight: 600;
  color: #e2e4e8;
}

.btn-limpar-filtros-bi {
  padding: 0.35rem 0.6rem;
  font-size: 0.8rem;
  background: transparent;
  border: 1px solid #56595e;
  border-radius: 6px;
  color: #8b8e94;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-limpar-filtros-bi:hover {
  border-color: #00ffaa;
  color: #00ffaa;
}

.filtros-grid-bi {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.filtro-campo-bi label {
  display: block;
  font-size: 0.75rem;
  color: #8b8e94;
  margin-bottom: 0.25rem;
}

.filtro-campo-bi input {
  width: 100%;
  padding: 0.5rem 0.6rem;
  background: #202326;
  border: 1px solid #56595e;
  border-radius: 6px;
  color: #e2e4e8;
  font-size: 0.9rem;
}

.filtro-campo-bi input::placeholder {
  color: #6b6e73;
}

.filtro-campo-bi input:focus {
  outline: none;
  border-color: #00ffaa;
}

.filtro-select-bi {
  width: 100%;
  padding: 0.5rem 0.6rem;
  background: #202326;
  border: 1px solid #56595e;
  border-radius: 6px;
  color: #e2e4e8;
  font-size: 0.9rem;
  cursor: pointer;
}

.filtro-select-bi:focus {
  outline: none;
  border-color: #00ffaa;
}

/* Filtro Cliente - autocomplete pesquisável */
.filtro-cliente-autocomplete {
  position: relative;
}
.filtro-cliente-wrap {
  position: relative;
}
.filtro-cliente-wrap input {
  width: 100%;
}
.filtro-cliente-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 2px;
  max-height: 220px;
  overflow-y: auto;
  background: #202326;
  border: 1px solid #56595e;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  z-index: 100;
}
.filtro-cliente-opt {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  color: #e2e4e8;
  cursor: pointer;
  transition: background 0.15s;
}
.filtro-cliente-opt:hover {
  background: rgba(0, 255, 170, 0.15);
}
.filtro-cliente-empty {
  padding: 0.75rem;
  font-size: 0.85rem;
  color: #8b8e94;
  text-align: center;
}
.filtro-cliente-id {
  font-size: 0.8em;
  color: #8b8e94;
  margin-left: 0.2rem;
}
.filtro-cliente-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.4rem;
}
.filtro-cliente-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.4rem;
  font-size: 0.8rem;
  background: rgba(0, 255, 170, 0.2);
  border: 1px solid rgba(0, 255, 170, 0.4);
  border-radius: 4px;
  color: #e2e4e8;
}
.filtro-cliente-chip-remove {
  padding: 0 0.2rem;
  background: none;
  border: none;
  color: #8b8e94;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
}
.filtro-cliente-chip-remove:hover {
  color: #00ffaa;
}
.filtro-cliente-opt.disabled {
  opacity: 0.6;
  cursor: default;
}
.filtro-cliente-opt.disabled:hover {
  background: transparent;
}
.filtro-cliente-check {
  margin-left: auto;
  color: #00ffaa;
}
/* Filtro armazém - múltipla escolha */
.filtro-armazem-multiplo {
  min-width: 0;
}
.filtro-armazem-dropdown {
  position: relative;
}
.filtro-armazem-trigger {
  width: 100%;
  min-height: 38px;
  padding: 0.5rem 0.75rem;
  background: #202326;
  border: 1px solid #56595e;
  border-radius: 6px;
  color: #e2e4e8;
  font-size: 0.9rem;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  transition: border-color 0.2s;
}
.filtro-armazem-trigger:hover,
.filtro-armazem-trigger:focus {
  border-color: #00ffaa;
  outline: none;
}
.filtro-armazem-trigger i.rotated {
  transform: rotate(180deg);
}
.filtro-armazem-opcoes {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 2px;
  max-height: 200px;
  overflow-y: auto;
  background: #202326;
  border: 1px solid #56595e;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  z-index: 100;
}
.filtro-armazem-opt {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: background 0.15s;
}
.filtro-armazem-opt:hover {
  background: rgba(0, 255, 170, 0.15);
}
.filtro-armazem-opt.checked .filtro-armazem-checkbox {
  background: rgba(0, 255, 170, 0.3);
  border-color: #00ffaa;
}
.filtro-armazem-checkbox {
  width: 18px;
  height: 18px;
  border: 1px solid #56595e;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: #00ffaa;
}
.filtro-armazem-text {
  flex: 1;
  font-size: 0.9rem;
  color: #e2e4e8;
}

/* Limite Expedição: calendário (input date) */
.filtro-data-wrap-bi {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.filtro-input-date-bi {
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0.6rem;
  background: #202326;
  border: 1px solid #56595e;
  border-radius: 6px;
  color: #e2e4e8;
  font-size: 0.9rem;
  cursor: pointer;
}
.filtro-input-date-bi:focus {
  outline: none;
  border-color: #00ffaa;
}
.filtro-input-date-bi::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.7;
  filter: invert(1);
}
.filtro-limpar-data-bi {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #272a2f;
  border: 1px solid #56595e;
  border-radius: 6px;
  color: #8b8e94;
  cursor: pointer;
  transition: all 0.2s;
}
.filtro-limpar-data-bi:hover {
  border-color: #00ffaa;
  color: #00ffaa;
}

/* Filtro situação - múltipla escolha */
.filtro-situacao-multiplo {
  min-width: 0;
}
.filtro-situacao-dropdown {
  position: relative;
}
.filtro-situacao-trigger {
  width: 100%;
  min-height: 38px;
  padding: 0.5rem 0.75rem;
  background: #202326;
  border: 1px solid #56595e;
  border-radius: 6px;
  color: #e2e4e8;
  font-size: 0.9rem;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  transition: border-color 0.2s;
  overflow: hidden;
}
.filtro-situacao-trigger > span,
.filtro-situacao-trigger {
  min-width: 0;
}
.filtro-situacao-trigger {
  white-space: nowrap;
}
.filtro-situacao-trigger {
  text-overflow: ellipsis;
}
.filtro-situacao-trigger:hover {
  border-color: #00ffaa;
}
.filtro-situacao-trigger:focus {
  outline: none;
  border-color: #00ffaa;
}
.filtro-situacao-trigger i {
  flex-shrink: 0;
  font-size: 0.7rem;
  opacity: 0.8;
  transition: transform 0.2s;
}
.filtro-situacao-trigger i.rotated {
  transform: rotate(180deg);
}
.filtro-situacao-opcoes {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 100%;
  width: max-content;
  max-width: 320px;
  padding: 0.5rem 0;
  background: #1c1e21;
  border: 1px solid #3d4249;
  border-radius: 10px;
  max-height: 280px;
  overflow-y: auto;
  z-index: 100;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(0, 255, 170, 0.04);
}
.filtro-situacao-opt {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.9rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #e2e4e8;
  transition:
    background 0.15s ease,
    color 0.15s ease;
  border-radius: 6px;
  margin: 0 0.35rem;
}
.filtro-situacao-opt-special {
  flex-wrap: wrap;
  font-weight: 500;
  color: #b8f5e8;
  background: rgba(0, 255, 170, 0.03);
  border-radius: 6px;
  margin-bottom: 0.15rem;
}
.filtro-situacao-opt-special:hover {
  background: rgba(0, 255, 170, 0.06);
}
.filtro-situacao-opt-special .filtro-situacao-hint {
  width: 100%;
  font-size: 0.72rem;
  font-weight: 400;
  color: #7a7e84;
  margin-left: 2rem;
  margin-top: 0.2rem;
  letter-spacing: 0.01em;
}
.filtro-situacao-opt:hover {
  background: rgba(255, 255, 255, 0.04);
}
.filtro-situacao-opt.checked,
.filtro-situacao-opt:has(input:checked) {
  background: rgba(0, 255, 170, 0.06);
  color: #e8faf6;
  border-left: 3px solid #00d4a0;
  padding-left: calc(2.5rem - 3px);
  margin-left: 0.1rem;
}
.filtro-situacao-opt.checked:hover,
.filtro-situacao-opt:has(input:checked):hover {
  background: rgba(0, 255, 170, 0.1);
}
/* Input acessível (oculto visualmente) */
.filtro-situacao-input-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
  cursor: pointer;
}
/* Caixa do checkbox - visual polido */
.filtro-situacao-checkbox {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 1.5px solid #4a4e54;
  border-radius: 5px;
  background: linear-gradient(180deg, #2a2d32 0%, #25282c 100%);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: transparent;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}
.filtro-situacao-opt:hover .filtro-situacao-checkbox {
  border-color: #5a5e64;
  background: linear-gradient(180deg, #2e3136 0%, #282b30 100%);
}
.filtro-situacao-opt.checked .filtro-situacao-checkbox,
.filtro-situacao-opt:has(input:checked) .filtro-situacao-checkbox {
  border-color: #00d4a0;
  background: linear-gradient(
    180deg,
    rgba(0, 212, 160, 0.25) 0%,
    rgba(0, 212, 160, 0.12) 100%
  );
  color: #00ffaa;
  box-shadow:
    inset 0 0 0 1px rgba(0, 212, 160, 0.2),
    0 0 8px rgba(0, 212, 160, 0.15);
}
.filtro-situacao-checkbox i {
  font-size: 0.75rem;
  font-weight: 600;
  filter: drop-shadow(0 0 1px rgba(0, 255, 170, 0.3));
}
/* Estado desabilitado */
.filtro-situacao-opt.disabled,
.filtro-situacao-opt:has(input:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}
.filtro-situacao-opt.disabled .filtro-situacao-checkbox,
.filtro-situacao-opt:has(input:disabled) .filtro-situacao-checkbox {
  border-color: #3a3e44;
  background: #1e2124;
  color: #5a5e64;
}
.filtro-situacao-text {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.filtro-situacao-opt-special .filtro-situacao-hint {
  color: #6a6e74;
  font-style: italic;
}
.filtro-situacao-opt-special.checked .filtro-situacao-hint,
.filtro-situacao-opt-special:has(input:checked) .filtro-situacao-hint {
  color: #7a7e84;
}
.filtro-situacao-divider {
  height: 1px;
  margin: 0.4rem 0.9rem;
  background: linear-gradient(
    90deg,
    transparent,
    #3d4249 10%,
    #3d4249 90%,
    transparent
  );
}

/* Calendário (mesmo modelo da página de rejeições, tema escuro BI) */
.bi-calendario-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: fit-content;
  /* Largura definida só pelo botão para o gap de 7px ficar entre botão e ícone de tema */
  padding-bottom: 1.6rem;
}

.bi-calendario-wrap .update-info {
  position: absolute;
  left: 0;
  top: 100%;
  margin-top: 0.4rem;
  margin-left: 0;
  padding-left: 0;
  white-space: nowrap;
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
.calendario-dropdown-bi-armazens {
  min-width: 280px;
  max-width: 380px;
}
.calendario-layout-bi {
  display: flex;
  padding: 1rem;
  gap: 1.5rem;
}
.calendario-layout-bi--armazens-unico {
  flex-direction: column;
  padding: 0.85rem 1rem 1rem;
  gap: 0;
}
.cal-armazens-unico {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  width: 100%;
}
.cal-armazens-presets-stack {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.cal-armazens-inline-custom {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding-top: 0.6rem;
  margin-top: 0.15rem;
  border-top: 1px solid rgba(86, 89, 94, 0.5);
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
.cal-presets-bi-kicker {
  margin: 0 0 0.45rem;
  padding: 0;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #7a7e84;
  line-height: 1.3;
}
.cal-armazens-resumo-bi {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.15rem 0 0.1rem;
}
.cal-armazens-resumo-periodo {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.cal-armazens-resumo-kicker {
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #8b8e94;
}
.cal-armazens-resumo-valor {
  font-size: 0.95rem;
  font-weight: 600;
  color: #e8eaed;
  line-height: 1.35;
}
.cal-armazens-sec-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.15rem;
}
.cal-armazens-aplicar-wrap {
  margin-top: 0.35rem;
}
.btn-aplicar-bi--armazens-full {
  display: inline-flex !important;
  width: 100%;
  justify-content: center;
  box-sizing: border-box;
  padding-top: 0.55rem;
  padding-bottom: 0.55rem;
}
.calendario-armazens-meses-bi {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.cal-arm-mes-row {
  display: grid;
  grid-template-columns: 2.35rem minmax(0, 1fr);
  align-items: center;
  gap: 0.35rem 0.6rem;
}
.cal-arm-mes-selects {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-width: 0;
  align-items: stretch;
}
.cal-arm-mes-selects .select-mes-ano-arm-bi {
  flex: 1 1 9.5rem;
  min-width: 0;
}
.cal-arm-mes-selects .select-ano-arm-bi {
  flex: 0 0 5.25rem;
  min-width: 5.25rem;
}
.cal-arm-label {
  min-width: 2.25rem;
  font-size: 0.85rem;
  color: #9ea2a8;
}
.select-mes-ano-arm-bi {
  flex: 1;
  min-width: 8.5rem;
  padding: 0.45rem 0.5rem;
  border-radius: 6px;
  border: 1px solid #56595e;
  background: #202326;
  color: #e2e4e8;
  font-size: 0.9rem;
  cursor: pointer;
}
.select-mes-ano-arm-bi:focus {
  outline: none;
  border-color: #00ffaa;
}
.select-ano-arm-bi {
  min-width: 5.5rem;
  flex: 0 0 auto;
}
.preset-dias-bi {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #8b8e94;
}
.preset-dias-bi input {
  width: 56px;
  padding: 0.35rem 0.5rem;
  border: 1px solid #56595e;
  border-radius: 6px;
  font-size: 0.9rem;
  background: #202326;
  color: #e2e4e8;
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

.bi-tabs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.bi-tab {
  background: #272a2f;
  border: 1px solid #56595e;
  color: #8b8e94;
  padding: 0.6rem 1.2rem;
  min-height: 40px;
  box-sizing: border-box;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.bi-tab:hover {
  background: #32363b;
  color: #ffffff;
}

.bi-tab.active {
  background: #00ffaa;
  color: #202326;
  border-color: #00ffaa;
}

.bi-tabs-rejeicao {
  margin-bottom: 0;
}
.bi-tab-label {
  font-size: 1.05rem;
  font-weight: 600;
  color: #8b8e94;
}
.bi-page.bi-theme-light .bi-tab-label {
  color: #5a6c7d;
}

/* SLA Content */
.sla-content {
  animation: fadeIn 0.3s ease;
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 0;
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

/* Flipper: duas faces (gráficos vs cards totalizadores) */
.sla-flipper-wrapper {
  perspective: 1200px;
  min-height: 320px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
.sla-flipper-inner {
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  min-height: 320px;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}
.sla-flipper-inner.flipped {
  transform: rotateY(180deg);
}
.sla-face {
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.sla-face-back {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 100%;
  transform: rotateY(180deg);
  background: #202326;
  border-radius: 18px;
  padding: 1rem;
  box-sizing: border-box;
}
.sla-flip-btn {
  padding: 0.4rem 0.75rem;
  background: #272a2f;
  border: 1px solid #56595e;
  border-radius: 8px;
  color: #00ffaa;
  font-size: 0.8rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: all 0.2s;
}
.sla-flip-btn:hover {
  background: #00ffaa;
  color: #202326;
}
/* Botão na barra de abas: ao lado da aba SLA */
.sla-flip-btn-tabs {
  margin-left: 0.5rem;
  flex-shrink: 0;
}

.bi-countdown-tabs {
  margin-left: 0.25rem;
}

/* Face traseira: cards totalizadores */
.sla-totalizadores-block {
  margin-bottom: 1.5rem;
  min-width: 0;
  max-width: 100%;
}
.sla-etapa-label {
  font-size: calc(1.95rem + 10px);
  font-weight: 600;
  color: #00ffaa;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.sla-totalizadores-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.75rem;
}
.sla-totalizador-card-total {
  border-color: #4a90d9;
}
.sla-totalizador-card {
  background: #272a2f;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  border: 1px solid #32363b;
  text-align: center;
}
.sla-totalizador-value {
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.25rem;
}
.sla-totalizador-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #8b8e94;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 0.5rem;
}
.sla-totalizador-gauge {
  height: 6px;
  background: #32363b;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}
.sla-gauge-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}
.sla-totalizador-pct {
  color: #8b8e94;
  font-weight: 600;
}
@media (max-width: 1200px) {
  .sla-totalizadores-row {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (max-width: 640px) {
  .sla-totalizadores-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

.sla-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.sla-card {
  --sla-donut-hole-fill: #272a2f;
  background: #272a2f;
  border-radius: 18px;
  padding: 1.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.sla-card-title {
  font-size: 1.95rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
}

.sla-card-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.sla-card-chart {
  position: relative;
  flex-shrink: 0;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  isolation: isolate;
}

.sla-card-chart canvas {
  position: relative;
  z-index: 0;
  max-width: 100%;
  max-height: 100%;
}

/* Miolo opaco entre o canvas (buraco transparente) e o total — bloqueia vazamento
   de outras faces/camadas por trás sem depender só do background do Chart.js. */
.sla-donut-hole-mask {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 65%;
  height: 65%;
  max-width: calc(100% - 4px);
  max-height: calc(100% - 4px);
  border-radius: 50%;
  background: var(--sla-donut-hole-fill, #272a2f);
  pointer-events: none;
  z-index: 1;
  box-sizing: border-box;
}

.sla-chart-center {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate3d(-50%, -50%, 0);
  font-weight: 800;
  color: #ffffff;
  pointer-events: none;
  z-index: 2;
  -webkit-font-smoothing: antialiased;
  text-shadow: none;
}

.sla-legend {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem 0.75rem;
  font-size: 2.15rem;
  font-weight: 600;
  line-height: 1.25;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  font-family: inherit;
  align-items: center;
}

.legend-item {
  white-space: nowrap;
  font-size: inherit;
  font-weight: inherit;
  font-family: inherit;
}

/* Tabela */
.sla-table-section {
  background: #272a2f;
  border-radius: 18px;
  padding: 1.25rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.sla-table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.sla-filter-badge {
  font-size: 2.15rem;
  font-weight: 600;
  color: #00ffaa;
  margin-left: 0.35rem;
}
.sla-filter-badge .btn-clear-filter {
  margin-left: 0.25rem;
  padding: 0.15rem 0.35rem;
  background: transparent;
  border: 1px solid #00ffaa;
  border-radius: 4px;
  color: #00ffaa;
  cursor: pointer;
  font-size: 0.75rem;
}
.sla-filter-badge .btn-clear-filter:hover {
  background: rgba(0, 255, 170, 0.15);
}

.sla-table-sub {
  font-size: 0.8rem;
  font-weight: 500;
  color: #8b8e94;
}
.sla-table-title {
  font-size: 1.95rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  text-transform: uppercase;
}

.sla-table-title-count {
  font-size: calc(1em + 5px);
  color: #ff0000;
  font-weight: 700;
}

.btn-refresh {
  background: #202326;
  border: 1px solid #56595e;
  color: #00ffaa;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-refresh:hover:not(:disabled) {
  background: #00ffaa;
  color: #202326;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sla-table-wrapper {
  overflow: auto;
  overflow-x: auto;
  max-height: min(60vh, 520px);
  border-radius: 8px;
  border: 1px solid #56595e;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
  background: #272a2f;
}

.sla-table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #32363b;
}
.sla-pagination-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.update-info-pagination {
  margin-left: auto;
}
.sla-pagination-label {
  font-size: 2.15rem;
  color: #8b8e94;
}
.sla-pagination-buttons {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.sla-pagination-page {
  font-size: 2.15rem;
  color: #e2e4e8;
  min-width: 120px;
  text-align: center;
}
.btn-pag-bi {
  padding: 0.4rem 0.75rem;
  background: #202326;
  border: 1px solid #56595e;
  border-radius: 6px;
  color: #e2e4e8;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: all 0.2s;
}
.btn-pag-bi:hover:not(:disabled) {
  border-color: #00ffaa;
  color: #00ffaa;
}
.btn-pag-bi:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sla-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 1.15rem;
}

.sla-table th,
.sla-table td {
  padding: 0.5rem 0.6rem;
  text-align: left;
  border-bottom: 1px solid #32363b;
  white-space: nowrap;
}

.sla-table th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #202326;
  color: #8b8e94;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
  box-shadow: 0 1px 0 0 #32363b;
}

.sla-table tbody tr:hover {
  background: rgba(0, 255, 170, 0.05);
}

@keyframes pulse-fora-prazo {
  0%,
  100% {
    background-color: rgba(255, 50, 50, 0.28);
  }
  50% {
    background-color: rgba(255, 80, 80, 0.38);
  }
}

.sla-table tbody tr.status-fora-prazo {
  background: rgba(255, 60, 60, 0.32);
  animation: pulse-fora-prazo 2s ease-in-out infinite;
}

.sla-table tbody tr.status-fora-prazo:hover {
  background: rgba(255, 70, 70, 0.4);
  animation: pulse-fora-prazo 2s ease-in-out infinite;
}

.sla-table td {
  color: #e2e4e8;
}

.empty-row {
  text-align: center;
  color: #8b8e94;
  padding: 2rem;
  font-size: 2.15rem;
}
.empty-row.empty-row-error {
  color: #ffa94d;
}
.empty-row.empty-row-error small {
  color: #8b8e94;
  font-size: 0.85em;
}

/* Dashboard Rejeição - Inspirado Stovest */
.bi-rejeicao-content {
  padding: 1.5rem clamp(1rem, 2vw, 2rem);
  min-height: 280px;
}
.bi-rejeicao-dashboard {
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  max-width: none;
  margin-inline: 0;
  box-sizing: border-box;
}
.bi-rejeicao-dashboard-body {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 0;
  flex: 1 1 auto;
}
.bi-rejeicao-main-content .bi-rejeicao-cards-grid {
  flex-shrink: 0;
}
.bi-rejeicao-dashboard-body .bi-rejeicao-main-with-sidebar {
  flex: 1 1 auto;
  min-height: 0;
}
.bi-rejeicao-dashboard .bi-rejeicao-footer {
  flex-shrink: 0;
}
.bi-rejeicao-main-with-sidebar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, min(32vw, 31rem));
  gap: 1.5rem;
  margin-bottom: 0;
  align-items: stretch;
}
.bi-rejeicao-main-content {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.bi-rejeicao-sidebar {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.bi-rejeicao-presets {
  display: flex;
  gap: 0.55rem;
  margin-left: 1rem;
  flex-wrap: wrap;
}
.bi-rejeicao-preset-btn {
  padding: 0.48rem 0.95rem;
  font-size: 1.06rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: #8b8e94;
  cursor: pointer;
  transition: all 0.2s;
}
.bi-rejeicao-preset-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #e2e4e8;
}
.bi-rejeicao-preset-btn.active {
  background: rgba(0, 119, 255, 0.25);
  border-color: rgba(0, 119, 255, 0.5);
  color: #4da6ff;
}
.bi-rejeicao-cards-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
  margin-bottom: 0.65rem;
  align-items: stretch;
}
@media (max-width: 900px) {
  .bi-rejeicao-main-with-sidebar {
    grid-template-columns: 1fr;
  }
  .bi-rejeicao-cards-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    overflow-x: auto;
    padding-bottom: 0.25rem;
    -webkit-overflow-scrolling: touch;
  }
  .bi-rejeicao-card-stovest {
    min-width: 9.5rem;
  }
}
.bi-rejeicao-card-stovest {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 0.65rem 0.85rem;
  transition: border-color 0.2s;
  overflow: hidden;
}
.bi-rejeicao-card-stovest:hover {
  border-color: rgba(255, 255, 255, 0.15);
}
.bi-rejeicao-card-total {
  border-left: 3px solid #4da6ff;
}
.bi-rejeicao-card-header {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.35rem 0.75rem;
  margin-bottom: 0.25rem;
}
.bi-rejeicao-card-header .bi-rejeicao-card-periodo {
  margin-left: auto;
}
.bi-rejeicao-card-title {
  font-size: 0.92rem;
  font-weight: 600;
  color: #8b8e94;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.bi-rejeicao-card-periodo {
  font-size: 0.82rem;
  color: #56595e;
}
.bi-rejeicao-card-valor-grande {
  display: inline-flex;
  flex-wrap: nowrap;
  align-items: baseline;
  gap: 0.35rem;
  max-width: 100%;
  font-size: 1.92rem;
  font-weight: 700;
  color: #e2e4e8;
  line-height: 1.2;
  white-space: nowrap;
}
.bi-rejeicao-card-valor-grande .bi-rejeicao-card-valor-num {
  flex-shrink: 0;
}
.bi-rejeicao-card-valor-grande .bi-rejeicao-card-unidade {
  flex-shrink: 0;
  font-size: 1.08rem;
  font-weight: 500;
  color: #8b8e94;
  white-space: nowrap;
}
.bi-rejeicao-card-sub {
  font-size: 0.98rem;
  color: #8b8e94;
  margin-top: 0.2rem;
}
.bi-rejeicao-evolucao-wrap {
  min-width: 0;
  flex-shrink: 0;
}
.bi-rejeicao-evolucao-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.bi-rejeicao-chart-filters {
  display: flex;
  gap: 0.35rem;
}
.bi-rejeicao-chart-filter {
  padding: 0.38rem 0.72rem;
  font-size: 1.02rem;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 6px;
  color: #8b8e94;
  cursor: pointer;
  transition: all 0.2s;
}
.bi-rejeicao-chart-filter:hover,
.bi-rejeicao-chart-filter.active {
  background: rgba(0, 119, 255, 0.2);
  color: #4da6ff;
}
.bi-rejeicao-sidebar .bi-rejeicao-portfolio-wrap,
.bi-rejeicao-sidebar .bi-rejeicao-motivos-wrap {
  flex-shrink: 1;
}
.bi-rejeicao-sidebar .bi-rejeicao-watchlist {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.bi-rejeicao-portfolio-wrap {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0.65rem 0.85rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.bi-rejeicao-portfolio-wrap .bi-rejeicao-tabela-titulo {
  border-bottom: none;
  padding: 0 0 0.35rem;
}
.bi-rejeicao-portfolio-cards {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow-y: auto;
  max-height: 220px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}
.bi-rejeicao-portfolio-cards::-webkit-scrollbar {
  width: 5px;
}
.bi-rejeicao-portfolio-cards::-webkit-scrollbar-track {
  background: transparent;
}
.bi-rejeicao-portfolio-cards::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}
.bi-rejeicao-portfolio-card {
  display: grid;
  grid-template-columns: 2.25rem 1fr auto;
  grid-template-rows: auto auto;
  gap: 0 0.85rem;
  padding: 0.35rem 0.65rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.bi-rejeicao-portfolio-num {
  grid-row: 1 / -1;
  font-weight: 700;
  color: #4da6ff;
  font-size: 1.12rem;
}
.bi-rejeicao-portfolio-nome {
  font-weight: 500;
  color: #e2e4e8;
  font-size: 1.12rem;
}
.bi-rejeicao-portfolio-valor {
  font-weight: 700;
  color: #e2e4e8;
  font-size: 1.28rem;
}
.bi-rejeicao-portfolio-sub {
  grid-column: 2;
  font-size: 0.98rem;
  color: #8b8e94;
}
.bi-rejeicao-motivos-wrap {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0.65rem 0.85rem;
  overflow: hidden;
}
.bi-rejeicao-motivos-wrap .bi-rejeicao-tabela-titulo {
  border-bottom: none;
  padding: 0 0 0.35rem;
}
.bi-rejeicao-table-section {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
.bi-rejeicao-table-main {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}
.bi-rejeicao-table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.65rem;
  padding: 1rem 1.15rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}
.bi-rejeicao-table-header .bi-rejeicao-tabela-titulo {
  margin: 0;
  padding: 0;
  border: none;
}
.bi-rejeicao-table-filters {
  display: flex;
  gap: 0.35rem;
}
.bi-rejeicao-filter-btn {
  padding: 0.46rem 0.88rem;
  font-size: 1.06rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #8b8e94;
  cursor: pointer;
  transition: all 0.2s;
}
.bi-rejeicao-filter-btn:hover,
.bi-rejeicao-filter-btn.active {
  background: rgba(0, 119, 255, 0.2);
  border-color: rgba(0, 119, 255, 0.4);
  color: #4da6ff;
}
.bi-rejeicao-badge-alert {
  background: rgba(255, 87, 87, 0.2) !important;
  color: #ff5757 !important;
}
.bi-rejeicao-badge-ok {
  background: rgba(0, 200, 83, 0.2) !important;
  color: #00c853 !important;
}
.bi-rejeicao-sla-badge {
  display: inline-block;
  padding: 0.28rem 0.58rem;
  background: rgba(77, 166, 255, 0.15);
  color: #4da6ff;
  border-radius: 4px;
  font-weight: 600;
  font-size: 1em;
}
.bi-rejeicao-portfolio-card--active {
  background: rgba(0, 119, 255, 0.15) !important;
  border-color: rgba(0, 119, 255, 0.5) !important;
  box-shadow: 0 0 0 1px rgba(0, 119, 255, 0.3);
}
.bi-rejeicao-portfolio-card:hover {
  background: rgba(255, 255, 255, 0.08);
}
.bi-rejeicao-filtro-adm-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
  margin-left: 0.6em;
  padding: 0.25em 0.65em;
  font-size: 0.75em;
  font-weight: 600;
  background: rgba(0, 119, 255, 0.18);
  color: #4da6ff;
  border: 1px solid rgba(0, 119, 255, 0.35);
  border-radius: 6px;
  cursor: pointer;
  vertical-align: middle;
  transition: background 0.15s;
}
.bi-rejeicao-filtro-adm-tag:hover {
  background: rgba(0, 119, 255, 0.3);
}
.bi-rejeicao-row-clickable {
  cursor: pointer;
  transition: background 0.12s;
}
.bi-rejeicao-row-clickable:hover {
  background: rgba(255, 255, 255, 0.06);
}
.bi-rejeicao-row-active {
  background: rgba(0, 119, 255, 0.1) !important;
}
.bi-rejeicao-row-expanded > td {
  padding: 0 !important;
  background: rgba(0, 0, 0, 0.15);
}
.bi-rejeicao-pedidos-expand {
  padding: 0.6rem 1rem 0.8rem 2.5rem;
  max-height: 300px;
  overflow-y: auto;
}
.bi-rejeicao-pedidos-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88em;
}
.bi-rejeicao-pedidos-table th {
  text-align: left;
  font-weight: 600;
  color: #8b8e94;
  padding: 0.45rem 0.7rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.9em;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.bi-rejeicao-pedidos-table td {
  padding: 0.4rem 0.7rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  color: #c5c8cd;
}
.bi-rejeicao-pedidos-table tbody tr:last-child td {
  border-bottom: none;
}
.bi-rejeicao-watchlist {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1rem;
  overflow: hidden;
}
.bi-rejeicao-watchlist .bi-rejeicao-tabela-titulo {
  flex-shrink: 0;
  border-bottom: none;
  padding: 0 0 0.5rem;
}
.bi-rejeicao-sidebar .bi-rejeicao-watchlist > .bi-rejeicao-metrica-vazio {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}
.bi-rejeicao-sidebar .bi-rejeicao-watchlist .bi-rejeicao-watchlist-items {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  max-height: none;
}
.bi-rejeicao-watchlist-filters {
  display: flex;
  gap: 0.35rem;
  margin-bottom: 0.5rem;
  flex-shrink: 0;
}
.bi-rejeicao-watch-btn {
  padding: 0.44rem 0.82rem;
  font-size: 1.02rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: #8b8e94;
  cursor: pointer;
  transition: all 0.2s;
}
.bi-rejeicao-watch-btn:hover,
.bi-rejeicao-watch-btn.active {
  background: rgba(255, 193, 7, 0.15);
  border-color: rgba(255, 193, 7, 0.3);
  color: #ffc107;
}
.bi-rejeicao-watchlist-items {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.bi-rejeicao-watchlist-item {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.65rem 0.8rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  font-size: 1.1rem;
}
.bi-rejeicao-watchlist-nome {
  flex: 1;
  color: #e2e4e8;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bi-rejeicao-watchlist-valor {
  font-weight: 700;
  color: #ffc107;
}
.bi-rejeicao-watchlist-badge {
  font-size: 0.92rem;
  color: #8b8e94;
}
.bi-rejeicao-watchlist-item.bi-rejeicao-watchlist-urgente {
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
}
.bi-rejeicao-watchlist-item.bi-rejeicao-watchlist-urgente
  .bi-rejeicao-watchlist-nome {
  flex: none;
}
.bi-rejeicao-watchlist-pedido {
  font-size: 1.05rem;
  color: #ffc107;
  font-weight: 600;
}
.bi-rejeicao-watchlist-msg {
  font-size: 1.02rem;
  color: #b0b4b8;
  line-height: 1.4;
}
.bi-rejeicao-watchlist-item.bi-rejeicao-watchlist-critico {
  border-left: 3px solid #ff4444;
  background: rgba(255, 68, 68, 0.08);
}
.bi-rejeicao-watchlist-item.bi-rejeicao-watchlist-critico
  .bi-rejeicao-watchlist-msg {
  color: #e57373;
}
/* Análise Armazéns — cartões com contraste; fundo transparente = mesmo tom que .content-area-bi / .bi-page */
.bi-armazens-content {
  --bi-ag-bg: 220 20% 10%;
  --bi-ag-card: 220 18% 13%;
  --bi-ag-border: 220 14% 20%;
  --bi-ag-muted: 215 15% 55%;
  --bi-ag-foreground: 210 20% 92%;
  --bi-ag-primary: 168 80% 50%;
  padding: 1rem clamp(0.35rem, 1.2vw, 1.25rem) 2rem;
  width: 100%;
  max-width: none;
  margin-inline: 0;
  background: transparent;
  box-sizing: border-box;
}
.bi-armazens-hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  margin-bottom: 1.25rem;
}
.bi-armazens-hero-kicker {
  margin: 0;
  font-size: 0.875rem;
  color: hsl(var(--bi-ag-muted));
  line-height: 1.4;
}
.bi-armazens-hero-badge {
  font-size: 0.7rem;
  color: hsl(var(--bi-ag-muted));
  border: 1px solid hsl(var(--bi-ag-border));
  border-radius: 0.375rem;
  padding: 0.35rem 0.75rem;
  white-space: nowrap;
}
.bi-armazens-intro-card {
  border-radius: 0.5rem;
  border: 1px solid hsl(var(--bi-ag-border));
  background: hsl(var(--bi-ag-card));
  padding: 1rem 1.25rem;
  margin-bottom: 1.75rem;
  max-width: 100%;
}
.bi-armazens-intro-card-title {
  margin: 0 0 0.35rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: hsl(var(--bi-ag-foreground));
}
.bi-armazens-intro-text {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.55;
  color: hsl(var(--bi-ag-muted));
}
.bi-armazens-intro-text strong {
  color: hsl(var(--bi-ag-foreground));
  font-weight: 600;
}
.bi-armazens-intro-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}
.bi-armazens-intro-card-header .bi-armazens-intro-card-title {
  margin-bottom: 0;
  flex: 1;
  min-width: 0;
}
.bi-armazens-card-header-actions {
  display: flex;
  align-items: flex-start;
  gap: 0.35rem;
  flex-shrink: 0;
}
.bi-armazens-chart-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}
.bi-armazens-chart-head .bi-armazens-chart-title {
  margin-bottom: 0;
  flex: 1;
  min-width: 0;
}
.bi-armazens-help-wrap {
  position: relative;
  flex-shrink: 0;
}
.bi-armazens-help-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  padding: 0;
  margin: 0;
  border: none;
  border-radius: 9999px;
  background: hsl(var(--bi-ag-border) / 0.45);
  color: hsl(var(--bi-ag-muted));
  cursor: help;
  line-height: 0;
  transition:
    background 0.15s,
    color 0.15s;
}
.bi-armazens-help-btn:hover,
.bi-armazens-help-btn:focus-visible {
  background: hsl(var(--bi-ag-primary) / 0.22);
  color: hsl(var(--bi-ag-primary));
  outline: none;
}
.bi-armazens-help-ico {
  display: block;
}
.bi-armazens-help-panel {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 200;
  min-width: 17rem;
  max-width: min(22rem, calc(100vw - 1.5rem));
  max-height: 70vh;
  overflow-y: auto;
  padding: 0.65rem 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid hsl(var(--bi-ag-border));
  background: hsl(var(--bi-ag-card));
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  text-align: left;
  text-transform: none;
  letter-spacing: normal;
  font-weight: 400;
}
.bi-armazens-help-panel-title {
  margin: 0 0 0.4rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: hsl(var(--bi-ag-foreground));
  line-height: 1.35;
}
.bi-armazens-help-panel-list {
  margin: 0;
  padding: 0 0 0 1rem;
  font-size: 0.65rem;
  line-height: 1.45;
  color: hsl(var(--bi-ag-muted));
}
.bi-armazens-section {
  margin-bottom: 2rem;
}
.bi-armazens-section--evolucao {
  margin-bottom: 0;
}
.bi-armazens-section-title {
  margin: 0 0 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: hsl(var(--bi-ag-primary));
}
.bi-armazens-section-lead {
  margin: 0 0 1rem;
  font-size: 0.88rem;
  line-height: 1.5;
  color: hsl(var(--bi-ag-muted));
  max-width: 100%;
}
.bi-armazens-section-lead--muted {
  font-size: 0.8rem;
}
.bi-armazens-evolucao-erro {
  padding: 1rem 1.25rem;
  border-radius: 8px;
  background: rgba(229, 115, 115, 0.12);
  border: 1px solid rgba(229, 115, 115, 0.35);
  color: #e57373;
  font-size: 0.9rem;
}
.bi-armazens-evolucao-erro i {
  margin-right: 0.5rem;
}
.bi-armazens-composicao-erro {
  margin: 0 0 0.75rem;
  padding: 0.65rem 0.9rem;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #e57373;
  background: rgba(229, 115, 115, 0.1);
  border: 1px solid rgba(229, 115, 115, 0.35);
}
.bi-armazens-composicao-erro i {
  margin-right: 0.4rem;
}
.bi-armazens-charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 420px), 1fr));
  gap: 1.25rem;
  align-items: stretch;
}
/** Linha + rosca (referência painel): ~2/3 + 1/3 */
.bi-armazens-charts-dashboard {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 32%);
  gap: 1.25rem;
  align-items: stretch;
}
.bi-armazens-section--recomendadas {
  margin-top: 1.75rem;
  padding-top: 0.25rem;
}
.bi-armazens-recomendadas-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
  align-items: stretch;
}
/**
 * Tela cheia: mesma lógica de grade que o modo normal — KPI 7+6, evolução 2 colunas, recomendadas em 2 colunas.
 * Rolagem no `.bi-page`; alturas mínimas confortáveis nos gráficos.
 */
.bi-page.bi-fullscreen:has(.bi-armazens-content) .bi-armazens-charts-dashboard {
  flex: 0 0 auto;
  min-height: auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 34%);
  gap: 1.5rem;
  align-content: start;
  align-items: stretch;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content)
  .bi-armazens-recomendadas-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content) .bi-armazens-chart-card {
  min-height: auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  isolation: isolate;
}
/** Linha mensal: não cortar traços/labels nas bordas em tela cheia. */
.bi-page.bi-fullscreen:has(.bi-armazens-content) .bi-armazens-chart-card--line {
  overflow: visible;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content)
  .bi-armazens-chart-card--line
  .bi-armazens-chart-wrap--evolucao {
  flex: 0 0 auto;
  flex-shrink: 0;
  min-height: 360px;
  height: 420px !important;
  position: relative;
  overflow: visible;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content)
  .bi-armazens-chart-card--donut
  .bi-armazens-chart-wrap--donut {
  flex: 0 0 auto;
  min-height: 340px;
  height: 360px !important;
}
.bi-page.bi-fullscreen:has(.bi-armazens-content)
  .bi-armazens-chart-card--rec
  .bi-armazens-chart-wrap--rec {
  flex: 0 0 auto;
  min-height: 320px;
  height: 340px !important;
}
.bi-armazens-chart-card--rec .bi-armazens-chart-wrap--rec {
  min-height: 240px;
  height: 260px;
}
.bi-armazens-chart-card--line {
  min-width: 0;
}
.bi-armazens-chart-card--donut {
  min-width: 0;
}
.bi-armazens-chart-wrap--evolucao {
  min-height: 300px;
  height: 320px;
}
.bi-armazens-chart-wrap--donut {
  position: relative;
  flex: 1;
  min-height: 240px;
  height: 260px;
}
.bi-armazens-chart-card {
  background: hsl(var(--bi-ag-card));
  border: 1px solid hsl(var(--bi-ag-border));
  border-radius: 0.5rem;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.bi-armazens-chart-title {
  margin: 0 0 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: hsl(var(--bi-ag-muted));
}
.bi-armazens-chart-sub {
  margin: 0 0 1rem;
  font-size: 0.75rem;
  color: hsl(var(--bi-ag-muted));
  line-height: 1.4;
}
.bi-armazens-chart-foot {
  margin: -0.35rem 0 0.75rem;
  font-size: 0.7rem;
  line-height: 1.4;
}
.bi-armazens-chart-foot--muted {
  color: hsl(var(--bi-ag-muted));
}
.bi-armazens-chart-wrap {
  position: relative;
  flex: 1;
  min-height: 260px;
  height: 280px;
}
.bi-armazens-chart-wrap canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}
.bi-armazens-chart-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(20, 22, 26, 0.45);
  font-size: 1.75rem;
  color: #4da6ff;
  pointer-events: none;
}
/**
 * Resumo: 12 métricas numa única linha; colunas flexíveis (1fr) para usar toda a largura do ecrã.
 * Período e cliente reutilizam a mesma classe — colunas alinhadas entre as secções.
 */
.bi-armazens-resumo-group-cards {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 0.4rem;
  align-items: stretch;
  overflow-x: auto;
  /* hidden em Y recortava os painéis «?»; o posicionamento fixed resolve; visible reduz efeito colateral */
  overflow-y: visible;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
  scrollbar-gutter: stable;
}
.bi-armazens-resumo-strip--alinhado {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  align-items: stretch;
  gap: 0.4rem;
  flex-direction: unset;
  flex-wrap: unset;
}
.bi-armazens-resumo-slot {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  box-sizing: border-box;
}
.bi-armazens-resumo-slot--vazio {
  pointer-events: none;
  visibility: hidden;
}
.bi-armazens-resumo-group-cards .bi-armazens-resumo-slot .bi-armazens-card {
  min-width: 0;
  max-width: none;
  box-sizing: border-box;
  /* Altura confortável (≈ card rejeição stovest) para título + valor legíveis */
  padding: 0.65rem 0.4rem 0.6rem;
  gap: 0.45rem;
  min-height: 7.75rem;
  width: 100%;
  flex: 1 1 auto;
  align-self: stretch;
}
.bi-armazens-resumo-group-cards
  .bi-armazens-resumo-slot
  .bi-armazens-card:hover {
  transform: none;
}
.bi-armazens-resumo-group-cards .bi-armazens-card-titulo {
  font-size: clamp(0.62rem, 0.5rem + 0.42vw, 0.78rem);
  font-weight: 600;
  letter-spacing: 0.03em;
  line-height: 1.25;
  /* Quebra de linha natural (sobre .bi-armazens-card-titulo: nowrap + ellipsis) */
  display: block;
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  word-break: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}
.bi-armazens-resumo-group-cards .bi-armazens-card-header {
  align-items: flex-start;
  flex: 1 1 auto;
  min-height: 0;
}
.bi-armazens-resumo-group-cards .bi-armazens-card-valor {
  font-size: clamp(0.8rem, 0.65rem + 0.4vw, 1rem);
  line-height: 1.15;
  flex-wrap: wrap;
  align-content: flex-end;
  word-break: break-word;
  margin-top: auto;
}
.bi-armazens-resumo-group-cards
  .bi-armazens-card-valor
  .bi-armazens-card-unidade {
  font-size: 0.55rem;
}
.bi-armazens-resumo-group-cards .bi-armazens-card-icon {
  font-size: 0.65rem;
  margin-top: 0;
  align-self: flex-start;
}
.bi-armazens-resumo-group-cards .bi-armazens-help-ico {
  width: 11px;
  height: 11px;
}
.bi-armazens-resumo-group-cards .bi-armazens-card-header-actions {
  flex-shrink: 0;
  gap: 0.2rem;
}
.bi-armazens-card {
  background: hsl(var(--bi-ag-card));
  border: 1px solid hsl(var(--bi-ag-border));
  border-radius: 0.5rem;
  padding: 1rem;
  transition:
    border-color 0.2s,
    transform 0.2s;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
  min-height: 0;
}
.bi-armazens-card:hover {
  border-color: hsl(var(--bi-ag-primary) / 0.45);
  transform: scale(1.01);
}
/** Posições paletes (PP): vermelho médio (tema escuro do painel). */
.bi-armazens-card.bi-armazens-card--pp {
  background: hsl(0 34% 22%);
  border-color: hsl(0 36% 34%);
}
/** Fatura cliente: verde. */
.bi-armazens-card.bi-armazens-card--fatura {
  background: hsl(152 32% 22%);
  border-color: hsl(152 36% 34%);
}
/** Custo total operação: vermelho mais intenso que o dos PP. */
.bi-armazens-card.bi-armazens-card--custo-op {
  background: hsl(0 40% 18%);
  border-color: hsl(0 42% 30%);
}
/** Indicadores com unidade / unidades no título: azul. */
.bi-armazens-card.bi-armazens-card--unidade {
  background: hsl(210 38% 24%);
  border-color: hsl(210 40% 36%);
}
/** Funcionários CLT / dedicado / custo por pessoa: amarelo. */
.bi-armazens-card.bi-armazens-card--func-pessoa {
  background: hsl(45 38% 26%);
  border-color: hsl(45 42% 38%);
}
/** % custo total cliente × custo total CD: laranja. */
.bi-armazens-card.bi-armazens-card--pct-cd {
  background: hsl(28 42% 24%);
  border-color: hsl(28 45% 36%);
}
.bi-armazens-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  flex: 0 0 auto;
}
.bi-armazens-card-titulo {
  flex: 1;
  min-width: 0;
  font-size: 0.75rem;
  font-weight: 500;
  color: hsl(var(--bi-ag-foreground));
  text-transform: uppercase;
  letter-spacing: 0.06em;
  line-height: 1.2;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bi-armazens-card-icon {
  flex-shrink: 0;
  color: hsl(var(--bi-ag-muted));
  font-size: 1rem;
  margin-top: 0.05rem;
}
.bi-armazens-card-valor {
  font-size: 1.5rem;
  font-weight: 700;
  color: hsl(var(--bi-ag-foreground));
  line-height: 1.15;
  margin-top: auto;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: baseline;
  gap: 0.2rem;
  min-width: 0;
}
.bi-armazens-card-valor .bi-armazens-card-unidade {
  font-size: 0.85rem;
  font-weight: 500;
  color: hsl(var(--bi-ag-muted));
  flex-shrink: 0;
  white-space: nowrap;
}
.bi-armazens-card-legenda {
  display: block;
  margin-top: 0.4rem;
  font-size: 0.65rem;
  font-weight: 500;
  line-height: 1.3;
  color: hsl(var(--bi-ag-muted) / 0.92);
  max-width: 100%;
}
@media (max-width: 1200px) {
  .bi-armazens-charts-dashboard {
    grid-template-columns: 1fr;
  }
  .bi-armazens-recomendadas-grid {
    grid-template-columns: 1fr;
  }
}
.bi-page.bi-theme-light .bi-armazens-content {
  --bi-ag-bg: 210 40% 98%;
  --bi-ag-card: 0 0% 100%;
  --bi-ag-border: 214 32% 88%;
  --bi-ag-muted: 215 16% 46%;
  --bi-ag-foreground: 222 47% 11%;
  --bi-ag-primary: 168 76% 32%;
  background: transparent;
}
.bi-page.bi-theme-light .bi-armazens-card {
  background: hsl(var(--bi-ag-card));
  border-color: hsl(var(--bi-ag-border));
}
.bi-page.bi-theme-light .bi-armazens-card.bi-armazens-card--pp {
  background: hsl(0 45% 72%);
  border-color: hsl(0 40% 50%);
}
.bi-page.bi-theme-light .bi-armazens-card.bi-armazens-card--fatura {
  background: hsl(152 48% 68%);
  border-color: hsl(152 42% 44%);
}
.bi-page.bi-theme-light .bi-armazens-card.bi-armazens-card--custo-op {
  background: hsl(0 58% 54%);
  border-color: hsl(0 52% 38%);
}
.bi-page.bi-theme-light .bi-armazens-card.bi-armazens-card--unidade {
  background: hsl(210 52% 76%);
  border-color: hsl(210 45% 52%);
}
.bi-page.bi-theme-light .bi-armazens-card.bi-armazens-card--func-pessoa {
  background: hsl(48 88% 78%);
  border-color: hsl(45 70% 48%);
}
.bi-page.bi-theme-light .bi-armazens-card.bi-armazens-card--pct-cd {
  background: hsl(28 88% 72%);
  border-color: hsl(24 70% 46%);
}
.bi-page.bi-theme-light .bi-armazens-card:hover {
  border-color: hsl(var(--bi-ag-primary) / 0.55);
}
.bi-page.bi-theme-light .bi-armazens-card.bi-armazens-card--pp:hover {
  border-color: hsl(0 48% 42%);
}
.bi-page.bi-theme-light .bi-armazens-card.bi-armazens-card--fatura:hover {
  border-color: hsl(152 45% 38%);
}
.bi-page.bi-theme-light .bi-armazens-card.bi-armazens-card--custo-op:hover {
  border-color: hsl(0 55% 32%);
}
.bi-page.bi-theme-light .bi-armazens-card.bi-armazens-card--unidade:hover {
  border-color: hsl(210 48% 44%);
}
.bi-page.bi-theme-light .bi-armazens-card.bi-armazens-card--func-pessoa:hover {
  border-color: hsl(45 75% 40%);
}
.bi-page.bi-theme-light .bi-armazens-card.bi-armazens-card--pct-cd:hover {
  border-color: hsl(24 75% 38%);
}
.bi-page.bi-theme-light .bi-armazens-card-titulo {
  color: #1a1a1a;
}
.bi-page.bi-theme-light .bi-armazens-card-icon {
  color: hsl(var(--bi-ag-muted));
}
.bi-page.bi-theme-light .bi-armazens-card-valor {
  color: #1a1a1a;
}
.bi-page.bi-theme-light .bi-armazens-card-valor .bi-armazens-card-unidade {
  color: #5a6c7d;
}
.bi-page.bi-theme-light .bi-armazens-card-legenda {
  color: #64748b;
}
.bi-page.bi-theme-light .bi-armazens-section-title {
  color: hsl(var(--bi-ag-primary));
}
.bi-page.bi-theme-light .bi-armazens-section-lead {
  color: hsl(var(--bi-ag-muted));
}
.bi-page.bi-theme-light .bi-armazens-chart-card {
  background: hsl(var(--bi-ag-card));
  border-color: hsl(var(--bi-ag-border));
}
.bi-page.bi-theme-light .bi-armazens-chart-title {
  color: hsl(var(--bi-ag-muted));
}
.bi-page.bi-theme-light .bi-armazens-chart-sub {
  color: hsl(var(--bi-ag-muted));
}
.bi-page.bi-theme-light .bi-armazens-chart-foot--muted {
  color: hsl(var(--bi-ag-muted));
}
.bi-page.bi-theme-light .bi-armazens-chart-overlay {
  background: rgba(255, 255, 255, 0.65);
}
.bi-page.bi-theme-light .bi-armazens-help-panel {
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.12);
}
.bi-page.bi-theme-light .bi-armazens-help-btn {
  background: hsl(var(--bi-ag-border) / 0.55);
}

.bi-rejeicao-loading,
.bi-rejeicao-erro,
.bi-rejeicao-vazio {
  text-align: center;
  padding: 3rem 2rem;
  color: #8b8e94;
}
.bi-rejeicao-loading i,
.bi-rejeicao-erro i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  display: block;
  color: #56595e;
}
.bi-rejeicao-erro i {
  color: #e57373;
}
.bi-rejeicao-vazio i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  display: block;
  color: #76fa65;
}
.bi-rejeicao-vazio h3 {
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
  color: #e2e4e8;
}
.bi-rejeicao-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.bi-rejeicao-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}
.bi-rejeicao-card-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 193, 7, 0.15);
  border-radius: 8px;
  color: #ffc107;
  font-size: 1.25rem;
}
.bi-rejeicao-card-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.bi-rejeicao-card-valor {
  font-size: 1.5rem;
  font-weight: 700;
  color: #e2e4e8;
}
.bi-rejeicao-card-label {
  font-size: 0.8rem;
  color: #8b8e94;
}
.bi-rejeicao-tabela-wrap {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
}
.bi-rejeicao-tabela-titulo {
  margin: 0;
  padding: 0.9rem 1.15rem;
  font-size: 1.18rem;
  font-weight: 600;
  color: #e2e4e8;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.bi-rejeicao-tabela-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: auto;
}
.bi-rejeicao-tabela {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
}
.bi-rejeicao-tabela th:nth-child(1),
.bi-rejeicao-tabela td:nth-child(1) {
  width: 34%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bi-rejeicao-tabela th:nth-child(2),
.bi-rejeicao-tabela td:nth-child(2) {
  width: 9%;
}
.bi-rejeicao-tabela th:nth-child(3),
.bi-rejeicao-tabela td:nth-child(3) {
  width: 9%;
}
.bi-rejeicao-tabela th:nth-child(4),
.bi-rejeicao-tabela td:nth-child(4) {
  width: 14%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bi-rejeicao-tabela th:nth-child(5),
.bi-rejeicao-tabela td:nth-child(5) {
  width: 11%;
  white-space: nowrap;
}
.bi-rejeicao-tabela th:nth-child(6),
.bi-rejeicao-tabela td:nth-child(6) {
  width: 13%;
  white-space: nowrap;
}
.bi-rejeicao-tabela th,
.bi-rejeicao-tabela td {
  padding: 0.82rem 1.05rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.bi-rejeicao-tabela th {
  font-size: 1.02rem;
  font-weight: 600;
  color: #8b8e94;
  text-transform: uppercase;
  background: rgba(0, 0, 0, 0.2);
}
.bi-rejeicao-tabela td {
  font-size: 1.18rem;
  color: #e2e4e8;
}
.bi-rejeicao-tabela tbody tr:hover {
  background: rgba(255, 255, 255, 0.04);
}
.bi-rejeicao-badge {
  display: inline-block;
  padding: 0.3rem 0.65rem;
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
  border-radius: 4px;
  font-weight: 600;
  font-size: 1em;
}
.bi-rejeicao-badge-total {
  background: rgba(0, 255, 170, 0.15);
  color: #00ffaa;
}
.bi-rejeicao-evolucao-wrap {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 1rem;
  padding: 1.15rem 1.25rem;
}
.bi-rejeicao-chart-container {
  position: relative;
  isolation: isolate;
  width: 100%;
  max-width: none;
  height: clamp(280px, 38vh, 480px);
  min-height: 260px;
  flex-shrink: 0;
  margin: 0.5rem 0 0;
}
.bi-rejeicao-chart-container canvas {
  position: relative;
  z-index: 0;
  display: block;
}
.bi-rejeicao-bar-label {
  position: absolute;
  z-index: 1;
  transform: translate(-50%, -100%);
  font-size: 17px;
  font-weight: 600;
  font-family: system-ui, 'Segoe UI', sans-serif;
  line-height: 1;
  white-space: nowrap;
  pointer-events: none;
  color: transparent;
  max-width: none;
}
.bi-rejeicao-bar-label-inner {
  display: inline-block;
  color: var(--rj-lbl, #ffc107) !important;
  -webkit-text-fill-color: var(--rj-lbl, #ffc107) !important;
  font-synthesis: none;
  text-shadow: none !important;
  -webkit-text-stroke: 0 transparent;
  paint-order: normal;
  white-space: nowrap;
  word-break: keep-all;
}
.bi-rejeicao-metrica-wrap {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
}
.bi-rejeicao-adm-lista {
  padding: 0.5rem 1rem 1rem;
}
.bi-rejeicao-adm-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 0.9rem;
}
.bi-rejeicao-adm-item:last-child {
  border-bottom: none;
}
.bi-rejeicao-adm-num {
  min-width: 2rem;
  font-weight: 700;
  color: #ffc107;
}
.bi-rejeicao-adm-nome {
  flex: 1;
  color: #e2e4e8;
  font-weight: 500;
}
.bi-rejeicao-adm-stats {
  color: #8b8e94;
  font-size: 0.85rem;
}
.bi-rejeicao-metrica-vazio {
  padding: 1.2rem;
  color: #8b8e94;
  font-size: 1.12rem;
}
.bi-rejeicao-motivos-lista {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.bi-rejeicao-motivo-item {
  display: grid;
  grid-template-columns: 2.25rem 1fr auto;
  gap: 0 0.85rem;
  align-items: center;
  padding: 0.4rem 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 1.1rem;
}
.bi-rejeicao-motivo-num {
  font-weight: 700;
  color: #4da6ff;
  font-size: 1.12rem;
}
.bi-rejeicao-motivo-texto {
  color: #e2e4e8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bi-rejeicao-motivo-count {
  font-weight: 600;
  color: #ffc107;
  font-size: 1.12rem;
}
.bi-rejeicao-footer {
  display: flex;
  align-items: center;
  gap: 1.15rem;
  flex-wrap: wrap;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  background: #202326;
  position: relative;
  z-index: 2;
  flex-shrink: 0;
}
.btn-refresh-bi-rej {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.62rem 1.2rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: #e2e4e8;
  font-size: 1.1rem;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s;
}
.btn-refresh-bi-rej:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
}
.btn-refresh-bi-rej:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.bi-rejeicao-update {
  font-size: 1.05rem;
  color: #8b8e94;
}

.bi-page.bi-theme-light .bi-rejeicao-footer {
  background: var(--gray-50);
  border-top-color: rgba(0, 119, 255, 0.18);
}

.bi-page.bi-theme-light .bi-rejeicao-card {
  background: #ffffff;
  border-color: #c5d9f0;
}
.bi-page.bi-theme-light .bi-rejeicao-card-icon {
  background: rgba(255, 193, 7, 0.12);
  color: #d4a017;
}
.bi-page.bi-theme-light .bi-rejeicao-card-valor {
  color: #1a1a1a;
}
.bi-page.bi-theme-light .bi-rejeicao-card-label {
  color: #5a6c7d;
}
.bi-page.bi-theme-light .bi-rejeicao-tabela-wrap {
  background: #ffffff;
  border-color: #c5d9f0;
}
.bi-page.bi-theme-light .bi-rejeicao-tabela-titulo {
  color: #1a1a1a;
  border-bottom-color: var(--gray-200);
}
.bi-page.bi-theme-light .bi-rejeicao-tabela th {
  background: var(--gray-100);
  color: #5a6c7d;
}
.bi-page.bi-theme-light .bi-rejeicao-tabela td {
  color: #1a1a1a;
  border-bottom-color: var(--gray-200);
}
.bi-page.bi-theme-light .bi-rejeicao-tabela tbody tr:hover {
  background: rgba(0, 119, 255, 0.04);
}
.bi-page.bi-theme-light .bi-rejeicao-badge {
  background: rgba(255, 193, 7, 0.2);
  color: #b38600;
}
.bi-page.bi-theme-light .bi-rejeicao-badge-total {
  background: rgba(0, 119, 255, 0.15);
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .bi-rejeicao-evolucao-wrap {
  background: #ffffff;
  border-color: #c5d9f0;
}
.bi-page.bi-theme-light .bi-rejeicao-metrica-wrap {
  background: #ffffff;
  border-color: #c5d9f0;
}
.bi-page.bi-theme-light .bi-rejeicao-adm-item {
  border-bottom-color: var(--gray-200);
}
.bi-page.bi-theme-light .bi-rejeicao-adm-num {
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .bi-rejeicao-adm-nome {
  color: #1a1a1a;
}
.bi-page.bi-theme-light .bi-rejeicao-adm-stats {
  color: #5a6c7d;
}
.bi-page.bi-theme-light .bi-rejeicao-metrica-vazio {
  color: #5a6c7d;
}
.bi-page.bi-theme-light .bi-rejeicao-motivo-item {
  background: var(--gray-100);
  border-color: var(--gray-200);
}
.bi-page.bi-theme-light .bi-rejeicao-motivo-num {
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .bi-rejeicao-motivo-texto {
  color: #1a1a1a;
}
.bi-page.bi-theme-light .bi-rejeicao-motivo-count {
  color: #5a6c7d;
}
.bi-page.bi-theme-light .btn-refresh-bi-rej {
  background: #ffffff;
  border-color: #c5d9f0;
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .btn-refresh-bi-rej:hover:not(:disabled) {
  background: var(--primary, #0077ff);
  border-color: var(--primary, #0077ff);
  color: #ffffff;
}
.bi-page.bi-theme-light .bi-rejeicao-loading,
.bi-page.bi-theme-light .bi-rejeicao-erro,
.bi-page.bi-theme-light .bi-rejeicao-vazio {
  color: #5a6c7d;
}
.bi-page.bi-theme-light .bi-rejeicao-vazio h3 {
  color: #1a1a1a;
}
.bi-page.bi-theme-light .bi-rejeicao-update {
  color: #5a6c7d;
}
.bi-page.bi-theme-light .bi-rejeicao-preset-btn {
  background: #f0f4f8;
  border-color: #c5d9f0;
  color: #5a6c7d;
}
.bi-page.bi-theme-light .bi-rejeicao-preset-btn:hover {
  background: #e6f0fa;
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .bi-rejeicao-preset-btn.active {
  background: rgba(0, 119, 255, 0.12);
  border-color: var(--primary, #0077ff);
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .bi-rejeicao-card-stovest {
  background: #ffffff;
  border-color: #c5d9f0;
}
.bi-page.bi-theme-light .bi-rejeicao-card-total {
  border-left-color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .bi-rejeicao-card-title {
  color: #5a6c7d;
}
.bi-page.bi-theme-light .bi-rejeicao-card-valor-grande {
  color: #1a1a1a;
}
.bi-page.bi-theme-light .bi-rejeicao-card-sub {
  color: #5a6c7d;
}
.bi-page.bi-theme-light .bi-rejeicao-portfolio-wrap,
.bi-page.bi-theme-light .bi-rejeicao-motivos-wrap,
.bi-page.bi-theme-light .bi-rejeicao-table-main,
.bi-page.bi-theme-light .bi-rejeicao-watchlist {
  background: #ffffff;
  border-color: #c5d9f0;
}
.bi-page.bi-theme-light .bi-rejeicao-portfolio-card {
  background: var(--gray-100);
  border-color: var(--gray-200);
}
.bi-page.bi-theme-light .bi-rejeicao-portfolio-nome {
  color: #1a1a1a;
}
.bi-page.bi-theme-light .bi-rejeicao-portfolio-valor {
  color: #1a1a1a;
}
.bi-page.bi-theme-light .bi-rejeicao-chart-filter {
  background: #f0f4f8;
  color: #5a6c7d;
}
.bi-page.bi-theme-light .bi-rejeicao-chart-filter:hover,
.bi-page.bi-theme-light .bi-rejeicao-chart-filter.active {
  background: rgba(0, 119, 255, 0.1);
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .bi-rejeicao-filter-btn {
  background: #f0f4f8;
  border-color: #c5d9f0;
  color: #5a6c7d;
}
.bi-page.bi-theme-light .bi-rejeicao-filter-btn:hover,
.bi-page.bi-theme-light .bi-rejeicao-filter-btn.active {
  background: rgba(0, 119, 255, 0.1);
  border-color: var(--primary, #0077ff);
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .bi-rejeicao-badge-alert {
  background: rgba(255, 87, 87, 0.15) !important;
  color: #c62828 !important;
}
.bi-page.bi-theme-light .bi-rejeicao-sla-badge {
  background: rgba(0, 119, 255, 0.12);
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .bi-rejeicao-row-clickable:hover {
  background: rgba(0, 0, 0, 0.04);
}
.bi-page.bi-theme-light .bi-rejeicao-row-active {
  background: rgba(0, 119, 255, 0.08) !important;
}
.bi-page.bi-theme-light .bi-rejeicao-row-expanded > td {
  background: rgba(0, 0, 0, 0.03);
}
.bi-page.bi-theme-light .bi-rejeicao-pedidos-table th {
  color: #5a6c7d;
  border-bottom-color: #e0e8f0;
}
.bi-page.bi-theme-light .bi-rejeicao-pedidos-table td {
  color: #3a3f44;
  border-bottom-color: #eef2f7;
}
.bi-page.bi-theme-light .bi-rejeicao-portfolio-card:hover {
  background: rgba(0, 0, 0, 0.04);
}
.bi-page.bi-theme-light .bi-rejeicao-portfolio-card--active {
  background: rgba(0, 119, 255, 0.1) !important;
  border-color: rgba(0, 119, 255, 0.4) !important;
}
.bi-page.bi-theme-light .bi-rejeicao-watchlist-item {
  background: var(--gray-100);
}
.bi-page.bi-theme-light .bi-rejeicao-watchlist-nome {
  color: #1a1a1a;
}
.bi-page.bi-theme-light .bi-rejeicao-watch-btn {
  background: #f0f4f8;
  border-color: #c5d9f0;
  color: #5a6c7d;
}
.bi-page.bi-theme-light .bi-rejeicao-watch-btn:hover,
.bi-page.bi-theme-light .bi-rejeicao-watch-btn.active {
  background: rgba(255, 193, 7, 0.12);
  border-color: #d4a017;
  color: #b38600;
}

.bi-placeholder {
  text-align: center;
  padding: 4rem 2rem;
  color: #8b8e94;
}

.bi-placeholder i {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
  color: #56595e;
}

/* Mensagem quando não há dados (cliente novo, sem movimentação no período) */
.bi-sem-dados-message {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  padding: 2rem;
  text-align: center;
}
.bi-sem-dados-inner {
  max-width: 420px;
}
.bi-sem-dados-icon {
  font-size: 3rem;
  color: #00ffaa;
  margin-bottom: 1rem;
  opacity: 0.9;
}
.bi-sem-dados-title {
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #e2e4e8;
}
.bi-sem-dados-text {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  line-height: 1.5;
  color: #8b8e94;
}
.bi-sem-dados-hint {
  margin: 0;
  font-size: 0.875rem;
  color: #6a6e74;
}
.bi-sem-dados-hint strong {
  color: #8b8e94;
}

/* ========== TEMA LIGHT (cinza padrão do sistema + acentos primários) ========== */
/* Apenas fundos e templates do SLA - cores dos gráficos permanecem iguais */
.bi-page.bi-theme-light {
  background: var(--gray-50);
  color: #1a1a1a;
}
.bi-page.bi-theme-light .bi-header-title {
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .bi-header-armazens-escopo {
  color: #475569;
}
.bi-page.bi-theme-light .bi-loading-overlay {
  background: rgba(248, 250, 252, 0.92);
}
.bi-page.bi-theme-light .bi-loading-canvas {
  background: #ffffff;
  border-color: rgba(0, 119, 255, 0.3);
}
.bi-page.bi-theme-light .bi-loading-icon {
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .bi-loading-message {
  color: #1a1a2e;
}
.bi-page.bi-theme-light .update-info {
  color: #5a6c7d;
}
.bi-page.bi-theme-light .filter-btn,
.bi-page.bi-theme-light .theme-toggle-btn {
  background: #ffffff;
  border-color: #c5d9f0;
  color: #5a6c7d;
}
.bi-page.bi-theme-light .filter-btn:hover,
.bi-page.bi-theme-light .theme-toggle-btn:hover {
  background: var(--gray-200);
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .filter-btn.active {
  border-color: var(--primary, #0077ff);
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .filter-badge {
  background: var(--primary, #0077ff);
  color: #ffffff;
}
.bi-page.bi-theme-light .filtros-dropdown-bi {
  background: #ffffff;
  border-color: #c5d9f0;
  box-shadow: 0 8px 24px rgba(0, 119, 255, 0.12);
}
.bi-page.bi-theme-light .filtros-header-bi {
  border-bottom-color: #c5d9f0;
}
.bi-page.bi-theme-light .filtros-header-bi span {
  color: #1a1a1a;
}
.bi-page.bi-theme-light .btn-limpar-filtros-bi {
  border-color: #c5d9f0;
  color: #5a6c7d;
}
.bi-page.bi-theme-light .btn-limpar-filtros-bi:hover {
  border-color: var(--primary, #0077ff);
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .filtro-campo-bi label {
  color: #5a6c7d;
}
.bi-page.bi-theme-light .filtro-campo-bi input,
.bi-page.bi-theme-light .filtro-select-bi,
.bi-page.bi-theme-light .filtro-situacao-trigger {
  background: var(--gray-100);
  border-color: #c5d9f0;
  color: #1a1a1a;
}
.bi-page.bi-theme-light .filtro-campo-bi input::placeholder {
  color: #8ba3c4;
}
.bi-page.bi-theme-light .filtro-campo-bi input:focus,
.bi-page.bi-theme-light .filtro-select-bi:focus,
.bi-page.bi-theme-light .filtro-situacao-trigger:focus {
  border-color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .filtro-cliente-dropdown {
  background: var(--gray-100);
  border-color: #c5d9f0;
}
.bi-page.bi-theme-light .filtro-cliente-opt {
  color: #1a1a1a;
}
.bi-page.bi-theme-light .filtro-cliente-opt:hover {
  background: rgba(0, 119, 255, 0.1);
}
.bi-page.bi-theme-light .filtro-cliente-chip {
  background: rgba(0, 119, 255, 0.15);
  border-color: #c5d9f0;
  color: #1a1a1a;
}
.bi-page.bi-theme-light .filtro-armazem-trigger {
  background: var(--gray-100);
  border-color: #c5d9f0;
  color: #1a1a1a;
}
.bi-page.bi-theme-light .filtro-armazem-trigger:hover,
.bi-page.bi-theme-light .filtro-armazem-trigger:focus {
  border-color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .filtro-armazem-opcoes {
  background: var(--gray-100);
  border-color: #c5d9f0;
}
.bi-page.bi-theme-light .filtro-armazem-opt:hover {
  background: rgba(0, 119, 255, 0.1);
}
.bi-page.bi-theme-light .filtro-armazem-opt.checked .filtro-armazem-checkbox {
  background: rgba(0, 119, 255, 0.2);
  border-color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .filtro-armazem-checkbox {
  border-color: #c5d9f0;
}
.bi-page.bi-theme-light .filtro-armazem-text {
  color: #1a1a1a;
}
.bi-page.bi-theme-light .filtro-input-date-bi {
  background: var(--gray-100);
  border-color: #c5d9f0;
  color: #1a1a1a;
}
.bi-page.bi-theme-light .filtro-input-date-bi:focus {
  border-color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light
  .filtro-input-date-bi::-webkit-calendar-picker-indicator {
  filter: none;
  opacity: 0.6;
}
.bi-page.bi-theme-light .filtro-limpar-data-bi {
  background: var(--gray-100);
  border-color: #c5d9f0;
  color: #5a6c7d;
}
.bi-page.bi-theme-light .filtro-limpar-data-bi:hover {
  border-color: var(--primary, #0077ff);
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .filtro-situacao-opcoes {
  background: #ffffff;
  border-color: #c5d9f0;
  box-shadow: 0 8px 24px rgba(0, 119, 255, 0.1);
}
.bi-page.bi-theme-light .filtro-situacao-opt {
  color: #1a1a1a;
}
.bi-page.bi-theme-light .filtro-situacao-opt:hover {
  background: var(--gray-200);
}
.bi-page.bi-theme-light .calendario-dropdown-bi {
  background: #ffffff;
  border-color: #c5d9f0;
  box-shadow: 0 8px 24px rgba(0, 119, 255, 0.12);
}
.bi-page.bi-theme-light .calendario-presets-bi .preset-btn-bi {
  background: var(--gray-100);
  border-color: #c5d9f0;
  color: #5a6c7d;
}
.bi-page.bi-theme-light .calendario-presets-bi .preset-btn-bi:hover,
.bi-page.bi-theme-light .calendario-presets-bi .preset-btn-bi.active {
  background: var(--primary, #0077ff);
  border-color: var(--primary, #0077ff);
  color: #ffffff;
}
.bi-page.bi-theme-light .btn-abrir-calendario-bi {
  background: #ffffff;
  border-color: #c5d9f0;
  color: #1a1a1a;
}
.bi-page.bi-theme-light .btn-abrir-calendario-bi:hover {
  background: var(--gray-200);
  border-color: var(--primary, #0077ff);
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .cal-presets-bi-kicker {
  color: #6a7a8c;
}
.bi-page.bi-theme-light .cal-armazens-resumo-valor {
  color: #1a1a1a;
}
.bi-page.bi-theme-light .cal-armazens-resumo-kicker {
  color: #6a7a8c;
}
.bi-page.bi-theme-light .cal-armazens-inline-custom {
  border-top-color: #d0dce8;
}
.bi-page.bi-theme-light .cal-arm-label {
  color: #5a6c7d;
}
.bi-page.bi-theme-light .select-mes-ano-arm-bi {
  background: #ffffff;
  border-color: #c5d9f0;
  color: #1a1a1a;
}
.bi-page.bi-theme-light .select-mes-ano-arm-bi:focus {
  border-color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .calendario-layout-bi--armazens-unico .cal-presets-bi-kicker,
.bi-page.bi-theme-light .calendario-layout-bi--armazens-unico .cal-armazens-resumo-kicker,
.bi-page.bi-theme-light .calendario-layout-bi--armazens-unico .cal-arm-label {
  color: #1a1a1a;
}
.bi-page.bi-theme-light
  .calendario-layout-bi--armazens-unico
  .cal-armazens-presets-stack
  .preset-btn-bi {
  color: #1a1a1a;
  background: var(--gray-100);
  border: 1px solid #c5d9f0;
}
.bi-page.bi-theme-light
  .calendario-layout-bi--armazens-unico
  .cal-armazens-presets-stack
  .preset-btn-bi:hover,
.bi-page.bi-theme-light
  .calendario-layout-bi--armazens-unico
  .cal-armazens-presets-stack
  .preset-btn-bi.active {
  background: var(--primary, #0077ff);
  border-color: var(--primary, #0077ff);
  color: #ffffff;
}
.bi-page.bi-theme-light
  .calendario-layout-bi--armazens-unico
  .btn-cal-bi:not(.btn-aplicar-bi) {
  background: var(--gray-100);
  border-color: #c5d9f0;
  color: #1a1a1a;
}
.bi-page.bi-theme-light
  .calendario-layout-bi--armazens-unico
  .btn-cal-bi:not(.btn-aplicar-bi):hover {
  background: var(--gray-200);
  border-color: var(--primary, #0077ff);
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .bi-tab {
  background: #ffffff;
  border-color: #c5d9f0;
  color: #5a6c7d;
}
.bi-page.bi-theme-light .bi-tab:hover {
  background: var(--gray-200);
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .bi-tab.active {
  background: var(--primary, #0077ff);
  color: #ffffff;
  border-color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .sla-card {
  --sla-donut-hole-fill: #ffffff;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 119, 255, 0.08);
  border: 1px solid #c5d9f0;
}
.bi-page.bi-theme-light .sla-card-title {
  color: #1a1a1a;
}
.bi-page.bi-theme-light .sla-chart-center {
  color: #1a1a1a;
}
.bi-page.bi-theme-light .sla-table-section {
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 119, 255, 0.08);
  border: 1px solid #c5d9f0;
}
.bi-page.bi-theme-light .sla-table-title {
  color: #1a1a1a;
}
.bi-page.bi-theme-light .sla-table-title-count {
  color: #dc2626;
}
.bi-page.bi-theme-light .sla-table-sub,
.bi-page.bi-theme-light .sla-filter-badge {
  color: #5a6c7d;
}
.bi-page.bi-theme-light .sla-filter-badge .btn-clear-filter {
  border-color: var(--primary, #0077ff);
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .sla-filter-badge .btn-clear-filter:hover {
  background: rgba(0, 119, 255, 0.1);
}
.bi-page.bi-theme-light .btn-refresh {
  background: #ffffff;
  border-color: #c5d9f0;
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .btn-refresh:hover:not(:disabled) {
  background: var(--primary, #0077ff);
  color: #ffffff;
}
.bi-page.bi-theme-light .sla-table-wrapper {
  border-color: #c5d9f0;
  background: #ffffff;
}
.bi-page.bi-theme-light .sla-table th,
.bi-page.bi-theme-light .sla-table td {
  border-bottom-color: var(--gray-200);
}
.bi-page.bi-theme-light .sla-table th {
  background: var(--gray-100);
  color: #5a6c7d;
  box-shadow: 0 1px 0 0 var(--gray-200);
}
.bi-page.bi-theme-light .sla-table tbody tr:hover {
  background: rgba(0, 119, 255, 0.04);
}
.bi-page.bi-theme-light .sla-table td {
  color: #1a1a1a;
}
.bi-page.bi-theme-light .sla-table-pagination {
  border-top-color: var(--gray-200);
}
.bi-page.bi-theme-light .sla-pagination-label,
.bi-page.bi-theme-light .sla-pagination-page {
  color: #5a6c7d;
}
.bi-page.bi-theme-light .btn-pag-bi {
  background: #ffffff;
  border-color: #c5d9f0;
  color: #1a1a1a;
}
.bi-page.bi-theme-light .btn-pag-bi:hover:not(:disabled) {
  border-color: var(--primary, #0077ff);
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .empty-row {
  color: #5a6c7d;
}
.bi-page.bi-theme-light .empty-row.empty-row-error {
  color: #d97706;
}
.bi-page.bi-theme-light .bi-placeholder {
  color: #5a6c7d;
}
.bi-page.bi-theme-light .bi-placeholder i {
  color: #8ba3c4;
}
.bi-page.bi-theme-light .bi-sem-dados-icon {
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .bi-sem-dados-title {
  color: #1a1a1a;
}
.bi-page.bi-theme-light .bi-sem-dados-text {
  color: #5a6c7d;
}
.bi-page.bi-theme-light .bi-sem-dados-hint {
  color: #6a7a8c;
}
.bi-page.bi-theme-light .bi-sem-dados-hint strong {
  color: #5a6c7d;
}
.bi-page.bi-theme-light .calendario-layout-bi,
.bi-page.bi-theme-light .calendario-custom-bi .btn-cal-bi {
  background: var(--gray-100);
  border-color: #c5d9f0;
  color: #1a1a1a;
}
.bi-page.bi-theme-light .calendario-custom-bi .btn-cal-bi:hover {
  background: var(--gray-200);
  border-color: var(--primary, #0077ff);
  color: var(--primary, #0077ff);
}
.bi-page.bi-theme-light .calendario-custom-bi .btn-aplicar-bi {
  background: var(--primary, #0077ff);
  border-color: var(--primary, #0077ff);
  color: #ffffff;
}
.bi-page.bi-theme-light .input-data-wrap-bi {
  background: var(--gray-100);
  border-color: #c5d9f0;
}
.bi-page.bi-theme-light .input-data-wrap-bi input {
  color: #1a1a1a;
}
.bi-page.bi-theme-light .input-data-wrap-bi input::placeholder {
  color: #8ba3c4;
}
.bi-page.bi-theme-light .input-data-wrap-bi i {
  color: #5a6c7d;
}

@media (orientation: portrait) {
  .sla-cards-grid {
    grid-template-columns: 1fr;
  }

  .sla-table th,
  .sla-table td {
    padding: 0.4rem 0.5rem;
    font-size: 0.65rem;
  }
}
</style>

<!--
  Tooltip externo dos donuts SLA: fora do scoped (nó criado em JS sem data-v).
  z-index acima de .sla-donut-hole-mask (1) e .sla-chart-center (2); cores com
  contraste no tema claro (herança de color do card).
-->
<style>
.bi-page .bi-sla-donut-tooltip-html {
  position: absolute;
  z-index: 40;
  pointer-events: none;
  min-width: 120px;
  max-width: 300px;
  padding: 12px;
  border-radius: 6px;
  background: #272a2f;
  color: #e2e4e8;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
  font-size: 12px;
  line-height: 1.35;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.12s ease;
  text-align: left;
}

.bi-page .bi-sla-donut-tooltip-html__title {
  color: #ffffff;
  font-weight: 600;
  margin: 0 0 8px;
}

.bi-page .bi-sla-donut-tooltip-html__row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.bi-page .bi-sla-donut-tooltip-html__swatch {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  border: 1px solid #ffffff;
  border-radius: 1px;
  box-sizing: border-box;
}

.bi-page .bi-sla-donut-tooltip-html__value {
  color: #d1d5db;
  font-weight: 400;
  margin: 0;
}

.bi-page .bi-sla-donut-tooltip-html__value--solo {
  padding-left: 0;
}
</style>
