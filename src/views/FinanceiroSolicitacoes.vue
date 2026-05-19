<template>
  <div class="portal-wrapper">
    <div class="portal-content">
      <div class="page-header">
        <div class="header-title-section">
          <h2>Solicitações de Serviços Extra</h2>
          <div class="agendamentos-count" aria-live="polite">
            <span class="count-badge">{{ historicoFiltrado.length }}</span>
            <span class="count-label">solicitações</span>
          </div>
          <p class="page-description">
            Listagem de solicitações por cliente selecionado.
          </p>
        </div>
        <div class="header-actions">
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!podeCriarSolicitacao"
            :title="podeCriarSolicitacao ? 'Criar nova solicitação' : 'Selecione um cliente específico para criar solicitação'"
            @click="abrirNovaSolicitacaoModal"
          >
            <i class="fas fa-plus" aria-hidden="true"></i>
            Nova solicitação
          </button>
        </div>
      </div>

      <section class="summary-cards">
        <div class="summary-card summary-card--empresa">
          <label class="summary-label" for="fs-empresa-topo-btn">
            Cliente/Estoque
          </label>
          <template v-if="carregandoEmpresas">
            <span class="summary-value">Carregando empresas...</span>
          </template>
          <template v-else-if="!empresasParaSelecao.length">
            <span class="summary-value summary-empresa-nome">
              Nenhuma empresa disponível
            </span>
          </template>
          <template v-else>
            <button
              id="fs-empresa-topo-btn"
              type="button"
              class="btn btn-outline-primary client-filter-btn summary-empresa-select"
              :class="{
                'btn-primary': empresaSelecionada !== '__all__',
                'btn-outline-primary': empresaSelecionada === '__all__',
              }"
              @click="abrirEmpresaModal"
            >
              <div class="client-filter-content">
                <i class="fas fa-warehouse"></i>
                <span class="client-filter-text">
                  {{ empresaSelecionadaNome }}
                </span>
                <i
                  v-if="empresaSelecionada !== '__all__'"
                  class="fas fa-times"
                  title="Selecionar todos"
                  @click.stop="selecionarTodasEmpresas"
                />
              </div>
            </button>
          </template>
        </div>
      </section>

        <div
          v-if="showEmpresaModal"
          class="modal-overlay"
          @click="fecharEmpresaModal"
        >
          <div class="modal-content estoque-selection-modal" @click.stop>
            <div class="modal-header">
              <h3>
                <i class="fas fa-warehouse"></i>
                Selecionar estoque
              </h3>
              <button class="modal-close-btn" @click="fecharEmpresaModal">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="search-container">
                <div class="search-input-wrapper">
                  <input
                    v-model.trim="empresaSearchQuery"
                    type="text"
                    placeholder="Pesquisar por nome ou CORPEM..."
                    class="search-input"
                  />
                  <button
                    v-if="empresaSearchQuery"
                    class="clear-search-btn"
                    title="Limpar pesquisa"
                    @click="empresaSearchQuery = ''"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>

              <div class="estoque-lista-vertical">
                <div
                  class="estoque-lista-item clickable-item"
                  @click="selecionarTodasEmpresas"
                >
                  <div class="estoque-lista-info">
                    <span class="estoque-nome">Todos selecionados</span>
                    <span class="estoque-numero">Exibir todos os registros disponíveis para o usuário</span>
                  </div>
                  <div class="estoque-lista-arrow">
                    <i class="fas fa-chevron-right"></i>
                  </div>
                </div>
                <div
                  v-for="empresa in empresasFiltradasModal"
                  :key="`modal-empresa-${empresa.codigo_corpem}`"
                  class="estoque-lista-item clickable-item"
                  @click="selecionarEmpresa(empresa)"
                >
                  <div class="estoque-lista-info">
                    <span class="estoque-nome">{{ empresa.nome }}</span>
                    <span class="estoque-numero">Corpem: {{ empresa.codigo_corpem }}</span>
                  </div>
                  <div class="estoque-lista-arrow">
                    <i class="fas fa-chevron-right"></i>
                  </div>
                </div>
                <div v-if="!empresasFiltradasModal.length" class="text-muted estoque-lista-vazia">
                  Nenhuma empresa encontrada.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="showNovaSolicitacaoModal"
          class="modal-overlay"
          @click="fecharNovaSolicitacaoModal"
        >
          <div class="modal-content estoque-selection-modal" @click.stop>
            <div class="modal-header">
              <h3>
                <i class="fas fa-plus-circle"></i>
                Nova solicitação
              </h3>
              <button class="modal-close-btn" @click="fecharNovaSolicitacaoModal">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="field">
                <label class="summary-label">Cliente selecionado</label>
                <div class="summary-value">{{ empresaSelecionadaNome }}</div>
              </div>

              <div class="field mt-2">
                <label for="nova-solicitacao-tipo">Tipo de solicitação <span class="req">*</span></label>
                <select
                  id="nova-solicitacao-tipo"
                  v-model="novaSolicitacao.tipo"
                  class="form-control"
                  :disabled="carregandoTipos || !tiposOpcoes.length"
                >
                  <option value="">{{ carregandoTipos ? 'Carregando tipos...' : 'Selecione o tipo' }}</option>
                  <option
                    v-for="tipo in tiposOpcoes"
                    :key="`novo-tipo-${tipo.id}`"
                    :value="tipo.id"
                  >
                    {{ tipo.label }}
                  </option>
                </select>
              </div>

              <div class="field mt-2">
                <label for="nova-solicitacao-detalhes">Detalhes <span class="req">*</span></label>
                <textarea
                  id="nova-solicitacao-detalhes"
                  v-model="novaSolicitacao.detalhes"
                  class="form-control textarea"
                  rows="5"
                  maxlength="2000"
                  placeholder="Descreva a solicitação (mínimo 20 caracteres)"
                />
              </div>

              <p v-if="erroNovaSolicitacao" class="form-error">{{ erroNovaSolicitacao }}</p>
            </div>
            <div class="modal-header">
              <div style="flex:1"></div>
              <div class="form-actions" style="margin-top:0;padding-top:0;border-top:none;">
                <button type="button" class="btn btn-secondary" @click="fecharNovaSolicitacaoModal">Cancelar</button>
                <button type="button" class="btn btn-primary" :disabled="enviandoNovaSolicitacao" @click="enviarNovaSolicitacao">
                  <i v-if="enviandoNovaSolicitacao" class="fas fa-spinner fa-spin" aria-hidden="true"></i>
                  <span>{{ enviandoNovaSolicitacao ? 'Enviando...' : 'Criar solicitação' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="showDetalhesSolicitacaoModal && solicitacaoDetalheSelecionada"
          class="modal-overlay"
          @click="fecharDetalhesSolicitacaoModal"
        >
          <div class="modal-content estoque-selection-modal" @click.stop>
            <div class="modal-header">
              <h3>
                <i class="fas fa-file-alt"></i>
                Detalhes da solicitação
              </h3>
              <button class="modal-close-btn" @click="fecharDetalhesSolicitacaoModal">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-body detalhes-modal-body">
              <div class="detalhe-grid">
                <div class="detalhe-item">
                  <span class="detalhe-label">Cliente/Estoque</span>
                  <span class="detalhe-value">{{ razaoPorCodigo(solicitacaoDetalheSelecionada) }}</span>
                </div>
                <div class="detalhe-item">
                  <span class="detalhe-label">CORPEM</span>
                  <span class="detalhe-value">{{ solicitacaoDetalheSelecionada.codigo_corpem || '—' }}</span>
                </div>
                <div class="detalhe-item">
                  <span class="detalhe-label">Tipo de serviço</span>
                  <span class="detalhe-value">{{ formatTipoSolicitacaoLabel(solicitacaoDetalheSelecionada) }}</span>
                </div>
                <div class="detalhe-item">
                  <span class="detalhe-label">Status atual</span>
                  <span class="detalhe-value">{{ solicitacaoDetalheSelecionada.status || '—' }}</span>
                </div>
                <div class="detalhe-item">
                  <span class="detalhe-label">Criada em</span>
                  <span class="detalhe-value">{{ formatDateTime(solicitacaoDetalheSelecionada.created_at) }}</span>
                </div>
              </div>

              <div class="detalhe-item mt-2">
                <span class="detalhe-label">Descrição enviada</span>
                <p class="detalhe-text">{{ formatDescricaoSolicitacao(solicitacaoDetalheSelecionada) }}</p>
              </div>

              <div class="detalhe-item mt-2">
                <span class="detalhe-label">Etapas de aprovação</span>
                <div class="detalhe-etapas">
                  <div class="detalhe-etapa">
                    <span class="detalhe-etapa-titulo">Gerência</span>
                    <span class="detalhe-etapa-status">{{ formatStatusGerencia(solicitacaoDetalheSelecionada) }}</span>
                    <span class="detalhe-etapa-meta">
                      Decisão em: {{ formatDateTime(stageAuditDetalhes.gerencia_decided_at) }}
                    </span>
                    <span class="detalhe-etapa-meta">
                      Responsável: {{ formatNomeDecisorEtapa('gerencia') }}
                    </span>
                  </div>
                  <div class="detalhe-etapa">
                    <span class="detalhe-etapa-titulo">Diretoria</span>
                    <span class="detalhe-etapa-status">{{ formatStatusDiretoria(solicitacaoDetalheSelecionada) }}</span>
                    <span class="detalhe-etapa-meta">
                      Decisão em: {{ formatDateTime(stageAuditDetalhes.diretoria_decided_at) }}
                    </span>
                    <span class="detalhe-etapa-meta">
                      Responsável: {{ formatNomeDecisorEtapa('diretoria') }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="detalhesAdicionaisSolicitacao.length" class="detalhe-item mt-2">
                <span class="detalhe-label">Campos adicionais</span>
                <ul class="detalhe-lista">
                  <li v-for="campo in detalhesAdicionaisSolicitacao" :key="campo.key">
                    <strong>{{ campo.label }}:</strong> {{ campo.value }}
                  </li>
                </ul>
              </div>

              <div class="detalhe-item mt-2">
                <span class="detalhe-label">Motivo de rejeição</span>
                <p class="detalhe-text">{{ solicitacaoDetalheSelecionada.motivo_rejeicao || '—' }}</p>
              </div>
            </div>
            <div class="modal-header">
              <div style="flex:1"></div>
              <div class="form-actions" style="margin-top:0;padding-top:0;border-top:none;">
                <button type="button" class="btn btn-secondary" @click="fecharDetalhesSolicitacaoModal">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>

      <section class="table-container historico-panel" aria-labelledby="historico-solicitacoes">
        <div class="table-header table-header--with-actions">
          <h3 id="historico-solicitacoes">Solicitações dos clientes</h3>
          <div class="table-header-actions" role="group" aria-label="Exportar listagem">
            <button
              type="button"
              class="btn btn-outline-secondary btn-export-inline"
              :disabled="carregandoHistorico || !historicoFiltrado.length"
              title="CSV com separador ; (compatível com Excel em PT-BR)"
              @click="exportarCsvFiltrado"
            >
              <i class="fas fa-file-csv" aria-hidden="true"></i>
              Exportar CSV
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary btn-export-inline"
              :disabled="carregandoHistorico || !historicoFiltrado.length"
              title="PDF resumido da listagem filtrada"
              @click="exportarPdfFiltrado"
            >
              <i class="fas fa-file-pdf" aria-hidden="true"></i>
              Exportar PDF
            </button>
          </div>
        </div>
        <p v-if="carregandoHistorico" class="panel-hint">Carregando histórico...</p>
        <template v-else-if="mensagemListaVazia">
          <p class="panel-hint">{{ mensagemListaVazia.principal }}</p>
          <p v-if="mensagemListaVazia.dica" class="panel-hint panel-hint--dica">{{ mensagemListaVazia.dica }}</p>
        </template>
        <div v-else class="historico-table-wrap">
          <table class="historico-table">
            <thead>
              <tr>
                <th>Seq</th>
                <th>CORPEM</th>
                <th>Razão social</th>
                <th>Aprovação gerência</th>
                <th>Aprovação diretoria</th>
                <th>Criação</th>
                <th>Motivo rej.</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in historicoFiltrado" :key="item.external_reference || item.id">
                <td>{{ idx + 1 }}</td>
                <td><code>{{ item.codigo_corpem || '—' }}</code></td>
                <td class="td-break">{{ razaoPorCodigo(item) }}</td>
                <td><span class="historico-status">{{ formatStatusGerencia(item) }}</span></td>
                <td><span class="historico-status">{{ formatStatusDiretoria(item) }}</span></td>
                <td>{{ formatDateTime(item.created_at) }}</td>
                <td class="td-break">{{ item.motivo_rejeicao || '—' }}</td>
                <td>
                  <button type="button" class="btn btn-secondary btn-detalhes" @click="abrirDetalhesSolicitacao(item)">
                    Ver detalhes
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <transition name="fs-toast-fade">
        <div
          v-if="toastEmpresasVisivel"
          class="fs-toast"
          role="status"
          aria-live="polite"
        >
          Lista de clientes não carregou; filtro e nomes usam as solicitações já exibidas. Atualize a página para tentar o cadastro completo.
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import { saveAs } from 'file-saver'
import apiService from '@/services/api'

const STORAGE_KEY_EMPRESA_FILTRO = 'financeiro_solicitacoes_empresa_corpem'

export default {
  name: 'FinanceiroSolicitacoes',
  data() {
    return {
      erroValidacao: '',
      erroNovaSolicitacao: '',
      historico: [],
      carregandoHistorico: false,
      empresas: [],
      showEmpresaModal: false,
      showNovaSolicitacaoModal: false,
      empresaSearchQuery: '',
      empresaSelecionada: '__all__',
      carregandoEmpresas: false,
      tiposOpcoes: [],
      carregandoTipos: false,
      enviandoNovaSolicitacao: false,
      carregandoHistoricoSilencioso: false,
      autoRefreshHistoricoMs: 10000,
      autoRefreshTimerId: null,
      showDetalhesSolicitacaoModal: false,
      solicitacaoDetalheSelecionada: null,
      novaSolicitacao: {
        tipo: '',
        detalhes: '',
      },
      empresasApiFalhou: false,
      toastEmpresasVisivel: false,
      toastEmpresasTimerId: null,
    }
  },
  computed: {
    /** Cadastro da API + CORPEMs do histórico com razão social (evita “Empresa 651” quando o CORPEM não entra no LIMIT de /empresas). */
    empresasParaSelecao() {
      const map = new Map()
      const corpemKey = (v) => String(v ?? '').trim()
      const add = (e) => {
        const c = corpemKey(e?.codigo_corpem)
        if (!c) return
        const nome = String(e?.nome || '').trim()
        const label = String(e?.label || '').trim()
        const prev = map.get(c)
        if (!prev) {
          map.set(c, { codigo_corpem: c, nome: nome || `Empresa ${c}`, label: label || (nome ? `${nome} (${c})` : `CORPEM ${c}`) })
          return
        }
        const prevNome = String(prev.nome || '')
        const isPlaceholder = /^empresa\s+\d+$/i.test(prevNome.trim())
        if (nome && (!prevNome || isPlaceholder)) {
          map.set(c, {
            codigo_corpem: c,
            nome,
            label: label || `${nome} (${c})`,
          })
        }
      }
      for (const e of this.empresas || []) add(e)
      for (const row of this.historico || []) {
        const c = corpemKey(row?.codigo_corpem)
        if (!c) continue
        const rs = String(row?.razao_social || '').trim()
        if (rs) add({ codigo_corpem: c, nome: rs, label: `${rs} (${c})` })
        else if (!map.has(c)) add({ codigo_corpem: c, nome: `Empresa ${c}`, label: `CORPEM ${c}` })
      }
      return Array.from(map.values()).sort((a, b) =>
        String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR')
      )
    },
    empresaSelecionadaNome() {
      if (this.empresaSelecionada === '__all__') return 'Todos selecionados'
      const sel = String(this.empresaSelecionada || '').trim()
      const item = (this.empresasParaSelecao || []).find((e) => String(e.codigo_corpem || '').trim() === sel)
      return item?.nome || item?.label || 'Selecionar Estoque'
    },
    empresasFiltradasModal() {
      const term = String(this.empresaSearchQuery || '').trim().toLowerCase()
      if (!term) return this.empresasParaSelecao
      return (this.empresasParaSelecao || []).filter((e) => {
        const nome = String(e.nome || '').toLowerCase()
        const label = String(e.label || '').toLowerCase()
        const corpem = String(e.codigo_corpem || '').toLowerCase()
        return nome.includes(term) || label.includes(term) || corpem.includes(term)
      })
    },
    historicoFiltrado() {
      if (this.empresaSelecionada === '__all__') return this.historico
      return (this.historico || []).filter((item) =>
        String(item?.codigo_corpem || '').trim() === this.empresaSelecionada
      )
    },
    /** Textos quando não há linhas na tabela (considera filtro e existência de clientes). */
    mensagemListaVazia() {
      if (this.carregandoHistorico) return null
      if (this.historicoFiltrado.length) return null
      if (!this.historico.length && this.empresasParaSelecao.length) {
        return {
          principal: 'Nenhuma solicitação registrada ainda.',
          dica: 'Selecione um cliente em Cliente/Estoque e use "Nova solicitação" para enviar a primeira.',
        }
      }
      if (this.historico.length && !this.historicoFiltrado.length) {
        return {
          principal: 'Nenhuma solicitação corresponde ao cliente filtrado.',
          dica: 'Escolha "Todos selecionados" ou outro estoque no filtro Cliente/Estoque.',
        }
      }
      return {
        principal: 'Nenhuma solicitação registrada ainda.',
        dica: this.empresasParaSelecao.length
          ? 'Quando houver registros autorizados para seu usuário, eles aparecerão nesta tabela.'
          : 'Se o carregamento de clientes falhou, atualize a página em alguns instantes.',
      }
    },
    podeCriarSolicitacao() {
      return !!this.empresasParaSelecao.length && this.empresaSelecionada !== '__all__'
    },
    detalhesAdicionaisSolicitacao() {
      const detalhes = this.solicitacaoDetalheSelecionada?.detalhes
      if (!detalhes || typeof detalhes !== 'object') return []
      const mapRotulos = {
        dataOperacao: 'Data de operação',
        horaInicioExtra: 'Hora início extra',
        horaFimExtra: 'Hora fim extra',
        dataDiaExtra: 'Data dia extra',
        equipeTurno: 'Equipe/turno',
        dataFeriado: 'Data feriado',
        motivoFeriado: 'Motivo feriado',
        tituloOutros: 'Título outros',
        prazoOutros: 'Prazo outros',
      }
      return Object.keys(mapRotulos)
        .map((key) => {
          const value = this.formatValorDetalhe(detalhes[key])
          return {
            key,
            label: mapRotulos[key],
            value,
          }
        })
        .filter((campo) => campo.value !== '—')
    },
    stageAuditDetalhes() {
      return this.solicitacaoDetalheSelecionada?.aprovador_json?.stage_audit || {}
    },
  },
  methods: {
    abrirDetalhesSolicitacao(item) {
      this.solicitacaoDetalheSelecionada = item || null
      this.showDetalhesSolicitacaoModal = !!item
    },
    fecharDetalhesSolicitacaoModal() {
      this.showDetalhesSolicitacaoModal = false
      this.solicitacaoDetalheSelecionada = null
    },
    formatValorDetalhe(value) {
      if (value == null) return '—'
      if (typeof value === 'string') {
        const cleaned = value.trim()
        return cleaned || '—'
      }
      if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value)
      }
      if (Array.isArray(value)) {
        return value.length ? value.join(', ') : '—'
      }
      if (typeof value === 'object') {
        const entries = Object.entries(value)
        return entries.length ? JSON.stringify(value) : '—'
      }
      return '—'
    },
    formatTipoAmigavel(rawTipo) {
      const valor = String(rawTipo || '').trim()
      if (!valor) return '—'
      const tipoConfig = (this.tiposOpcoes || []).find(
        (t) => String(t.id || '').trim() === valor || String(t.tipo_servico || '').trim() === valor
      )
      if (tipoConfig?.label) return tipoConfig.label
      return valor
        .split('_')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    },
    formatTipoSolicitacaoLabel(item) {
      const tipoDetalhe = this.formatValorDetalhe(item?.detalhes?.tipo)
      if (tipoDetalhe !== '—') return this.formatTipoAmigavel(tipoDetalhe)
      const tipoServico = this.formatValorDetalhe(item?.tipo_servico)
      if (tipoServico !== '—') return this.formatTipoAmigavel(tipoServico)
      return '—'
    },
    formatDescricaoSolicitacao(item) {
      const descricaoDetalhes = this.formatValorDetalhe(item?.detalhes?.detalhes)
      if (descricaoDetalhes !== '—') return descricaoDetalhes
      const descricaoPadrao = this.formatValorDetalhe(item?.descricao)
      if (descricaoPadrao !== '—') return descricaoPadrao
      return '—'
    },
    razaoPorCodigo(codigoOuItem) {
      const isRow =
        codigoOuItem != null && typeof codigoOuItem === 'object' && !Array.isArray(codigoOuItem)
      const item = isRow ? codigoOuItem : null
      const codigo = String((item ? item.codigo_corpem : codigoOuItem) ?? '').trim()
      if (!codigo) return '—'
      const direto = item ? String(item.razao_social || '').trim() : ''
      if (direto) return direto
      const empresa = (this.empresasParaSelecao || []).find(
        (e) => String(e.codigo_corpem || '').trim() === codigo
      )
      if (empresa?.nome) return empresa.nome
      if (empresa?.label) return empresa.label
      return `Empresa ${codigo}`
    },
    abrirEmpresaModal() {
      if (!this.empresasParaSelecao.length) return
      this.showEmpresaModal = true
    },
    fecharEmpresaModal() {
      this.showEmpresaModal = false
    },
    selecionarEmpresa(empresa) {
      this.empresaSelecionada = String(empresa?.codigo_corpem || '').trim() || '__all__'
      this.erroValidacao = ''
      this.showEmpresaModal = false
      this.persistirEmpresaSelecionada()
    },
    selecionarTodasEmpresas() {
      this.empresaSelecionada = '__all__'
      this.erroValidacao = ''
      this.showEmpresaModal = false
      this.persistirEmpresaSelecionada()
    },
    persistirEmpresaSelecionada() {
      try {
        if (typeof sessionStorage === 'undefined') return
        sessionStorage.setItem(STORAGE_KEY_EMPRESA_FILTRO, this.empresaSelecionada)
      } catch (_) {
        /* ignore quota / private mode */
      }
    },
    aplicarFiltroEmpresaPersistido() {
      if (typeof sessionStorage === 'undefined') {
        this._definirEmpresaPadraoPosCarga()
        this._sanearSelecaoInvalida()
        return
      }
      const raw = sessionStorage.getItem(STORAGE_KEY_EMPRESA_FILTRO)
      if (raw != null && raw !== '') {
        if (raw === '__all__') {
          this.empresaSelecionada = '__all__'
          this._sanearSelecaoInvalida()
          return
        }
        const val = String(raw).trim()
        if ((this.empresasParaSelecao || []).some((e) => String(e.codigo_corpem || '').trim() === val)) {
          this.empresaSelecionada = val
          return
        }
      }
      this._definirEmpresaPadraoPosCarga()
      this._sanearSelecaoInvalida()
    },
    _definirEmpresaPadraoPosCarga() {
      if (this.empresas.length === 1) {
        const c = String(this.empresas[0].codigo_corpem || '').trim()
        if (c) this.empresaSelecionada = c
      }
    },
    _sanearSelecaoInvalida() {
      if (this.empresaSelecionada === '__all__') return
      const val = String(this.empresaSelecionada || '').trim()
      if (!val) {
        this.empresaSelecionada = '__all__'
        return
      }
      const ok = (this.empresasParaSelecao || []).some((e) => String(e.codigo_corpem || '').trim() === val)
      if (!ok) this.empresaSelecionada = '__all__'
    },
    verificarToastEmpresasAusentes() {
      if (!this.empresasApiFalhou || !this.historico.length) return
      this.mostrarToastEmpresasFallback()
    },
    mostrarToastEmpresasFallback() {
      if (this.toastEmpresasTimerId) {
        clearTimeout(this.toastEmpresasTimerId)
        this.toastEmpresasTimerId = null
      }
      this.toastEmpresasVisivel = true
      this.toastEmpresasTimerId = setTimeout(() => {
        this.toastEmpresasVisivel = false
        this.toastEmpresasTimerId = null
      }, 6500)
    },
    escapeCsvCell(value) {
      const s = String(value ?? '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
      if (/[";\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
      return s
    },
    rotuloFiltroArquivo() {
      if (this.empresaSelecionada === '__all__') return 'todos'
      return String(this.empresaSelecionada || 'filtro').replace(/[^\w.-]+/g, '_')
    },
    exportarCsvFiltrado() {
      const rows = this.historicoFiltrado
      if (!rows.length || this.carregandoHistorico) return
      const headers = [
        'Seq',
        'CORPEM',
        'Razão social',
        'Gerência',
        'Diretoria',
        'Criação',
        'Motivo rejeição',
        'Status',
        'Descrição',
      ]
      const lines = [headers.join(';')]
      rows.forEach((item, idx) => {
        const cells = [
          idx + 1,
          item.codigo_corpem || '',
          this.razaoPorCodigo(item),
          this.formatStatusGerencia(item),
          this.formatStatusDiretoria(item),
          this.formatDateTime(item.created_at),
          item.motivo_rejeicao || '',
          item.status || '',
          this.formatDescricaoSolicitacao(item),
        ]
        lines.push(cells.map((c) => this.escapeCsvCell(c)).join(';'))
      })
      const bom = '\uFEFF'
      const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
      saveAs(blob, `solicitacoes-servico-extra_${this.rotuloFiltroArquivo()}.csv`)
    },
    exportarPdfFiltrado() {
      const rows = this.historicoFiltrado
      if (!rows.length || this.carregandoHistorico) return
      import('jspdf')
        .then(({ jsPDF }) => {
          const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
          const margin = 12
          const maxW = doc.internal.pageSize.getWidth() - margin * 2
          let y = 14
          doc.setFontSize(11)
          doc.text('Solicitações de serviços extra', margin, y)
          y += 6
          doc.setFontSize(8)
          const sub = `Gerado em ${new Date().toLocaleString('pt-BR')}  |  Cliente/Estoque: ${this.empresaSelecionadaNome}`
          const subLinhas = doc.splitTextToSize(sub, maxW)
          doc.text(subLinhas, margin, y)
          y += subLinhas.length * 3.6 + 6
          doc.setFontSize(7.5)
          rows.forEach((item, idx) => {
            const bloco = [
              `#${idx + 1}  CORPEM: ${item.codigo_corpem || '—'}  |  ${this.razaoPorCodigo(item)}`,
              `Tipo: ${this.formatTipoSolicitacaoLabel(item)}  |  Status: ${item.status || '—'}`,
              `Gerência: ${this.formatStatusGerencia(item)}  |  Diretoria: ${this.formatStatusDiretoria(
                item
              )}  |  Criação: ${this.formatDateTime(item.created_at)}`,
              `Motivo rejeição: ${String(item.motivo_rejeicao || '—').slice(0, 280)}`,
              `Descrição: ${this.formatDescricaoSolicitacao(item).slice(0, 500)}`,
            ].join('\n')
            const linhas = doc.splitTextToSize(bloco, maxW)
            const altura = linhas.length * 3.6 + 5
            if (y + altura > doc.internal.pageSize.getHeight() - 12) {
              doc.addPage()
              y = 14
            }
            doc.text(linhas, margin, y)
            y += altura
          })
          doc.save(`solicitacoes-servico-extra_${this.rotuloFiltroArquivo()}.pdf`)
        })
        .catch(() => {
          this.erroValidacao = 'Não foi possível gerar o PDF. Tente o export em CSV.'
        })
    },
    async carregarTipos() {
      this.carregandoTipos = true
      try {
        const resp = await apiService.get('/financeiro/solicitacoes/tipos')
        const list = Array.isArray(resp?.data) ? resp.data : []
        this.tiposOpcoes = list
          .map((item) => ({
            id: String(item?.id || '').trim(),
            tipo_servico: String(item?.tipo_servico || '').trim(),
            label: String(item?.label || item?.tipo_servico || '').trim(),
          }))
          .filter((item) => item.id && item.tipo_servico)
      } catch (e) {
        this.tiposOpcoes = []
      } finally {
        this.carregandoTipos = false
      }
    },
    abrirNovaSolicitacaoModal() {
      if (!this.podeCriarSolicitacao) return
      this.showNovaSolicitacaoModal = true
      this.erroNovaSolicitacao = ''
      if (!this.tiposOpcoes.length) {
        this.carregarTipos()
      }
    },
    fecharNovaSolicitacaoModal() {
      this.showNovaSolicitacaoModal = false
      this.erroNovaSolicitacao = ''
    },
    async enviarNovaSolicitacao() {
      if (!this.podeCriarSolicitacao) {
        this.erroNovaSolicitacao = 'Selecione um cliente específico para criar a solicitação.'
        return
      }
      const tipo = String(this.novaSolicitacao.tipo || '').trim()
      const detalhes = String(this.novaSolicitacao.detalhes || '').trim()
      if (!tipo) {
        this.erroNovaSolicitacao = 'Selecione o tipo da solicitação.'
        return
      }
      if (detalhes.length < 20) {
        this.erroNovaSolicitacao = 'Informe ao menos 20 caracteres em detalhes.'
        return
      }
      const tipoSelecionado = this.tiposOpcoes.find((t) => t.id === tipo)
      if (!tipoSelecionado) {
        this.erroNovaSolicitacao = 'Tipo de solicitação inválido.'
        return
      }

      this.enviandoNovaSolicitacao = true
      this.erroNovaSolicitacao = ''
      try {
        await apiService.post('/financeiro/solicitacoes', {
          codigo_corpem: this.empresaSelecionada,
          tipo,
          tipo_servico: tipoSelecionado.tipo_servico,
          detalhes,
          criadoEm: new Date().toISOString(),
        })
        this.showNovaSolicitacaoModal = false
        this.novaSolicitacao = { tipo: '', detalhes: '' }
        await this.carregarHistorico()
      } catch (e) {
        this.erroNovaSolicitacao = e?.message || 'Não foi possível criar a solicitação.'
      } finally {
        this.enviandoNovaSolicitacao = false
      }
    },
    temDecisaoGerencia(item) {
      const audit = item?.aprovador_json?.stage_audit || {}
      return Boolean(audit?.gerencia_decided_at || audit?.gerencia_decided_by_user_id)
    },
    temDecisaoDiretoria(item) {
      const audit = item?.aprovador_json?.stage_audit || {}
      return Boolean(audit?.diretoria_decided_at || audit?.diretoria_decided_by_user_id)
    },
    formatNomeDecisorEtapa(stage) {
      const audit = this.stageAuditDetalhes || {}
      if (stage === 'gerencia') {
        return this.formatNomePessoa(
          audit?.gerencia_decided_by_nome,
          audit?.gerencia_decided_by_email,
          audit?.gerencia_decided_by_user_id
        )
      }
      if (stage === 'diretoria') {
        return this.formatNomePessoa(
          audit?.diretoria_decided_by_nome,
          audit?.diretoria_decided_by_email,
          audit?.diretoria_decided_by_user_id
        )
      }
      return '—'
    },
    formatNomePessoa(nome, email, userId) {
      const nomeFmt = this.formatValorDetalhe(nome)
      if (nomeFmt !== '—') return nomeFmt
      return 'Não informado'
    },
    formatStatusGerencia(item) {
      const s = String(item?.status || '').toLowerCase()
      if (s === 'pendente') return 'Aguardando aprovação'
      if (s === 'aguardando_diretoria') return 'Aprovado'
      if (s === 'aprovada') return 'Aprovado'
      if (s === 'rejeitada') return this.temDecisaoDiretoria(item) ? 'Aprovado' : 'Rejeitado'
      return '—'
    },
    formatStatusDiretoria(item) {
      const s = String(item?.status || '').toLowerCase()
      if (s === 'pendente') return 'Pendente'
      if (s === 'aguardando_diretoria') return 'Aguardando aprovação'
      if (s === 'aprovada') return 'Aprovado'
      if (s === 'rejeitada') return this.temDecisaoDiretoria(item) ? 'Rejeitado' : 'Pendente'
      return '—'
    },
    formatDateTime(value) {
      if (!value) return '—'
      const dt = new Date(value)
      if (Number.isNaN(dt.getTime())) return String(value)
      return dt.toLocaleString('pt-BR')
    },
    async carregarHistorico({ silent = false } = {}) {
      if (silent) {
        if (this.carregandoHistorico || this.carregandoHistoricoSilencioso) return
        this.carregandoHistoricoSilencioso = true
      } else {
        if (this.carregandoHistorico) return
        this.carregandoHistorico = true
      }
      try {
        const resp = await apiService.get('/financeiro/solicitacoes', { limit: 300 })
        this.historico = Array.isArray(resp?.data) ? resp.data : []
      } catch (e) {
        if (!silent) {
          this.historico = []
        }
      } finally {
        if (silent) {
          this.carregandoHistoricoSilencioso = false
        } else {
          this.carregandoHistorico = false
        }
      }
    },
    iniciarAutoRefreshHistorico() {
      this.pararAutoRefreshHistorico()
      this.autoRefreshTimerId = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
        this.carregarHistorico({ silent: true })
      }, this.autoRefreshHistoricoMs)
    },
    pararAutoRefreshHistorico() {
      if (!this.autoRefreshTimerId) return
      clearInterval(this.autoRefreshTimerId)
      this.autoRefreshTimerId = null
    },
    onVisibilityChange() {
      if (typeof document === 'undefined' || document.visibilityState !== 'visible') return
      this.carregarHistorico({ silent: true })
    },
    async carregarEmpresas() {
      this.carregandoEmpresas = true
      this.empresasApiFalhou = false
      try {
        const resp = await apiService.get('/financeiro/solicitacoes/empresas')
        const list = Array.isArray(resp?.data) ? resp.data : []
        this.empresas = list
          .map((item) => ({
            codigo_corpem: String(item?.codigo_corpem || '').trim(),
            nome: String(item?.nome || '').trim(),
            label: String(item?.label || '').trim(),
          }))
          .filter((item) => item.codigo_corpem)
      } catch (e) {
        this.empresas = []
        this.empresasApiFalhou = true
        this.erroValidacao = e?.message || 'Não foi possível carregar empresas para seleção.'
      } finally {
        this.carregandoEmpresas = false
      }
    },
  },
  async mounted() {
    await Promise.all([this.carregarEmpresas(), this.carregarHistorico(), this.carregarTipos()])
    this.aplicarFiltroEmpresaPersistido()
    this.verificarToastEmpresasAusentes()
    this.iniciarAutoRefreshHistorico()
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibilityChange)
    }
  },
  beforeUnmount() {
    this.pararAutoRefreshHistorico()
    this.fecharDetalhesSolicitacaoModal()
    if (this.toastEmpresasTimerId) {
      clearTimeout(this.toastEmpresasTimerId)
      this.toastEmpresasTimerId = null
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibilityChange)
    }
  },
}
</script>

