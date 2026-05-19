<template>
  <div class="config-rejeicoes">
    <div class="tab-panel-header">
      <h3>
        <i class="fa fa-exclamation-triangle"></i> Configurações de Rejeições
      </h3>
    </div>

    <!-- Configurações WhatsApp -->
    <div v-if="!configRejeicao" class="config-carregando">
      <i class="fa fa-spinner fa-spin"></i> Carregando configurações...
    </div>
    <div v-else class="painel-configuracoes-card painel-rejeicoes-wide">
      <h4><i class="fa fa-comment"></i> Configurações WhatsApp</h4>
      <p class="config-descricao">
        Configure os números e método de envio de notificações WhatsApp quando
        pedidos forem ignorados.
      </p>

      <div class="config-form">
        <!-- Números WhatsApp -->
        <div class="config-group">
          <label>
            <i class="fa fa-phone"></i> Número que Recebe (Gestor)
            <span class="config-hint"
              >Número para teste de envio – usados grupos nos envios reais
              (opcional)</span
            >
          </label>
          <input
            type="text"
            v-model="configRejeicao.whatsapp_gestor_numero"
            placeholder="5511999999999"
            class="config-input"
          />
          <small class="config-small"
            >Formato: 5511999999999 (código país + DDD + número)</small
          >
        </div>

        <!-- Notificação automática -->
        <div class="config-section">
          <h5><i class="fa fa-bell"></i> Notificação automática</h5>
          <p class="config-descricao">
            Enviar WhatsApp automaticamente quando um pedido aparecer como
            <strong>rejeitado</strong> ou quando for
            <strong>resolvido</strong> (integrado).
          </p>
          <div class="config-group">
            <label class="config-check-label">
              <input
                type="checkbox"
                v-model="configRejeicao.notificar_auto_ativo"
              />
              <span>Ativar envio automático</span>
            </label>
          </div>
          <div v-if="configRejeicao.notificar_auto_ativo" class="config-group">
            <label
              ><i class="fa fa-clock-o"></i> Intervalo de verificação
              (segundos)</label
            >
            <input
              type="number"
              v-model.number="configRejeicao.notificar_auto_intervalo_segundo"
              min="30"
              max="3600"
              step="10"
              class="config-input config-input-small"
            />
            <small class="config-small">De 30 a 3600 segundos.</small>
          </div>
          <div
            v-if="configRejeicao.notificar_auto_ativo"
            class="config-group config-info-box"
          >
            <label
              ><i class="fa fa-info-circle"></i> Regras de envio de
              rejeitados</label
            >
            <div class="config-rejeitados-regras">
              <p>
                <strong>• Envio diário às 9h:</strong> consolidado de todos os
                pedidos rejeitados pendentes.
              </p>
              <p>
                <strong>• Fora das 9h:</strong> só envia quando houver pedido
                <strong>novo</strong> rejeitado → consolidado (novo + já
                avisados).
              </p>
              <p>
                <strong>• Janela de horário:</strong> todos os envios respeitam
                o intervalo abaixo — não envia durante a madrugada mesmo que
                pedidos rejeitem durante a integração.
              </p>
            </div>
          </div>
          <div
            v-if="configRejeicao.notificar_auto_ativo"
            class="config-section-horario"
          >
            <h5><i class="fa fa-clock-o"></i> Horário e dias de envio</h5>
            <p class="config-descricao">
              Restrinja o envio automático a um horário e dias específicos (ex:
              7h–19h, segunda a sexta) para não enviar durante a madrugada ou
              fins de semana. Deixe vazio para enviar a qualquer momento.
            </p>
            <div class="config-row-horario">
              <div class="config-group">
                <label>Hora de início (0-23)</label>
                <input
                  type="number"
                  v-model.number="configRejeicao.enviar_horario_inicio"
                  min="0"
                  max="23"
                  step="1"
                  placeholder="Ex: 7"
                  class="config-input config-input-small"
                />
                <small class="config-small">Vazio = sem restrição</small>
              </div>
              <div class="config-group">
                <label>Hora de fim (0-23)</label>
                <input
                  type="number"
                  v-model.number="configRejeicao.enviar_horario_fim"
                  min="0"
                  max="23"
                  step="1"
                  placeholder="Ex: 19"
                  class="config-input config-input-small"
                />
                <small class="config-small">Vazio = sem restrição</small>
              </div>
            </div>
            <div class="config-group">
              <label>Enviar apenas nos dias</label>
              <div class="config-dias-semana">
                <label
                  v-for="d in diasSemanaOpts"
                  :key="d.value"
                  class="config-check-dia"
                >
                  <input
                    type="checkbox"
                    :value="d.value"
                    v-model="diasSemanaSelecionados"
                  />
                  <span>{{ d.label }}</span>
                </label>
              </div>
              <small class="config-small"
                >Deixe nenhum marcado para enviar em todos os dias. Segunda=1,
                Terça=2, ..., Domingo=0.</small
              >
            </div>
          </div>
        </div>

        <!-- Evolution API -->
        <div class="config-section">
          <h5><i class="fa fa-server"></i> Evolution API</h5>
          <p class="config-descricao">
            Nome da instância no Evolution Manager. A URL base e a API key vêm
            do <code>.env</code> do backend (<code>EVOLUTION_API_ENDPOINT</code>
            ou <code>EVOLUTION_API_URL</code> e <code>EVOLUTION_API_KEY</code>),
            iguais ao envio das rejeições.
          </p>
          <div class="config-group">
            <label><i class="fa fa-tag"></i> Instância padrão</label>
            <div class="config-row-instancia-add">
              <select
                v-model="instanciaPadraoSelecionada"
                class="config-input config-select"
              >
                <option value="default">default</option>
                <option
                  v-for="inst in instanciasList"
                  :key="getInstNome(inst)"
                  :value="getInstNome(inst)"
                >
                  {{ getInstNome(inst)
                  }}{{ getInstIsDefault(inst) ? ' ★ Padrão' : '' }}
                </option>
              </select>
              <div class="config-add-instancia">
                <input
                  type="text"
                  v-model="novaInstanciaNome"
                  placeholder="Ex: Guilherme, Nexos"
                  class="config-input config-input-instancia"
                  @keyup.enter="adicionarInstancia"
                />
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  @click="adicionarInstancia"
                  :disabled="!novaInstanciaNome.trim()"
                >
                  <i class="fa fa-plus"></i> Adicionar
                </button>
              </div>
            </div>
            <small class="config-small"
              >Usada como padrão e para carregar grupos. Cada cliente pode ter
              sua própria instância ao vincular grupo.</small
            >
          </div>
          <!-- Números Administradores -->
          <div class="config-section config-section-numeros-admin">
            <h5><i class="fa fa-address-book"></i> Números Administradores</h5>
            <p class="config-descricao">
              Cadastre os números WhatsApp usados para filtrar grupos com base
              nos que você participa. Use na opção "Vincular por Grupo" para
              listar apenas os grupos em comum.
            </p>
            <div class="config-numeros-admin-add">
              <input
                type="text"
                v-model="novoNumeroAdmin"
                placeholder="5511999999999"
                class="config-input config-input-numero"
                maxlength="20"
              />
              <input
                type="text"
                v-model="novoNomeAdmin"
                placeholder="Nome (opcional)"
                class="config-input config-input-nome"
              />
              <button
                type="button"
                class="btn btn-primary btn-sm"
                @click="adicionarNumeroAdmin"
                :disabled="!novoNumeroAdmin.trim() || salvandoNumeroAdmin"
              >
                <i
                  class="fa"
                  :class="
                    salvandoNumeroAdmin ? 'fa-spinner fa-spin' : 'fa-plus'
                  "
                ></i>
                Adicionar
              </button>
            </div>
            <ul
              v-if="numerosAdmin.length > 0"
              class="config-numeros-admin-lista"
            >
              <li
                v-for="n in numerosAdmin"
                :key="n.id"
                class="config-numero-admin-item"
              >
                <span class="config-numero-admin-info">
                  <strong>{{ n.numero }}</strong>
                  <span v-if="n.nome" class="config-numero-admin-nome">{{
                    n.nome
                  }}</span>
                </span>
                <button
                  type="button"
                  class="btn btn-secondary btn-sm btn-remove"
                  @click="removerNumeroAdmin(n.id)"
                  :disabled="removendoNumeroAdmin === n.id"
                  title="Remover"
                >
                  <i
                    class="fa"
                    :class="
                      removendoNumeroAdmin === n.id
                        ? 'fa-spinner fa-spin'
                        : 'fa-trash'
                    "
                  ></i>
                </button>
              </li>
            </ul>
            <small v-else class="config-small"
              >Nenhum número cadastrado. Adicione um número para usar na
              vinculação por grupo.</small
            >
          </div>
          <div class="config-buttons">
            <button
              type="button"
              class="btn btn-secondary"
              @click="verificarStatusConexao"
              :disabled="verificandoConexao"
            >
              <i
                class="fa"
                :class="
                  verificandoConexao ? 'fa-spinner fa-spin' : 'fa-check-circle'
                "
              ></i>
              {{ verificandoConexao ? 'Verificando...' : 'Verificar Conexão' }}
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="abrirDiagnosticoEnvio"
              :disabled="carregandoDiagnostico"
            >
              <i
                class="fa"
                :class="
                  carregandoDiagnostico
                    ? 'fa-spinner fa-spin'
                    : 'fa-stethoscope'
                "
              ></i>
              {{
                carregandoDiagnostico ? 'Carregando...' : 'Diagnóstico de envio'
              }}
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="enviarTesteWhatsApp"
              :disabled="enviandoTeste"
            >
              <i
                class="fa"
                :class="enviandoTeste ? 'fa-spinner fa-spin' : 'fa-paper-plane'"
              ></i>
              {{ enviandoTeste ? 'Enviando...' : 'Enviar teste' }}
            </button>
          </div>
          <small class="config-small" style="display: block; margin-top: 6px"
            >A URL da Evolution no servidor é definida no <strong>.env</strong>
            do backend. Após alterar instância aqui, use
            <strong>Salvar</strong> e <strong>Verificar Conexão</strong>.</small
          >

          <!-- Modal diagnóstico de envio -->
          <div
            v-if="showDiagnosticoEnvio"
            class="modal-overlay"
            @click.self="showDiagnosticoEnvio = false"
          >
            <div class="modal-content modal-diagnostico">
              <h4>
                <i class="fa fa-stethoscope"></i> Diagnóstico de envio WhatsApp
              </h4>
              <p class="config-descricao">{{ diagnosticoEnvio?.observacao }}</p>
              <dl v-if="diagnosticoEnvio" class="diagnostico-lista">
                <dt>API usada</dt>
                <dd>
                  <strong>{{ diagnosticoEnvio.api_usada }}</strong>
                </dd>
                <dt>URL da Evolution</dt>
                <dd>
                  Origem:
                  <strong>{{ diagnosticoEnvio.evolution_url_origem }}</strong>
                  <span
                    v-if="diagnosticoEnvio.evolution_url_esta_default"
                    class="text-warning"
                  >
                    (valor padrão – configure EVOLUTION_API_* no .env)</span
                  >
                </dd>
                <dt>API Key</dt>
                <dd>
                  <span
                    :class="
                      diagnosticoEnvio.evolution_key_ok
                        ? 'text-success'
                        : 'text-warning'
                    "
                  >
                    {{
                      diagnosticoEnvio.evolution_key_ok
                        ? 'Configurada'
                        : 'Não configurada (EVOLUTION_API_KEY no .env)'
                    }}
                  </span>
                </dd>
                <dt>Instância</dt>
                <dd>
                  {{ diagnosticoEnvio.evolution_instance_name || 'default' }}
                </dd>
                <dt>Número gestor preenchido</dt>
                <dd>
                  {{
                    diagnosticoEnvio.whatsapp_gestor_preenchido ? 'Sim' : 'Não'
                  }}
                </dd>
                <dt>
                  Tabelas (rejeicao_config, rejeicao_cliente_grupo,
                  bi_pedidos_config)
                </dt>
                <dd>
                  <span
                    :class="
                      diagnosticoEnvio.tabelas_ok
                        ? 'text-success'
                        : 'text-warning'
                    "
                  >
                    {{
                      diagnosticoEnvio.tabelas_ok
                        ? 'OK'
                        : 'Verifique erros abaixo'
                    }}
                  </span>
                  <span
                    v-if="
                      diagnosticoEnvio.tabelas && !diagnosticoEnvio.tabelas_ok
                    "
                    class="diagnostico-tabelas"
                  >
                    {{ JSON.stringify(diagnosticoEnvio.tabelas) }}
                  </span>
                </dd>
                <dt>Requisitos .env</dt>
                <dd class="small">{{ diagnosticoEnvio.requisitos_env }}</dd>
              </dl>
              <button
                class="btn btn-primary"
                @click="showDiagnosticoEnvio = false"
              >
                Fechar
              </button>
            </div>
          </div>

          <!-- Modal resultado teste -->
          <div
            v-if="showTesteResultado"
            class="modal-overlay"
            @click.self="showTesteResultado = false"
          >
            <div class="modal-content">
              <h4>
                <i
                  :class="
                    resultadoTeste?.sucesso
                      ? 'fa fa-check-circle'
                      : 'fa fa-exclamation-triangle'
                  "
                  :style="
                    resultadoTeste?.sucesso
                      ? 'color: #22c55e'
                      : 'color: #f59e0b'
                  "
                ></i>
                {{
                  resultadoTeste?.sucesso
                    ? 'Teste enviado'
                    : 'Teste não enviado'
                }}
              </h4>
              <p>{{ resultadoTeste?.mensagem }}</p>
              <button
                class="btn btn-primary"
                @click="showTesteResultado = false"
              >
                OK
              </button>
            </div>
          </div>

          <!-- Grupos por Cliente -->
          <div class="config-section config-section-grupos">
            <h5><i class="fa fa-users"></i> Grupos por Cliente</h5>
            <p class="config-descricao">
              Mapeie cada cliente ao grupo WhatsApp e à instância. Use
              <strong>Por Cliente</strong> para vincular grupo a cada cliente,
              ou <strong>Por Grupo</strong> para escolher um admin e vincular
              clientes aos grupos dele.
            </p>
            <div class="config-tabs-grupos">
              <label
                class="config-tab"
                :class="{ active: modoTabGrupos === 'cliente' }"
              >
                <input type="radio" value="cliente" v-model="modoTabGrupos" />
                <span><i class="fa fa-user"></i> Por Cliente</span>
              </label>
              <label
                class="config-tab"
                :class="{ active: modoTabGrupos === 'grupo' }"
              >
                <input type="radio" value="grupo" v-model="modoTabGrupos" />
                <span><i class="fa fa-users"></i> Por Grupo</span>
              </label>
            </div>

            <!-- Barra de pesquisa e filtro (só no modo Por Cliente) -->
            <div
              v-show="modoTabGrupos === 'cliente'"
              class="config-row-instancia-pesquisa"
            >
              <div class="config-group config-group-pesquisa-cliente">
                <label><i class="fa fa-search"></i> Pesquisar cliente</label>
                <input
                  type="text"
                  v-model="buscaClienteGrupo"
                  placeholder="Pesquisar cliente..."
                  class="config-input"
                />
              </div>
              <div class="config-group config-group-filtro-envio">
                <label><i class="fa fa-filter"></i> Envio automático</label>
                <select
                  v-model="filtroEnvioAutomatico"
                  class="config-input config-select config-select-filtro"
                >
                  <option value="todos">Todos os clientes</option>
                  <option value="com_auto">Com envio automático</option>
                  <option value="sem_auto">Sem envio automático</option>
                  <option value="sem_grupo">Sem grupo vinculado</option>
                </select>
              </div>
            </div>

            <!-- Modo Por Cliente (original) -->
            <div v-show="modoTabGrupos === 'cliente'">
              <div class="config-resumo-envio">
                <i class="fa fa-bell"></i>
                <strong>{{ totalComEnvioAuto }}</strong> cliente(s) com envio
                automático
                <span class="config-resumo-separador">|</span>
                <span>{{ totalComGrupo }}</span> com grupo vinculado
                <span class="config-resumo-separador">|</span>
                <span>{{ clientesRejeicao.length }}</span> total
              </div>
              <div class="config-group config-group-buttons-grupos">
                <button
                  type="button"
                  class="btn btn-secondary"
                  @click="loadGruposEvolution"
                  :disabled="gruposEvolutionCarregando"
                >
                  <i
                    class="fa"
                    :class="
                      gruposEvolutionCarregando
                        ? 'fa-spinner fa-spin'
                        : 'fa-refresh'
                    "
                  ></i>
                  {{
                    gruposEvolutionCarregando
                      ? 'Pesquisando grupos...'
                      : gruposEvolutionCache.length > 0
                        ? `Recarregar (${gruposEvolutionCache.length} grupos)`
                        : 'Carregar grupos'
                  }}
                </button>
                <button
                  type="button"
                  class="btn btn-primary"
                  @click="mapearCorrespondencia"
                  :disabled="
                    mapeandoCorrespondencia ||
                    gruposEvolutionCarregando ||
                    gruposEvolutionCache.length === 0
                  "
                  title="Vincular automaticamente clientes a grupos quando o nome do grupo corresponde ao cliente (ID ou nome)"
                >
                  <i
                    class="fa"
                    :class="
                      mapeandoCorrespondencia
                        ? 'fa-spinner fa-spin'
                        : 'fa-magic'
                    "
                  ></i>
                  {{
                    mapeandoCorrespondencia
                      ? 'Mapeando...'
                      : 'Mapear automaticamente'
                  }}
                </button>
                <button
                  type="button"
                  class="btn btn-secondary"
                  @click="habilitarEnvioAutoTodosComGrupo"
                  :disabled="totalComGrupo === 0"
                  title="Marcar 'Receber mensagens automáticas' para todos os clientes que têm grupo vinculado"
                >
                  <i class="fa fa-check-square-o"></i> Habilitar envio auto em
                  todos com grupo
                </button>
                <small v-if="gruposEvolutionErro" class="config-erro">{{
                  gruposEvolutionErro
                }}</small>
              </div>
              <div v-if="clientesRejeicao.length === 0" class="config-vazio">
                Nenhum cliente encontrado na tabela de rejeições.
              </div>
              <div v-else class="lista-grupos-cliente">
                <div
                  v-if="clientesFiltradosPorEnvio.length === 0"
                  class="config-vazio"
                >
                  Nenhum cliente encontrado
                  <template v-if="buscaClienteGrupo">
                    para "{{ buscaClienteGrupo }}"</template
                  >
                  <template v-if="filtroEnvioAutomatico !== 'todos'">
                    com o filtro selecionado</template
                  >.
                </div>
                <table v-else class="tabela-clientes-grupos">
                  <thead>
                    <tr>
                      <th class="col-cliente-nome">CLIENTE</th>
                      <th class="col-cliente-id">ID</th>
                      <th class="col-recebe-auto">
                        RECEBE MENSAGENS AUTOMÁTICAS ?
                      </th>
                      <th class="col-grupo-vinculado">GRUPO VINCULADO</th>
                      <th class="col-acoes">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(c, idx) in clientesFiltradosPorEnvio"
                      :key="c.id_cliente"
                      :class="idx % 2 === 0 ? 'row-even' : 'row-odd'"
                    >
                      <td class="col-cliente-nome">
                        <strong>{{
                          c.nome_cliente || 'Cliente ' + c.id_cliente
                        }}</strong>
                      </td>
                      <td class="col-cliente-id">{{ c.id_cliente }}</td>
                      <td class="col-recebe-auto">
                        <label
                          v-if="getGrupoCliente(c.id_cliente)"
                          class="grupo-cliente-check-auto"
                        >
                          <input
                            type="checkbox"
                            :checked="
                              getGrupoCliente(c.id_cliente)
                                ?.receber_mensagens_auto
                            "
                            @change="toggleReceberMensagensAutoLocal(c)"
                            :title="
                              getGrupoCliente(c.id_cliente)
                                ?.receber_mensagens_auto
                                ? 'Sim'
                                : 'Não'
                            "
                          />
                        </label>
                        <span v-else class="grupo-cliente-sem-grupo">—</span>
                      </td>
                      <td class="col-grupo-vinculado">
                        <span
                          v-if="getGrupoCliente(c.id_cliente)"
                          class="grupo-cliente-configurado"
                        >
                          <i class="fa fa-check-circle"></i>
                          {{ getGrupoLabel(c.id_cliente) }}
                          <span
                            v-if="
                              getGrupoCliente(c.id_cliente)
                                ?.evolution_instance_name
                            "
                            class="grupo-cliente-instancia"
                            >(inst:
                            {{
                              getGrupoCliente(c.id_cliente)
                                .evolution_instance_name
                            }})</span
                          >
                        </span>
                        <span v-else class="grupo-cliente-nao-configurado"
                          ><i class="fa fa-exclamation-circle"></i> Grupo não
                          configurado</span
                        >
                      </td>
                      <td class="col-acoes">
                        <button
                          type="button"
                          class="btn btn-secondary btn-sm"
                          @click="abrirModalGrupos(c)"
                          :disabled="gruposEvolutionCache.length === 0"
                          :title="
                            gruposEvolutionCache.length === 0
                              ? 'Carregue os grupos primeiro (Recarregar)'
                              : 'Vincular este cliente a um grupo WhatsApp'
                          "
                        >
                          <i class="fa fa-link"></i> Vincular grupo
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <!-- Modal seleção de grupo -->
                <div
                  v-if="showModalGrupos"
                  class="modal-overlay"
                  @click.self="showModalGrupos = false"
                >
                  <div class="modal-content modal-grupos">
                    <h4><i class="fa fa-users"></i> Selecionar grupo Saídas</h4>
                    <p v-if="clienteModal">
                      Cliente:
                      <strong>{{
                        clienteModal.nome_cliente || clienteModal.id_cliente
                      }}</strong>
                    </p>
                    <div class="config-group">
                      <label
                        ><i class="fa fa-paper-plane"></i> Instância que envia
                        para ESTE cliente</label
                      >
                      <select
                        v-model="evolutionInstanceModal"
                        class="config-input config-select"
                      >
                        <option value="">Padrão (configuração geral)</option>
                        <option
                          v-for="inst in instanciasList"
                          :key="getInstNome(inst)"
                          :value="getInstNome(inst)"
                        >
                          {{ getInstNome(inst) }}
                        </option>
                      </select>
                    </div>
                    <div v-if="gruposModal.length > 0" class="config-group">
                      <input
                        type="text"
                        v-model="buscaGrupoModal"
                        placeholder="Pesquisar grupo..."
                        class="config-input"
                      />
                    </div>
                    <div v-if="gruposModal.length === 0" class="config-vazio">
                      Carregue os grupos primeiro.
                    </div>
                    <div v-else class="grupos-modal-lista">
                      <label
                        v-for="g in gruposModalFiltrados"
                        :key="g.id"
                        class="grupo-modal-item"
                        :class="{
                          'grupo-modal-selecionado':
                            grupoModalSelecionado === g.id,
                        }"
                      >
                        <input
                          type="radio"
                          :name="'grupo_' + (clienteModal?.id_cliente || '')"
                          :value="g.id"
                          v-model="grupoModalSelecionado"
                        />
                        <span class="grupo-modal-nome">{{
                          g.subject || g.id
                        }}</span>
                      </label>
                    </div>
                    <div v-if="grupoModalSelecionado" class="config-group">
                      <label class="grupo-modal-check-auto">
                        <input
                          type="checkbox"
                          v-model="receberMensagensAutoModal"
                        />
                        Receber mensagens automáticas no grupo
                      </label>
                    </div>
                    <div class="modal-buttons">
                      <button
                        class="btn btn-secondary"
                        @click="showModalGrupos = false"
                      >
                        Cancelar
                      </button>
                      <button
                        class="btn btn-primary"
                        @click="salvarGrupoCliente"
                        :disabled="!grupoModalSelecionado"
                      >
                        <i class="fa fa-check"></i> Salvar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modo Por Grupo (vinculação reversa) -->
            <div v-show="modoTabGrupos === 'grupo'" class="config-por-grupo">
              <p class="config-descricao">
                Selecione um Número Administrador para listar os grupos em que
                ele participa. Em seguida, vincule cada grupo a um cliente e
                defina se deve receber mensagens.
              </p>
              <div class="config-row-admin-grupos">
                <div class="config-group">
                  <label
                    ><i class="fa fa-phone"></i> Número Administrador</label
                  >
                  <select
                    v-model="adminSelecionadoParaGrupos"
                    class="config-input config-select"
                  >
                    <option value="">Selecione um admin...</option>
                    <option
                      v-for="n in numerosAdmin"
                      :key="n.id"
                      :value="n.numero"
                    >
                      {{ n.nome ? `${n.nome} (${n.numero})` : n.numero }}
                    </option>
                  </select>
                </div>
                <div class="config-group">
                  <button
                    type="button"
                    class="btn btn-primary"
                    @click="carregarGruposPorAdmin"
                    :disabled="
                      !adminSelecionadoParaGrupos || gruposPorAdminCarregando
                    "
                  >
                    <i
                      class="fa"
                      :class="
                        gruposPorAdminCarregando
                          ? 'fa-spinner fa-spin'
                          : 'fa-refresh'
                      "
                    ></i>
                    {{
                      gruposPorAdminCarregando
                        ? 'Carregando...'
                        : 'Carregar grupos'
                    }}
                  </button>
                </div>
              </div>
              <small v-if="gruposPorAdminErro" class="config-erro">{{
                gruposPorAdminErro
              }}</small>
              <div
                v-if="gruposPorAdmin.length > 0"
                class="config-row-filtro-cliente-grupo"
              >
                <div class="config-group">
                  <label
                    ><i class="fa fa-search"></i> Filtrar por cliente</label
                  >
                  <input
                    type="text"
                    v-model="filtroClientePorGrupo"
                    placeholder="Digite nome ou ID do cliente vinculado..."
                    class="config-input"
                  />
                </div>
              </div>
              <div
                v-if="gruposPorAdmin.length > 0"
                class="tabela-grupos-admin-wrapper"
              >
                <table class="tabela-grupos-admin">
                  <thead>
                    <tr>
                      <th class="col-grupo">GRUPO</th>
                      <th class="col-cliente">CLIENTE VINCULADO</th>
                      <th class="col-envio">ENVIO AUTOMÁTICO</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(g, idx) in gruposPorAdminFiltrados"
                      :key="g.id"
                      :class="idx % 2 === 0 ? 'row-even' : 'row-odd'"
                    >
                      <td class="col-grupo">
                        <strong>{{ g.subject || g.id }}</strong>
                      </td>
                      <td class="col-cliente">
                        <div
                          class="combobox-cliente-wrapper"
                          :ref="el => setComboboxRef(g.id, el)"
                        >
                          <input
                            type="text"
                            :value="
                              comboboxBusca[g.id] !== undefined
                                ? comboboxBusca[g.id]
                                : getClienteLabel(clientePorGrupo[g.id])
                            "
                            @focus="abrirCombobox(g.id)"
                            @input="onComboboxInput(g.id, $event)"
                            @keydown.down.prevent="comboboxNavegar(g.id, 1)"
                            @keydown.up.prevent="comboboxNavegar(g.id, -1)"
                            @keydown.enter.prevent="comboboxSelecionar(g)"
                            @keydown.escape="fecharCombobox(g.id)"
                            :placeholder="
                              comboboxAberto === g.id
                                ? 'Digite nome ou ID...'
                                : '— Sem cliente —'
                            "
                            class="config-input config-input-combobox"
                            autocomplete="off"
                          />
                          <div
                            v-if="comboboxAberto === g.id"
                            class="combobox-dropdown"
                          >
                            <div
                              v-for="(c, idx) in getClientesFiltradosCombobox(
                                g.id
                              )"
                              :key="c.id_cliente"
                              class="combobox-item"
                              :class="{
                                'combobox-item-selecionado':
                                  comboboxHighlight === idx,
                              }"
                              @mousedown.prevent="
                                selecionarClienteCombobox(g, c)
                              "
                            >
                              {{
                                c.nome_cliente
                                  ? `${c.nome_cliente} (ID: ${c.id_cliente})`
                                  : 'Cliente ' + c.id_cliente
                              }}
                            </div>
                            <div
                              v-if="
                                getClientesFiltradosCombobox(g.id).length === 0
                              "
                              class="combobox-item combobox-vazio"
                            >
                              Nenhum cliente encontrado
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="col-envio">
                        <label
                          v-if="clientePorGrupo[g.id]"
                          class="grupo-por-admin-check"
                        >
                          <input
                            type="checkbox"
                            :checked="getReceberAutoPorGrupo(g.id)"
                            @change="toggleReceberAutoPorGrupo(g)"
                            :title="
                              getReceberAutoPorGrupo(g.id) ? 'Sim' : 'Não'
                            "
                          />
                        </label>
                        <span v-else class="col-envio-vazio">—</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div
                v-else-if="
                  adminSelecionadoParaGrupos && !gruposPorAdminCarregando
                "
                class="config-vazio"
              >
                Selecione um admin e clique em "Carregar grupos". Se não
                aparecer nenhum, o admin pode não participar de grupos ou os
                grupos podem não conter "Saídas" no nome.
              </div>
            </div>
          </div>
        </div>

        <button
          class="btn-salvar-config"
          @click="salvarConfiguracaoRejeicao"
          :disabled="salvandoConfigRejeicao"
        >
          <i class="fa fa-save"></i>
          {{ salvandoConfigRejeicao ? 'Salvando...' : 'Salvar Configurações' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { storeToRefs } from 'pinia'
import { useGruposEvolutionStore } from '@/stores/gruposEvolution'
import {
  configuracaoRejeicaoService,
  rejeicaoService,
  numerosAdminService,
  adminGruposCacheService,
} from '@/services/api'

export default {
  name: 'ConfigRejeicoesPage',
  emits: ['notification'],
  setup(props, { emit }) {
    // No-op para compatibilidade com errorHandler global (main.js)
    const setLoading = () => {}

    const notifySuccess = msg => emit('notification', msg, 'success')
    const notifyError = msg => emit('notification', msg, 'error')
    const notifyWarning = msg => emit('notification', msg, 'warning')
    const gruposEvolutionStore = useGruposEvolutionStore()
    const {
      grupos: gruposEvolutionCache,
      loading: gruposEvolutionCarregando,
      error: gruposEvolutionErro,
    } = storeToRefs(gruposEvolutionStore)

    const configRejeicao = ref({
      whatsapp_gestor_numero: '',
      whatsapp_numero_envia: '',
      evolution_instance_name: 'default',
      notificar_auto_ativo: true,
      notificar_auto_intervalo_segundo: 90,
      rejeitado_repetir_intervalo_horas: 1,
      enviar_horario_inicio: null,
      enviar_horario_fim: null,
      enviar_dias_semana: '1,2,3,4,5',
    })
    const diasSemanaOpts = [
      { value: '1', label: 'Seg' },
      { value: '2', label: 'Ter' },
      { value: '3', label: 'Qua' },
      { value: '4', label: 'Qui' },
      { value: '5', label: 'Sex' },
      { value: '6', label: 'Sáb' },
      { value: '0', label: 'Dom' },
    ]
    const diasSemanaSelecionados = ref([])
    const salvandoConfigRejeicao = ref(false)
    const verificandoConexao = ref(false)
    const enviandoTeste = ref(false)
    const showTesteResultado = ref(false)
    const showDiagnosticoEnvio = ref(false)
    const diagnosticoEnvio = ref(null)
    const carregandoDiagnostico = ref(false)
    const resultadoTeste = ref(null)
    const clientesRejeicao = ref([])
    const mapeamentosClienteGrupo = ref([])
    const showModalGrupos = ref(false)
    const clienteModal = ref(null)
    const gruposModal = ref([])
    const grupoModalSelecionado = ref('')
    const buscaClienteGrupo = ref('')
    const filtroEnvioAutomatico = ref('todos')
    const buscaGrupoModal = ref('')
    const salvandoGrupoCliente = ref(false)
    const mapeandoCorrespondencia = ref(false)
    const receberMensagensAutoModal = ref(false)
    const instanciasEvolution = ref([])
    const instanciaPadraoSelecionada = ref('default')
    const evolutionInstanceModal = ref('')
    const novaInstanciaNome = ref('')
    const salvandoInstancia = ref(false)
    const instanciasPendentes = ref([])
    const numerosAdmin = ref([])
    const novoNumeroAdmin = ref('')
    const novoNomeAdmin = ref('')
    const salvandoNumeroAdmin = ref(false)
    const removendoNumeroAdmin = ref(null)
    const modoTabGrupos = ref('cliente')
    const adminSelecionadoParaGrupos = ref(
      localStorage.getItem('configRejeicao_adminGrupos') || ''
    )
    const filtroClientePorGrupo = ref('')
    const gruposPorAdmin = ref([])
    const gruposPorAdminCarregando = ref(false)
    const gruposPorAdminErro = ref('')
    const clientePorGrupo = ref({})

    const comboboxAberto = ref(null)
    const comboboxBusca = ref({})
    const comboboxHighlight = ref(0)
    const comboboxRefsMap = ref({})

    const setComboboxRef = (gid, el) => {
      if (el) comboboxRefsMap.value[gid] = el
    }

    const filtrarClientesPorBusca = busca => {
      const lista = clientesRejeicao.value || []
      if (!busca || !String(busca).trim()) return lista
      const buscaStr = String(busca).trim()
      const buscaLower = buscaStr.toLowerCase()
      const buscaNum = buscaStr.replace(/\D/g, '')
      const filtrados = lista.filter(c => {
        const nome = (c.nome_cliente || '').toLowerCase()
        const idStr = String(c.id_cliente ?? '')
        const idNorm = idStr.replace(/\D/g, '')
        return (
          nome.includes(buscaLower) ||
          idStr === buscaStr ||
          idNorm === buscaNum ||
          (buscaNum && (idNorm.includes(buscaNum) || idStr.includes(buscaStr)))
        )
      })
      if (buscaNum && filtrados.length > 1) {
        const exato = filtrados.find(
          c =>
            String(c.id_cliente) === buscaNum ||
            String(c.id_cliente) === buscaStr
        )
        if (exato)
          return [
            exato,
            ...filtrados.filter(c => c.id_cliente !== exato.id_cliente),
          ]
      }
      return filtrados
    }

    const getClientesFiltradosCombobox = gid =>
      filtrarClientesPorBusca(comboboxBusca.value?.[gid] ?? '')

    const getClienteLabel = idCliente => {
      if (!idCliente) return ''
      const c = clientesRejeicao.value?.find(
        x => String(x.id_cliente) === String(idCliente)
      )
      return c
        ? c.nome_cliente
          ? `${c.nome_cliente} (ID: ${c.id_cliente})`
          : `Cliente ${c.id_cliente}`
        : ''
    }

    const abrirCombobox = gid => {
      comboboxAberto.value = gid
      comboboxBusca.value = { ...comboboxBusca.value, [gid]: '' }
      comboboxHighlight.value = 0
    }

    const fecharCombobox = gid => {
      if (comboboxAberto.value === gid) {
        comboboxAberto.value = null
        const sel = clientePorGrupo.value?.[gid]
        comboboxBusca.value = { ...comboboxBusca.value, [gid]: undefined }
      }
    }

    const onComboboxInput = (gid, ev) => {
      comboboxBusca.value = { ...comboboxBusca.value, [gid]: ev.target.value }
      comboboxHighlight.value = 0
    }

    const comboboxNavegar = (gid, dir) => {
      const lista = getClientesFiltradosCombobox(gid)
      if (lista.length === 0) return
      comboboxHighlight.value = Math.max(
        0,
        Math.min(lista.length - 1, comboboxHighlight.value + dir)
      )
    }

    const comboboxSelecionar = g => {
      const lista = getClientesFiltradosCombobox(g.id)
      const c = lista[comboboxHighlight.value]
      if (c) selecionarClienteCombobox(g, c)
      else fecharCombobox(g.id)
    }

    const selecionarClienteCombobox = (g, c) => {
      clientePorGrupo.value = { ...clientePorGrupo.value, [g.id]: c.id_cliente }
      atualizarMapeamentoPorGrupo(g)
      comboboxAberto.value = null
      comboboxBusca.value = { ...comboboxBusca.value, [g.id]: undefined }
    }

    const handleClickFora = ev => {
      const gid = comboboxAberto.value
      if (!gid) return
      const wrapper = comboboxRefsMap.value?.[gid]
      if (wrapper && !wrapper.contains(ev.target)) fecharCombobox(gid)
    }

    const clientesRejeicaoFiltrados = computed(() => {
      const busca = (buscaClienteGrupo.value || '').trim().toLowerCase()
      if (!busca) return clientesRejeicao.value
      return clientesRejeicao.value.filter(c => {
        const nome = (c.nome_cliente || '').toLowerCase()
        const id = (c.id_cliente || '').toString().toLowerCase()
        return nome.includes(busca) || id.includes(busca)
      })
    })

    const totalComEnvioAuto = computed(() => {
      return (mapeamentosClienteGrupo.value || []).filter(
        m => m.grupo_saidas_jid && m.receber_mensagens_auto
      ).length
    })

    const totalComGrupo = computed(() => {
      return (mapeamentosClienteGrupo.value || []).filter(
        m => m.grupo_saidas_jid && m.grupo_saidas_jid.trim()
      ).length
    })

    const clientesFiltradosPorEnvio = computed(() => {
      const lista = clientesRejeicaoFiltrados.value || []
      const filtro = filtroEnvioAutomatico.value || 'todos'
      if (filtro === 'todos') return lista
      return lista.filter(c => {
        const m = mapeamentosClienteGrupo.value?.find(
          x => String(x.id_cliente) === String(c.id_cliente)
        )
        const temGrupo = m?.grupo_saidas_jid && m.grupo_saidas_jid.trim()
        const temAuto = !!m?.receber_mensagens_auto
        if (filtro === 'com_auto') return temGrupo && temAuto
        if (filtro === 'sem_auto') return temGrupo && !temAuto
        if (filtro === 'sem_grupo') return !temGrupo
        return true
      })
    })

    const gruposModalFiltrados = computed(() => {
      const busca = (buscaGrupoModal.value || '').trim().toLowerCase()
      if (!busca) return gruposModal.value
      return gruposModal.value.filter(g => {
        const subj = (g.subject || '').toLowerCase()
        const id = (g.id || '').toLowerCase()
        return subj.includes(busca) || id.includes(busca)
      })
    })

    /** Filtra grupos por cliente vinculado (modo Por Grupo) */
    const gruposPorAdminFiltrados = computed(() => {
      const lista = gruposPorAdmin.value || []
      const busca = (filtroClientePorGrupo.value || '').trim().toLowerCase()
      if (!busca) return lista
      const semCliente =
        busca === 'sem cliente' || busca === 'sem cliente vinculado'
      return lista.filter(g => {
        const idCliente = clientePorGrupo.value?.[g.id]
        if (!idCliente) return semCliente
        const c = clientesRejeicao.value?.find(
          x => String(x.id_cliente) === String(idCliente)
        )
        const nome = (c?.nome_cliente || '').toLowerCase()
        const id = (idCliente || '').toString().toLowerCase()
        return nome.includes(busca) || id.includes(busca)
      })
    })

    const instanciasList = computed(() => instanciasEvolution.value || [])
    const getInstNome = inst =>
      inst && typeof inst === 'object' ? inst.instance_name : String(inst || '')
    const getInstIsDefault = inst =>
      inst && typeof inst === 'object' ? !!inst.isdefault : false

    const loadConfiguracaoRejeicao = async () => {
      try {
        const response = await configuracaoRejeicaoService.getConfiguracao()
        const data = response?.data ?? response
        if (data && typeof data === 'object') {
          configRejeicao.value = {
            whatsapp_gestor_numero: data.whatsapp_gestor_numero || '',
            whatsapp_numero_envia: data.whatsapp_numero_envia || '',
            evolution_instance_name: data.evolution_instance_name || 'default',
            notificar_auto_ativo: data.notificar_auto_ativo !== false,
            notificar_auto_intervalo_segundo:
              data.notificar_auto_intervalo_segundo ??
              data.notificar_auto_intervalo_segundos ??
              90,
            rejeitado_repetir_intervalo_horas:
              data.rejeitado_repetir_intervalo_horas ?? 1,
            enviar_horario_inicio: data.enviar_horario_inicio ?? null,
            enviar_horario_fim: data.enviar_horario_fim ?? null,
            enviar_dias_semana: (data.enviar_dias_semana || '').trim() || null,
          }
          const diasStr = (data.enviar_dias_semana || '').toString().trim()
          diasSemanaSelecionados.value = diasStr
            ? diasStr
                .split(',')
                .map(d => String(d).trim())
                .filter(Boolean)
            : []
          instanciaPadraoSelecionada.value =
            data.evolution_instance_name || 'default'
        }
        await Promise.all([
          loadClientesRejeicao(),
          loadClientesGrupos(),
          loadInstanciasEvolution(),
          loadNumerosAdmin(),
        ])
        if (!gruposEvolutionStore.hasCache) {
          try {
            const instance =
              instanciaPadraoSelecionada.value ||
              configRejeicao.value?.evolution_instance_name
            await gruposEvolutionStore.load({ instanceName: instance })
          } catch (_) {
            /* grupos carregados em segundo plano - usuário pode clicar Recarregar se precisar */
          }
        }
      } catch (e) {
        console.error('Erro ao carregar configuração:', e)
        notifyError(
          'Erro: ' +
            (e.message ||
              'Rota não encontrada. Verifique se o backend está rodando e as tabelas foram criadas.')
        )
      }
    }

    const loadClientesRejeicao = async () => {
      try {
        const res = await rejeicaoService.getClientesRejeicao()
        clientesRejeicao.value = res.data?.clientes || []
      } catch (e) {
        clientesRejeicao.value = []
      }
    }

    const loadClientesGrupos = async () => {
      try {
        const res = await rejeicaoService.getClientesGrupos()
        mapeamentosClienteGrupo.value = res.data?.mapeamentos || []
      } catch (e) {
        mapeamentosClienteGrupo.value = []
      }
    }

    const loadNumerosAdmin = async () => {
      try {
        const res = await numerosAdminService.listar()
        numerosAdmin.value = res?.numeros || []
      } catch (e) {
        numerosAdmin.value = []
      }
    }

    const adicionarNumeroAdmin = async () => {
      const num = novoNumeroAdmin.value?.trim().replace(/\D/g, '')
      if (!num) {
        notifyWarning('Informe o número.')
        return
      }
      salvandoNumeroAdmin.value = true
      try {
        await numerosAdminService.adicionar(num, novoNomeAdmin.value?.trim())
        await loadNumerosAdmin()
        novoNumeroAdmin.value = ''
        novoNomeAdmin.value = ''
        notifySuccess('Número adicionado.')
      } catch (e) {
        notifyError(e.response?.data?.error || e.message || 'Erro ao adicionar')
      } finally {
        salvandoNumeroAdmin.value = false
      }
    }

    const removerNumeroAdmin = async id => {
      removendoNumeroAdmin.value = id
      try {
        await numerosAdminService.remover(id)
        await loadNumerosAdmin()
        if (adminSelecionadoParaGrupos.value) {
          const rem = numerosAdmin.value.find(n => n.id === id)
          if (
            rem &&
            String(rem.numero) === String(adminSelecionadoParaGrupos.value)
          ) {
            adminSelecionadoParaGrupos.value = ''
            gruposPorAdmin.value = []
          }
        }
        notifySuccess('Número removido.')
      } catch (e) {
        notifyError(e.response?.data?.error || e.message || 'Erro ao remover')
      } finally {
        removendoNumeroAdmin.value = null
      }
    }

    const loadInstanciasEvolution = async () => {
      try {
        const res = await rejeicaoService.getInstanciasEvolution()
        const lista = res?.instancias || res?.data?.instancias || []
        instanciasEvolution.value = Array.isArray(lista) ? lista : []
        if (instanciasEvolution.value.length === 0) {
          instanciasEvolution.value = [
            { instance_name: 'default', isdefault: true },
          ]
        }
        const def = res?.default ?? res?.data?.default
        instanciaPadraoSelecionada.value =
          def || configRejeicao.value?.evolution_instance_name || 'default'
      } catch (e) {
        instanciasEvolution.value = [
          { instance_name: 'default', isdefault: true },
        ]
      }
    }

    const adicionarInstancia = () => {
      const nome = novaInstanciaNome.value?.trim()
      if (!nome) return
      const jaExiste = instanciasList.value?.some?.(
        i => getInstNome(i) === nome
      )
      if (jaExiste) {
        notifyWarning(`Instância "${nome}" já existe.`)
        return
      }
      instanciasPendentes.value = [...instanciasPendentes.value, nome]
      instanciasEvolution.value = [
        ...(instanciasEvolution.value || []),
        { instance_name: nome, isdefault: false },
      ]
      novaInstanciaNome.value = ''
      notifySuccess(
        `Instância "${nome}" adicionada localmente. Salve para aplicar.`
      )
    }

    const loadGruposEvolution = async () => {
      try {
        notifySuccess('Pesquisando grupos no WhatsApp...')
        const instance =
          instanciaPadraoSelecionada.value ||
          configRejeicao.value.evolution_instance_name
        await gruposEvolutionStore.load({ instanceName: instance })
        const qtd = gruposEvolutionCache.value?.length ?? 0
        notifySuccess(
          qtd > 0
            ? `${qtd} grupo(s) carregado(s) com sucesso.`
            : 'Nenhum grupo encontrado.'
        )
      } catch (e) {
        notifyError(
          'Erro ao carregar grupos: ' + (gruposEvolutionErro.value || e.message)
        )
      }
    }

    const normalize = s =>
      String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/\s+/g, ' ')
        .trim()
    const palavrasChave = nome => {
      const n = normalize(nome)
        .replace(/\b(ltda|s\.?a\.?|eireli|epp|me|eireli)\b/gi, '')
        .trim()
      return n.split(/\s+/).filter(p => p.length >= 2)
    }

    const filtrarGruposSaidasParaMapeamento = lista => {
      if (!lista || lista.length <= 1) return lista
      const comSaidas = lista.filter(g => {
        const subj = (g.subject || g.name || g.id || '').toLowerCase()
        return subj.includes('saídas') || subj.includes('saidas')
      })
      return comSaidas.length > 0 ? comSaidas : lista
    }
    const mapearCorrespondencia = () => {
      const todosGrupos = gruposEvolutionCache.value || []
      if (todosGrupos.length === 0) {
        notifyError('Carregue os grupos primeiro (clique em Recarregar).')
        return
      }
      const grupos = filtrarGruposSaidasParaMapeamento(todosGrupos)
      if (grupos.length === 0) {
        notifyError(
          'Nenhum grupo com "Saídas" no nome. O mapeamento automático usa apenas esses grupos.'
        )
        return
      }
      mapeandoCorrespondencia.value = true
      const clientes = clientesRejeicao.value || []
      const jaMapeados = new Set(
        (mapeamentosClienteGrupo.value || [])
          .filter(m => m.grupo_saidas_jid)
          .map(m => String(m.id_cliente || ''))
      )
      const jidUsados = new Set(
        (mapeamentosClienteGrupo.value || [])
          .filter(m => m.grupo_saidas_jid)
          .map(m => String(m.grupo_saidas_jid || ''))
      )
      const instance =
        instanciaPadraoSelecionada.value?.trim() ||
        configRejeicao.value?.evolution_instance_name ||
        'default'
      const receberAuto = false
      let mapeados = 0
      const novosMapeamentos = [...mapeamentosClienteGrupo.value]
      for (const c of clientes) {
        if (jaMapeados.has(String(c.id_cliente || ''))) continue
        let melhor = null
        let melhorScore = 0
        const idCliente = String(c.id_cliente || '')
        const palavrasCliente = palavrasChave(c.nome_cliente || '')
        const subjNormalizado = g => normalize(g?.subject || g?.id || '')
        for (const g of grupos) {
          if (jidUsados.has(String(g?.id || ''))) continue
          const subj = subjNormalizado(g)
          let score = 0
          if (
            idCliente &&
            (subj.includes(idCliente) || subj.includes(normalize(idCliente)))
          )
            score += 50
          if (palavrasCliente.length > 0) {
            const matches = palavrasCliente.filter(p => subj.includes(p))
            if (matches.length >= 1) score += 20 * matches.length
            if (matches.length >= 2) score += 15
          }
          if (score > melhorScore) {
            melhorScore = score
            melhor = g
          }
        }
        if (melhor && melhorScore >= 20) {
          const idx = novosMapeamentos.findIndex(
            m => String(m.id_cliente) === String(c.id_cliente)
          )
          const novo = {
            id_cliente: c.id_cliente,
            nome_cliente: c.nome_cliente || '',
            grupo_saidas_jid: melhor.id,
            grupo_saidas_nome: melhor.subject || melhor.id,
            receber_mensagens_auto: receberAuto,
            evolution_instance_name: instance,
          }
          if (idx >= 0) {
            novosMapeamentos[idx] = { ...novosMapeamentos[idx], ...novo }
          } else {
            novosMapeamentos.push(novo)
          }
          jidUsados.add(String(melhor.id))
          jaMapeados.add(idCliente)
          mapeados++
        }
      }
      mapeamentosClienteGrupo.value = novosMapeamentos
      mapeandoCorrespondencia.value = false
      if (mapeados > 0) {
        notifySuccess(
          `${mapeados} cliente(s) mapeado(s) localmente. Salve para aplicar.`
        )
      } else {
        notifySuccess(
          'Nenhuma correspondência encontrada. Os grupos podem ter nomes diferentes dos clientes.'
        )
      }
    }

    const getGrupoCliente = idCliente =>
      mapeamentosClienteGrupo.value.find(
        m => String(m.id_cliente) === String(idCliente)
      )
    const getGrupoLabel = idCliente => {
      const m = getGrupoCliente(idCliente)
      return m?.grupo_saidas_jid
        ? m.grupo_saidas_nome || m.grupo_saidas_jid
        : ''
    }

    const salvarConfiguracaoRejeicao = async () => {
      try {
        salvandoConfigRejeicao.value = true
        const cfg = configRejeicao.value || {}
        const diasStr =
          (diasSemanaSelecionados.value || []).length > 0
            ? diasSemanaSelecionados.value.join(',')
            : ''
        const configParaSalvar = {
          ...cfg,
          evolution_instance_name:
            instanciaPadraoSelecionada.value?.trim() ||
            cfg.evolution_instance_name ||
            'default',
          notificar_auto_intervalo_segundos:
            cfg.notificar_auto_intervalo_segundo ??
            cfg.notificar_auto_intervalo_segundos ??
            90,
          notificar_auto_intervalo_segundo:
            cfg.notificar_auto_intervalo_segundo ??
            cfg.notificar_auto_intervalo_segundos ??
            90,
          enviar_horario_inicio:
            cfg.enviar_horario_inicio != null &&
            cfg.enviar_horario_inicio !== ''
              ? cfg.enviar_horario_inicio
              : null,
          enviar_horario_fim:
            cfg.enviar_horario_fim != null && cfg.enviar_horario_fim !== ''
              ? cfg.enviar_horario_fim
              : null,
          enviar_dias_semana: diasStr || null,
        }
        await configuracaoRejeicaoService.atualizarConfiguracao(
          configParaSalvar
        )
        const instPadrao = instanciaPadraoSelecionada.value?.trim()
        if (instPadrao && instPadrao !== 'default') {
          await rejeicaoService.setDefaultInstanciaEvolution(instPadrao)
        }
        for (const nome of instanciasPendentes.value) {
          await rejeicaoService.addInstanciaEvolution(nome)
        }
        instanciasPendentes.value = []
        await loadInstanciasEvolution()
        const mapeamentosParaSalvar = (mapeamentosClienteGrupo.value || [])
          .filter(m => m.grupo_saidas_jid)
          .map(m => ({
            id_cliente: m.id_cliente,
            nome_cliente: m.nome_cliente || '',
            grupo_saidas_jid: m.grupo_saidas_jid,
            grupo_saidas_nome: m.grupo_saidas_nome || '',
            receber_mensagens_auto: !!m.receber_mensagens_auto,
            evolution_instance_name: m.evolution_instance_name || null,
          }))
        if (mapeamentosParaSalvar.length > 0) {
          const res = await rejeicaoService.salvarClientesGruposBatch(
            mapeamentosParaSalvar
          )
          const salvos = res?.salvos ?? mapeamentosParaSalvar.length
          if (salvos < mapeamentosParaSalvar.length) {
            notifyWarning(
              `Salvo: ${salvos} de ${mapeamentosParaSalvar.length} mapeamentos. Verifique o console do backend.`
            )
          }
        }
        await loadClientesGrupos()
        notifySuccess('Configurações salvas com sucesso!')
      } catch (e) {
        notifyError('Erro ao salvar: ' + (e.response?.data?.error || e.message))
      } finally {
        salvandoConfigRejeicao.value = false
      }
    }

    const enviarTesteWhatsApp = async () => {
      try {
        enviandoTeste.value = true
        showTesteResultado.value = false
        const response = await configuracaoRejeicaoService.enviarTeste()
        resultadoTeste.value = response?.data || response
        showTesteResultado.value = true
      } catch (error) {
        const data = error.response?.data
        resultadoTeste.value =
          data && typeof data === 'object' && 'sucesso' in data
            ? data
            : {
                sucesso: false,
                mensagem:
                  data?.error || error.message || 'Erro ao enviar teste',
              }
        showTesteResultado.value = true
      } finally {
        enviandoTeste.value = false
      }
    }

    const abrirDiagnosticoEnvio = async () => {
      carregandoDiagnostico.value = true
      diagnosticoEnvio.value = null
      showDiagnosticoEnvio.value = true
      try {
        const res = await configuracaoRejeicaoService.getDiagnosticoEnvio()
        diagnosticoEnvio.value = res?.data ?? res
      } catch (e) {
        diagnosticoEnvio.value = {
          error: e.message || String(e),
          observacao: 'Erro ao carregar diagnóstico.',
        }
      } finally {
        carregandoDiagnostico.value = false
      }
    }

    const verificarStatusConexao = async () => {
      try {
        verificandoConexao.value = true
        const inst =
          instanciaPadraoSelecionada.value ||
          configRejeicao.value.evolution_instance_name
        const response = await configuracaoRejeicaoService.verificarStatus({
          evolution_instance_name: inst || '',
        })
        const data = response?.data || response
        if (data.conectado) {
          notifySuccess('WhatsApp conectado!')
        } else {
          const motivo =
            data.motivo ||
            (data.instancias_encontradas?.length > 0
              ? `Instância não encontrada. Disponíveis: ${data.instancias_encontradas.join(', ')}`
              : 'Verifique URL, chave e nome da instância.')
          let msg = motivo
          if (data.evolution_url_used)
            msg += ` (URL: ${data.evolution_url_used})`
          notifyWarning(msg)
        }
      } catch (e) {
        const errData = e.response?.data || {}
        let msg = errData.error || e.message
        if (errData.evolution_url_used)
          msg += ` URL usada: ${errData.evolution_url_used}`
        notifyError('Erro: ' + msg)
      } finally {
        verificandoConexao.value = false
      }
    }

    const habilitarEnvioAutoTodosComGrupo = () => {
      const comGrupo = (mapeamentosClienteGrupo.value || []).filter(
        m => m.grupo_saidas_jid && m.grupo_saidas_jid.trim()
      )
      if (comGrupo.length === 0) {
        notifyWarning('Nenhum cliente com grupo vinculado.')
        return
      }
      const idsComGrupo = new Set(comGrupo.map(m => String(m.id_cliente)))
      mapeamentosClienteGrupo.value = (mapeamentosClienteGrupo.value || []).map(
        item =>
          idsComGrupo.has(String(item.id_cliente))
            ? { ...item, receber_mensagens_auto: true }
            : item
      )
      notifySuccess(
        `${comGrupo.length} cliente(s) com envio automático habilitado. Salve para aplicar.`
      )
    }

    const toggleReceberMensagensAutoLocal = cliente => {
      const m = getGrupoCliente(cliente.id_cliente)
      if (!m) return
      const novo = !m.receber_mensagens_auto
      mapeamentosClienteGrupo.value = mapeamentosClienteGrupo.value.map(item =>
        String(item.id_cliente) === String(cliente.id_cliente)
          ? { ...item, receber_mensagens_auto: novo }
          : item
      )
      notifySuccess(
        `Alteração local: ${novo ? 'ativado' : 'desativado'}. Salve para aplicar.`
      )
    }

    const aplicarGruposPorAdmin = lista => {
      gruposPorAdmin.value = lista
      clientePorGrupo.value = {}
      for (const g of lista) {
        const m = mapeamentosClienteGrupo.value?.find(
          m2 => String(m2.grupo_saidas_jid) === String(g.id)
        )
        if (m) clientePorGrupo.value[g.id] = m.id_cliente
      }
    }

    const carregarGruposPorAdmin = async () => {
      const admin = adminSelecionadoParaGrupos.value
      if (!admin) return
      gruposPorAdminCarregando.value = true
      gruposPorAdminErro.value = ''
      const instance =
        instanciaPadraoSelecionada.value ||
        configRejeicao.value?.evolution_instance_name
      try {
        const res = await rejeicaoService.getGruposEvolution(instance, admin)
        const lista = res?.grupos || res?.data?.grupos || []
        aplicarGruposPorAdmin(lista)
        if (lista.length > 0) {
          await adminGruposCacheService.salvar(admin, instance, lista)
        }
        notifySuccess(`${lista.length} grupo(s) encontrado(s).`)
      } catch (e) {
        gruposPorAdmin.value = []
        gruposPorAdminErro.value = e.message || 'Erro ao carregar grupos'
        notifyError(gruposPorAdminErro.value)
      } finally {
        gruposPorAdminCarregando.value = false
      }
    }

    const carregarGruposCachePorAdmin = async () => {
      const admin = adminSelecionadoParaGrupos.value
      if (!admin) return
      try {
        const instance =
          instanciaPadraoSelecionada.value ||
          configRejeicao.value?.evolution_instance_name
        const res = await adminGruposCacheService.obter(admin, instance)
        const lista = res?.grupos || []
        if (lista.length > 0) {
          aplicarGruposPorAdmin(lista)
        }
      } catch (_) {}
    }

    const atualizarMapeamentoPorGrupo = g => {
      const idCliente = clientePorGrupo.value[g.id]
      const instance =
        instanciaPadraoSelecionada.value ||
        configRejeicao.value?.evolution_instance_name ||
        null
      if (!idCliente) {
        mapeamentosClienteGrupo.value = mapeamentosClienteGrupo.value.filter(
          m => String(m.grupo_saidas_jid) !== String(g.id)
        )
        return
      }
      const cliente = clientesRejeicao.value.find(
        c => String(c.id_cliente) === String(idCliente)
      )
      const novo = {
        id_cliente: idCliente,
        nome_cliente: cliente?.nome_cliente || '',
        grupo_saidas_jid: g.id,
        grupo_saidas_nome: g.subject || g.id,
        receber_mensagens_auto: getReceberAutoPorGrupo(g.id),
        evolution_instance_name: instance,
      }
      let lista = mapeamentosClienteGrupo.value || []
      lista = lista.filter(m => String(m.grupo_saidas_jid) !== String(g.id))
      const idxCliente = lista.findIndex(
        m => String(m.id_cliente) === String(idCliente)
      )
      if (idxCliente >= 0) {
        lista = lista.map((m, i) => (i === idxCliente ? { ...m, ...novo } : m))
      } else {
        lista = [...lista, novo]
      }
      mapeamentosClienteGrupo.value = lista
    }

    const getReceberAutoPorGrupo = grupoId => {
      const m = mapeamentosClienteGrupo.value?.find(
        m2 => String(m2.grupo_saidas_jid) === String(grupoId)
      )
      return !!m?.receber_mensagens_auto
    }

    const toggleReceberAutoPorGrupo = g => {
      const idCliente = clientePorGrupo.value[g.id]
      if (!idCliente) return
      const m = mapeamentosClienteGrupo.value?.find(
        m2 => String(m2.grupo_saidas_jid) === String(g.id)
      )
      if (!m) return
      const novo = !m.receber_mensagens_auto
      mapeamentosClienteGrupo.value = mapeamentosClienteGrupo.value.map(item =>
        String(item.grupo_saidas_jid) === String(g.id)
          ? { ...item, receber_mensagens_auto: novo }
          : item
      )
    }

    const abrirModalGrupos = cliente => {
      clienteModal.value = cliente
      buscaGrupoModal.value = ''
      const mapeado = getGrupoCliente(cliente.id_cliente)
      grupoModalSelecionado.value = mapeado?.grupo_saidas_jid || ''
      receberMensagensAutoModal.value = mapeado
        ? mapeado.receber_mensagens_auto !== false
        : false
      evolutionInstanceModal.value = mapeado?.evolution_instance_name || ''
      gruposModal.value = gruposEvolutionCache.value
      showModalGrupos.value = true
    }

    const salvarGrupoCliente = () => {
      if (!clienteModal.value || !grupoModalSelecionado.value) return
      const grupo = gruposModal.value.find(
        g => g.id === grupoModalSelecionado.value
      )
      const novo = {
        id_cliente: clienteModal.value.id_cliente,
        nome_cliente: clienteModal.value.nome_cliente || '',
        grupo_saidas_jid: grupoModalSelecionado.value,
        grupo_saidas_nome: grupo?.subject || '',
        evolution_instance_name: evolutionInstanceModal.value || null,
        receber_mensagens_auto: receberMensagensAutoModal.value,
      }
      const idx = mapeamentosClienteGrupo.value.findIndex(
        m => String(m.id_cliente) === String(clienteModal.value.id_cliente)
      )
      if (idx >= 0) {
        mapeamentosClienteGrupo.value = mapeamentosClienteGrupo.value.map(
          (m, i) => (i === idx ? { ...m, ...novo } : m)
        )
      } else {
        mapeamentosClienteGrupo.value = [...mapeamentosClienteGrupo.value, novo]
      }
      showModalGrupos.value = false
      notifySuccess('Grupo vinculado localmente. Salve para aplicar.')
    }

    watch(instanciaPadraoSelecionada, val => {
      if (configRejeicao.value) {
        configRejeicao.value.evolution_instance_name =
          val || configRejeicao.value.evolution_instance_name || 'default'
      }
    })

    watch(
      adminSelecionadoParaGrupos,
      val => {
        if (val) localStorage.setItem('configRejeicao_adminGrupos', val)
      },
      { immediate: true }
    )

    watch([adminSelecionadoParaGrupos, modoTabGrupos], () => {
      if (modoTabGrupos.value === 'grupo' && adminSelecionadoParaGrupos.value) {
        carregarGruposCachePorAdmin()
      }
    })

    onMounted(() => {
      loadConfiguracaoRejeicao()
      document.addEventListener('click', handleClickFora)
    })
    onBeforeUnmount(() => {
      document.removeEventListener('click', handleClickFora)
    })

    return {
      setLoading,
      configRejeicao,
      diasSemanaOpts,
      diasSemanaSelecionados,
      salvandoConfigRejeicao,
      verificandoConexao,
      enviandoTeste,
      showTesteResultado,
      showDiagnosticoEnvio,
      diagnosticoEnvio,
      carregandoDiagnostico,
      abrirDiagnosticoEnvio,
      resultadoTeste,
      clientesRejeicao,
      clientesRejeicaoFiltrados,
      clientesFiltradosPorEnvio,
      filtroEnvioAutomatico,
      totalComEnvioAuto,
      totalComGrupo,
      gruposEvolutionCache,
      gruposEvolutionCarregando,
      gruposEvolutionErro,
      buscaClienteGrupo,
      buscaGrupoModal,
      gruposModal,
      gruposModalFiltrados,
      grupoModalSelecionado,
      showModalGrupos,
      clienteModal,
      salvandoGrupoCliente,
      mapeandoCorrespondencia,
      habilitarEnvioAutoTodosComGrupo,
      receberMensagensAutoModal,
      loadGruposEvolution,
      mapearCorrespondencia,
      loadInstanciasEvolution,
      adicionarInstancia,
      instanciasEvolution,
      instanciasList,
      instanciaPadraoSelecionada,
      getInstNome,
      getInstIsDefault,
      evolutionInstanceModal,
      novaInstanciaNome,
      salvandoInstancia,
      getGrupoCliente,
      getGrupoLabel,
      salvarConfiguracaoRejeicao,
      enviarTesteWhatsApp,
      verificarStatusConexao,
      toggleReceberMensagensAutoLocal,
      abrirModalGrupos,
      salvarGrupoCliente,
      numerosAdmin,
      novoNumeroAdmin,
      novoNomeAdmin,
      salvandoNumeroAdmin,
      removendoNumeroAdmin,
      adicionarNumeroAdmin,
      removerNumeroAdmin,
      modoTabGrupos,
      adminSelecionadoParaGrupos,
      filtroClientePorGrupo,
      gruposPorAdmin,
      gruposPorAdminFiltrados,
      gruposPorAdminCarregando,
      gruposPorAdminErro,
      clientePorGrupo,
      comboboxAberto,
      comboboxBusca,
      comboboxHighlight,
      setComboboxRef,
      getClienteLabel,
      getClientesFiltradosCombobox,
      abrirCombobox,
      onComboboxInput,
      comboboxNavegar,
      comboboxSelecionar,
      fecharCombobox,
      selecionarClienteCombobox,
      carregarGruposPorAdmin,
      atualizarMapeamentoPorGrupo,
      getReceberAutoPorGrupo,
      toggleReceberAutoPorGrupo,
    }
  },
}
</script>

<style scoped>
.config-rejeicoes {
  padding: 1rem;
}

.tab-panel-header {
  margin-bottom: 1.5rem;
}

.tab-panel-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.painel-configuracoes-card {
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.painel-rejeicoes-wide {
  max-width: 100%;
  width: 100%;
}

.painel-configuracoes-card h4 {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 1.1rem;
}

.painel-configuracoes-card h5 {
  margin: 0 0 0.75rem 0;
  color: #1e293b;
  font-size: 1rem;
}

.config-descricao {
  color: #64748b;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.config-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.config-group label {
  font-weight: 500;
  color: #475569;
  font-size: 0.95rem;
}
.config-hint {
  font-weight: 400;
  font-size: 0.85rem;
  color: #64748b;
  font-style: italic;
}
.config-small {
  color: #64748b;
  margin-top: 0.25rem;
  display: block;
}
.config-erro {
  color: #ef4444;
  display: block;
  margin-top: 0.5rem;
}
.config-vazio {
  color: #64748b;
  padding: 1rem;
}
.config-check-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}
.config-input {
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  max-width: 500px;
  width: 100%;
}
.config-input-small {
  max-width: 120px;
}
.config-input:focus {
  outline: none;
  border-color: #3b82f6;
}
.config-section {
  margin-top: 1rem;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.config-section-horario {
  margin-top: 1rem;
  padding: 1rem;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #bae6fd;
}
.config-info-box .config-rejeitados-regras {
  padding: 0.75rem 1rem;
  background: #f0f9ff;
  border-radius: 8px;
  border: 1px solid #bae6fd;
}
.config-rejeitados-regras p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
  color: #475569;
}
.config-rejeitados-regras p:first-child {
  margin-top: 0;
}
.config-rejeitados-regras p:last-child {
  margin-bottom: 0;
}
.config-section-grupos {
  margin-top: 1.5rem;
}
.config-row-horario {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.config-dias-semana {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  align-items: center;
}
.config-check-dia {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  font-weight: normal;
}
.config-group-buttons-grupos {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
}
.config-buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.btn-primary {
  background: #3b82f6;
  color: white;
}
.btn-secondary {
  background: #e2e8f0;
  color: #475569;
}
.btn-sm {
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-salvar-config {
  padding: 0.875rem 2rem;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: white;
  font-weight: 600;
  cursor: pointer;
  align-self: flex-start;
  margin-top: 1rem;
}
.btn-salvar-config:hover:not(:disabled) {
  background: #2563eb;
}
.btn-salvar-config:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 520px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}
.modal-content h4 {
  margin: 0 0 1rem 0;
}
.modal-buttons {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  justify-content: flex-end;
}
.modal-diagnostico {
  max-width: 560px;
}
.modal-diagnostico .diagnostico-lista {
  margin: 1rem 0;
  text-align: left;
}
.modal-diagnostico .diagnostico-lista dt {
  font-weight: 600;
  color: #475569;
  margin-top: 0.75rem;
  font-size: 0.9rem;
}
.modal-diagnostico .diagnostico-lista dd {
  margin: 0.25rem 0 0 0;
  font-size: 0.95rem;
}
.modal-diagnostico .diagnostico-lista dd.small {
  font-size: 0.85rem;
  color: #64748b;
}
.modal-diagnostico .diagnostico-tabelas {
  display: block;
  margin-top: 0.35rem;
  font-size: 0.85rem;
  color: #64748b;
}
.text-success {
  color: #22c55e;
}
.text-warning {
  color: #f59e0b;
}
.btn-outline-secondary {
  background: transparent;
  color: #475569;
  border: 1px solid #cbd5e1;
}
.btn-outline-secondary:hover:not(:disabled) {
  background: #f1f5f9;
}

.lista-grupos-cliente {
  display: flex;
  flex-direction: column;
}
.tabela-clientes-grupos {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.tabela-clientes-grupos thead {
  background: #f1f5f9;
}
.tabela-clientes-grupos th {
  padding: 0.75rem 1rem;
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.03em;
  color: #475569;
  text-transform: uppercase;
  border-bottom: 2px solid #e2e8f0;
  text-align: center;
  white-space: nowrap;
}
.tabela-clientes-grupos th.col-cliente-nome {
  min-width: 200px;
  text-align: left;
}
.tabela-clientes-grupos th.col-cliente-id {
  width: 80px;
}
.tabela-clientes-grupos th.col-recebe-auto {
  min-width: 200px;
}
.tabela-clientes-grupos th.col-grupo-vinculado {
  min-width: 220px;
  text-align: left;
}
.tabela-clientes-grupos th.col-acoes {
  width: 130px;
  white-space: nowrap;
}
.tabela-clientes-grupos tbody tr {
  border-bottom: 1px solid #e2e8f0;
}
.tabela-clientes-grupos tbody tr:last-child {
  border-bottom: none;
}
.tabela-clientes-grupos tbody tr.row-even {
  background: #fff;
}
.tabela-clientes-grupos tbody tr.row-odd {
  background: #f8fafc;
}
.tabela-clientes-grupos tbody tr:hover {
  background: #f0f9ff;
}
.tabela-clientes-grupos td {
  padding: 0.75rem 1rem;
  vertical-align: middle;
  text-align: center;
}
.tabela-clientes-grupos td.col-cliente-nome,
.tabela-clientes-grupos td.col-grupo-vinculado {
  text-align: left;
}
.grupo-cliente-configurado {
  color: #22c55e;
  font-size: 0.9rem;
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}
.grupo-cliente-check-auto {
  font-weight: normal;
  color: #475569;
  font-size: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0;
}
.grupo-cliente-nao-configurado {
  color: #f59e0b;
  font-size: 0.9rem;
}
.grupo-cliente-sem-grupo {
  color: #94a3b8;
}
.modal-grupos {
  max-width: 560px;
}
.grupos-modal-lista {
  max-height: 280px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.grupo-modal-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
}
.grupo-modal-item:hover {
  background: #f8fafc;
}
.grupo-modal-item.grupo-modal-selecionado {
  border-color: #3b82f6;
  background: #eff6ff;
}
.grupo-modal-nome {
  flex: 1;
}
.grupo-modal-check-auto {
  font-size: 0.9rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.config-select {
  max-width: 500px;
  cursor: pointer;
}
.config-row-instancia-pesquisa {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: flex-end;
  margin-bottom: 0.75rem;
}
.config-row-instancia-pesquisa .config-group {
  flex: 1;
  min-width: 200px;
}
.config-group-pesquisa-cliente .config-input {
  max-width: 280px;
}
.config-group-filtro-envio .config-input {
  max-width: 220px;
}
.config-select-filtro {
  min-width: 180px;
}
.config-resumo-envio {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  color: #1e40af;
}
.config-resumo-envio strong {
  color: #1d4ed8;
}
.config-resumo-separador {
  color: #93c5fd;
  margin: 0 0.25rem;
}
.config-row-instancia-add {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.config-add-instancia {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}
.config-input-instancia {
  max-width: 180px;
}
.grupo-cliente-instancia {
  font-size: 0.8rem;
  color: #64748b;
  margin-left: 0.35rem;
}
.config-carregando {
  padding: 2rem;
  text-align: center;
  color: #64748b;
}
.config-section-numeros-admin {
  margin-top: 1rem;
}
.config-numeros-admin-add {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 0.75rem;
}
.config-input-numero {
  max-width: 160px;
}
.config-input-nome {
  max-width: 180px;
}
.config-numeros-admin-lista {
  list-style: none;
  padding: 0;
  margin: 0;
}
.config-numero-admin-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  border: 1px solid #e2e8f0;
}
.config-numero-admin-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.config-numero-admin-nome {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: normal;
}
.btn-remove {
  color: #ef4444;
}
.config-tabs-grupos {
  display: flex;
  gap: 0;
  margin-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}
.config-tab {
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-weight: 500;
  color: #64748b;
}
.config-tab input {
  display: none;
}
.config-tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}
.config-por-grupo {
  padding-top: 1rem;
}
.config-row-admin-grupos {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-end;
  margin-bottom: 0.75rem;
}
.config-row-filtro-cliente-grupo {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-end;
  margin-bottom: 0.75rem;
}
.config-row-filtro-cliente-grupo .config-input {
  max-width: 300px;
}
.tabela-grupos-admin-wrapper {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: visible;
  background: #fff;
}
.tabela-grupos-admin {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}
.tabela-grupos-admin thead {
  background: #f1f5f9;
}
.tabela-grupos-admin th {
  padding: 0.75rem 1rem;
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.03em;
  color: #475569;
  text-transform: uppercase;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}
.tabela-grupos-admin th.col-grupo {
  min-width: 180px;
  text-align: left;
}
.tabela-grupos-admin th.col-cliente {
  min-width: 280px;
  text-align: center;
}
.tabela-grupos-admin th.col-envio {
  min-width: 140px;
  width: 140px;
  text-align: center;
}
.tabela-grupos-admin tbody tr {
  border-bottom: 1px solid #e2e8f0;
}
.tabela-grupos-admin tbody tr:last-child {
  border-bottom: none;
}
.tabela-grupos-admin tbody tr.row-even {
  background: #fff;
}
.tabela-grupos-admin tbody tr.row-odd {
  background: #f8fafc;
}
.tabela-grupos-admin tbody tr:hover {
  background: #f0f9ff;
}
.tabela-grupos-admin td {
  padding: 0.75rem 1rem;
  vertical-align: middle;
}
.tabela-grupos-admin td.col-grupo {
  text-align: left;
  font-size: 0.95rem;
  line-height: 1.4;
}
.tabela-grupos-admin td.col-cliente {
  text-align: center;
}
.tabela-grupos-admin td.col-cliente .combobox-cliente-wrapper {
  display: inline-block;
  max-width: 320px;
}
.tabela-grupos-admin td.col-cliente .config-input-combobox {
  width: 100%;
  min-width: 200px;
  max-width: 320px;
}
.tabela-grupos-admin td.col-envio {
  text-align: center;
}
.tabela-grupos-admin td.col-envio .grupo-por-admin-check {
  justify-content: center;
}
.tabela-grupos-admin .col-envio-vazio {
  color: #94a3b8;
  font-size: 0.9rem;
}
.grupo-por-admin-check {
  font-weight: normal;
  font-size: 0.9rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
  margin: 0;
}
.config-select-cliente {
  max-width: 280px;
  min-width: 200px;
}
.config-row-busca-por-grupo {
  margin-bottom: 0.75rem;
}
.combobox-cliente-wrapper {
  position: relative;
  display: inline-block;
}
.config-input-combobox {
  min-width: 200px;
  max-width: 280px;
}
.combobox-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 2px;
  max-height: 300px;
  overflow-y: auto;
  background: #fff;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1100;
}
.combobox-item {
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  font-size: 0.9rem;
  border-bottom: 1px solid #f1f5f9;
}
.combobox-item:hover {
  background: #f0f9ff;
}
.combobox-item-selecionado {
  background: #dbeafe;
}
.combobox-item:last-child {
  border-bottom: none;
}
.combobox-vazio {
  color: #94a3b8;
  font-style: italic;
  cursor: default;
}
</style>
