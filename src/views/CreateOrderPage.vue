<template>
  <div class="create-order-page">
    <h1>Criar Pedido de Saída - TESTE TOOLTIP</h1>

    <!-- Etapa 1: Seleção do tipo de criação -->
    <div v-if="step === 1" class="selection-step">
      <div class="card">
        <h2>Como deseja criar o pedido?</h2>

        <!-- Opção 1: Upload de XML -->
        <div class="option-section">
          <label for="xml-upload" class="upload-label">
            <div class="upload-box" :class="{ active: xmlFile }">
              <input
                type="file"
                id="xml-upload"
                accept=".xml"
                @change="handleXmlUpload"
                :disabled="createWithoutNfe"
              />
              <div class="upload-icon">📄</div>
              <div v-if="!xmlFile">
                <p class="upload-text">
                  Clique para selecionar arquivo XML da NFe
                </p>
                <p class="upload-hint">
                  Tópico 6 - Integração da Nota Fiscal de Saída
                </p>
              </div>
              <div v-else class="file-selected">
                <p class="file-name">{{ xmlFile.name }}</p>
                <button
                  type="button"
                  @click.stop="clearXmlFile"
                  class="btn-clear"
                >
                  ✕
                </button>
              </div>
            </div>
          </label>
        </div>

        <!-- Divisor -->
        <div class="divider">
          <span>OU</span>
        </div>

        <!-- Opção 2: Criar sem NFe -->
        <div class="option-section">
          <label class="checkbox-container">
            <input
              type="checkbox"
              v-model="createWithoutNfe"
              :disabled="!!xmlFile"
            />
            <span class="checkmark"></span>
            <span class="checkbox-label">Criar pedido sem nota fiscal</span>
          </label>
          <p class="option-hint">
            Tópico 4 - Integração de Pedido de Saída (DP Saída)
          </p>
        </div>

        <!-- Botão Continuar -->
        <div class="action-buttons">
          <button
            type="button"
            class="btn-continue"
            :disabled="!canContinue"
            @click="goToForm"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>

    <!-- Etapa 2: Formulário de criação -->
    <div v-if="step === 2" class="form-step">
      <div class="form-header">
        <button type="button" @click="goBack" class="btn-back">← Voltar</button>
        <h2>
          {{
            createWithoutNfe
              ? 'Pedido sem Nota Fiscal'
              : 'Pedido com Nota Fiscal'
          }}
        </h2>
      </div>

      <form @submit.prevent="submitOrder" class="order-form">
        <!-- Seção: Informações do Cliente WMS -->
        <div class="form-section">
          <h3>Informações do Armazém</h3>
          <div class="form-row">
            <div class="form-group required">
              <label for="cgccliwms" title="CGCCLIWMS"
                >CNPJ Cliente WMS (Armazém)</label
              >
              <input
                type="text"
                id="cgccliwms"
                v-model="orderData.CGCCLIWMS"
                @input="formatCNPJ($event, 'CGCCLIWMS')"
                maxlength="18"
                placeholder="00.000.000/0000-00"
                required
              />
            </div>
            <div class="form-group required">
              <label for="cgceminf" title="CGCEMINF">CNPJ Emitente da NF</label>
              <input
                type="text"
                id="cgceminf"
                v-model="orderData.CGCEMINF"
                @input="formatCNPJ($event, 'CGCEMINF')"
                maxlength="18"
                placeholder="00.000.000/0000-00"
                required
              />
            </div>
          </div>
        </div>

        <!-- Seção: Dados do Pedido -->
        <div class="form-section">
          <h3>Dados do Pedido</h3>
          <div class="form-row">
            <div class="form-group required">
              <label for="numpedcli" title="NUMPEDCLI">Número do Pedido</label>
              <input
                type="text"
                id="numpedcli"
                v-model="orderData.NUMPEDCLI"
                maxlength="50"
                placeholder="Ex: DC-123"
                required
              />
            </div>
            <div class="form-group required">
              <label for="vltotped" title="VLTOTPED"
                >Valor Total do Pedido</label
              >
              <input
                type="text"
                id="vltotped"
                v-model="orderData.VLTOTPED"
                @input="formatCurrency"
                placeholder="R$ 0,00"
                required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="obsped" title="OBSPED">Observação do Pedido</label>
              <textarea
                id="obsped"
                v-model="orderData.OBSPED"
                maxlength="2000"
                rows="3"
                placeholder="Observação não apresentada no romaneio"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="obsrom" title="OBSROM">Observação no Romaneio</label>
              <textarea
                id="obsrom"
                v-model="orderData.OBSROM"
                maxlength="2000"
                rows="3"
                placeholder="Observação apresentada no romaneio de separação"
              ></textarea>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="orderid" title="ORDER_ID">ORDER ID (Vtex)</label>
              <input
                type="text"
                id="orderid"
                v-model="orderData.ORDER_ID"
                maxlength="200"
                placeholder="ORDER ID do Pedido no Vtex"
              />
            </div>
            <div class="form-group">
              <label for="numpedrca" title="NUMPEDRCA">Número Pedido RCA</label>
              <input
                type="text"
                id="numpedrca"
                v-model="orderData.NUMPEDRCA"
                maxlength="50"
                placeholder="Número pedido RCA"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="codmarketp" title="COD_MARKETP"
                >Código Marketplace</label
              >
              <input
                type="text"
                id="codmarketp"
                v-model="orderData.COD_MARKETP"
                maxlength="200"
                placeholder="Ex: B2W, Mercado Livre"
              />
            </div>
            <div class="form-group">
              <label for="ietiqmk" title="IETIQ_MK">Etiqueta Marketplace</label>
              <select id="ietiqmk" v-model="orderData.IETIQ_MK">
                <option value="N">Não</option>
                <option value="S">Sim</option>
              </select>
            </div>
            <div class="form-group">
              <label for="orderidmk" title="ORDER_ID_MK"
                >ORDER ID Marketplace</label
              >
              <input
                type="text"
                id="orderidmk"
                v-model="orderData.ORDER_ID_MK"
                maxlength="200"
                placeholder="Shipment_ID"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="ecttpserv" title="ECT_TPSERV"
                >Tipo Serviço Correios</label
              >
              <input
                type="text"
                id="ecttpserv"
                v-model="orderData.ECT_TPSERV"
                maxlength="20"
                placeholder="Ex: PAC, SEDEX"
              />
            </div>
            <div class="form-group">
              <label for="prioridade" title="PRIORIDADE">Prioridade</label>
              <input
                type="text"
                id="prioridade"
                v-model="orderData.PRIORIDADE"
                maxlength="30"
                placeholder="Ex: ALTA, MÉDIA, BAIXA"
              />
            </div>
          </div>
        </div>

        <!-- Seção: Dados do Destinatário -->
        <div class="form-section">
          <h3>Dados do Destinatário</h3>
          <div class="form-row">
            <div class="form-group required">
              <label for="cgcdest" title="CGCDEST">CNPJ/CPF Destinatário</label>
              <input
                type="text"
                id="cgcdest"
                v-model="orderData.CGCDEST"
                @input="formatCNPJCPF"
                maxlength="18"
                placeholder="00.000.000/0000-00 ou 000.000.000-00"
                required
              />
            </div>
            <div class="form-group required">
              <label for="iedest" title="IEDEST">Inscrição Estadual</label>
              <input
                type="text"
                id="iedest"
                v-model="orderData.IEDEST"
                maxlength="20"
                placeholder="Se não tiver = ISENTO"
                required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group required full-width">
              <label for="nomedest" title="NOMEDEST">Nome/Razão Social</label>
              <input
                type="text"
                id="nomedest"
                v-model="orderData.NOMEDEST"
                maxlength="100"
                placeholder="Nome completo ou Razão Social"
                required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group required">
              <label for="cepdest" title="CEPDEST">CEP</label>
              <input
                type="text"
                id="cepdest"
                v-model="orderData.CEPDEST"
                @input="formatCEP"
                @blur="searchCEP"
                maxlength="9"
                placeholder="00000-000"
                required
              />
            </div>
            <div class="form-group required">
              <label for="ufdest" title="UFDEST">UF</label>
              <select id="ufdest" v-model="orderData.UFDEST" required>
                <option value="">Selecione</option>
                <option v-for="uf in ufs" :key="uf" :value="uf">
                  {{ uf }}
                </option>
              </select>
            </div>
            <div class="form-group required">
              <label for="ibgemundest" title="IBGEMUNDEST"
                >Código IBGE Município</label
              >
              <input
                type="text"
                id="ibgemundest"
                v-model="orderData.IBGEMUNDEST"
                maxlength="7"
                placeholder="0000000"
                required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group required">
              <label for="mundest" title="MUN_DEST">Município</label>
              <input
                type="text"
                id="mundest"
                v-model="orderData.MUN_DEST"
                maxlength="100"
                placeholder="Nome do município"
                required
              />
            </div>
            <div class="form-group required">
              <label for="bairdest" title="BAIR_DEST">Bairro</label>
              <input
                type="text"
                id="bairdest"
                v-model="orderData.BAIR_DEST"
                maxlength="100"
                placeholder="Nome do bairro"
                required
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group required" style="flex: 2">
              <label for="logrdest" title="LOGR_DEST">Logradouro</label>
              <input
                type="text"
                id="logrdest"
                v-model="orderData.LOGR_DEST"
                maxlength="100"
                placeholder="Rua, Avenida, etc"
                required
              />
            </div>
            <div class="form-group required">
              <label for="numdest" title="NUM_DEST">Número</label>
              <input
                type="text"
                id="numdest"
                v-model="orderData.NUM_DEST"
                maxlength="6"
                placeholder="Nº"
                required
              />
            </div>
            <div class="form-group required">
              <label for="compdest" title="COMP_DEST">Complemento</label>
              <input
                type="text"
                id="compdest"
                v-model="orderData.COMP_DEST"
                maxlength="50"
                placeholder="Apto, Sala, etc"
                required
              />
            </div>
          </div>
        </div>

        <!-- Seção: Dados da Transportadora -->
        <div class="form-section">
          <h3>Dados da Transportadora e Frete</h3>
          <div class="form-row">
            <div class="form-group required">
              <label for="tpfrete" title="TP_FRETE">Tipo do Frete</label>
              <select id="tpfrete" v-model="orderData.TP_FRETE" required>
                <option value="">Selecione</option>
                <option value="C">CIF (Por conta do remetente)</option>
                <option value="F">FOB (Por conta do destinatário)</option>
              </select>
            </div>
            <div class="form-group required">
              <label for="cgctrp" title="CGC_TRP">CNPJ Transportadora</label>
              <input
                type="text"
                id="cgctrp"
                v-model="orderData.CGC_TRP"
                @input="formatCNPJ($event, 'CGC_TRP')"
                maxlength="18"
                placeholder="00.000.000/0000-00"
                required
              />
            </div>
            <div class="form-group required">
              <label for="uftrp" title="UF_TRP">UF Transportadora</label>
              <select id="uftrp" v-model="orderData.UF_TRP" required>
                <option value="">Selecione</option>
                <option v-for="uf in ufs" :key="uf" :value="uf">
                  {{ uf }}
                </option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="codcarga" title="COD_CARGA">Código da Carga</label>
              <input
                type="text"
                id="codcarga"
                v-model="orderData.COD_CARGA"
                maxlength="150"
                placeholder="Código da carga"
              />
            </div>
            <div class="form-group">
              <label for="codrastreio" title="COD_RASTREIO"
                >Código de Rastreio</label
              >
              <input
                type="text"
                id="codrastreio"
                v-model="orderData.COD_RASTREIO"
                maxlength="100"
                placeholder="Código de rastreio transportadora"
              />
            </div>
            <div class="form-group">
              <label for="rotatransp" title="ROTA_TRANSP"
                >Rota da Transportadora</label
              >
              <input
                type="text"
                id="rotatransp"
                v-model="orderData.ROTA_TRANSP"
                maxlength="100"
                placeholder="Ex: ROTA 00157"
              />
            </div>
          </div>
        </div>

        <!-- Seção: Dados do Vendedor (Opcionais) -->
        <div class="form-section">
          <h3>Dados do Vendedor</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="codvendedor" title="CODVENDEDOR"
                >Código do Vendedor</label
              >
              <input
                type="text"
                id="codvendedor"
                v-model="orderData.CODVENDEDOR"
                maxlength="20"
                placeholder="Código do vendedor"
              />
            </div>
            <div class="form-group">
              <label for="nomevendedor" title="NOMEVENDEDOR"
                >Nome do Vendedor</label
              >
              <input
                type="text"
                id="nomevendedor"
                v-model="orderData.NOMEVENDEDOR"
                maxlength="100"
                placeholder="Nome do vendedor"
              />
            </div>
          </div>
        </div>

        <!-- Seção: Datas (Opcionais) -->
        <div class="form-section">
          <h3>Datas</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="dtinclusaoerp" title="DTINCLUSAOERP"
                >Data Inclusão ERP</label
              >
              <input
                type="date"
                id="dtinclusaoerp"
                v-model="orderData.DTINCLUSAOERP"
              />
            </div>
            <div class="form-group">
              <label for="dtliberacaoerp" title="DTLIBERACAOERP"
                >Data Liberação ERP</label
              >
              <input
                type="date"
                id="dtliberacaoerp"
                v-model="orderData.DTLIBERACAOERP"
              />
            </div>
            <div class="form-group">
              <label for="dtpreventsit" title="DTPREV_ENT_SITE"
                >Data Previsão Entrega Site</label
              >
              <input
                type="date"
                id="dtpreventsit"
                v-model="orderData.DTPREV_ENT_SITE"
              />
            </div>
          </div>
        </div>

        <!-- Seção: Rastreamento (Opcionais) -->
        <div class="form-section">
          <h3>Dados para Rastreamento</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="emailrastro" title="EMAILRASTRO"
                >Email para Rastreamento</label
              >
              <input
                type="email"
                id="emailrastro"
                v-model="orderData.EMAILRASTRO"
                maxlength="200"
                placeholder="email@exemplo.com"
              />
            </div>
            <div class="form-group">
              <label for="dddrastro" title="DDDRASTRO">DDD</label>
              <input
                type="text"
                id="dddrastro"
                v-model="orderData.DDDRASTRO"
                maxlength="2"
                placeholder="00"
              />
            </div>
            <div class="form-group">
              <label for="telrastro" title="TELRASTRO">Telefone</label>
              <input
                type="text"
                id="telrastro"
                v-model="orderData.TELRASTRO"
                @input="formatPhone"
                maxlength="15"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </div>

        <!-- Seção: Bloqueio (Opcional) -->
        <div class="form-section">
          <h3>Código de Bloqueio</h3>
          <div class="form-row">
            <div class="form-group">
              <label for="cdblqclg" title="CDBLQ_CLG"
                >Código Motivo de Bloqueio de Estoque (WCE)</label
              >
              <input
                type="text"
                id="cdblqclg"
                v-model="orderData.CDBLQ_CLG"
                maxlength="30"
                placeholder="Código de bloqueio"
              />
            </div>
          </div>
        </div>

        <!-- Seção: Itens do Pedido -->
        <div class="form-section">
          <div class="section-header">
            <h3>Itens do Pedido</h3>
            <button type="button" @click="addItem" class="btn-add-item">
              + Adicionar Item
            </button>
          </div>

          <div v-if="orderData.ITENS.length === 0" class="no-items">
            <p>
              Nenhum item adicionado. Clique em "Adicionar Item" para começar.
            </p>
          </div>

          <div
            v-for="(item, index) in orderData.ITENS"
            :key="index"
            class="item-card"
          >
            <div class="item-header">
              <h4>Item {{ index + 1 }}</h4>
              <button
                type="button"
                @click="removeItem(index)"
                class="btn-remove-item"
              >
                ✕ Remover
              </button>
            </div>

            <div class="form-row">
              <div class="form-group required">
                <label title="CODPROD">Código do Produto</label>
                <input
                  type="text"
                  v-model="item.CODPROD"
                  maxlength="30"
                  placeholder="Código do produto"
                  required
                />
              </div>
              <div class="form-group required">
                <label title="QTPROD">Quantidade</label>
                <input
                  type="number"
                  v-model="item.QTPROD"
                  min="1"
                  placeholder="0"
                  required
                />
              </div>
              <div class="form-group">
                <label title="VLUNIT">Valor Unitário</label>
                <input
                  type="text"
                  v-model="item.VLUNIT"
                  @input="formatItemPrice(index)"
                  placeholder="R$ 0,00"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label title="LOTFAB">Lote de Fabricação</label>
                <input
                  type="text"
                  v-model="item.LOTFAB"
                  maxlength="100"
                  placeholder="Lote de fabricação"
                />
              </div>
              <div class="form-group">
                <label title="CDBLQ_PROD">Código de Bloqueio do Produto</label>
                <input
                  type="text"
                  v-model="item.CDBLQ_PROD"
                  maxlength="30"
                  placeholder="Código de bloqueio"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label title="IDPERSO">ID Personalização</label>
                <input
                  type="text"
                  v-model="item.IDPERSO"
                  maxlength="100"
                  placeholder="Identificador de personalização"
                />
              </div>
              <div class="form-group">
                <label title="TXPERSO">Texto Personalização</label>
                <input
                  type="text"
                  v-model="item.TXPERSO"
                  maxlength="200"
                  placeholder="Texto da personalização"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Botões de Ação -->
        <div class="form-actions">
          <button type="button" @click="goBack" class="btn-cancel">
            Cancelar
          </button>
          <button type="submit" class="btn-submit" :disabled="submitting">
            {{ submitting ? 'Enviando...' : 'Criar Pedido' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CreateOrderPage',
  data() {
    return {
      step: 1,
      xmlFile: null,
      createWithoutNfe: false,
      submitting: false,
      orderData: {
        CGCCLIWMS: '',
        CGCEMINF: '',
        OBSPED: '',
        OBSROM: '',
        NUMPEDCLI: '',
        ORDER_ID: '',
        NUMPEDRCA: '',
        VLTOTPED: '',
        COD_MARKETP: '',
        IETIQ_MK: 'N',
        ORDER_ID_MK: '',
        ECT_TPSERV: '',
        CGCDEST: '',
        IEDEST: '',
        NOMEDEST: '',
        CEPDEST: '',
        UFDEST: '',
        IBGEMUNDEST: '',
        MUN_DEST: '',
        BAIR_DEST: '',
        LOGR_DEST: '',
        NUM_DEST: '',
        COMP_DEST: '',
        TP_FRETE: '',
        CODVENDEDOR: '',
        NOMEVENDEDOR: '',
        DTINCLUSAOERP: '',
        DTLIBERACAOERP: '',
        DTPREV_ENT_SITE: '',
        EMAILRASTRO: '',
        DDDRASTRO: '',
        TELRASTRO: '',
        NUMNF: '',
        SERIENF: '',
        DTEMINF: '',
        VLTOTALNF: '',
        CHAVENF: '',
        CGC_TRP: '',
        UF_TRP: '',
        CDBLQ_CLG: '',
        PRIORIDADE: '',
        COD_CARGA: '',
        COD_RASTREIO: '',
        ROTA_TRANSP: '',
        ETQCLIFILESIZE: '',
        ETQCLIZPLBASE64: '',
        ITENS: [],
      },
      ufs: [
        'AC',
        'AL',
        'AP',
        'AM',
        'BA',
        'CE',
        'DF',
        'ES',
        'GO',
        'MA',
        'MT',
        'MS',
        'MG',
        'PA',
        'PB',
        'PR',
        'PE',
        'PI',
        'RJ',
        'RN',
        'RS',
        'RO',
        'RR',
        'SC',
        'SP',
        'SE',
        'TO',
      ],
    }
  },
  computed: {
    canContinue() {
      return !!this.xmlFile || this.createWithoutNfe
    },
  },
  methods: {
    handleXmlUpload(event) {
      const file = event.target.files[0]
      if (file && file.name.endsWith('.xml')) {
        this.xmlFile = file
        this.createWithoutNfe = false
      } else {
        alert('Por favor, selecione um arquivo XML válido')
        event.target.value = ''
      }
    },
    clearXmlFile() {
      this.xmlFile = null
      document.getElementById('xml-upload').value = ''
    },
    goToForm() {
      this.step = 2
      // Se tiver XML, processar depois
      // Por enquanto apenas avança para o formulário
    },
    goBack() {
      this.step = 1
      // Resetar dados se necessário
    },
    addItem() {
      this.orderData.ITENS.push({
        NUMSEQ: (this.orderData.ITENS.length + 1).toString(),
        CODPROD: '',
        QTPROD: '',
        VLUNIT: '',
        LOTFAB: '',
        CDBLQ_PROD: '',
        IDPERSO: '',
        TXPERSO: '',
      })
    },
    removeItem(index) {
      this.orderData.ITENS.splice(index, 1)
      // Renumerar os itens
      this.orderData.ITENS.forEach((item, i) => {
        item.NUMSEQ = (i + 1).toString()
      })
    },
    formatCNPJ(event, field) {
      let value = event.target.value.replace(/\D/g, '')
      if (value.length <= 14) {
        value = value.replace(/^(\d{2})(\d)/, '$1.$2')
        value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        value = value.replace(/\.(\d{3})(\d)/, '.$1/$2')
        value = value.replace(/(\d{4})(\d)/, '$1-$2')
      }
      this.orderData[field] = value
    },
    formatCNPJCPF(event) {
      let value = event.target.value.replace(/\D/g, '')
      if (value.length <= 11) {
        // CPF
        value = value.replace(/(\d{3})(\d)/, '$1.$2')
        value = value.replace(/(\d{3})(\d)/, '$1.$2')
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      } else {
        // CNPJ
        value = value.replace(/^(\d{2})(\d)/, '$1.$2')
        value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        value = value.replace(/\.(\d{3})(\d)/, '.$1/$2')
        value = value.replace(/(\d{4})(\d)/, '$1-$2')
      }
      this.orderData.CGCDEST = value
    },
    formatCEP(event) {
      let value = event.target.value.replace(/\D/g, '')
      value = value.replace(/^(\d{5})(\d)/, '$1-$2')
      this.orderData.CEPDEST = value
    },
    async searchCEP() {
      const cep = this.orderData.CEPDEST.replace(/\D/g, '')
      if (cep.length === 8) {
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
          const data = await response.json()
          if (!data.erro) {
            this.orderData.LOGR_DEST = data.logradouro
            this.orderData.BAIR_DEST = data.bairro
            this.orderData.MUN_DEST = data.localidade
            this.orderData.UFDEST = data.uf
            this.orderData.IBGEMUNDEST = data.ibge
          }
        } catch (error) {
          console.error('Erro ao buscar CEP:', error)
        }
      }
    },
    formatCurrency(event) {
      let value = event.target.value.replace(/\D/g, '')
      value = (parseInt(value) / 100).toFixed(2)
      value = value.replace('.', ',')
      value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
      this.orderData.VLTOTPED = value
    },
    formatItemPrice(index) {
      let value = this.orderData.ITENS[index].VLUNIT.replace(/\D/g, '')
      value = (parseInt(value) / 100).toFixed(2)
      value = value.replace('.', ',')
      value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
      this.orderData.ITENS[index].VLUNIT = value
    },
    formatPhone(event) {
      let value = event.target.value.replace(/\D/g, '')
      if (value.length <= 10) {
        value = value.replace(/^(\d{2})(\d)/, '($1) $2')
        value = value.replace(/(\d{4})(\d)/, '$1-$2')
      } else {
        value = value.replace(/^(\d{2})(\d)/, '($1) $2')
        value = value.replace(/(\d{5})(\d)/, '$1-$2')
      }
      this.orderData.TELRASTRO = value
    },
    async submitOrder() {
      if (this.orderData.ITENS.length === 0) {
        alert('Adicione pelo menos um item ao pedido')
        return
      }

      this.submitting = true

      try {
        // Aqui você fará a chamada para o backend
        const payload = {
          CORPEM_ERP_DOC_SAI: {
            ...this.orderData,
          },
        }

        console.log('Payload a ser enviado:', JSON.stringify(payload, null, 2))

        // TODO: Implementar chamada ao backend
        // const response = await axios.post('/api/corpem/pedido-saida', payload)

        alert('Pedido criado com sucesso! (funcionalidade em desenvolvimento)')
        this.goBack()
      } catch (error) {
        console.error('Erro ao criar pedido:', error)
        alert('Erro ao criar pedido: ' + error.message)
      } finally {
        this.submitting = false
      }
    },
  },
}
</script>