<style scoped>
/* Mesmas variáveis e casca de FaturasLista.vue */
.portal-wrapper {
  --primary: #0077ff;
  --primary-dark: #0a54a3;
  --white: #ffffff;
  --gray-50: #f8fafc;
  --gray-100: #f1f5f9;
  --gray-200: #e2e8f0;
  --gray-300: #cbd5e1;
  --gray-500: #64748b;
  --gray-600: #475569;
  --gray-700: #334155;
  --gray-800: #1e293b;
  --gray-900: #0f172a;
  --success: #10b981;
  --danger: #ef4444;

  font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: var(--white);
  min-height: 100%;
  border-radius: 12px;
}

.portal-content {
  padding: 1.5rem;
  width: 100%;
  box-sizing: border-box;
  border-radius: 12px;
  border: 0 solid #e0e0e0;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.page-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-title-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-title-section h2 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--gray-900);
}

.agendamentos-count {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 0.55rem;
  border-radius: 999px;
  background: #e0efff;
  color: #0056b3;
  font-size: 0.9rem;
  font-weight: 700;
}

.count-label {
  color: var(--gray-600);
  font-size: 0.88rem;
}

.page-description {
  margin: 4px 0 0;
  max-width: 52rem;
  color: var(--gray-500);
  font-size: 0.9rem;
  line-height: 1.45;
}

