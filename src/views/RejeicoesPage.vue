<template>
  <div class="rejeicoes">
    <div class="page-header">
      <h2>
        <span class="header-icon">
          <i class="fa fa-exclamation-triangle"></i>
        </span>
        Acompanhamento Rejeições
      </h2>
      <p v-if="visaoClientePedidosPlana">
        Seus pedidos em rejeição (visão direta por pedido)
      </p>
      <p v-else>Gerencie os pedidos em rejeição por cliente</p>
    </div>

    <!-- Filtros e ações -->
    <div class="filters-section">
      <div class="filter-group filter-group-pesquisa-cliente">
        <label v-if="rejeicoesUserLevel === 1" for="filtro-cliente"
          ><i class="fa fa-search"></i> Pesquisar pedido</label
        >
        <label v-else for="filtro-cliente"
          ><i class="fa fa-search"></i> Pesquisar cliente</label
        >
        <input
          type="text"
          id="filtro-cliente"
          v-model="filtroCliente"
          :placeholder="
            rejeicoesUserLevel === 1
              ? 'Nº do pedido...'
              : 'Digite código ou nome...'
          "
          class="filter-input-pesquisa"
          autocomplete="off"
        />
      </div>
      <div v-if="showFiltroAdmin" class="filter-group">
        <label for="filtro-admin"
          ><i class="fa fa-user-shield"></i> Admin:</label
        >
        <select id="filtro-admin" v-model="filtroAdmin">
          <option value="">Todos os admins</option>
          <option
            v-for="a in opcoesAdmDistintos"
            :key="'adm-' + (a === null ? '_vazio' : a)"
            :value="a === null ? '__VAZIO__' : a || ''"
          >
            {{ a === null || a === '' ? '(vazio)' : a }}
          </option>
        </select>
      </div>
      <div v-if="showFiltroArmazem" class="filter-group">
        <label for="filtro-armazem"
          ><i class="fa fa-warehouse"></i> Armazém:</label
        >
        <select id="filtro-armazem" v-model="filtroArmazem">
          <option value="">Todos os armazéns</option>
          <option v-for="a in armazensDisponiveis" :key="a" :value="a">
            {{ a || '(vazio)' }}
          </option>
        </select>
      </div>
      <div class="filter-group">
        <label for="filtro-status">Filtrar por Status:</label>
        <select
          id="filtro-status"
          v-model="filtroStatus"
          @change="aplicarFiltros"
        >
          <option value="">Todos os status</option>
          <option value="rejeitado">Em Rejeição</option>
          <option value="reprocessado">Integrados</option>
          <option value="tratados">
            Tratados (estavam com rejeição e foram reprocessados)
          </option>
        </select>
      </div>

      <!-- Intervalo de datas (sempre visível; default = todos; filtra só ao aplicar um período) -->
      <div ref="calendarioRef" class="filter-group filter-group-datas">
        <div class="intervalo-datas-header">
          <label class="intervalo-label">Período:</label>
          <button
            type="button"
            class="btn-abrir-calendario"
            @click="mostrarCalendario = !mostrarCalendario"
            :title="mostrarCalendario ? 'Fechar' : 'Selecionar período'"
          >
            <i class="fa fa-calendar-alt"></i>
            {{ labelIntervaloAtual }}
          </button>
        </div>
        <div v-if="mostrarCalendario" class="calendario-dropdown" @click.stop>
          <div class="calendario-layout">
            <div class="calendario-presets">
              <button
                v-for="p in presets"
                :key="p.id"
                type="button"
                class="preset-btn"
                :class="{ active: presetAtivo === p.id }"
                @click="aplicarPreset(p.id)"
              >
                {{ p.label }}
              </button>
            </div>
            <div class="calendario-custom">
              <div class="calendario-buttons">
                <button type="button" class="btn-cal" @click="irParaHoje">
                  Ir para Hoje
                </button>
                <button type="button" class="btn-cal" @click="limparIntervalo">
                  Limpar
                </button>
                <button
                  type="button"
                  class="btn-cal btn-aplicar"
                  @click="aplicarIntervalo"
                >
                  Aplicar
                </button>
              </div>
              <div class="calendario-inputs">
                <div class="input-data-wrap">
                  <i class="fa fa-calendar"></i>
                  <input
                    type="text"
                    v-model="dataInicioDisplayModel"
                    placeholder="DD/MM/AAAA"
                    maxlength="10"
                  />
                </div>
                <div class="input-data-wrap">
                  <i class="fa fa-calendar"></i>
                  <input
                    type="text"
                    v-model="dataFimDisplayModel"
                    placeholder="DD/MM/AAAA"
                    maxlength="10"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        class="btn-refresh"
        @click="aoClicarAtualizar"
        :disabled="carregando"
      >
        <i class="fa fa-sync-alt" :class="{ 'fa-spin': carregando }"></i>
        Atualizar
      </button>
      <!-- Resumo: total carregado do backend vs. exibido (evita confusão quando filtro por cliente está ativo) -->
      <p v-if="!carregando && rejeicoes.length > 0" class="resumo-registros">
        <strong>Total carregado:</strong>
        {{ rejeicoes.length.toLocaleString('pt-BR') }} pedidos
        <template v-if="filtroCliente || filtroAdmin || filtroArmazem">
          <template v-if="visaoClientePedidosPlana && filtroCliente">
            — filtro ativo: exibindo
            <strong>{{
              formatarQuantidade(pedidosPlanaCliente.length)
            }}</strong>
            pedido(s) na listagem
          </template>
          <template v-else>
            — filtro ativo: exibindo
            <strong>{{ formatarQuantidade(rejeicoesFiltradas.length) }}</strong>
            pedidos em
            <strong>{{ formatarQuantidade(clientesExibicao.length) }}</strong>
            cliente(s)
          </template>
        </template>
        <template v-else>
          — {{ formatarQuantidade(rejeicoesAgrupadas.length) }} cliente(s)
        </template>
      </p>
    </div>

    <!-- Popup ao clicar em Atualizar -->
    <Teleport to="body">
      <transition name="popup-fade">
        <div v-if="mostrarPopupAtualizando" class="popup-atualizando-overlay">
          <div class="popup-atualizando-content">
            <div class="popup-atualizando-spinner">
              <i class="fa fa-sync-alt fa-spin"></i>
            </div>
            <p class="popup-atualizando-texto">
              Consultando os dados mais recentes no banco de dados...
            </p>
            <p v-if="dataInicio || dataFim" class="popup-atualizando-filtros">
              Período:
              {{
                dataInicio && dataFim
                  ? `${formatarData(dataInicio)} - ${formatarData(dataFim)}`
                  : dataInicio || dataFim || 'Todos'
              }}
            </p>
            <p v-if="filtroCliente" class="popup-atualizando-filtros">
              {{ rejeicoesUserLevel === 1 ? 'Busca' : 'Cliente' }}:
              {{ filtroCliente }}
            </p>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Modal de progresso ao enviar WhatsApp -->
    <Teleport to="body">
      <transition name="popup-fade">
        <div
          v-if="modalWhatsappProgress.visivel"
          class="popup-atualizando-overlay popup-whatsapp-progress"
        >
          <div class="popup-atualizando-content">
            <div class="popup-atualizando-spinner">
              <i class="fa fa-whatsapp fa-spin"></i>
            </div>
            <p class="popup-atualizando-texto">
              Enviando mensagens para o WhatsApp...
            </p>
            <p class="popup-whatsapp-stats">
              <strong>{{
                formatarQuantidade(modalWhatsappProgress.enviadas)
              }}</strong>
              de
              <strong>{{
                formatarQuantidade(modalWhatsappProgress.total)
              }}</strong>
              enviadas
              <span class="popup-whatsapp-faltam"
                >({{
                  formatarQuantidade(
                    Math.max(
                      0,
                      modalWhatsappProgress.total -
                        modalWhatsappProgress.enviadas
                    )
                  )
                }}
                restantes)</span
              >
            </p>
            <p
              v-if="modalWhatsappProgress.erros.length > 0"
              class="popup-whatsapp-erros"
            >
              {{ formatarQuantidade(modalWhatsappProgress.erros.length) }}
              erro(s)
            </p>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Loading skeleton - melhora percepção de velocidade -->
    <div
      v-if="carregando && rejeicoes.length === 0"
      class="loading-container loading-skeleton"
    >
      <div class="skeleton-header"></div>
      <div class="skeleton-row" v-for="n in 8" :key="n"></div>
      <p class="loading-text">Carregando rejeições...</p>
    </div>

    <!-- Cards totalizadores + Lista de clientes com rejeição -->
    <div
      v-else-if="rejeicoesAgrupadas.length > 0"
      class="clientes-rejeicao-wrapper"
    >
      <!-- Cards totalizadores -->
      <div class="cards-totalizadores">
        <div class="card-totalizador card-clientes">
          <div class="card-totalizador-icon">
            <i
              class="fa"
              :class="visaoClientePedidosPlana ? 'fa-list' : 'fa-users'"
            ></i>
          </div>
          <div class="card-totalizador-content">
            <span class="card-totalizador-valor">{{
              formatarQuantidade(
                visaoClientePedidosPlana
                  ? totalPedidosListaPlana
                  : totalClientesComRejeicao
              )
            }}</span>
            <span class="card-totalizador-label">{{
              visaoClientePedidosPlana
                ? 'Pedidos na listagem'
                : 'Clientes com pedidos em rejeição'
            }}</span>
          </div>
        </div>
        <div class="card-totalizador card-pedidos">
          <div class="card-totalizador-icon">
            <i class="fa fa-exclamation-triangle"></i>
          </div>
          <div class="card-totalizador-content">
            <span class="card-totalizador-valor">{{
              formatarQuantidade(
                visaoClientePedidosPlana
                  ? totalEmRejeicaoPlana
                  : totalPedidosEmRejeicao
              )
            }}</span>
            <span class="card-totalizador-label">Pedidos em rejeição</span>
          </div>
        </div>
      </div>

      <!-- Nível 1 + 1 CNPJ: tabela plana de pedidos (sem agrupar por cliente) -->
      <template
        v-if="visaoClientePedidosPlana && pedidosPlanaCliente.length > 0"
      >
        <div
          v-if="
            pedidosSelecionados.length > 0 &&
            (podeEnviarWhatsappRejeicoes || podeIgnorarRejeicoes)
          "
          class="acoes-multiplas-modal acoes-multiplas-plana"
        >
          <button
            v-if="podeEnviarWhatsappRejeicoes"
            class="btn-whatsapp-multiplos"
            @click="enviarWhatsappSelecionados()"
            :disabled="processando !== null"
            type="button"
          >
            <i class="fa fa-whatsapp"></i>
            Enviar WhatsApp ({{
              formatarQuantidade(pedidosSelecionados.length)
            }})
          </button>
          <button
            v-if="podeIgnorarRejeicoes"
            class="btn-ignorar-multiplos"
            @click="ignorarSelecionados()"
            :disabled="processando !== null"
            type="button"
          >
            <i class="fa fa-eye-slash"></i>
            Ignorar selecionados ({{
              formatarQuantidade(pedidosSelecionados.length)
            }})
          </button>
        </div>
        <div class="clientes-list-container table-pedidos-plana-wrap">
          <div class="table-wrapper">
            <div class="table-header-fixed">
              <table class="clientes-table table-pedidos-plana">
                <colgroup>
                  <col
                    v-if="mostrarCheckboxesRejeicoes"
                    class="col-check-plana"
                  />
                  <col class="col-pedido-plana" />
                  <col class="col-cliente-plana" />
                  <col class="col-data-plana" />
                  <col class="col-data-plana" />
                  <col class="col-status-plana" />
                  <col class="col-motivo-plana" />
                  <col class="col-acoes-plana" />
                  <col class="col-reproc-plana" />
                  <col class="col-resolv-plana" />
                </colgroup>
                <thead>
                  <tr>
                    <th
                      v-if="mostrarCheckboxesRejeicoes"
                      class="col-check-plana"
                    >
                      <input
                        type="checkbox"
                        class="checkbox-select-all"
                        :checked="todosPedidosVisiveisSelecionados"
                        :indeterminate.prop="algunsPedidosVisiveisSelecionados"
                        @change="toggleSelecionarTodosVisiveis"
                        title="Selecionar página"
                      />
                    </th>
                    <th>N° Pedido</th>
                    <th>Cliente</th>
                    <th>Data mov.</th>
                    <th>Inclusão</th>
                    <th>Status</th>
                    <th>Motivo</th>
                    <th>Ação</th>
                    <th>Reprocessado</th>
                    <th>Resolvido</th>
                  </tr>
                </thead>
              </table>
            </div>
            <div class="table-body-scroll">
              <table class="clientes-table table-pedidos-plana">
                <colgroup>
                  <col
                    v-if="mostrarCheckboxesRejeicoes"
                    class="col-check-plana"
                  />
                  <col class="col-pedido-plana" />
                  <col class="col-cliente-plana" />
                  <col class="col-data-plana" />
                  <col class="col-data-plana" />
                  <col class="col-status-plana" />
                  <col class="col-motivo-plana" />
                  <col class="col-acoes-plana" />
                  <col class="col-reproc-plana" />
                  <col class="col-resolv-plana" />
                </colgroup>
                <tbody>
                  <tr
                    v-for="pedido in pedidosPlanaVisiveis"
                    :key="chavePedido(pedido)"
                    :class="{
                      'row-selecionada': isPedidoSelecionado(pedido),
                      'row-pode-remover': pedido.podeRemover,
                    }"
                  >
                    <td
                      v-if="mostrarCheckboxesRejeicoes"
                      class="col-check-plana"
                    >
                      <input
                        type="checkbox"
                        :value="chavePedido(pedido)"
                        @change="toggleSelecaoPedido(pedido)"
                        :checked="isPedidoSelecionado(pedido)"
                        class="checkbox-pedido"
                      />
                    </td>
                    <td>
                      <strong>{{ pedido.pedido }}</strong>
                    </td>
                    <td>{{ (pedido.nome_cliente || '').trim() || '—' }}</td>
                    <td>{{ formatarData(pedido.dt_movimento) }}</td>
                    <td>{{ formatarDataHora(pedido.dt_inclusao) }}</td>
                    <td>
                      <span
                        class="status-badge"
                        :class="getStatusExibicaoClass(pedido.status_exibicao)"
                      >
                        {{
                          pedido.status_exibicao || pedido.sit_arquivo || '—'
                        }}
                      </span>
                    </td>
                    <td class="col-motivo-plana">
                      <span :title="pedido.rejeicao || '-'">{{
                        pedido.rejeicao || '—'
                      }}</span>
                    </td>
                    <td>
                      <button
                        v-if="
                          pedido.status_exibicao === 'C/ Rejeições' ||
                          pedido.status_exibicao === 'Integrado'
                        "
                        class="btn-action btn-detalhar"
                        type="button"
                        @click="abrirDetalhePedido(pedido)"
                        :disabled="carregandoDetalhe === chavePedido(pedido)"
                      >
                        <i class="fa fa-list-alt"></i>
                        Detalhar
                      </button>
                      <button
                        v-else-if="pedido.podeRemover && podeIgnorarRejeicoes"
                        class="btn-action btn-ignorar"
                        type="button"
                        @click="removerRejeicao(pedido)"
                        :disabled="processando === chavePedido(pedido)"
                      >
                        <i class="fa fa-eye-slash"></i>
                        Ignorar
                      </button>
                      <span v-else class="info-text">—</span>
                    </td>
                    <td>
                      <span
                        v-if="pedido.reprocessado_com_sucesso === 'Sim'"
                        class="reprocessado-sim"
                        >Sim</span
                      >
                      <span
                        v-else-if="pedido.reprocessado_com_sucesso === 'Não'"
                        class="reprocessado-nao"
                        >Não</span
                      >
                      <span v-else class="reprocessado-vazio">—</span>
                    </td>
                    <td>
                      <span
                        v-if="
                          pedido.status_exibicao === 'Integrado' &&
                          pedido.dt_integrado_em
                        "
                      >
                        {{ formatarDataHora(pedido.dt_integrado_em) }}
                      </span>
                      <span v-else class="resolvido-vazio">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div
          v-if="pedidosPlanaCliente.length > TAMANHO_PAGINA"
          class="paginacao-modal paginacao-plana"
        >
          <span class="paginacao-info">
            Página {{ formatarQuantidade(pagePedidosPlana) }} de
            {{ formatarQuantidade(totalPaginasPlana) }} (exibindo
            {{ formatarQuantidade(pedidosPlanaVisiveis.length) }} de
            {{ formatarQuantidade(pedidosPlanaCliente.length) }})
          </span>
          <div class="paginacao-botoes">
            <button
              type="button"
              class="btn-pagina"
              :disabled="pagePedidosPlana <= 1"
              @click="pagePedidosPlana = Math.max(1, pagePedidosPlana - 1)"
            >
              <i class="fa fa-chevron-left"></i> Anterior
            </button>
            <button
              type="button"
              class="btn-pagina"
              :disabled="pagePedidosPlana >= totalPaginasPlana"
              @click="
                pagePedidosPlana = Math.min(
                  totalPaginasPlana,
                  pagePedidosPlana + 1
                )
              "
            >
              Próxima <i class="fa fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </template>

      <!-- Lista agrupada por cliente (vários CNPJs no login ou níveis internos) -->
      <div
        v-else-if="(clientesExibicao || []).length > 0"
        class="clientes-list-container"
      >
        <div class="table-wrapper">
          <!-- Cabeçalho fixo - fora do container de scroll -->
          <div class="table-header-fixed">
            <table class="clientes-table">
              <colgroup>
                <col class="col-cliente" />
                <col class="col-id" />
                <col class="col-armazem" />
                <col class="col-total" />
                <col class="col-acoes-header" />
              </colgroup>
              <thead>
                <tr>
                  <th class="col-cliente">CLIENTE</th>
                  <th class="col-id">ID</th>
                  <th class="col-armazem">ARMAZEM</th>
                  <th class="col-total">TOTAL DE PEDIDOS</th>
                  <th class="col-acoes-header">AÇÕES</th>
                </tr>
              </thead>
            </table>
          </div>
          <!-- Corpo rolável - apenas as linhas -->
          <div class="table-body-scroll">
            <table class="clientes-table">
              <colgroup>
                <col class="col-cliente" />
                <col class="col-id" />
                <col class="col-armazem" />
                <col class="col-total" />
                <col class="col-acoes-header" />
              </colgroup>
              <tbody>
                <tr
                  v-for="grupo in clientesExibicao || []"
                  :key="`${grupo.id_cliente ?? ''}|${grupo.cliente}`"
                  class="cliente-row"
                >
                  <td class="col-cliente">
                    <strong>{{ grupo.cliente }}</strong>
                  </td>
                  <td class="col-id">{{ grupo.id_cliente || '-' }}</td>
                  <td class="col-armazem">
                    {{ grupo.estabelecimento || '-' }}
                  </td>
                  <td class="col-total">
                    <span class="total-badge">{{
                      formatarQuantidade(grupo.pedidos.length)
                    }}</span>
                    <span class="total-detalhe"
                      >({{ formatarQuantidade(grupo.pedidosEmRejeicao) }} em
                      rejeição)</span
                    >
                  </td>
                  <td class="col-acoes-header">
                    <button
                      class="btn-ver-pedidos"
                      @click="abrirModalPedidos(grupo)"
                      title="Ver pedidos em rejeição"
                    >
                      <i class="fa fa-list"></i>
                      Ver Pedidos
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Estado vazio: carregou mas nenhum cliente com rejeição -->
      <div v-else class="empty-state empty-sem-rejeicao">
        <div class="empty-icon"><i class="fa fa-check-circle"></i></div>
        <template v-if="visaoClientePedidosPlana">
          <h4>Nenhum pedido na listagem</h4>
          <p>Ajuste o período, o filtro de status ou a pesquisa por pedido.</p>
        </template>
        <template v-else>
          <h4>Nenhum cliente com pedidos em rejeição</h4>
          <p>
            Não há pedidos em rejeição no momento. Todos os clientes estão com
            pedidos processados ou integrados.
          </p>
        </template>
      </div>
    </div>

    <!-- Estado vazio: sem dados carregados -->
    <div v-else class="empty-state">
      <div class="empty-icon"><i class="fa fa-check-circle"></i></div>
      <h4>Nenhuma rejeição encontrada</h4>
      <p>Todos os pedidos estão processados corretamente!</p>
    </div>

    <!-- Modal de Pedidos do Cliente -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="modalCliente" class="modal-overlay">
          <div class="modal-content-pedidos" @click.stop>
            <div class="modal-header">
              <h3>{{ modalCliente?.cliente || '' }}</h3>
              <button class="btn-close" @click="fecharModalPedidos">×</button>
            </div>

            <div class="modal-body-pedidos">
              <!-- Informações do Cliente -->
              <div class="cliente-info-modal">
                <div class="info-item">
                  <span class="info-label">Grupo vinculado:</span>
                  <span class="info-value info-grupo-vinculado">{{
                    modalGrupoVinculado || '-'
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">ID:</span>
                  <span class="info-value">{{
                    modalCliente?.id_cliente || '-'
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">ARMAZEM:</span>
                  <span class="info-value">{{
                    modalCliente?.estabelecimento || '-'
                  }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Total de Pedidos:</span>
                  <span class="info-value total-pedidos">{{
                    formatarQuantidade(modalCliente?.pedidos?.length || 0)
                  }}</span>
                </div>
                <div
                  class="info-item info-item-detalhe"
                  v-if="modalCliente?.pedidos?.length"
                >
                  <span class="info-label">Resumo:</span>
                  <span class="info-value"
                    >{{ formatarQuantidade(modalPedidosEmRejeicao) }} em
                    rejeição,
                    {{ formatarQuantidade(modalPedidosIntegrados) }} integrados
                    (resolvidos)</span
                  >
                </div>
              </div>

              <!-- Botões de ação para selecionados -->
              <div
                v-if="
                  pedidosSelecionados.length > 0 &&
                  (podeEnviarWhatsappRejeicoes || podeIgnorarRejeicoes)
                "
                class="acoes-multiplas-modal"
              >
                <button
                  v-if="podeEnviarWhatsappRejeicoes"
                  class="btn-whatsapp-multiplos"
                  @click="enviarWhatsappSelecionados()"
                  :disabled="processando !== null"
                  title="Enviar mensagem no WhatsApp com detalhes das rejeições"
                >
                  <i class="fa fa-whatsapp"></i>
                  Enviar WhatsApp ({{
                    formatarQuantidade(pedidosSelecionados.length)
                  }})
                </button>
                <button
                  v-if="podeIgnorarRejeicoes"
                  class="btn-ignorar-multiplos"
                  @click="ignorarSelecionados()"
                  :disabled="processando !== null"
                >
                  <i class="fa fa-eye-slash"></i>
                  Ignorar
                  {{ formatarQuantidade(pedidosSelecionados.length) }} pedido(s)
                  selecionado(s)
                </button>
              </div>

              <!-- Filtro (parte superior) -->
              <div
                v-if="(modalCliente?.pedidos?.length || 0) > 0"
                class="filtro-modal-pedidos"
              >
                <div class="filtro-modal-pedido-input">
                  <label for="filtro-modal-pedido"
                    ><i class="fa fa-search"></i> Filtrar por pedido</label
                  >
                  <input
                    type="text"
                    id="filtro-modal-pedido"
                    v-model="filtroModalPedido"
                    placeholder="Digite o número do pedido..."
                    class="filter-input-pedido"
                    @input="pageModalPedidos = 1"
                  />
                </div>
                <label class="filtro-check-label">
                  <input
                    type="checkbox"
                    v-model="filtroModalApenasRejeicao"
                    @change="pageModalPedidos = 1"
                  />
                  Exibir apenas pedidos em rejeição
                </label>
              </div>

              <!-- Tabela de Pedidos -->
              <div class="table-container-modal">
                <table>
                  <colgroup>
                    <col
                      v-if="mostrarCheckboxesRejeicoes"
                      class="col-checkbox"
                    />
                    <col class="col-pedido" />
                    <col class="col-data" />
                    <col class="col-data" />
                    <col class="col-status" />
                    <col class="col-motivo" />
                    <col class="col-acoes" />
                    <col class="col-reprocessado" />
                    <col class="col-resolvido" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th
                        v-if="mostrarCheckboxesRejeicoes"
                        class="col-checkbox"
                      >
                        <input
                          type="checkbox"
                          class="checkbox-select-all"
                          :checked="todosPedidosVisiveisSelecionados"
                          :indeterminate.prop="
                            algunsPedidosVisiveisSelecionados
                          "
                          @change="toggleSelecionarTodosVisiveis"
                          :title="
                            todosPedidosVisiveisSelecionados
                              ? 'Desmarcar todos'
                              : 'Marcar todos os pedidos da página'
                          "
                        />
                      </th>
                      <th class="col-pedido">N° Pedido</th>
                      <th class="col-data">Data Movimento</th>
                      <th class="col-data">Data Inclusão</th>
                      <th class="col-status">Status</th>
                      <th class="col-motivo">Motivo Rejeição</th>
                      <th class="col-acoes">Ação</th>
                      <th class="col-reprocessado">
                        Reprocessado com Sucesso?
                      </th>
                      <th class="col-resolvido">Resolvido em</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="pedido in pedidosVisiveis"
                      :key="chavePedido(pedido)"
                      :class="{
                        'row-selecionada': isPedidoSelecionado(pedido),
                        'row-pode-remover': pedido.podeRemover,
                      }"
                    >
                      <td
                        v-if="mostrarCheckboxesRejeicoes"
                        class="col-checkbox"
                      >
                        <input
                          type="checkbox"
                          :value="chavePedido(pedido)"
                          @change="toggleSelecaoPedido(pedido)"
                          :checked="isPedidoSelecionado(pedido)"
                          class="checkbox-pedido"
                        />
                      </td>
                      <td class="col-pedido">
                        <strong>{{ pedido.pedido }}</strong>
                      </td>
                      <td class="col-data">
                        {{ formatarData(pedido.dt_movimento) }}
                      </td>
                      <td class="col-data">
                        {{ formatarDataHora(pedido.dt_inclusao) }}
                      </td>
                      <td class="col-status">
                        <span
                          class="status-badge"
                          :class="
                            getStatusExibicaoClass(pedido.status_exibicao)
                          "
                          :title="
                            pedido.status_exibicao || pedido.sit_arquivo || ''
                          "
                        >
                          {{
                            pedido.status_exibicao || pedido.sit_arquivo || '—'
                          }}
                        </span>
                      </td>
                      <td class="col-motivo">
                        <span :title="pedido.rejeicao || '-'">
                          {{ pedido.rejeicao || '-' }}
                        </span>
                      </td>
                      <td class="col-acoes">
                        <button
                          v-if="
                            pedido.status_exibicao === 'C/ Rejeições' ||
                            pedido.status_exibicao === 'Integrado'
                          "
                          class="btn-action btn-detalhar"
                          @click="abrirDetalhePedido(pedido)"
                          :disabled="carregandoDetalhe === chavePedido(pedido)"
                          :title="
                            pedido.status_exibicao === 'Integrado'
                              ? 'Ver itens do pedido (original e ajustado)'
                              : 'Detalhar itens rejeitados do pedido'
                          "
                        >
                          <i class="fa fa-list-alt"></i>
                          <span v-if="carregandoDetalhe !== chavePedido(pedido)"
                            >Detalhar</span
                          >
                          <span v-else>...</span>
                        </button>
                        <button
                          v-else-if="pedido.podeRemover && podeIgnorarRejeicoes"
                          class="btn-action btn-ignorar"
                          @click="removerRejeicao(pedido)"
                          :disabled="processando === chavePedido(pedido)"
                          :title="
                            processando === chavePedido(pedido)
                              ? 'Processando...'
                              : 'Ignorar pedido rejeitado'
                          "
                        >
                          <i class="fa fa-eye-slash"></i>
                          <span v-if="processando !== chavePedido(pedido)"
                            >Ignorar</span
                          >
                          <span v-else>...</span>
                        </button>
                        <span v-else class="info-text">
                          <i class="fa fa-info-circle"></i>
                          Aguardando
                        </span>
                      </td>
                      <td class="col-reprocessado">
                        <span
                          v-if="pedido.reprocessado_com_sucesso === 'Sim'"
                          class="reprocessado-sim"
                          >Sim</span
                        >
                        <span
                          v-else-if="pedido.reprocessado_com_sucesso === 'Não'"
                          class="reprocessado-nao"
                          >Não</span
                        >
                        <span v-else class="reprocessado-vazio">—</span>
                      </td>
                      <td class="col-resolvido">
                        <span
                          v-if="
                            pedido.status_exibicao === 'Integrado' &&
                            pedido.dt_integrado_em
                          "
                        >
                          {{ formatarDataHora(pedido.dt_integrado_em) }}
                        </span>
                        <span v-else class="resolvido-vazio">—</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <!-- Paginação -->
              <div
                v-if="pedidosFiltradosModal.length > TAMANHO_PAGINA"
                class="paginacao-modal"
              >
                <span class="paginacao-info">
                  Página {{ formatarQuantidade(pageModalPedidos) }} de
                  {{ formatarQuantidade(totalPaginasModal) }} (exibindo
                  {{ formatarQuantidade(pedidosVisiveis.length) }} de
                  {{ formatarQuantidade(pedidosFiltradosModal.length) }}
                  pedidos)
                </span>
                <div class="paginacao-botoes">
                  <button
                    type="button"
                    class="btn-pagina"
                    :disabled="pageModalPedidos <= 1"
                    @click="
                      pageModalPedidos = Math.max(1, pageModalPedidos - 1)
                    "
                  >
                    <i class="fa fa-chevron-left"></i> Anterior
                  </button>
                  <button
                    type="button"
                    class="btn-pagina"
                    :disabled="pageModalPedidos >= totalPaginasModal"
                    @click="
                      pageModalPedidos = Math.min(
                        totalPaginasModal,
                        pageModalPedidos + 1
                      )
                    "
                  >
                    Próxima <i class="fa fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Modal Detalhe do Pedido Rejeitado -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="modalDetalhe" class="modal-overlay">
          <div class="modal-detalhe-pedido">
            <div class="modal-detalhe-header">
              <h3>
                <i class="fa fa-list-alt"></i>
                Detalhe do Pedido {{ modalDetalhe.pedido }} —
                {{ modalCliente?.cliente || '' }}
              </h3>
              <button
                class="btn-fechar"
                @click="fecharModalDetalhe"
                type="button"
              >
                <i class="fa fa-times"></i>
              </button>
            </div>
            <div class="modal-detalhe-body">
              <div v-if="carregandoItens" class="detalhe-loading">
                <i class="fa fa-spinner fa-spin"></i> Carregando itens...
              </div>
              <div v-else-if="itensDetalhe.length === 0" class="detalhe-vazio">
                Nenhum item encontrado na tabela wbh para este pedido.
              </div>
              <div v-else class="detalhe-itens-container">
                <!-- Exibição por tentativas (original / reprocessado X / ajustado) -->
                <div
                  v-if="tentativasDetalhe.length > 0"
                  class="detalhe-itens-grid"
                >
                  <div
                    v-for="(t, ti) in tentativasDetalhe"
                    :key="'tent-' + ti"
                    class="detalhe-itens-col"
                  >
                    <h4 class="detalhe-itens-titulo">
                      <i
                        :class="
                          t.tipo === 'ajustado'
                            ? 'fa fa-check-circle'
                            : 'fa fa-exclamation-triangle'
                        "
                      ></i>
                      <span class="detalhe-titulo-text">{{
                        tituloTentativa(t)
                      }}</span>
                    </h4>
                    <div class="detalhe-data-linha">
                      <span v-if="t.dt" class="detalhe-data-badge">{{
                        formatarDataHora(t.dt)
                      }}</span>
                    </div>
                    <div class="detalhe-tentativa-resumo-slot">
                      <p
                        v-if="t.qtdRejeitados > 0"
                        class="detalhe-tentativa-resumo"
                      >
                        Rejeitou
                        {{ formatarQuantidade(t.qtdRejeitados) }} item(ns)
                      </p>
                      <p
                        v-else-if="t.status === 'integrado'"
                        class="detalhe-tentativa-resumo detalhe-tentativa-ok"
                      >
                        Enviado com sucesso
                      </p>
                    </div>
                    <div class="table-container-detalhe">
                      <table class="tabela-itens-detalhe">
                        <thead>
                          <tr>
                            <th>Cód.</th>
                            <th>Mercadoria</th>
                            <th>Motivo</th>
                            <th>Qt.</th>
                            <th>Qt. Rejeitada</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(item, idx) in t.itens"
                            :key="'t' + ti + '-' + idx"
                          >
                            <td>{{ item.cod_merc }}</td>
                            <td>{{ item.mercadoria }}</td>
                            <td>{{ item.motivo_rejeicao || '—' }}</td>
                            <td>
                              {{
                                (item.qt_mercadoria_ok ?? item.qt_mercadoria) !=
                                null
                                  ? formatarQuantidade(
                                      item.qt_mercadoria_ok ??
                                        item.qt_mercadoria
                                    )
                                  : '—'
                              }}
                            </td>
                            <td>
                              {{
                                item.qt_rejeicao != null && item.qt_rejeicao > 0
                                  ? formatarQuantidade(item.qt_rejeicao)
                                  : '—'
                              }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <!-- Fallback: formato antigo (2 colunas) quando não há múltiplas tentativas -->
                <div v-else class="detalhe-itens-grid">
                  <div class="detalhe-itens-col">
                    <h4 class="detalhe-itens-titulo">
                      <i class="fa fa-exclamation-triangle"></i> Pedido original
                      (primeiro envio — rejeitado)
                      <span
                        v-if="dtOriginalDetalhe"
                        class="detalhe-data-badge"
                        >{{ formatarDataHora(dtOriginalDetalhe) }}</span
                      >
                    </h4>
                    <div class="table-container-detalhe">
                      <table class="tabela-itens-detalhe">
                        <thead>
                          <tr>
                            <th>Cód.</th>
                            <th>Mercadoria</th>
                            <th>Motivo</th>
                            <th>Qt. Original</th>
                            <th>Qt. Rejeitada</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(item, idx) in itensOriginaisDetalhe"
                            :key="'orig-' + idx"
                          >
                            <td>{{ item.cod_merc }}</td>
                            <td>{{ item.mercadoria }}</td>
                            <td>{{ item.motivo_rejeicao || '—' }}</td>
                            <td>
                              {{
                                item.qt_mercadoria != null
                                  ? formatarQuantidade(item.qt_mercadoria)
                                  : '—'
                              }}
                            </td>
                            <td>
                              {{
                                item.qt_rejeicao != null
                                  ? formatarQuantidade(item.qt_rejeicao)
                                  : '—'
                              }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div
                    v-if="modalDetalhe?.status_exibicao === 'Integrado'"
                    class="detalhe-itens-col"
                  >
                    <h4 class="detalhe-itens-titulo">
                      <i class="fa fa-check-circle"></i> Pedido ajustado (envio
                      com sucesso)
                      <span
                        v-if="dtResolvidoDetalhe"
                        class="detalhe-data-badge"
                        >{{ formatarDataHora(dtResolvidoDetalhe) }}</span
                      >
                    </h4>
                    <div class="table-container-detalhe">
                      <table class="tabela-itens-detalhe">
                        <thead>
                          <tr>
                            <th>Cód.</th>
                            <th>Mercadoria</th>
                            <th>Motivo</th>
                            <th>Qt. Ajustada</th>
                            <th>Qt. Rejeitada</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(item, idx) in itensAjustadosDetalhe"
                            :key="'ajust-' + idx"
                          >
                            <td>{{ item.cod_merc }}</td>
                            <td>{{ item.mercadoria }}</td>
                            <td>{{ item.motivo_rejeicao || '—' }}</td>
                            <td>
                              {{
                                (item.qt_mercadoria_ok ?? item.qt_mercadoria) !=
                                null
                                  ? formatarQuantidade(
                                      item.qt_mercadoria_ok ??
                                        item.qt_mercadoria
                                    )
                                  : '—'
                              }}
                            </td>
                            <td>
                              {{
                                item.qt_rejeicao != null && item.qt_rejeicao > 0
                                  ? formatarQuantidade(item.qt_rejeicao)
                                  : '—'
                              }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div
                  v-if="
                    tentativasDetalhe.length === 0 &&
                    modalDetalhe?.status_exibicao === 'Integrado' &&
                    (removidosDetalhe.length > 0 || ajustadosDetalhe.length > 0)
                  "
                  class="detalhe-comparacao-resumo"
                >
                  <h4>
                    <i class="fa fa-exchange-alt"></i> Resumo de alterações
                  </h4>
                  <div
                    v-if="removidosDetalhe.length > 0"
                    class="resumo-removidos"
                  >
                    <strong>Itens removidos:</strong>
                    <ul>
                      <li v-for="(r, i) in removidosDetalhe" :key="'rem-' + i">
                        {{ r[1] }} — {{ r[0] }} (qt: {{ r[2] }})
                      </li>
                    </ul>
                  </div>
                  <div
                    v-if="ajustadosDetalhe.length > 0"
                    class="resumo-ajustados"
                  >
                    <strong>Itens ajustados (qt alterada):</strong>
                    <ul>
                      <li v-for="(a, i) in ajustadosDetalhe" :key="'aj-' + i">
                        {{ a[1] }} — {{ a[0] }} (de {{ a[2] }} para {{ a[3] }})
                      </li>
                    </ul>
                  </div>
                </div>
                <p
                  v-else-if="
                    tentativasDetalhe.length === 0 &&
                    modalDetalhe?.status_exibicao === 'Integrado'
                  "
                  class="detalhe-info-comparacao"
                >
                  <i class="fa fa-info-circle"></i>
                  Para pedidos já integrados, o histórico do estado original
                  pode não estar disponível. Os itens exibidos correspondem ao
                  estado atual na tabela wbh.
                </p>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Modal Motivo ao Ignorar Pedido -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div
          v-if="modalIgnorarMotivo.visivel"
          class="modal-overlay"
          @click.self="fecharModalIgnorarMotivo"
        >
          <div class="modal-ignorar-motivo">
            <div class="modal-ignorar-header">
              <h3>
                <i class="fa fa-eye-slash"></i>
                {{
                  modalIgnorarMotivo.tipo === 'batch'
                    ? 'Ignorar Pedidos Selecionados'
                    : 'Ignorar Pedido Rejeitado'
                }}
              </h3>
              <button
                class="btn-fechar"
                @click="fecharModalIgnorarMotivo"
                type="button"
              >
                <i class="fa fa-times"></i>
              </button>
            </div>
            <div class="modal-ignorar-body">
              <p class="modal-ignorar-info">
                {{
                  modalIgnorarMotivo.tipo === 'batch'
                    ? `Você está ignorando ${modalIgnorarMotivo.quantidade} pedido(s). Informe o motivo:`
                    : `Pedido ${modalIgnorarMotivo.pedido?.pedido || ''} — informe o motivo:`
                }}
              </p>
              <div class="motivo-opcoes">
                <label class="motivo-radio">
                  <input type="radio" v-model="motivoTipo" value="1" />
                  <span>1 - Outros</span>
                </label>
                <label class="motivo-radio">
                  <input type="radio" v-model="motivoTipo" value="2" />
                  <span>2 - Pedido Integrado manualmente</span>
                </label>
              </div>
              <div v-if="motivoTipo === '1'" class="motivo-campo">
                <label for="motivo-outros"
                  >Resuma o motivo de estar ignorando o pedido:</label
                >
                <textarea
                  id="motivo-outros"
                  v-model="motivoOutros"
                  rows="4"
                  placeholder="Descreva o motivo..."
                  maxlength="65535"
                ></textarea>
              </div>
              <div v-else-if="motivoTipo === '2'" class="motivo-campo">
                <label for="dp-pedido-manual"
                  >Cole a DP do pedido que foi criada para o pedido
                  manual:</label
                >
                <input
                  id="dp-pedido-manual"
                  v-model="dpPedidoManual"
                  type="text"
                  placeholder="Ex: 1.234.567"
                  maxlength="10"
                />
              </div>
            </div>
            <div class="modal-ignorar-footer">
              <button
                type="button"
                class="btn-cancelar"
                @click="fecharModalIgnorarMotivo"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="btn-confirmar"
                :disabled="!podeConfirmarIgnorar"
                @click="confirmarIgnorarComMotivo"
              >
                <i
                  v-if="processando === 'ignorar-motivo'"
                  class="fa fa-spinner fa-spin"
                ></i>
                {{
                  processando === 'ignorar-motivo'
                    ? 'Processando...'
                    : 'Confirmar e Ignorar'
                }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script>
import { ref, shallowRef, computed, watch, onMounted, onUnmounted } from 'vue'
import { rejeicaoService } from '@/services/api'
import { useRejeicoesStore } from '@/stores/rejeicoes'
import { showNotification } from '@/utils/notifications'

export default {
  name: 'RejeicoesPage',
  setup() {
    // shallowRef: 55k objetos sem proxy profundo — evita travamento ao receber dados
    const rejeicoes = shallowRef([])
    const carregando = ref(false)
    const mostrarPopupAtualizando = ref(false)
    const modalWhatsappProgress = ref({
      visivel: false,
      enviadas: 0,
      total: 0,
      erros: [],
    })
    const processando = ref(null)
    const filtroCliente = ref('')
    const filtroStatus = ref('')
    const filtroAdmin = ref('')
    const filtroArmazem = ref('')
    const clientesExpandidos = ref(new Set())
    const pedidosSelecionados = ref([])
    const pedidosSelecionadosSet = computed(
      () => new Set(pedidosSelecionados.value)
    )
    const modalCliente = ref(null)
    const modalDetalhe = ref(null)
    const mapeamentosClienteGrupo = ref([])
    const pageModalPedidos = ref(1)
    const pagePedidosPlana = ref(1)
    const TAMANHO_PAGINA = 500
    const filtroModalApenasRejeicao = ref(false)
    const filtroModalPedido = ref('')
    const itensDetalhe = ref([])
    const carregandoDetalhe = ref(null)
    const carregandoItens = ref(false)

    const modalIgnorarMotivo = ref({
      visivel: false,
      tipo: 'single',
      pedido: null,
      quantidade: 0,
    })
    const motivoTipo = ref('1')
    const motivoOutros = ref('')
    const dpPedidoManual = ref('')

    const mostrarCalendario = ref(false)
    const dataInicio = ref('')
    const dataFim = ref('')
    const presetAtivo = ref('')

    const presets = [
      { id: 'ontem', label: 'Ontem' },
      { id: 'hoje', label: 'Hoje' },
      { id: 'esta_semana', label: 'Esta Semana' },
      { id: 'semana_passada', label: 'Semana Passada' },
      { id: 'este_mes', label: 'Este Mês' },
      { id: 'mes_passado', label: 'Mês Passado' },
    ]

    const getHoje = () => {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      return d
    }
    /** YYYY-MM-DD em horário local (evita deslocamento por fuso) */
    const toISO = d => {
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${day}`
    }

    /** YYYY-MM-DD -> DD/MM/YYYY para exibição no input */
    const isoToDDMMYYYY = v => {
      if (!v) return ''
      const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/)
      return m ? `${m[3]}/${m[2]}/${m[1]}` : v
    }

    /** Converte DD/MM/AAAA para YYYY-MM-DD. Retorna '' se inválido ou incompleto. */
    const parseDDMMYYYY = str => {
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
      return toISO(d)
    }

    /** Formata durante digitação: apenas dígitos -> DD/MM/AAAA */
    const formatarParaInput = val => {
      if (!val) return ''
      const nums = String(val).replace(/\D/g, '')
      if (nums.length <= 2) return nums
      if (nums.length <= 4) return `${nums.slice(0, 2)}/${nums.slice(2)}`
      return `${nums.slice(0, 2)}/${nums.slice(2, 4)}/${nums.slice(4, 8)}`
    }

    const dataInicioDisplay = ref('')
    const dataFimDisplay = ref('')

    /** Sincroniza cada display com seu modelo (evita sobrescrever o outro campo ao digitar) */
    const syncDataInicioDisplay = () => {
      dataInicioDisplay.value = isoToDDMMYYYY(dataInicio.value)
    }
    const syncDataFimDisplay = () => {
      dataFimDisplay.value = isoToDDMMYYYY(dataFim.value)
    }

    /** v-model com formatação automática (igual BI-SLA): digita só números, barras aparecem sozinhas */
    const dataInicioDisplayModel = computed({
      get: () => dataInicioDisplay.value,
      set: val => {
        const formatado = formatarParaInput(val)
        dataInicioDisplay.value = formatado
        const parsed = parseDDMMYYYY(formatado)
        if (parsed || formatado === '') dataInicio.value = parsed
        if (formatado) presetAtivo.value = ''
      },
    })
    const dataFimDisplayModel = computed({
      get: () => dataFimDisplay.value,
      set: val => {
        const formatado = formatarParaInput(val)
        dataFimDisplay.value = formatado
        const parsed = parseDDMMYYYY(formatado)
        if (parsed || formatado === '') dataFim.value = parsed
        if (formatado) presetAtivo.value = ''
      },
    })

    watch(dataInicio, syncDataInicioDisplay, { immediate: true })
    watch(dataFim, syncDataFimDisplay, { immediate: true })

    const formatarQuantidade = n => {
      const num = typeof n === 'number' ? n : parseInt(n, 10) || 0
      return num.toLocaleString('pt-BR')
    }

    /** Normaliza nome do cliente para agrupar/filtrar (trim, minúsculas, sem acentos) — evita só 8 por variação no banco */
    const normalizarCliente = s => {
      if (!s || typeof s !== 'string') return ''
      return s
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/\s+/g, ' ')
    }

    const labelIntervaloAtual = computed(() => {
      if (!dataInicio.value && !dataFim.value) return 'Todos'
      if (dataInicio.value && dataFim.value)
        return `${formatarData(dataInicio.value)} - ${formatarData(dataFim.value)}`
      return dataInicio.value
        ? formatarData(dataInicio.value)
        : formatarData(dataFim.value)
    })

    /** Nível: 0=dev, 1=cliente, 2=admin, 3=gerente */
    const rejeicoesUserLevel = computed(() => {
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return null
        const user = JSON.parse(userData)
        return user.level_access != null ? Number(user.level_access) : null
      } catch {
        return null
      }
    })

    /** Quantidade de CNPJs (14 dígitos) em cli_access — só relevante para nível 1 */
    const qtdCnpjsCliAccess = computed(() => {
      if (rejeicoesUserLevel.value !== 1) return 0
      try {
        const userData = localStorage.getItem('user')
        if (!userData) return 0
        const user = JSON.parse(userData)
        let cli = user?.cli_access || {}
        if (typeof cli === 'string' && cli) {
          try {
            cli = JSON.parse(cli)
          } catch {
            cli = {}
          }
        }
        if (typeof cli !== 'object' || !cli) return 0
        let n = 0
        for (const k of Object.keys(cli)) {
          const d = String(k).replace(/\D/g, '')
          if (d.length === 14) n++
        }
        return n
      } catch {
        return 0
      }
    })

    /** Cliente com um único CNPJ: lista plana de pedidos na tela principal */
    const visaoClientePedidosPlana = computed(
      () => rejeicoesUserLevel.value === 1 && qtdCnpjsCliAccess.value === 1
    )

    const rejeicoesFiltradas = computed(() => {
      let filtradas = rejeicoes.value

      if (filtroCliente.value) {
        const busca = String(filtroCliente.value).trim()
        const buscaLower = busca.toLowerCase()
        const buscaNum = busca.replace(/\D/g, '')
        if (rejeicoesUserLevel.value === 1) {
          filtradas = filtradas.filter(r => {
            const ped = String(r.pedido ?? '')
            const pedNorm = ped.replace(/\D/g, '')
            return (
              ped.toLowerCase().includes(buscaLower) ||
              (buscaNum.length > 0 && pedNorm.includes(buscaNum))
            )
          })
        } else {
          filtradas = filtradas.filter(r => {
            const nome = (r.nome_cliente || '').toLowerCase()
            const idStr = String(r.id_cliente ?? '')
            const idNorm = idStr.replace(/\D/g, '')
            return (
              nome.includes(buscaLower) ||
              idStr.includes(busca) ||
              (buscaNum && (idNorm.includes(buscaNum) || idStr.includes(busca)))
            )
          })
        }
      }

      if (filtroStatus.value === 'rejeitado') {
        filtradas = filtradas.filter(r => r.status_exibicao === 'C/ Rejeições')
      } else if (filtroStatus.value === 'reprocessado') {
        filtradas = filtradas.filter(r => r.status_exibicao === 'Integrado')
      } else if (filtroStatus.value === 'tratados') {
        // Pedidos que estavam com rejeição e foram tratados (reprocessados): Sim ou Não
        filtradas = filtradas.filter(
          r =>
            r.reprocessado_com_sucesso != null &&
            String(r.reprocessado_com_sucesso).trim() !== ''
        )
      }

      return filtradas
    })

    const rejeicoesAgrupadas = computed(() => {
      const grupos = {}
      const isRejeicao = r => {
        if (!r?.sit_arquivo) return false
        const sit = String(r.sit_arquivo).trim()
        if (sit === 'S/ Rejeições') return false // Apenas S/ Rejeições = integrado; Reprocessado não
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

      // Agrupar por (id_cliente, nome) — id_cliente é a identificação do cliente (ex: 691), estabelecimento (ML) é o armazém
      rejeicoesFiltradas.value.forEach(rejeicao => {
        const nomeRaw = rejeicao.nome_cliente || 'Sem Cliente'
        const idCliente = rejeicao.id_cliente ?? ''
        const keyNorm = `${idCliente}|${normalizarCliente(nomeRaw) || 'sem cliente'}`
        if (!grupos[keyNorm]) {
          grupos[keyNorm] = {
            cliente: (nomeRaw.trim() || 'Sem Cliente').toUpperCase(),
            id_cliente: rejeicao.id_cliente,
            estabelecimento: rejeicao.estabelecimento,
            adm: (rejeicao.adm || '').trim(),
            pedidos: [],
            expandido: clientesExpandidos.value.has(
              `${idCliente}|${nomeRaw.trim()}`
            ),
          }
        }
        const key = `${rejeicao.pedido}_${idCliente}`
        if (!grupos[keyNorm]._porPedido) grupos[keyNorm]._porPedido = {}
        if (!grupos[keyNorm]._porPedido[key])
          grupos[keyNorm]._porPedido[key] = []
        grupos[keyNorm]._porPedido[key].push(rejeicao)
      })

      // Usar porPedido diretamente — evita O(n*grupos) de rejeicoesFiltradas.forEach por grupo
      Object.keys(grupos).forEach(keyNorm => {
        const grupo = grupos[keyNorm]
        const porPedido = grupo._porPedido || {}
        grupo.pedidos = []
        Object.entries(porPedido).forEach(([key, registros]) => {
          if (!registros?.length) return
          const temRejeicao = registros.some(isRejeicao)
          const temSemRejeicao = registros.some(
            r => r.sit_arquivo === 'S/ Rejeições'
          )
          const podeRemoverPorKey = temSemRejeicao && temRejeicao
          const r = registros[0]
          const emRejeicao = isRejeicao(r)
          const podeRemover =
            r.sit_arquivo === 'S/ Rejeições' && podeRemoverPorKey
          const integrado = r.status_exibicao === 'Integrado'
          if (emRejeicao || podeRemover || integrado) {
            grupo.pedidos.push({
              ...r,
              podeRemover,
              temRejeicaoAnterior: podeRemoverPorKey,
              registros,
            })
          }
        })
        delete grupo._porPedido
        grupo.pedidosEmRejeicao = grupo.pedidos.filter(
          p => p.status_exibicao === 'C/ Rejeições'
        ).length
        grupo.pedidosIntegrados = grupo.pedidos.filter(
          p => p.status_exibicao === 'Integrado'
        ).length
        grupo.pedidos.sort((a, b) => {
          const rejA = a.status_exibicao === 'C/ Rejeições' ? 0 : 1
          const rejB = b.status_exibicao === 'C/ Rejeições' ? 0 : 1
          if (rejA !== rejB) return rejA - rejB
          const dataA = new Date(a.dt_movimento || 0)
          const dataB = new Date(b.dt_movimento || 0)
          return dataA - dataB
        })
      })

      const gruposFiltrados = Object.values(grupos).filter(
        g => g.pedidos.length > 0
      )
      return gruposFiltrados.sort((a, b) => {
        const rejA = a.pedidosEmRejeicao || 0
        const rejB = b.pedidosEmRejeicao || 0
        if (rejB !== rejA) return rejB - rejA
        return a.cliente.localeCompare(b.cliente)
      })
    })

    /** Clientes com pedidos em rejeição: C/ Rejeições (atual) OU Integrado (reprocessado — teve rejeição e foi corrigido) */
    const clientesComRejeicao = computed(() => {
      return rejeicoesAgrupadas.value.filter(
        g => (g.pedidosEmRejeicao || 0) > 0 || (g.pedidosIntegrados || 0) > 0
      )
    })

    /** Lista exibida: mesma de clientesComRejeicao (inclui C/ Rejeições e Integrados/reprocessados) */
    const clientesListagem = computed(() => clientesComRejeicao.value)

    /** Armazéns únicos presentes na lista de clientes com rejeição */
    const armazensDisponiveis = computed(() => {
      const set = new Set()
      clientesListagem.value.forEach(g => {
        const e = (g?.estabelecimento ?? '').toString().trim()
        if (e) set.add(e)
      })
      return Array.from(set).sort()
    })

    /** Filtro Admin (adm da wcl): apenas nível 0 e 3, como no BI */
    const showFiltroAdmin = computed(() => {
      const l = rejeicoesUserLevel.value
      return l === 0 || l === 3
    })

    /** Filtro Armazém: apenas nível 0 (dev); oculto para admins (2 e 3) */
    const showFiltroArmazem = computed(() => rejeicoesUserLevel.value === 0)

    /** Apenas nível 0 (dev) envia WhatsApp */
    const podeEnviarWhatsappRejeicoes = computed(
      () => rejeicoesUserLevel.value === 0
    )

    /** Nível 1 (cliente): somente consulta — não ignora / não altera rejeição */
    const podeIgnorarRejeicoes = computed(() => rejeicoesUserLevel.value !== 1)

    const mostrarCheckboxesRejeicoes = computed(
      () => rejeicoesUserLevel.value !== 1
    )

    /** Valores distintos de adm nos dados carregados (como BI) */
    const opcoesAdmDistintos = computed(() => {
      const set = new Set()
      const list = clientesListagem.value || []
      const armazem = (filtroArmazem.value || '').trim()
      for (const g of list) {
        if (armazem && String(g?.estabelecimento ?? '').trim() !== armazem)
          continue
        const a = (g?.adm != null ? String(g.adm).trim() : '') || ''
        set.add(a === '' ? null : a)
      }
      return Array.from(set).sort((a, b) =>
        (a || '').localeCompare(b || '', 'pt-BR')
      )
    })

    /** Filtra clientes pelo admin (adm wcl) e armazém selecionados */
    const clientesExibicao = computed(() => {
      let lista = clientesListagem.value
      if (filtroAdmin.value) {
        if (filtroAdmin.value === '__VAZIO__') {
          lista = lista.filter(g => !(g?.adm || '').trim())
        } else {
          lista = lista.filter(
            g =>
              (g?.adm || '').trim().toLowerCase() ===
              filtroAdmin.value.trim().toLowerCase()
          )
        }
      }
      if (filtroArmazem.value) {
        lista = lista.filter(
          g =>
            String(g?.estabelecimento ?? '').trim() ===
            String(filtroArmazem.value).trim()
        )
      }
      return lista
    })

    /** Pedidos em lista única (1 CNPJ no login): mesmos objetos do modal */
    const pedidosPlanaCliente = computed(() => {
      if (!visaoClientePedidosPlana.value) return []
      const list = clientesExibicao.value.flatMap(g => g.pedidos || [])
      return [...list].sort((a, b) => {
        const rejA = a.status_exibicao === 'C/ Rejeições' ? 0 : 1
        const rejB = b.status_exibicao === 'C/ Rejeições' ? 0 : 1
        if (rejA !== rejB) return rejA - rejB
        const dataA = new Date(a.dt_movimento || 0)
        const dataB = new Date(b.dt_movimento || 0)
        return dataB - dataA
      })
    })

    const totalPaginasPlana = computed(() => {
      const total = pedidosPlanaCliente.value.length || 0
      return Math.max(1, Math.ceil(total / TAMANHO_PAGINA))
    })

    const pedidosPlanaVisiveis = computed(() => {
      const pedidos = pedidosPlanaCliente.value
      if (pedidos.length <= TAMANHO_PAGINA) return pedidos
      const inicio = (pagePedidosPlana.value - 1) * TAMANHO_PAGINA
      return pedidos.slice(inicio, inicio + TAMANHO_PAGINA)
    })

    const totalPedidosListaPlana = computed(
      () => pedidosPlanaCliente.value.length
    )
    const totalEmRejeicaoPlana = computed(
      () =>
        pedidosPlanaCliente.value.filter(
          p => p.status_exibicao === 'C/ Rejeições'
        ).length
    )

    const pedidosDisponiveisSelecao = computed(() => {
      if (modalCliente.value) return modalCliente.value.pedidos || []
      if (visaoClientePedidosPlana.value) return pedidosPlanaCliente.value
      return []
    })

    const totalClientesComRejeicao = computed(
      () => clientesExibicao.value.length
    )
    const totalPedidosEmRejeicao = computed(() => {
      return clientesExibicao.value.reduce(
        (acc, g) => acc + (g.pedidosEmRejeicao || 0),
        0
      )
    })

    const podeConfirmarIgnorar = computed(() => {
      if (motivoTipo.value === '1')
        return (motivoOutros.value || '').trim().length > 0
      if (motivoTipo.value === '2')
        return (dpPedidoManual.value || '').trim().length > 0
      return false
    })

    const modalGrupoVinculado = computed(() => {
      const id = modalCliente.value?.id_cliente
      if (id == null || id === '') return ''
      const m = (mapeamentosClienteGrupo.value || []).find(
        x => String(x?.id_cliente ?? '') === String(id)
      )
      return (m?.grupo_saidas_nome || m?.grupo_saidas_jid || '').trim() || ''
    })

    const modalPedidosEmRejeicao = computed(() => {
      const pedidos = modalCliente.value?.pedidos || []
      return pedidos.filter(p => p.status_exibicao === 'C/ Rejeições').length
    })
    const modalPedidosIntegrados = computed(() => {
      const pedidos = modalCliente.value?.pedidos || []
      return pedidos.filter(p => p.status_exibicao === 'Integrado').length
    })
    const pedidosFiltradosModal = computed(() => {
      let pedidos = modalCliente.value?.pedidos || []
      const buscaPedido = (filtroModalPedido.value || '').trim()
      if (buscaPedido) {
        const buscaNum = buscaPedido.replace(/\D/g, '')
        pedidos = pedidos.filter(p => {
          const pedStr = String(p.pedido ?? '')
          const pedNorm = pedStr.replace(/\D/g, '')
          return (
            pedStr.includes(buscaPedido) ||
            (buscaNum && pedNorm.includes(buscaNum))
          )
        })
      }
      if (!filtroModalApenasRejeicao.value) return pedidos
      return pedidos.filter(p => p.status_exibicao === 'C/ Rejeições')
    })
    const pedidosVisiveis = computed(() => {
      const pedidos = pedidosFiltradosModal.value
      if (pedidos.length <= TAMANHO_PAGINA) return pedidos
      const inicio = (pageModalPedidos.value - 1) * TAMANHO_PAGINA
      return pedidos.slice(inicio, inicio + TAMANHO_PAGINA)
    })
    const totalPaginasModal = computed(() => {
      const total = pedidosFiltradosModal.value.length || 0
      return Math.max(1, Math.ceil(total / TAMANHO_PAGINA))
    })

    /** Checkboxes “selecionar página”: modal ou lista plana */
    const pedidosVisiveisSelecao = computed(() => {
      if (modalCliente.value) return pedidosVisiveis.value
      if (visaoClientePedidosPlana.value) return pedidosPlanaVisiveis.value
      return []
    })

    watch([filtroCliente, pedidosPlanaCliente], () => {
      pagePedidosPlana.value = 1
    })

    const aplicarPreset = id => {
      presetAtivo.value = id
      const hoje = getHoje()
      let ini, fim
      switch (id) {
        case 'ontem':
          const ontem = new Date(hoje)
          ontem.setDate(ontem.getDate() - 1)
          ini = fim = toISO(ontem)
          break
        case 'hoje':
          ini = fim = toISO(hoje)
          break
        case 'esta_semana': {
          const dia = hoje.getDay()
          const seg = new Date(hoje)
          seg.setDate(hoje.getDate() - (dia === 0 ? 6 : dia - 1))
          fim = toISO(hoje)
          ini = toISO(seg)
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
          ini = toISO(segPassada)
          fim = toISO(domPassada)
          break
        }
        case 'este_mes':
          ini = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
          fim = toISO(hoje)
          break
        case 'mes_passado': {
          const prim = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
          const ult = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
          ini = toISO(prim)
          fim = toISO(ult)
          break
        }
        default:
          return
      }
      dataInicio.value = ini
      dataFim.value = fim
      mostrarCalendario.value = false
      carregarRejeicoes({ forceRefresh: true })
    }

    const aplicarIntervalo = () => {
      // Ao clicar Aplicar: prioriza parsing direto dos campos DD/MM/AAAA (fonte da verdade)
      const iniDisplay = String(dataInicioDisplay.value || '').trim()
      const fimDisplay = String(dataFimDisplay.value || '').trim()
      const iniParsed = parseDDMMYYYY(iniDisplay)
      const fimParsed = parseDDMMYYYY(fimDisplay)

      if (iniParsed && fimParsed) {
        dataInicio.value = iniParsed
        dataFim.value = fimParsed
        presetAtivo.value = ''
      }
      mostrarCalendario.value = false
      // forceRefresh para garantir que nova requisição seja feita com os params corretos (evita cache antigo)
      carregarRejeicoes({ forceRefresh: true })
    }

    const limparIntervalo = () => {
      const hoje = getHoje()
      dataInicio.value = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
      dataFim.value = toISO(
        new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
      )
      presetAtivo.value = 'este_mes'
      mostrarCalendario.value = false
      carregarRejeicoes({ forceRefresh: true })
    }

    const irParaHoje = () => {
      dataInicio.value = toISO(getHoje())
      dataFim.value = toISO(getHoje())
    }

    const rejeicoesStore = useRejeicoesStore()
    const carregarRejeicoesEmAndamento = ref(null)
    const carregarRejeicoes = async (opcoes = {}) => {
      const forceRefresh = opcoes.forceRefresh === true
      const params = {}
      if (dataInicio.value) params.data_inicio = dataInicio.value
      if (dataFim.value) params.data_fim = dataFim.value
      if (!dataInicio.value && !dataFim.value) params.todo_periodo = '1'
      const paramsKey = JSON.stringify(params)
      if (forceRefresh) rejeicoesStore.invalidate()
      let cached = forceRefresh ? null : rejeicoesStore.getCached(params)
      if (cached) {
        rejeicoes.value = cached
        return
      }
      const loadPromise = rejeicoesStore.getLoadPromiseIfSameParams(params)
      if (loadPromise) {
        carregando.value = true
        try {
          await loadPromise
          cached = rejeicoesStore.getCached(params)
          if (cached) {
            rejeicoes.value = cached
            return
          }
        } finally {
          carregando.value = false
        }
      }
      if (
        carregarRejeicoesEmAndamento.value &&
        carregarRejeicoesEmAndamento.value.key === paramsKey
      ) {
        await carregarRejeicoesEmAndamento.value.promise
        const c = rejeicoesStore.getCached(params)
        if (c) rejeicoes.value = c
        return
      }
      carregando.value = true
      const promise = (async () => {
        try {
          const response = await rejeicaoService.getRejeicoes(params)
          const data = response.data || []
          rejeicoes.value = data
          rejeicoesStore.setCache(params, data)
        } catch (error) {
          console.error('Erro ao carregar rejeições:', error)
          const errorMessage =
            error.response?.data?.error ||
            error.message ||
            'Erro desconhecido ao carregar rejeições'
          showNotification(errorMessage, 'error')
        } finally {
          carregando.value = false
          if (carregarRejeicoesEmAndamento.value?.key === paramsKey) {
            carregarRejeicoesEmAndamento.value = null
          }
        }
      })()
      carregarRejeicoesEmAndamento.value = { key: paramsKey, promise }
      await promise
    }

    const aoClicarAtualizar = async () => {
      mostrarPopupAtualizando.value = true
      const inicio = Date.now()
      const TEMPO_MINIMO_MS = 800
      try {
        await carregarRejeicoes({ forceRefresh: true })
      } finally {
        const decorrido = Date.now() - inicio
        if (decorrido < TEMPO_MINIMO_MS) {
          await new Promise(r => setTimeout(r, TEMPO_MINIMO_MS - decorrido))
        }
        mostrarPopupAtualizando.value = false
      }
    }

    const toggleCliente = cliente => {
      if (clientesExpandidos.value.has(cliente)) {
        clientesExpandidos.value.delete(cliente)
      } else {
        clientesExpandidos.value.add(cliente)
      }
    }

    const abrirModalIgnorarMotivo = (tipo, pedido = null, quantidade = 0) => {
      motivoTipo.value = '1'
      motivoOutros.value = ''
      dpPedidoManual.value = ''
      modalIgnorarMotivo.value = { visivel: true, tipo, pedido, quantidade }
    }

    const fecharModalIgnorarMotivo = () => {
      modalIgnorarMotivo.value = {
        visivel: false,
        tipo: 'single',
        pedido: null,
        quantidade: 0,
      }
    }

    const confirmarIgnorarComMotivo = async () => {
      if (!podeIgnorarRejeicoes.value) return
      if (!podeConfirmarIgnorar.value) return
      const motivo = {
        motivo_tipo: motivoTipo.value,
        motivo_ignorar_outros:
          motivoTipo.value === '1' ? motivoOutros.value.trim() : null,
        dp_pedido_manual:
          motivoTipo.value === '2'
            ? dpPedidoManual.value.trim().slice(0, 10)
            : null,
      }

      processando.value = 'ignorar-motivo'

      if (
        modalIgnorarMotivo.value.tipo === 'single' &&
        modalIgnorarMotivo.value.pedido
      ) {
        const pedido = modalIgnorarMotivo.value.pedido
        fecharModalIgnorarMotivo()
        processando.value = chavePedido(pedido)
        try {
          const response = await rejeicaoService.removerRejeicao(
            pedido.pedido,
            pedido.id_cliente,
            motivo
          )
          let mensagem = `Pedido ${pedido.pedido} ignorado com sucesso!`
          if (response.data?.whatsapp_enviado) {
            mensagem +=
              '\nNotificação enviada ao grupo do cliente via WhatsApp.'
          } else if (response.data?.whatsapp_erro) {
            mensagem += `\n⚠️ Aviso: Erro ao enviar WhatsApp: ${response.data.whatsapp_erro}`
          }
          showNotification(mensagem, 'success')
          await carregarRejeicoes()
          if (modalCliente.value) {
            const clienteAtual = rejeicoesAgrupadas.value.find(
              g =>
                (g.id_cliente ?? '') ===
                  (modalCliente.value.id_cliente ?? '') &&
                g.cliente === modalCliente.value.cliente
            )
            if (clienteAtual) {
              modalCliente.value = clienteAtual
              if (clienteAtual.pedidos.length === 0) fecharModalPedidos()
            }
          }
        } catch (error) {
          console.error('Erro ao ignorar pedido:', error)
          showNotification(
            `Erro ao ignorar pedido: ${error.response?.data?.error || error.message || 'Erro desconhecido'}`,
            'error'
          )
        } finally {
          processando.value = null
        }
      } else {
        fecharModalIgnorarMotivo()
        processando.value = 'ignorar'
        try {
          const chaves = pedidosSelecionados.value
          const listaParaIgnorar = pedidosDisponiveisSelecao.value
            .filter(p => chaves.includes(chavePedido(p)))
            .map(p => ({ pedido: p.pedido, id_cliente: p.id_cliente }))
          await rejeicaoService.ignorarRejeicoes(listaParaIgnorar, true, motivo)
          showNotification(
            `${listaParaIgnorar.length} pedido(s) ignorado(s) com sucesso!`,
            'success'
          )
          pedidosSelecionados.value = []
          await carregarRejeicoes()
          if (modalCliente.value) {
            const clienteAtual = rejeicoesAgrupadas.value.find(
              g =>
                (g.id_cliente ?? '') ===
                  (modalCliente.value.id_cliente ?? '') &&
                g.cliente === modalCliente.value.cliente
            )
            if (clienteAtual) {
              modalCliente.value = clienteAtual
              if (clienteAtual.pedidos.length === 0) fecharModalPedidos()
            }
          }
        } catch (error) {
          console.error('Erro ao ignorar pedidos:', error)
          showNotification(
            `Erro ao ignorar pedidos: ${error.response?.data?.error || error.message || 'Erro desconhecido'}`,
            'error'
          )
        } finally {
          processando.value = null
        }
      }
    }

    const removerRejeicao = pedido => {
      if (!podeIgnorarRejeicoes.value) return
      abrirModalIgnorarMotivo('single', pedido, 1)
    }

    const aplicarFiltros = () => {
      // Os filtros são aplicados automaticamente via computed
    }

    const formatarData = data => {
      if (!data) return '-'
      try {
        const str = String(data).trim()
        // Exibir exatamente o que veio do banco: só reformatar YYYY-MM-DD -> DD/MM/YYYY
        // Sem usar Date() para não haver conversão de fuso — o que está na tabela é o que aparece.
        const onlyDateMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
        if (onlyDateMatch) {
          const [, ano, mes, dia] = onlyDateMatch
          return `${dia}/${mes}/${ano}`
        }
        const d = new Date(data)
        return Number.isNaN(d.getTime()) ? data : d.toLocaleDateString('pt-BR')
      } catch {
        return data
      }
    }

    const formatarDataHora = data => {
      if (!data) return '-'
      try {
        const d = new Date(data)
        return d.toLocaleString('pt-BR')
      } catch {
        return data
      }
    }

    const getStatusClass = status => {
      if (!status) return ''
      if (status === 'S/ Rejeições') return 'status-ok' // Apenas S/ Rejeições = integrado
      if (status.includes('Rejeição')) return 'status-rejeitado'
      return 'status-outro'
    }

    const getStatusExibicaoClass = statusExibicao => {
      if (!statusExibicao) return 'status-outro'
      if (statusExibicao === 'Integrado') return 'status-ok'
      if (statusExibicao === 'C/ Rejeições') return 'status-rejeitado'
      return 'status-outro'
    }

    const chavePedido = pedido =>
      `${pedido.pedido}_${pedido.id_cliente ?? ''}_${pedido.no_seq ?? pedido.dt_inclusao ?? ''}`

    const toggleSelecaoPedido = pedido => {
      const chave = chavePedido(pedido)
      const arr = pedidosSelecionados.value
      const idx = arr.indexOf(chave)
      if (idx > -1) {
        arr.splice(idx, 1)
      } else {
        arr.push(chave)
      }
    }

    const isPedidoSelecionado = pedido => {
      return pedidosSelecionadosSet.value.has(chavePedido(pedido))
    }

    const todosPedidosVisiveisSelecionados = computed(() => {
      const visiveis = pedidosVisiveisSelecao.value
      if (!visiveis?.length) return false
      const set = pedidosSelecionadosSet.value
      return visiveis.every(p => set.has(chavePedido(p)))
    })

    const algunsPedidosVisiveisSelecionados = computed(() => {
      const visiveis = pedidosVisiveisSelecao.value
      if (!visiveis?.length) return false
      const set = pedidosSelecionadosSet.value
      const selecionados = visiveis.filter(p => set.has(chavePedido(p))).length
      return selecionados > 0 && selecionados < visiveis.length
    })

    const toggleSelecionarTodosVisiveis = () => {
      const visiveis = pedidosVisiveisSelecao.value || []
      if (todosPedidosVisiveisSelecionados.value) {
        const chavesVisiveis = new Set(visiveis.map(p => chavePedido(p)))
        pedidosSelecionados.value = pedidosSelecionados.value.filter(
          ch => !chavesVisiveis.has(ch)
        )
      } else {
        const chavesAtuais = new Set(pedidosSelecionados.value)
        visiveis.forEach(p => chavesAtuais.add(chavePedido(p)))
        pedidosSelecionados.value = Array.from(chavesAtuais)
      }
    }

    const enviarWhatsappSelecionados = async () => {
      if (pedidosSelecionados.value.length === 0) {
        showNotification(
          'Selecione pelo menos um pedido para enviar',
          'warning'
        )
        return
      }

      const chaves = pedidosSelecionados.value
      const lista = pedidosDisponiveisSelecao.value
        .filter(p => chaves.includes(chavePedido(p)))
        .map(p => ({ pedido: p.pedido, id_cliente: p.id_cliente }))

      processando.value = 'whatsapp'
      modalWhatsappProgress.value = {
        visivel: true,
        enviadas: 0,
        total: lista.length,
        erros: [],
      }
      try {
        const resultado = await rejeicaoService.enviarWhatsappRejeicoesStream(
          lista,
          prog => {
            modalWhatsappProgress.value = {
              visivel: true,
              enviadas: prog.enviadas,
              total: prog.total,
              erros: prog.erros || [],
            }
          }
        )
        modalWhatsappProgress.value = {
          ...modalWhatsappProgress.value,
          visivel: false,
        }
        const { enviadas, erros } = resultado
        if (erros?.length > 0) {
          showNotification(
            `${enviadas} enviado(s), ${erros.length} erro(s): ${erros.join('; ')}`,
            enviadas > 0 ? 'warning' : 'error'
          )
        } else {
          showNotification(
            `${enviadas} mensagem(ns) enviada(s) no WhatsApp com sucesso!`,
            'success'
          )
        }
      } catch (error) {
        console.error('Erro ao enviar WhatsApp:', error)
        modalWhatsappProgress.value = {
          ...modalWhatsappProgress.value,
          visivel: false,
        }
        showNotification(
          error?.message ||
            error?.response?.data?.error ||
            'Erro ao enviar WhatsApp',
          'error'
        )
      } finally {
        processando.value = null
      }
    }

    const ignorarSelecionados = () => {
      if (!podeIgnorarRejeicoes.value) return
      if (pedidosSelecionados.value.length === 0) {
        showNotification(
          'Selecione pelo menos um pedido para ignorar',
          'warning'
        )
        return
      }
      abrirModalIgnorarMotivo('batch', null, pedidosSelecionados.value.length)
    }

    const abrirModalPedidos = grupo => {
      modalCliente.value = grupo
      pedidosSelecionados.value = []
      pageModalPedidos.value = 1
      filtroModalApenasRejeicao.value = false
      filtroModalPedido.value = ''
    }

    const fecharModalPedidos = () => {
      modalCliente.value = null
      pedidosSelecionados.value = [] // Limpar seleções ao fechar
    }

    const tentativasDetalhe = ref([])
    const itensOriginaisDetalhe = ref([])
    const itensAjustadosDetalhe = ref([])
    const removidosDetalhe = ref([])
    const ajustadosDetalhe = ref([])
    const temComparacaoDetalhe = ref(false)
    const dtOriginalDetalhe = ref(null)
    const dtResolvidoDetalhe = ref(null)

    const tituloTentativa = t => {
      if (t.tipo === 'original')
        return 'Pedido original (primeiro envio — rejeitado)'
      if (t.tipo === 'ajustado') return 'Pedido ajustado (envio com sucesso)'
      return `Reprocessado tentativa ${t.tentativa}`
    }

    const abrirDetalhePedido = async pedido => {
      const key = chavePedido(pedido)
      modalDetalhe.value = pedido
      itensDetalhe.value = []
      tentativasDetalhe.value = []
      itensOriginaisDetalhe.value = []
      itensAjustadosDetalhe.value = []
      removidosDetalhe.value = []
      ajustadosDetalhe.value = []
      temComparacaoDetalhe.value = false
      dtOriginalDetalhe.value = null
      dtResolvidoDetalhe.value = null
      carregandoDetalhe.value = key
      carregandoItens.value = true
      try {
        const resTent = await rejeicaoService.getItensPedidoRejeitado(
          pedido.pedido,
          pedido.id_cliente,
          false,
          true
        )
        if (resTent?.tentativas?.length > 0) {
          tentativasDetalhe.value = resTent.tentativas
          itensDetalhe.value = resTent.tentativas.flatMap(t => t.itens)
        }
        if (tentativasDetalhe.value.length === 0) {
          const res = await rejeicaoService.getItensPedidoRejeitado(
            pedido.pedido,
            pedido.id_cliente,
            true
          )
          itensDetalhe.value = res?.itens ?? []
          itensOriginaisDetalhe.value = res?.itensOriginais ?? res?.itens ?? []
          let itensAjust = res?.itensAjustados ?? res?.itens ?? []
          if (pedido.status_exibicao === 'Integrado' && itensAjust.length > 0) {
            itensAjust = itensAjust.map(i => ({
              ...i,
              motivo_rejeicao: '',
              qt_rejeicao: 0,
              qt_mercadoria_ok:
                (i.qt_mercadoria_ok ?? 0) > 0
                  ? i.qt_mercadoria_ok
                  : (i.qt_mercadoria ?? 0),
            }))
          }
          itensAjustadosDetalhe.value = itensAjust
          removidosDetalhe.value = res?.removidos ?? []
          ajustadosDetalhe.value = res?.ajustados ?? []
          temComparacaoDetalhe.value = res?.temComparacao ?? false
          dtOriginalDetalhe.value =
            res?.dt_original ?? pedido.dt_inclusao ?? null
          dtResolvidoDetalhe.value =
            res?.dt_resolvido ?? pedido.dt_integrado_em ?? null
        }
        if (itensDetalhe.value.length === 0) {
          showNotification(
            'Nenhum item encontrado para este pedido na tabela wbh',
            'info'
          )
        }
      } catch (err) {
        showNotification(
          err.response?.data?.error || 'Erro ao carregar itens do pedido',
          'error'
        )
        fecharModalDetalhe()
      } finally {
        carregandoDetalhe.value = null
        carregandoItens.value = false
      }
    }

    const fecharModalDetalhe = () => {
      modalDetalhe.value = null
      itensDetalhe.value = []
      tentativasDetalhe.value = []
      itensOriginaisDetalhe.value = []
      itensAjustadosDetalhe.value = []
      removidosDetalhe.value = []
      ajustadosDetalhe.value = []
      temComparacaoDetalhe.value = false
      dtOriginalDetalhe.value = null
      dtResolvidoDetalhe.value = null
      carregandoDetalhe.value = null
    }

    const calendarioRef = ref(null)
    const closeCalendarioAoClicarFora = e => {
      if (
        mostrarCalendario.value &&
        calendarioRef.value &&
        !calendarioRef.value.contains(e.target)
      ) {
        mostrarCalendario.value = false
      }
    }
    const carregarClientesGrupos = async () => {
      try {
        const { data } = await rejeicaoService.getClientesGrupos()
        mapeamentosClienteGrupo.value = data?.mapeamentos || []
      } catch (e) {
        mapeamentosClienteGrupo.value = []
      }
    }

    onMounted(() => {
      // Período padrão: mês atual (do dia 1 até hoje)
      const hoje = getHoje()
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      dataInicio.value = toISO(primeiroDiaMes)
      dataFim.value = toISO(hoje)
      presetAtivo.value = 'este_mes'
      carregarRejeicoes()
      carregarClientesGrupos()
      document.addEventListener('click', closeCalendarioAoClicarFora)
    })
    onUnmounted(() => {
      document.removeEventListener('click', closeCalendarioAoClicarFora)
    })

    return {
      rejeicoes,
      carregando,
      mostrarPopupAtualizando,
      modalWhatsappProgress,
      processando,
      filtroCliente,
      filtroStatus,
      filtroAdmin,
      filtroArmazem,
      rejeicoesUserLevel,
      visaoClientePedidosPlana,
      qtdCnpjsCliAccess,
      pedidosPlanaCliente,
      pedidosPlanaVisiveis,
      pagePedidosPlana,
      totalPaginasPlana,
      totalPedidosListaPlana,
      totalEmRejeicaoPlana,
      armazensDisponiveis,
      showFiltroAdmin,
      showFiltroArmazem,
      podeEnviarWhatsappRejeicoes,
      podeIgnorarRejeicoes,
      mostrarCheckboxesRejeicoes,
      opcoesAdmDistintos,
      rejeicoesFiltradas,
      rejeicoesAgrupadas,
      clientesComRejeicao,
      clientesListagem,
      clientesExibicao,
      totalClientesComRejeicao,
      totalPedidosEmRejeicao,
      carregarRejeicoes,
      aoClicarAtualizar,
      toggleCliente,
      removerRejeicao,
      aplicarFiltros,
      formatarData,
      formatarDataHora,
      formatarQuantidade,
      getStatusClass,
      getStatusExibicaoClass,
      chavePedido,
      toggleSelecaoPedido,
      isPedidoSelecionado,
      todosPedidosVisiveisSelecionados,
      algunsPedidosVisiveisSelecionados,
      toggleSelecionarTodosVisiveis,
      enviarWhatsappSelecionados,
      ignorarSelecionados,
      pedidosSelecionados,
      modalCliente,
      modalGrupoVinculado,
      abrirModalPedidos,
      fecharModalPedidos,
      modalDetalhe,
      itensDetalhe,
      tentativasDetalhe,
      tituloTentativa,
      itensOriginaisDetalhe,
      itensAjustadosDetalhe,
      dtOriginalDetalhe,
      dtResolvidoDetalhe,
      removidosDetalhe,
      ajustadosDetalhe,
      temComparacaoDetalhe,
      carregandoDetalhe,
      carregandoItens,
      abrirDetalhePedido,
      fecharModalDetalhe,
      modalPedidosEmRejeicao,
      modalPedidosIntegrados,
      pedidosVisiveis,
      pedidosFiltradosModal,
      pageModalPedidos,
      totalPaginasModal,
      TAMANHO_PAGINA,
      filtroModalApenasRejeicao,
      filtroModalPedido,
      mostrarCalendario,
      dataInicio,
      dataFim,
      dataInicioDisplayModel,
      dataFimDisplayModel,
      presetAtivo,
      presets,
      labelIntervaloAtual,
      aplicarPreset,
      aplicarIntervalo,
      limparIntervalo,
      irParaHoje,
      modalIgnorarMotivo,
      motivoTipo,
      motivoOutros,
      dpPedidoManual,
      podeConfirmarIgnorar,
      fecharModalIgnorarMotivo,
      confirmarIgnorarComMotivo,
    }
  },
}
</script>

<style scoped>
.rejeicoes {
  width: 100%;
  max-width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  overflow: hidden;
  box-sizing: border-box;
}

.page-header {
  flex-shrink: 0;
  margin-bottom: 0.75rem;
  padding: 0.75rem 1rem;
  background: linear-gradient(
    135deg,
    var(--primary) 0%,
    var(--primary-light) 100%
  );
  border-radius: 8px;
  color: var(--white);
}

.page-header h2 {
  margin: 0 0 0.25rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-header p {
  margin: 0;
  opacity: 0.9;
  font-size: 0.85rem;
  color: black;
}

.header-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--white);
  font-size: 0.9rem;
}

.filters-section {
  flex-shrink: 0;
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
  min-width: 200px;
}

.filter-group label {
  font-weight: 500;
  color: #303133;
  font-size: 0.8rem;
}

.filter-group select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-group select:hover {
  border-color: var(--primary);
}

.filter-group select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(28, 68, 245, 0.1);
}

.filter-group-pesquisa-cliente .filter-input-pesquisa {
  padding: 0.65rem 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  width: 100%;
  max-width: 280px;
  background: white;
  transition: border-color 0.2s;
}
.filter-group-pesquisa-cliente .filter-input-pesquisa:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(28, 68, 245, 0.1);
}
.filter-group-pesquisa-cliente .filter-input-pesquisa::placeholder {
  color: #94a3b8;
}

.btn-refresh {
  padding: 0.5rem 1rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
  height: fit-content;
}

.btn-refresh:hover:not(:disabled) {
  background: var(--primary-dark);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Popup "Consultando dados mais recentes" */
.popup-atualizando-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.popup-whatsapp-progress {
  z-index: 10001;
  backdrop-filter: blur(3px);
}
.popup-whatsapp-progress .popup-atualizando-content {
  border: 2px solid rgba(37, 211, 102, 0.3);
  animation: pulse-whatsapp 1.5s ease-in-out infinite;
}
@keyframes pulse-whatsapp {
  0%,
  100% {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }
  50% {
    box-shadow: 0 8px 32px rgba(37, 211, 102, 0.25);
  }
}
.popup-atualizando-content {
  background: white;
  padding: 2rem 2.5rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 400px;
}
.popup-atualizando-spinner {
  font-size: 2.5rem;
  color: var(--primary);
  margin-bottom: 1rem;
}
.popup-atualizando-texto {
  font-size: 1.1rem;
  font-weight: 500;
  color: #303133;
  margin: 0 0 0.5rem 0;
}
.popup-atualizando-filtros {
  font-size: 0.9rem;
  color: #606266;
  margin: 0.25rem 0 0 0;
}

.popup-whatsapp-stats {
  font-size: 1.1rem;
  margin-top: 0.5rem;
  color: #1e293b;
}

.popup-whatsapp-faltam {
  color: #64748b;
  font-weight: normal;
}

.popup-whatsapp-erros {
  font-size: 0.9rem;
  color: #dc2626;
  margin-top: 0.25rem;
}

.popup-fade-enter-active,
.popup-fade-leave-active {
  transition: opacity 0.2s ease;
}
.popup-fade-enter-from,
.popup-fade-leave-to {
  opacity: 0;
}

.resumo-registros {
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  color: #475569;
  width: 100%;
}

.resumo-registros strong {
  color: #0f172a;
}

.filter-group-checkbox {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-group-checkbox .checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
}

.filter-group-checkbox .checkbox-label input {
  width: 1.1rem;
  height: 1.1rem;
  cursor: pointer;
}

.filter-hint-inline {
  font-size: 0.8rem;
  color: #64748b;
}

/* Intervalo de datas - calendário dinâmico */
.filter-group-datas {
  position: relative;
  min-width: 280px;
}
.intervalo-datas-header {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.intervalo-label {
  font-weight: 500;
  color: #303133;
  font-size: 0.8rem;
}
.btn-abrir-calendario {
  padding: 0.5rem 1rem;
  background: #f0f2f5;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #303133;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}
.btn-abrir-calendario:hover {
  background: #e6e8eb;
  border-color: var(--primary);
  color: var(--primary);
}
.calendario-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 0.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border: 1px solid #e4e7ed;
  z-index: 1000;
  min-width: 520px;
}
.calendario-layout {
  display: flex;
  padding: 1rem;
  gap: 1.5rem;
}
.calendario-presets {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 180px;
  padding-right: 1rem;
  border-right: 1px solid #e4e7ed;
}
.preset-btn {
  padding: 0.5rem 0.75rem;
  text-align: left;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 0.9rem;
  color: #303133;
  cursor: pointer;
  transition: background 0.2s;
}
.preset-btn:hover {
  background: #f0f2f5;
}
.preset-btn.active {
  background: var(--primary);
  color: white;
  font-weight: 500;
}
.preset-dias {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: #606266;
}
.preset-dias input {
  width: 56px;
  padding: 0.35rem 0.5rem;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 0.9rem;
}
.calendario-custom {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.calendario-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.btn-cal {
  padding: 0.4rem 0.75rem;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: white;
  font-size: 0.85rem;
  color: #606266;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cal:hover {
  border-color: var(--primary);
  color: var(--primary);
}
.btn-cal.btn-aplicar {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}
.btn-cal.btn-aplicar:hover {
  background: var(--primary-dark);
  border-color: var(--primary-dark);
}
.calendario-inputs {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}
.input-data-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: white;
}
.input-data-wrap:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(28, 68, 245, 0.1);
}
.input-data-wrap i {
  color: #909399;
  font-size: 0.9rem;
}
.input-data-wrap input[type='date'],
.input-data-wrap input[type='text'] {
  border: none;
  outline: none;
  font-size: 0.95rem;
  color: #303133;
  min-width: 110px;
  width: 110px;
}

.loading-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
  overflow-y: auto;
}

.loading-skeleton {
  gap: 0.75rem;
  align-items: stretch;
}

.skeleton-header,
.skeleton-row {
  height: 40px;
  background: linear-gradient(90deg, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  border-radius: 6px;
}

.skeleton-header {
  height: 48px;
  margin-bottom: 0.5rem;
}

.skeleton-row {
  opacity: 0.85;
}

.skeleton-row:nth-child(odd) {
  opacity: 0.7;
}

.loading-text {
  margin-top: 1rem;
  color: var(--text-muted, #6c757d);
  font-size: 0.9rem;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.clientes-rejeicao-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
  min-height: 0;
}

.cards-totalizadores {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.card-totalizador {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
  min-width: 200px;
}

.card-totalizador-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.card-clientes .card-totalizador-icon {
  background: #e7f5ff;
  color: #1971c2;
}

.card-pedidos .card-totalizador-icon {
  background: #fff3bf;
  color: #e67700;
}

.card-totalizador-content {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.card-totalizador-valor {
  font-size: 1.5rem;
  font-weight: 700;
  color: #212529;
  line-height: 1.2;
}

.card-totalizador-label {
  font-size: 0.85rem;
  color: #6c757d;
}

.clientes-list-container {
  margin-top: 0;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Estrutura: cabeçalho separado (fixo) + corpo rolável */
.table-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: white;
}

/* Cabeçalho fixo - fora do scroll, sempre visível */
.table-header-fixed {
  flex-shrink: 0;
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  border-radius: 8px 8px 0 0;
  padding-right: 17px; /* alinha com a barra de rolagem do corpo */
}

.table-header-fixed .clientes-table {
  border-radius: 8px 8px 0 0;
}

/* Corpo rolável - scroll apenas aqui */
.table-body-scroll {
  flex: 1;
  min-height: 200px;
  max-height: min(75vh, 800px);
  overflow-x: auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-gutter: stable;
}

.clientes-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  table-layout: fixed;
  background: white;
}

.clientes-table thead tr {
  background: #f8f9fa;
}

.clientes-table thead th {
  background: #f8f9fa !important;
  border-bottom: 2px solid #dee2e6;
}

.clientes-table th {
  padding: 1rem;
  font-weight: 600;
  font-size: 0.9rem;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  text-align: center;
  vertical-align: middle;
}

.clientes-table th.col-cliente {
  text-align: left;
}

.clientes-table td {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  font-size: 0.9rem;
  color: #212529;
  text-align: center;
  vertical-align: middle;
}

.clientes-table td.col-cliente {
  text-align: left;
}

.clientes-table tbody tr {
  transition: background 0.2s;
}

.clientes-table tbody tr:hover {
  background: #f8f9fa;
}

.col-cliente {
  font-weight: 600;
  min-width: 0;
  width: 40%;
}

.col-total {
  text-align: center;
  width: 18%;
  min-width: 0;
}

.total-detalhe {
  display: block;
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.total-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  background: var(--primary);
  color: white;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.col-acoes-header {
  text-align: center;
  width: 18%;
  min-width: 0;
}

.clientes-table td.col-acoes-header {
  display: table-cell;
}

.btn-ver-pedidos {
  padding: 0.5rem 1rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  font-size: 0.85rem;
  margin: 0 auto;
}

.btn-ver-pedidos:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

/* Modal Styles */
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
  z-index: 10000;
  backdrop-filter: blur(2px);
}

.modal-content-pedidos {
  background: white;
  border-radius: 12px;
  width: 96vw;
  max-width: 96vw;
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  box-sizing: border-box;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  border-radius: 12px 12px 0 0;
}

.modal-header h3 {
  margin: 0;
  color: #212529;
  font-size: 1.3rem;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #e9ecef;
  color: #212529;
}

.modal-body-pedidos {
  padding: 1.5rem;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  min-width: 0;
  min-height: 0;
  max-height: calc(92vh - 140px);
  -webkit-overflow-scrolling: touch;
}

.cliente-info-modal {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  flex-wrap: nowrap;
  overflow-x: auto;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.info-label {
  font-weight: 600;
  color: #495057;
  font-size: 0.9rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.info-value {
  color: #212529;
  font-size: 0.95rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.info-value.total-pedidos {
  font-weight: 600;
  color: var(--primary);
  font-size: 1.1rem;
}

.info-item-detalhe .info-value {
  color: #0d9488;
  font-weight: 500;
}

.acoes-multiplas-modal {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #fff3cd;
  border-radius: 8px;
  border: 2px solid #ffc107;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.table-container-modal {
  overflow-x: auto;
  overflow-y: auto;
  width: 100%;
  max-height: 55vh;
  -webkit-overflow-scrolling: touch;
  scrollbar-gutter: stable;
}

.filtro-modal-pedidos {
  padding: 0.5rem 0;
  margin: 0.5rem 0 1rem 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
}

.filtro-modal-pedido-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filtro-modal-pedido-input label {
  font-size: 0.9rem;
  color: #495057;
  white-space: nowrap;
}

.filtro-modal-pedido-input .filter-input-pedido {
  padding: 0.35rem 0.65rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 0.9rem;
  min-width: 180px;
}

.filtro-modal-pedido-input .filter-input-pedido:focus {
  outline: none;
  border-color: #0d6efd;
  box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.2);
}

.filtro-check-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  color: #495057;
  user-select: none;
}

.filtro-check-label input {
  cursor: pointer;
}

.paginacao-modal {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  margin-top: 0.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  font-size: 0.9rem;
}

.paginacao-info {
  color: #495057;
}

.paginacao-botoes {
  display: flex;
  gap: 0.5rem;
}

.btn-pagina {
  padding: 0.4rem 0.9rem;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  color: #495057;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  transition: all 0.2s;
  touch-action: manipulation;
}

.btn-pagina:hover:not(:disabled) {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.btn-pagina:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.table-container-modal table {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
}

/* colgroup define larguras exatas para alinhar cabeçalho com células */
.table-container-modal col.col-checkbox {
  width: 3%;
  min-width: 40px;
}
.table-container-modal col.col-pedido {
  width: 13%;
}
.table-container-modal col.col-data {
  width: 10%;
}
.table-container-modal col.col-status {
  width: 16%;
}
.table-container-modal col.col-motivo {
  width: 14%;
}
.table-container-modal col.col-acoes {
  width: 12%;
}
.table-container-modal col.col-reprocessado {
  width: 12%;
}
.table-container-modal col.col-resolvido {
  width: 12%;
}

.table-container-modal th,
.table-container-modal td {
  padding: 0.75rem 1rem;
  vertical-align: middle;
  box-sizing: border-box;
  font-size: 1.05rem;
}

.table-container-modal thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #f8f9fa;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.table-container-modal thead tr {
  background: #f8f9fa;
}

.table-container-modal thead th {
  background: #f8f9fa !important;
  border-bottom: 2px solid #dee2e6;
  box-shadow: 0 2px 0 0 #f8f9fa;
  font-weight: 600;
  font-size: 0.9rem;
  color: #495057;
}

/* Alinhamento coluna a coluna - cabeçalho e conteúdo no mesmo nível */
.table-container-modal th.col-checkbox,
.table-container-modal td.col-checkbox {
  text-align: center;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.table-container-modal th.col-pedido,
.table-container-modal td.col-pedido {
  text-align: left;
}

.table-container-modal th.col-data,
.table-container-modal td.col-data {
  text-align: left;
}

.table-container-modal th.col-status,
.table-container-modal td.col-status {
  text-align: left !important;
}

.table-container-modal th.col-motivo,
.table-container-modal td.col-motivo {
  text-align: center !important;
}

.table-container-modal td.col-motivo span {
  text-align: center;
}

.table-container-modal th.col-acoes,
.table-container-modal td.col-acoes {
  text-align: center !important;
}

.table-container-modal th.col-reprocessado,
.table-container-modal td.col-reprocessado {
  text-align: left !important;
}

.table-container-modal th.col-resolvido,
.table-container-modal td.col-resolvido {
  text-align: left !important;
  font-size: 0.95rem;
}

/* Garantir que Status e Ação alinhem conteúdo com o cabeçalho - mesmas proporções do botão Detalhar */
.table-container-modal td.col-status .status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 0.9rem !important;
  padding: 0.5rem 1rem !important;
  min-width: 120px;
  min-height: 29px;
  line-height: 1.25;
  box-sizing: border-box;
}

/* Sobrescrever auto-resize-tiny/small para manter tamanho legível e proporções do botão */
.table-container-modal td.col-status .status-badge.auto-resize-tiny,
.table-container-modal td.col-status .status-badge.auto-resize-small {
  font-size: 0.9rem !important;
  padding: 0.5rem 1rem !important;
  letter-spacing: normal !important;
}

.table-container-modal td.col-acoes .btn-action,
.table-container-modal td.col-acoes .info-text {
  justify-content: center;
  margin: 0 auto;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.acoes-multiplas-tabela {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #fff3cd;
  border-radius: 8px;
  border: 2px solid #ffc107;
  display: flex;
  justify-content: flex-end;
}

.cliente-tabela-group {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 1rem;
}

.cliente-tabela-header {
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cliente-tabela-header:hover {
  background: #e9ecef;
}

.cliente-tabela-header i {
  transition: transform 0.3s;
  color: var(--primary);
  font-size: 0.9rem;
}

.cliente-tabela-header i.rotated {
  transform: rotate(90deg);
}

.cliente-header-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cliente-tabela-header h3 {
  margin: 0;
  color: #212529;
  font-size: 1.1rem;
  font-weight: 600;
}

.cliente-info-badges {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.info-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: #e9ecef;
  border-radius: 6px;
  font-size: 0.85rem;
  color: #495057;
  font-weight: 500;
}

.info-badge i {
  color: var(--primary);
  font-size: 0.9rem;
}

.badge {
  background: var(--primary);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.btn-whatsapp-multiplos {
  padding: 0.75rem 1.5rem;
  background: #25d366;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
  touch-action: manipulation;
  user-select: none;
}

.btn-whatsapp-multiplos:hover:not(:disabled) {
  background: #1da851;
}

.btn-whatsapp-multiplos:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-ignorar-multiplos {
  padding: 0.75rem 1.5rem;
  background: #ffc107;
  color: #333;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
  touch-action: manipulation;
  user-select: none;
}

.btn-ignorar-multiplos:hover:not(:disabled) {
  background: #e0a800;
}

.btn-ignorar-multiplos:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Tabela principal (clientes): cabeçalho fixo + corpo rolável */
.table-wrapper .clientes-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  background: white;
}

.table-wrapper .col-cliente {
  width: 38%;
}
.table-wrapper .col-id {
  width: 14%;
}
.table-wrapper .col-armazem {
  width: 14%;
}
.table-wrapper .col-total {
  width: 18%;
}
.table-wrapper .col-acoes-header {
  width: 16%;
}

.table-wrapper th,
.table-wrapper td {
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  box-sizing: border-box;
}

.table-wrapper th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.table-wrapper .clientes-table th {
  text-align: center;
}
.table-wrapper .clientes-table th.col-cliente {
  text-align: left;
}
.table-wrapper .clientes-table td.col-acoes-header {
  text-align: center;
}

.table-body-scroll td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e9ecef;
  font-size: 0.9rem;
  color: #212529;
}

.table-body-scroll tbody tr {
  background: #fffef5;
  transition: background 0.2s;
  border-left: 4px solid transparent;
}

.table-body-scroll tbody tr:hover {
  background: #fff9e6;
}

.table-body-scroll tbody tr.row-selecionada {
  background: #fffde7;
  border-left-color: #ffc107;
}

.table-body-scroll tbody tr.row-pode-remover {
  border-left-color: #28a745;
}

.col-checkbox {
  width: 40px;
  text-align: center;
}

.col-checkbox input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--primary);
}

.col-pedido {
  font-weight: 600;
  color: #212529;
  min-width: 0;
  width: 14%;
}

.col-id {
  min-width: 0;
  width: 8%;
  color: #495057;
  font-weight: 500;
}

.col-armazem {
  min-width: 0;
  width: 10%;
  color: #495057;
  font-weight: 500;
}

.col-data {
  white-space: nowrap;
  min-width: 0;
  width: 10%;
  color: #6c757d;
}

.col-status {
  min-width: 120px;
  width: 14%;
}

.status-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 1.1rem;
  font-weight: 600;
  white-space: nowrap;
  min-width: 6em;
  text-align: center;
}

.status-badge.status-ok {
  background: linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 100%);
  color: #065f46;
  border: 1px solid #059669;
}

.status-badge.status-rejeitado {
  background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
  color: #7f1d1d;
  border: 1px solid #b91c1c;
}

.status-badge.status-outro {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #3730a3;
}

.col-motivo {
  min-width: 0;
  width: 22%;
}

.col-motivo span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-acoes {
  width: 10%;
  min-width: 0;
  text-align: center;
}

.col-reprocessado {
  min-width: 0;
  width: 12%;
  text-align: center;
  white-space: nowrap;
}

/* Colunas no modal: larguras fixas para alinhar cabeçalho com conteúdo */
.table-container-modal th.col-checkbox,
.table-container-modal td.col-checkbox {
  width: 3%;
  min-width: 40px;
}
.table-container-modal th.col-pedido,
.table-container-modal td.col-pedido {
  width: 13%;
}
.table-container-modal th.col-data,
.table-container-modal td.col-data {
  width: 10%;
}
.table-container-modal th.col-status,
.table-container-modal td.col-status {
  width: 16%;
}
.table-container-modal th.col-motivo,
.table-container-modal td.col-motivo {
  width: 14%;
}
.table-container-modal th.col-acoes,
.table-container-modal td.col-acoes {
  width: 12%;
}
.table-container-modal th.col-reprocessado,
.table-container-modal td.col-reprocessado {
  width: 12%;
}
.table-container-modal th.col-resolvido,
.table-container-modal td.col-resolvido {
  width: 12%;
}

.reprocessado-sim {
  color: #065f46;
  font-weight: 600;
}

.reprocessado-nao {
  color: #991b1b;
  font-weight: 500;
}

.reprocessado-vazio {
  color: #94a3b8;
}

.resolvido-vazio {
  color: #94a3b8;
}

.btn-action {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  touch-action: manipulation;
  user-select: none;
  transition: all 0.2s;
  font-size: 0.85rem;
}

.btn-action.btn-detalhar {
  background: #0d6efd;
  color: #fff;
}

.btn-action.btn-detalhar:hover:not(:disabled) {
  background: #0b5ed7;
  transform: translateY(-1px);
}

.btn-action.btn-ignorar {
  background: #ffc107;
  color: #333;
}

.btn-action.btn-ignorar:hover:not(:disabled) {
  background: #e0a800;
  transform: translateY(-1px);
}

.btn-action:active:not(:disabled) {
  transform: translateY(0);
}

.btn-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.checkbox-pedido {
  cursor: pointer;
  touch-action: manipulation;
}

.checkbox-select-all {
  cursor: pointer;
  touch-action: manipulation;
  width: 1.1rem;
  height: 1.1rem;
}

.info-text {
  color: #6c757d;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-style: italic;
}

.empty-state {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: #10b981;
}

.empty-state h4 {
  color: #1e293b;
  margin-bottom: 0.5rem;
  font-size: 1.3rem;
}

.empty-state p {
  color: #64748b;
  margin: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 2000px;
  opacity: 1;
}

/* Modal Motivo ao Ignorar */
.modal-ignorar-motivo {
  background: #fff;
  border-radius: 12px;
  max-width: 480px;
  width: 96%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-ignorar-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
}

.modal-ignorar-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #334155;
}

.modal-ignorar-header h3 .fa {
  margin-right: 0.5rem;
  color: #64748b;
}

.modal-ignorar-header .btn-fechar {
  background: none;
  border: none;
  padding: 0.25rem;
  color: #64748b;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  border-radius: 6px;
}

.modal-ignorar-header .btn-fechar:hover {
  background: #e2e8f0;
  color: #334155;
}

.modal-ignorar-body {
  padding: 1.25rem;
}

.modal-ignorar-info {
  margin: 0 0 1rem;
  color: #475569;
  font-size: 0.95rem;
}

.motivo-opcoes {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.motivo-radio {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.95rem;
  color: #334155;
}

.motivo-radio input {
  padding: 0;
  margin: 0;
}

.motivo-campo {
  margin-top: 1rem;
}

.motivo-campo label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #475569;
}

.motivo-campo textarea,
.motivo-campo input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
}

.motivo-campo textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-ignorar-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  background: #f8fafc;
}

.modal-ignorar-footer .btn-cancelar {
  padding: 0.5rem 1rem;
  border: 1px solid #cbd5e1;
  background: #fff;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  color: #475569;
}

.modal-ignorar-footer .btn-cancelar:hover {
  background: #f1f5f9;
}

.modal-ignorar-footer .btn-confirmar {
  padding: 0.5rem 1rem;
  border: none;
  background: var(--primary, #2563eb);
  color: #fff;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
}

.modal-ignorar-footer .btn-confirmar:hover:not(:disabled) {
  background: var(--primary-dark, #1d4ed8);
}

.modal-ignorar-footer .btn-confirmar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal Detalhe do Pedido */
.modal-detalhe-pedido {
  background: #fff;
  border-radius: 12px;
  max-width: min(1320px, 98vw);
  width: 98%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.detalhe-itens-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

/*
 * Tentativas em uma única faixa horizontal: muitas colunas = rolagem lateral
 * (corpo do modal também rola no eixo X quando o grid ultrapassa a largura).
 */
.detalhe-itens-grid {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: flex-start;
  gap: 1.25rem;
  min-width: 100%;
  width: max-content;
  max-width: none;
  padding: 0.25rem 0.125rem 0.75rem;
  margin: 0;
}

@supports (grid-template-rows: subgrid) {
  .detalhe-itens-grid {
    display: grid;
    grid-auto-flow: column;
    /* Largura fixa por tentativa: várias ficam lado a lado, com scroll no corpo do modal */
    grid-auto-columns: minmax(300px, 360px);
    grid-template-rows: auto auto auto auto;
    gap: 0.5rem 1.25rem;
    align-items: start;
  }
}

.modal-detalhe-body::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.modal-detalhe-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.detalhe-itens-col {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 0 0 auto;
  width: 360px;
  min-width: 300px;
  max-width: min(400px, 88vw);
  box-sizing: border-box;
}

@supports (grid-template-rows: subgrid) {
  .detalhe-itens-col {
    display: grid;
    grid-template-rows: subgrid;
    grid-row: span 4;
    width: auto;
    min-width: 0;
    max-width: none;
    flex: unset;
    gap: 0;
  }
}

.detalhe-itens-titulo {
  margin: 0;
  width: 100%;
  font-size: 0.95rem;
  font-weight: 600;
  color: #334155;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  line-height: 1.35;
}

.detalhe-titulo-text {
  flex: 1;
  min-width: 0;
}

.detalhe-data-linha {
  min-width: 0;
  min-height: 1.25em;
}

.detalhe-tentativa-resumo-slot {
  min-width: 0;
  min-height: 1.25em;
}

.detalhe-itens-titulo .fa-exclamation-triangle {
  color: #dc2626;
}

.detalhe-itens-titulo .fa-check-circle {
  color: #16a34a;
}

.detalhe-tentativa-resumo {
  margin: 0;
  font-size: 0.85rem;
  color: #dc2626;
}
.detalhe-tentativa-resumo.detalhe-tentativa-ok {
  color: #16a34a;
}
.detalhe-data-badge {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
}

.detalhe-comparacao-resumo {
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.detalhe-comparacao-resumo h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  color: #475569;
}

.resumo-removidos ul,
.resumo-ajustados ul {
  margin: 0.25rem 0 0 0;
  padding-left: 1.25rem;
}

.detalhe-info-comparacao {
  margin: 0.5rem 0 0 0;
  padding: 0.75rem;
  font-size: 0.85rem;
  color: #64748b;
  background: #f1f5f9;
  border-radius: 6px;
}

.modal-detalhe-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-detalhe-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-detalhe-body {
  padding: 1rem 1.5rem;
  overflow: auto;
  flex: 1;
  min-height: 0;
  min-width: 0;
}

.detalhe-loading,
.detalhe-vazio {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

.table-container-detalhe {
  overflow-x: hidden;
  max-width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fafafa;
}

.detalhe-itens-titulo > .fa:first-child {
  flex-shrink: 0;
  margin-top: 0.15rem;
}

.tabela-itens-detalhe {
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.tabela-itens-detalhe th,
.tabela-itens-detalhe td {
  padding: 0.6rem 0.8rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  min-width: 0;
  word-break: break-word;
  overflow-wrap: anywhere;
  vertical-align: top;
}

/* Qt.: mantém compacto; texto longo quebra nas colunas de código/mercadoria/motivo */
.tabela-itens-detalhe th:nth-child(1),
.tabela-itens-detalhe td:nth-child(1) {
  width: 14%;
}

.tabela-itens-detalhe th:nth-child(2),
.tabela-itens-detalhe td:nth-child(2) {
  width: 34%;
}

.tabela-itens-detalhe th:nth-child(3),
.tabela-itens-detalhe td:nth-child(3) {
  width: 28%;
}

.tabela-itens-detalhe th:nth-child(4),
.tabela-itens-detalhe th:nth-child(5) {
  width: 12%;
  white-space: nowrap;
  text-align: center;
}

.tabela-itens-detalhe td:nth-child(4),
.tabela-itens-detalhe td:nth-child(5) {
  width: 12%;
  white-space: nowrap;
  text-align: right;
}

.tabela-itens-detalhe th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
}

.tabela-itens-detalhe tbody tr:hover {
  background: #f8fafc;
}

.tabela-itens-detalhe td:nth-child(3) {
  color: #dc2626;
  font-weight: 500;
}

.acoes-multiplas-plana {
  margin: 0.75rem 0 1rem;
}

.table-pedidos-plana-wrap .table-pedidos-plana {
  font-size: 0.875rem;
}

.table-pedidos-plana-wrap .col-motivo-plana {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-pedidos-plana-wrap .btn-action {
  padding: 0.35rem 0.5rem;
  font-size: 0.8rem;
}

/* Tabela plana: status legível como o botão Detalhar (vue-components + auto-resize/global container encolhem o badge) */
.table-pedidos-plana-wrap .table-pedidos-plana .status-badge {
  container-type: normal !important;
  font-size: 0.8rem !important;
  padding: 0.35rem 0.5rem !important;
  line-height: 1.25 !important;
  letter-spacing: normal !important;
  text-transform: none !important;
  overflow: visible !important;
  min-width: 0 !important;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
}

.table-pedidos-plana-wrap .table-pedidos-plana .status-badge.auto-resize-tiny,
.table-pedidos-plana-wrap .table-pedidos-plana .status-badge.auto-resize-small {
  font-size: 0.8rem !important;
  padding: 0.35rem 0.5rem !important;
  letter-spacing: normal !important;
}

@media (orientation: portrait) {
  .rejeicoes {
    padding: 1rem;
  }

  .filters-section {
    flex-direction: column;
  }

  .filter-group {
    min-width: 100%;
  }

  .pedido-detalhes {
    grid-template-columns: 1fr;
  }
}
</style>