<style scoped>
.create-order-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 28px;
}

/* Etapa 1: Seleção */
.selection-step {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 40px;
  max-width: 600px;
  width: 100%;
}

.card h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
  font-size: 24px;
}

.option-section {
  margin: 30px 0;
}

.upload-label {
  cursor: pointer;
  display: block;
}

.upload-box {
  border: 2px dashed #cbd5e0;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  transition: all 0.3s;
  background: #f7fafc;
  position: relative;
}

.upload-box:hover {
  border-color: #4299e1;
  background: #ebf8ff;
}

.upload-box.active {
  border-color: #48bb78;
  background: #f0fff4;
}

.upload-box input[type='file'] {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  cursor: pointer;
}

.upload-box input[type='file']:disabled {
  cursor: not-allowed;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.upload-text {
  font-size: 16px;
  color: #4a5568;
  margin: 10px 0;
}

.upload-hint {
  font-size: 12px;
  color: #718096;
  font-style: italic;
}

.file-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.file-name {
  font-weight: 600;
  color: #48bb78;
}

.btn-clear {
  background: #f56565;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.divider {
  text-align: center;
  margin: 30px 0;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: #e2e8f0;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider span {
  background: white;
  padding: 0 15px;
  color: #718096;
  font-weight: 600;
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 20px;
  border: 2px solid #cbd5e0;
  border-radius: 8px;
  transition: all 0.3s;
}

.checkbox-container:hover {
  border-color: #4299e1;
  background: #ebf8ff;
}

.checkbox-container input[type='checkbox'] {
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.checkbox-label {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.option-hint {
  font-size: 12px;
  color: #718096;
  font-style: italic;
  margin-top: 10px;
  margin-left: 20px;
}

.action-buttons {
  margin-top: 40px;
  display: flex;
  justify-content: center;
}

.btn-continue {
  background: #4299e1;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 15px 50px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-continue:hover:not(:disabled) {
  background: #3182ce;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(66, 153, 225, 0.3);
}

.btn-continue:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
}

/* Etapa 2: Formulário */
.form-step {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.form-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 20px;
}

.btn-back {
  background: #e2e8f0;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: 600;
  color: #2c3e50;
  transition: all 0.3s;
}

.btn-back:hover {
  background: #cbd5e0;
}

.form-header h2 {
  color: #2c3e50;
  margin: 0;
}

.order-form {
  max-width: 100%;
}

.form-section {
  margin-bottom: 40px;
  padding: 25px;
  background: #f7fafc;
  border-radius: 8px;
  border-left: 4px solid #4299e1;
}

.form-section h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 600;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  flex: 2;
}

.form-group label {
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-group label[title] {
  cursor: help;
  border-bottom: 1px dotted #cbd5e0;
  display: inline-block;
  transition: all 0.2s;
}

.form-group label[title]:hover {
  border-bottom-color: #4299e1;
  color: #2c5282;
}

.form-group.required label::after {
  content: ' *';
  color: #f56565;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid #cbd5e0;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.3s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.form-group input:disabled,
.form-group select:disabled,
.form-group textarea:disabled {
  background: #e2e8f0;
  cursor: not-allowed;
}

/* Itens do Pedido */
.btn-add-item {
  background: #48bb78;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-add-item:hover {
  background: #38a169;
}

.no-items {
  text-align: center;
  padding: 40px;
  color: #718096;
  font-style: italic;
}

.item-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e2e8f0;
}

.item-header h4 {
  color: #2c3e50;
  margin: 0;
  font-size: 16px;
}

.btn-remove-item {
  background: #f56565;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-remove-item:hover {
  background: #e53e3e;
}

/* Botões de Ação */
.form-actions {
  display: flex;
  gap: 20px;
  justify-content: flex-end;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 2px solid #e2e8f0;
}

.btn-cancel {
  background: #e2e8f0;
  color: #2c3e50;
  border: none;
  border-radius: 8px;
  padding: 15px 40px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel:hover {
  background: #cbd5e0;
}

.btn-submit {
  background: #48bb78;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 15px 40px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-submit:hover:not(:disabled) {
  background: #38a169;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
}

.btn-submit:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
}

/* Responsividade */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
  }

  .card {
    padding: 20px;
  }

  .form-section {
    padding: 15px;
  }
}
</style>