.summary-cards {
  display: grid;
  grid-template-columns: minmax(260px, 1fr);
  gap: 12px;
  margin-bottom: 1rem;
}

.summary-card {
  background: var(--white);
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  padding: 0.9rem 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.summary-card--empresa {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--gray-500);
}

.summary-value {
  margin-top: 2px;
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--gray-800);
}

.summary-empresa-nome {
  line-height: 1.35;
}

.summary-empresa-select {
  margin-top: 2px;
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

.client-filter-btn i.fa-times {
  color: #dc3545 !important;
  font-size: 0.75rem !important;
  padding: 2px !important;
  border-radius: 2px !important;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.estoque-selection-modal {
  width: min(720px, 100%);
  max-height: 80vh;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--gray-200);
}

.modal-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
}

.modal-close-btn {
  border: none;
  background: transparent;
  color: var(--gray-600);
  cursor: pointer;
}

.modal-body {
  padding: 0.9rem 1rem;
  overflow: auto;
}

.search-container {
  margin-bottom: 0.75rem;
}

.search-input-wrapper {
  position: relative;
}

.search-input {
  width: 100%;
  height: 38px;
  border: 1px solid var(--gray-300);
  border-radius: 6px;
  padding: 0 2rem 0 0.75rem;
}

.clear-search-btn {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--gray-500);
}

.estoque-lista-vertical {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.estoque-lista-item {
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  padding: 0.7rem 0.85rem;
}

.clickable-item {
  cursor: pointer;
}

.clickable-item:hover {
  background: #f8fbff;
  border-color: #bfdbfe;
}

.estoque-lista-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.estoque-nome {
  font-weight: 600;
  color: var(--gray-800);
}

.estoque-numero {
  font-size: 0.82rem;
  color: var(--gray-500);
}

.estoque-lista-arrow {
  float: right;
  margin-top: -1.3rem;
  color: var(--gray-400);
}

.estoque-lista-vazia {
  padding: 0.9rem;
  text-align: center;
}

/* Painel filtros (FaturasLista) */
.filters-container {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.table-header {
  margin-bottom: 0.5rem;
}

.table-header--with-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.table-header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.btn-export-inline {
  font-size: 0.8rem;
  padding: 0.35rem 0.65rem;
}

.table-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-800);
}

.panel-hint {
  margin: 0 0 0.85rem;
  font-size: 0.85rem;
  color: var(--gray-500);
  line-height: 1.4;
}

.panel-hint--dica {
  margin-top: -0.35rem;
  font-size: 0.8rem;
  color: var(--gray-600);
}

.fs-toast {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 9999;
  max-width: min(22rem, calc(100vw - 2rem));
  padding: 0.65rem 0.85rem;
  font-size: 0.8rem;
  line-height: 1.35;
  color: var(--gray-900);
  background: #fffbeb;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.12);
}

.fs-toast-fade-enter-active,
.fs-toast-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fs-toast-fade-enter-from,
.fs-toast-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.detalhes-modal-body {
  max-height: min(70vh, 620px);
}

.detalhe-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
}

.detalhe-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detalhe-label {
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--gray-500);
}

.detalhe-value {
  font-size: 0.9rem;
  color: var(--gray-800);
  word-break: break-word;
}

.detalhe-mono {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.82rem;
}

.detalhe-text {
  margin: 0;
  font-size: 0.9rem;
  color: var(--gray-700);
  white-space: pre-wrap;
  line-height: 1.45;
}

.detalhe-lista {
  margin: 0;
  padding-left: 1rem;
  color: var(--gray-700);
  font-size: 0.88rem;
  line-height: 1.45;
}

.detalhe-etapas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.6rem;
}

.detalhe-etapa {
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  padding: 0.6rem 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  background: var(--gray-50);
}

.detalhe-etapa-titulo {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--gray-800);
}

.detalhe-etapa-status {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--primary-dark);
}

.detalhe-etapa-meta {
  font-size: 0.78rem;
  color: var(--gray-600);
}

.detalhe-json {
  margin: 0;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  padding: 0.65rem;
  background: var(--gray-50);
  font-size: 0.78rem;
  color: var(--gray-700);
  max-height: 260px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.tipo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

/* Cartões no estilo summary-card (Faturas) */
.tipo-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  padding: 0.9rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background: var(--white);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    transform 0.15s;
  font: inherit;
  color: var(--gray-800);
}

.tipo-card:hover {
  border-color: #bfdbfe;
  box-shadow: 0 4px 8px rgba(0, 119, 255, 0.1);
  transform: translateY(-1px);
}

.tipo-card--selected {
  border-color: var(--primary);
  background: linear-gradient(180deg, #f0f7ff 0%, var(--white) 100%);
  box-shadow: 0 2px 8px rgba(0, 119, 255, 0.15);
}

.tipo-card-icon {
  font-size: 1.25rem;
  color: var(--primary);
  margin-bottom: 0.45rem;
}

.tipo-card-label {
  font-weight: 700;
  font-size: 0.95rem;
  margin-bottom: 0.2rem;
}

.tipo-card-desc {
  font-size: 0.8rem;
  color: var(--gray-500);
  line-height: 1.35;
}

/* Formulário: container tabela (Faturas) */
.table-container {
  background: var(--white);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.form-panel {
  margin-bottom: 1rem;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.mt-2 {
  margin-top: 0.75rem;
}

.field-span2 {
  grid-column: 1 / -1;
}

.field--detalhes {
  margin-top: 0.35rem;
}

.field label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #555;
  margin-bottom: 0.25rem;
}

.req {
  color: #b91c1c;
}

.form-control {
  height: 40px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  padding: 0.5rem 0.75rem;
  font: inherit;
  color: var(--gray-900);
  background: var(--white);
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(0, 119, 255, 0.15);
}

textarea.form-control {
  height: auto;
  min-height: 120px;
  resize: vertical;
  line-height: 1.45;
}

.char-count {
  font-size: 12px;
  color: var(--gray-500);
  text-align: right;
  margin-top: 0.25rem;
}

.form-error {
  margin: 0.75rem 0 0;
  font-size: 0.85rem;
  color: #b91c1c;
  font-weight: 600;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 0.8rem;
  border-top: 1px solid var(--gray-200);
}

/* Botões alinhados a FaturasLista */
.btn {
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  font-family: inherit;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--primary);
  color: var(--white);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-dark);
}

.btn-secondary {
  background-color: var(--gray-200);
  color: var(--gray-700);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--gray-300);
}

.btn-inner {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

/* Dicas — mesmo bloco comparativo (FaturasLista) */
.comparativo-empresas {
  background: var(--white);
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1rem 1.1rem 1.1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.comparativo-header {
  margin-bottom: 0.5rem;
}

.comparativo-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--gray-900);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tip-icon {
  color: var(--primary);
  font-size: 1rem;
}

.tips-list {
  margin: 0;
  padding-left: 1.2rem;
  font-size: 13px;
  color: var(--gray-600);
  line-height: 1.5;
}

/* Sucesso dentro do table-container */
.success-wrap {
  text-align: center;
  padding: 2rem 1.5rem 1.5rem;
  max-width: 28rem;
  margin: 0 auto 1rem;
}

.success-icon-wrap {
  font-size: 2.75rem;
  color: var(--success);
  margin-bottom: 0.65rem;
}

.success-title {
  margin: 0 0 0.5rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--gray-900);
}

.success-text {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  color: var(--gray-600);
}

.success-ref {
  color: var(--primary-dark);
  font-size: 1rem;
  font-weight: 700;
}

.success-hint {
  margin: 0 0 1.25rem;
  font-size: 13px;
  color: var(--gray-500);
  line-height: 1.45;
}

.historico-panel {
  margin-top: 1rem;
}

.historico-table-wrap {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
}

.historico-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1080px;
}

.historico-table th,
.historico-table td {
  padding: 0.65rem 0.75rem;
  border-bottom: 1px solid var(--gray-200);
  text-align: left;
  vertical-align: top;
  font-size: 0.82rem;
  color: var(--gray-700);
}

.historico-table th {
  background: var(--gray-50);
  color: var(--gray-600);
  font-weight: 700;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.historico-table tbody tr:hover {
  background: #f8fbff;
}

.historico-status {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--primary-dark);
}

.btn-detalhes {
  white-space: nowrap;
}

.td-break {
  max-width: 260px;
  white-space: normal;
  word-break: break-word;
}

@media (max-width: 520px) {
  .form-actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .btn {
    width: 100%;
  }
}
</style>
