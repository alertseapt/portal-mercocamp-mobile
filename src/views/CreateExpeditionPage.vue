<template>
  <div class="create-expedition-page">
    <div class="page-header">
      <div class="header-title-section">
        <h2>
          <i class="fas fa-plus-circle"></i>
          Criar Pedido de Expedição - CorpEM WMS
        </h2>
        <p class="page-description">
          Formulário completo de integração com CorpEM WMS
        </p>
      </div>
      <div class="header-actions">
        <button
          type="button"
          class="btn-reimport-xml"
          @click="xmlImported ? reimportXml() : selectXmlFile()"
          :title="
            xmlImported
              ? 'Substituir dados com outro XML'
              : 'Importar XML de NFe'
          "
        >
          <i class="fas fa-file-import"></i>
          {{ xmlImported ? 'Enviar outro XML' : 'Importar XML' }}
        </button>
      </div>
    </div>

    <!-- Lista de XMLs Processados -->
    <div v-if="processedXmls.length > 0" class="processed-xmls-section">
      <div class="xmls-header">
        <h3>
          <i class="fas fa-file-code"></i>
          XMLs Processados ({{ processedXmls.length }})
        </h3>
        <button
          type="button"
          class="btn-clear-xmls"
          @click="clearProcessedXmls"
          title="Limpar todos os XMLs"
        >
          <i class="fas fa-trash"></i>
          Limpar Todos
        </button>
      </div>
      <div class="xmls-list">
        <div
          v-for="(xml, index) in processedXmls"
          :key="index"
          class="xml-item"
        >
          <div class="xml-icon">
            <i class="fas fa-file-code"></i>
          </div>
          <div class="xml-details">
            <p class="xml-filename">{{ xml.fileName }}</p>
            <p class="xml-info">
              <span class="xml-nf">NF: {{ xml.nfeData.numeroNFe }}</span>
              <span class="xml-cnpj"
                >CNPJ: {{ xml.nfeData.cnpjDestinatario }}</span
              >
            </p>
          </div>
          <button
            type="button"
            class="btn-remove-xml"
            @click="removeProcessedXml(index)"
            title="Remover este XML"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="xmls-info">
        <p>
          <i class="fas fa-info-circle"></i>
          Os pedidos serão criados em lote com um identificador único (LOT). Os
          documentos anexados serão inseridos apenas no primeiro pedido.
        </p>
      </div>
    </div>

    <div class="page-content">
      <div class="form-container">
        <form @submit.prevent="handleSubmit">
          <!-- Seção 1: Informações Básicas -->
          <div class="form-section">
            <h3 @click="toggleSection('basicas')" class="section-header">
              <i
                class="fas"
                :class="
                  sections.basicas ? 'fa-chevron-down' : 'fa-chevron-right'
                "
              ></i>
              1. Informações Básicas do Pedido *
            </h3>
            <div v-show="sections.basicas" class="section-content">
              <div class="form-row">
                <div class="form-group">
                  <label for="cgccliwms" title="CGCCLIWMS"
                    >CNPJ Armazém *</label
                  >
                  <input
                    type="text"
                    id="cgccliwms"
                    v-model="form.CGCCLIWMS"
                    placeholder="00000000000000"
                    maxlength="14"
                    required
                  />
                  <small>Apenas números, sem máscara</small>
                </div>

                <div class="form-group">
                  <label for="cgceminf" title="CGCEMINF"
                    >CNPJ Emitente NF *</label
                  >
                  <input
                    type="text"
                    id="cgceminf"
                    v-model="form.CGCEMINF"
                    placeholder="00000000000000"
                    maxlength="14"
                    required
                  />
                  <small>Apenas números, sem máscara</small>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="numpedcli" title="NUMPEDCLI"
                    >Número do Pedido *</label
                  >
                  <input
                    type="text"
                    id="numpedcli"
                    v-model="form.NUMPEDCLI"
                    placeholder="Número único do pedido"
                    maxlength="50"
                    required
                  />
                  <small>Deve ser único</small>
                </div>

                <div class="form-group">
                  <label for="vltotped" title="VLTOTPED"
                    >Valor Total do Pedido *</label
                  >
                  <input
                    type="number"
                    id="vltotped"
                    v-model="form.VLTOTPED"
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Seção 2: Dados do Destinatário -->
          <div class="form-section">
            <h3 @click="toggleSection('destinatario')" class="section-header">
              <i
                class="fas"
                :class="
                  sections.destinatario ? 'fa-chevron-down' : 'fa-chevron-right'
                "
              ></i>
              2. Dados do Destinatário *
            </h3>
            <div v-show="sections.destinatario" class="section-content">
              <div class="form-row">
                <div class="form-group">
                  <label for="cgcdest" title="CGCDEST"
                    >CNPJ/CPF Destinatário *</label
                  >
                  <input
                    type="text"
                    id="cgcdest"
                    v-model="form.CGCDEST"
                    placeholder="00000000000000"
                    maxlength="14"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="iedest" title="IEDEST"
                    >Inscrição Estadual *</label
                  >
                  <input
                    type="text"
                    id="iedest"
                    v-model="form.IEDEST"
                    placeholder="ISENTO ou número"
                    maxlength="20"
                    required
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group full-width">
                  <label for="nomedest" title="NOMEDEST"
                    >Nome/Razão Social *</label
                  >
                  <input
                    type="text"
                    id="nomedest"
                    v-model="form.NOMEDEST"
                    placeholder="Nome completo ou razão social"
                    maxlength="100"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Seção 3: Endereço de Entrega -->
          <div class="form-section">
            <h3 @click="toggleSection('endereco')" class="section-header">
              <i
                class="fas"
                :class="
                  sections.endereco ? 'fa-chevron-down' : 'fa-chevron-right'
                "
              ></i>
              3. Endereço de Entrega *
            </h3>
            <div v-show="sections.endereco" class="section-content">
              <div class="form-row">
                <div class="form-group">
                  <label for="cepdest" title="CEPDEST">CEP *</label>
                  <div class="input-with-button">
                    <input
                      type="text"
                      id="cepdest"
                      v-model="form.CEPDEST"
                      placeholder="00000000"
                      maxlength="8"
                      required
                      @input="cepError = ''"
                    />
                    <button
                      type="button"
                      class="btn-search-cep"
                      @click="buscarCEP"
                      :disabled="loadingCep"
                      title="Buscar endereço pelo CEP"
                    >
                      <i
                        class="fas"
                        :class="loadingCep ? 'fa-spinner fa-spin' : 'fa-search'"
                      ></i>
                    </button>
                  </div>
                  <small v-if="!cepError">Apenas números</small>
                  <small v-if="cepError" class="error-message">{{
                    cepError
                  }}</small>
                  <small v-if="cepSuccess" class="success-message">{{
                    cepSuccess
                  }}</small>
                </div>

                <div class="form-group">
                  <label for="ufdest" title="UFDEST">UF *</label>
                  <select id="ufdest" v-model="form.UFDEST" required>
                    <option value="">Selecione...</option>
                    <option v-for="uf in ufs" :key="uf" :value="uf">
                      {{ uf }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="ibgemundest" title="IBGEMUNDEST"
                    >Código IBGE Município *</label
                  >
                  <input
                    type="text"
                    id="ibgemundest"
                    v-model="form.IBGEMUNDEST"
                    placeholder="0000000"
                    maxlength="7"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="mun_dest" title="MUN_DEST">Município *</label>
                  <input
                    type="text"
                    id="mun_dest"
                    v-model="form.MUN_DEST"
                    placeholder="Nome do município"
                    maxlength="100"
                    required
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="bair_dest" title="BAIR_DEST">Bairro *</label>
                  <input
                    type="text"
                    id="bair_dest"
                    v-model="form.BAIR_DEST"
                    placeholder="Nome do bairro"
                    maxlength="100"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="logr_dest" title="LOGR_DEST">Logradouro *</label>
                  <input
                    type="text"
                    id="logr_dest"
                    v-model="form.LOGR_DEST"
                    placeholder="Rua, Avenida, etc."
                    maxlength="100"
                    required
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="num_dest" title="NUM_DEST">Número *</label>
                  <input
                    type="text"
                    id="num_dest"
                    v-model="form.NUM_DEST"
                    placeholder="123"
                    maxlength="6"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Seção 4: Frete e Transporte -->
          <div class="form-section">
            <h3 @click="toggleSection('frete')" class="section-header">
              <i
                class="fas"
                :class="sections.frete ? 'fa-chevron-down' : 'fa-chevron-right'"
              ></i>
              4. Frete e Transporte *
            </h3>
            <div v-show="sections.frete" class="section-content">
              <div class="form-row">
                <div class="form-group">
                  <label for="cgc_trp" title="CGC_TRP"
                    >CNPJ Transportadora *</label
                  >
                  <input
                    type="text"
                    id="cgc_trp"
                    v-model="form.CGC_TRP"
                    placeholder="00000000000000"
                    maxlength="14"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="uf_trp" title="UF_TRP">UF Transportadora *</label>
                  <select id="uf_trp" v-model="form.UF_TRP" required>
                    <option value="">Selecione...</option>
                    <option v-for="uf in ufs" :key="uf" :value="uf">
                      {{ uf }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Seção 5: Informações da NF-e (Opcional) -->
          <div class="form-section">
            <h3 @click="toggleSection('nfe')" class="section-header">
              <i
                class="fas"
                :class="sections.nfe ? 'fa-chevron-down' : 'fa-chevron-right'"
              ></i>
              5. Informações da NF-e (Opcional)
            </h3>
            <div v-show="sections.nfe" class="section-content">
              <div class="form-row">
                <div class="form-group">
                  <label for="numnf" title="NUMNF">Número da NF</label>
                  <input
                    type="text"
                    id="numnf"
                    v-model="form.NUMNF"
                    placeholder="Número da nota fiscal"
                    maxlength="20"
                  />
                </div>

                <div class="form-group">
                  <label for="serienf" title="SERIENF">Série da NF</label>
                  <input
                    type="text"
                    id="serienf"
                    v-model="form.SERIENF"
                    placeholder="Série da nota fiscal"
                    maxlength="10"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="dteminf" title="DTEMINF">Data de Emissão</label>
                  <input type="date" id="dteminf" v-model="form.DTEMINF" />
                </div>

                <div class="form-group">
                  <label for="vltotalnf" title="VLTOTALNF"
                    >Valor Total da NF</label
                  >
                  <input
                    type="number"
                    id="vltotalnf"
                    v-model="form.VLTOTALNF"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group full-width">
                  <label for="chavenf" title="CHAVENF"
                    >Chave da NF (44 dígitos)</label
                  >
                  <input
                    type="text"
                    id="chavenf"
                    v-model="form.CHAVENF"
                    placeholder="Chave de 44 dígitos da nota fiscal"
                    maxlength="44"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Seção 6: NFes de Entrada (Crossdock) - Opcional -->
          <div class="form-section">
            <h3 @click="toggleSection('checkinNfs')" class="section-header">
              <i
                class="fas"
                :class="
                  sections.checkinNfs ? 'fa-chevron-down' : 'fa-chevron-right'
                "
              ></i>
              6. NFes de Entrada (Crossdock) - Opcional
              <span v-if="selectedCheckinNfs.length > 0" class="badge-count">
                {{ selectedCheckinNfs.length }} selecionada(s)
              </span>
            </h3>
            <div v-show="sections.checkinNfs" class="section-content">
              <p class="section-description">
                <i class="fas fa-info-circle"></i>
                Para operações de cross-docking, vincule as NFes de entrada que
                serão expedidas neste pedido.
              </p>

              <!-- Campo de busca -->
              <div class="form-group">
                <label for="searchCheckinNf">
                  <i class="fas fa-search"></i>
                  Buscar NFe de Entrada
                </label>
                <div class="search-input-wrapper">
                  <input
                    type="text"
                    id="searchCheckinNf"
                    v-model="checkinNfSearch"
                    @input="searchCheckinNfs"
                    placeholder="Digite o número da NF ou chave (mínimo 3 caracteres)"
                    class="search-input"
                    autocomplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    name="checkin-nf-search"
                  />
                  <i
                    v-if="searchingCheckinNfs"
                    class="fas fa-spinner fa-spin search-icon-loading"
                  ></i>
                </div>
                <small v-if="checkinNfSearchMessage" class="search-message">
                  {{ checkinNfSearchMessage }}
                </small>
              </div>

              <!-- Resultados da busca -->
              <div v-if="checkinNfsResults.length > 0" class="search-results">
                <h4 class="results-title">
                  <i class="fas fa-list"></i>
                  Resultados da busca ({{ checkinNfsResults.length }})
                </h4>
                <div class="results-list">
                  <div
                    v-for="schedule in checkinNfsResults"
                    :key="schedule.id"
                    class="result-item"
                    :class="{ selected: isCheckinNfSelected(schedule.id) }"
                    @click="toggleCheckinNfSelection(schedule)"
                  >
                    <div class="result-checkbox">
                      <input
                        type="checkbox"
                        :checked="isCheckinNfSelected(schedule.id)"
                        @click.stop="toggleCheckinNfSelection(schedule)"
                      />
                    </div>
                    <div class="result-content">
                      <div class="result-header">
                        <span class="result-nf-number">
                          <i class="fas fa-file-alt"></i>
                          NF: {{ schedule.numeroNF }}
                        </span>
                        <span
                          class="result-status"
                          :class="
                            'status-' +
                            schedule.status.toLowerCase().replace(' ', '-')
                          "
                        >
                          {{ schedule.status }}
                        </span>
                      </div>
                      <div class="result-details">
                        <span class="result-detail">
                          <i class="fas fa-calendar"></i>
                          {{ formatDate(schedule.dataAgendamento) }}
                        </span>
                        <span class="result-detail">
                          <i class="fas fa-warehouse"></i>
                          {{ schedule.armazem }}
                        </span>
                      </div>
                      <div v-if="schedule.chaveNF" class="result-key">
                        <i class="fas fa-key"></i>
                        {{ schedule.chaveNF.substring(0, 20) }}...
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- NFes selecionadas -->
              <div v-if="selectedCheckinNfs.length > 0" class="selected-nfs">
                <h4 class="selected-title">
                  <i class="fas fa-check-circle"></i>
                  NFes Selecionadas ({{ selectedCheckinNfs.length }})
                </h4>
                <div class="selected-list">
                  <div
                    v-for="nf in selectedCheckinNfs"
                    :key="nf.id"
                    class="selected-item"
                  >
                    <div class="selected-content">
                      <span class="selected-nf-number">
                        <i class="fas fa-file-alt"></i>
                        NF: {{ nf.numeroNF }}
                      </span>
                      <span class="selected-status">{{ nf.status }}</span>
                    </div>
                    <button
                      type="button"
                      class="btn-remove-nf"
                      @click="removeCheckinNf(nf.id)"
                      title="Remover"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Seção 7: Etiqueta do Cliente (Opcional) -->
          <div class="form-section">
            <h3 @click="toggleSection('etiqueta')" class="section-header">
              <i
                class="fas"
                :class="
                  sections.etiqueta ? 'fa-chevron-down' : 'fa-chevron-right'
                "
              ></i>
              7. Etiqueta do Cliente (Opcional)
            </h3>
            <div v-show="sections.etiqueta" class="section-content">
              <div class="upload-section">
                <p class="upload-description">
                  Faça upload de um arquivo de etiqueta personalizada do cliente
                  (.zpl ou .pdf). O arquivo será convertido automaticamente para
                  Base64 antes do envio.
                  <strong>Tamanho máximo: 2MB</strong>
                </p>

                <!-- Área de Upload -->
                <div v-if="!selectedEtiquetaFile" class="upload-area">
                  <button
                    type="button"
                    class="btn-upload"
                    @click="$refs.etiquetaFileInput.click()"
                  >
                    <i class="fas fa-cloud-upload-alt"></i>
                    Selecionar Arquivo
                  </button>
                  <p class="upload-hint">
                    Formatos aceitos: .zpl, .pdf (máx. 2MB)
                  </p>
                </div>

                <!-- Arquivo Selecionado -->
                <div v-else class="file-selected">
                  <div class="file-info">
                    <div class="file-icon">
                      <i class="fas fa-file-alt"></i>
                    </div>
                    <div class="file-details">
                      <p class="file-name">{{ etiquetaFileName }}</p>
                      <p class="file-size">
                        {{ formatFileSize(etiquetaFileSize) }}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="btn-remove"
                    @click="removeEtiquetaFile"
                    title="Remover arquivo"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>

                <!-- Input file oculto -->
                <input
                  ref="etiquetaFileInput"
                  type="file"
                  accept=".zpl,.pdf"
                  @change="handleEtiquetaFileSelect"
                  style="display: none"
                />
              </div>
            </div>
          </div>

          <!-- Seção 8: Itens do Pedido -->
          <div class="form-section">
            <h3 @click="toggleSection('itens')" class="section-header">
              <i
                class="fas"
                :class="sections.itens ? 'fa-chevron-down' : 'fa-chevron-right'"
              ></i>
              8. Itens do Pedido * ({{ form.ITENS.length }}
              {{ form.ITENS.length === 1 ? 'item' : 'itens' }})
            </h3>
            <div v-show="sections.itens" class="section-content">
              <div
                v-for="(item, index) in form.ITENS"
                :key="index"
                class="item-card"
              >
                <div class="item-header">
                  <h4>Item {{ index + 1 }}</h4>
                  <button
                    type="button"
                    class="btn-remove-item"
                    @click="removeItem(index)"
                    v-if="form.ITENS.length > 1"
                  >
                    <i class="fas fa-trash"></i>
                    Remover
                  </button>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label :for="'codprod_' + index"
                      >Código Produto (CODPROD) *</label
                    >
                    <input
                      type="text"
                      :id="'codprod_' + index"
                      v-model="item.CODPROD"
                      placeholder="Código do produto"
                      maxlength="30"
                      required
                    />
                  </div>

                  <div class="form-group">
                    <label :for="'qtprod_' + index"
                      >Quantidade (QTPROD) *</label
                    >
                    <input
                      type="number"
                      :id="'qtprod_' + index"
                      v-model="item.QTPROD"
                      placeholder="0"
                      min="1"
                      required
                    />
                  </div>
                </div>
              </div>

              <button type="button" class="btn btn-add-item" @click="addItem">
                <i class="fas fa-plus"></i>
                Adicionar Item
              </button>
            </div>
          </div>

          <!-- Botões de Ação -->
          <div class="form-actions">
            <button
              type="button"
              class="btn btn-secondary"
              @click="handleCancel"
            >
              <i class="fas fa-times"></i>
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="loading">
              <i
                class="fas"
                :class="loading ? 'fa-spinner fa-spin' : 'fa-paper-plane'"
              ></i>
              {{
                loading
                  ? 'Enviando para CorpEM WMS...'
                  : 'Criar Pedido de Expedição'
              }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Importação de XML -->
    <div
      v-if="showXmlImportModal"
      class="modal-overlay"
      @click="closeXmlImportModal"
    >
      <div class="modal-content xml-import-modal" @click.stop>
        <div class="modal-header">
          <h3>
            <i class="fas fa-file-import"></i>
            Importar Dados da NFe
          </h3>
          <button class="modal-close-btn" @click="closeXmlImportModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="xml-import-content">
            <div class="xml-import-icon">
              <i class="fas fa-file-code"></i>
            </div>

            <div class="xml-import-message">
              <h4>Deseja importar um XML de NFe?</h4>
              <p class="import-description">
                Você pode importar um arquivo XML de Nota Fiscal eletrônica para
                preencher automaticamente os campos do formulário.
              </p>
              <p class="import-hint">
                <i class="fas fa-info-circle"></i>
                O sistema extrairá informações como CNPJ, endereço, produtos e
                valores.
              </p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="skipXmlImport">
            <i class="fas fa-edit"></i>
            Preencher Manualmente
          </button>
          <button class="btn btn-primary" @click="selectXmlFile">
            <i class="fas fa-file-upload"></i>
            Selecionar XML
          </button>
        </div>
      </div>
    </div>

    <!-- Input file oculto para seleção de XMLs (permite múltiplos) -->
    <input
      ref="xmlFileInput"
      type="file"
      accept=".xml"
      :multiple="true"
      @change="handleXmlFileSelect"
      style="display: none"
    />
  </div>
</template>

<script>
import axios from 'axios'
import { BASE_URL } from '../config/api'

export default {
  name: 'CreateExpeditionPage',
  data() {
    return {
      loading: false,
      loadingCep: false,
      cepError: '',
      cepSuccess: '',
      showXmlImportModal: false,
      selectedXmlFile: null,
      xmlImported: false,
      processedXmls: [], // Array para armazenar múltiplos XMLs processados
      selectedEtiquetaFile: null,
      etiquetaFileName: '',
      etiquetaFileSize: 0,
      sections: {
        basicas: true,
        destinatario: true,
        endereco: true,
        frete: true,
        nfe: true,
        checkinNfs: true,
        etiqueta: true,
        itens: true,
      },
      // Busca de agendamentos (NFes de entrada)
      checkinNfSearch: '',
      searchingCheckinNfs: false,
      checkinNfsResults: [],
      selectedCheckinNfs: [],
      checkinNfSearchMessage: '',
      searchTimeout: null,
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
      form: {
        // Informações Básicas
        CGCCLIWMS: '',
        CGCEMINF: '',
        NUMPEDCLI: '',
        VLTOTPED: '',

        // Destinatário
        CGCDEST: '',
        IEDEST: '',
        NOMEDEST: '',

        // Endereço
        CEPDEST: '',
        UFDEST: '',
        IBGEMUNDEST: '',
        MUN_DEST: '',
        BAIR_DEST: '',
        LOGR_DEST: '',
        NUM_DEST: '',

        // Frete
        TP_FRETE: 'C', // CIF (Remetente paga) - padrão fixo
        CGC_TRP: '',
        UF_TRP: '',

        // Informações da NF-e (Opcional)
        NUMNF: '',
        SERIENF: '',
        DTEMINF: '',
        VLTOTALNF: '',
        CHAVENF: '',

        // Etiqueta do Cliente (Opcional)
        ETQCLIFILESIZE: '',
        ETQCLIZPLBASE64: '',

        // Itens
        ITENS: [
          {
            NUMSEQ: 1,
            CODPROD: '',
            QTPROD: '',
          },
        ],
      },
    }
  },
  mounted() {
    // Mostrar modal de importação de XML ao carregar a página
    this.showXmlImportModal = true
  },
  watch: {
    // Sincronizar Número do Pedido com Número da NF
    'form.NUMNF'(newValue) {
      if (newValue) {
        this.form.NUMPEDCLI = newValue
      }
    },
  },
  methods: {
    validarCEP(cep) {
      // Remove caracteres não numéricos
      const cepLimpo = cep.replace(/\D/g, '')

      // Verifica se tem 8 dígitos
      if (cepLimpo.length !== 8) {
        return false
      }

      // Verifica se não é uma sequência inválida (ex: 00000000, 11111111)
      const sequenciasInvalidas = [
        '00000000',
        '11111111',
        '22222222',
        '33333333',
        '44444444',
        '55555555',
        '66666666',
        '77777777',
        '88888888',
        '99999999',
      ]

      if (sequenciasInvalidas.includes(cepLimpo)) {
        return false
      }

      return true
    },

    // Métodos para upload de etiqueta
    async handleEtiquetaFileSelect(event) {
      const file = event.target.files[0]
      if (!file) return

      // Validar extensão - APENAS PDF e ZPL
      const fileName = file.name.toLowerCase()
      const validExtensions = ['.zpl', '.pdf']
      const hasValidExtension = validExtensions.some(ext =>
        fileName.endsWith(ext)
      )

      if (!hasValidExtension) {
        alert(
          '❌ Formato de arquivo inválido!\n\nApenas arquivos PDF e ZPL são aceitos.'
        )
        event.target.value = ''
        return
      }

      // Validar tamanho (2MB)
      const maxSize = 2 * 1024 * 1024
      if (file.size > maxSize) {
        alert('❌ Arquivo muito grande!\n\nO tamanho máximo é 2MB.')
        event.target.value = ''
        return
      }

      // Armazenar arquivo
      this.selectedEtiquetaFile = file
      this.etiquetaFileName = file.name
      this.etiquetaFileSize = file.size

      console.log(
        `✅ Arquivo selecionado: ${file.name} (${this.formatFileSize(file.size)})`
      )

      // Converter para base64
      await this.convertEtiquetaToBase64()
    },

    async convertEtiquetaToBase64() {
      if (!this.selectedEtiquetaFile) return

      try {
        const base64String = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = e => resolve(e.target.result)
          reader.onerror = e => reject(e)
          reader.readAsDataURL(this.selectedEtiquetaFile)
        })

        // Remover o prefixo "data:...;base64," da string
        const base64Content = base64String.split(',')[1]

        // Preencher campos do formulário
        this.form.ETQCLIZPLBASE64 = base64Content
        this.form.ETQCLIFILESIZE = base64Content.length.toString()

        console.log('✅ Etiqueta convertida para base64:', {
          fileName: this.etiquetaFileName,
          fileSize: this.formatFileSize(this.etiquetaFileSize),
          base64Length: base64Content.length,
        })
      } catch (error) {
        console.error('❌ Erro ao converter etiqueta:', error)
        alert('Erro ao processar o arquivo. Por favor, tente novamente.')
        this.removeEtiquetaFile()
      }
    },

    removeEtiquetaFile() {
      this.selectedEtiquetaFile = null
      this.etiquetaFileName = ''
      this.etiquetaFileSize = 0
      this.form.ETQCLIZPLBASE64 = ''
      this.form.ETQCLIFILESIZE = ''

      // Limpar input file
      if (this.$refs.etiquetaFileInput) {
        this.$refs.etiquetaFileInput.value = ''
      }

      console.log('🗑️ Arquivo de etiqueta removido')
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    async buscarCEP() {
      // Limpa mensagens anteriores
      this.cepError = ''
      this.cepSuccess = ''

      // Valida o CEP
      if (!this.validarCEP(this.form.CEPDEST)) {
        this.cepError = 'CEP inválido. Digite um CEP válido com 8 dígitos.'
        return
      }

      // Remove caracteres não numéricos
      const cepLimpo = this.form.CEPDEST.replace(/\D/g, '')

      this.loadingCep = true

      try {
        const response = await axios.get(
          `https://viacep.com.br/ws/${cepLimpo}/json/`
        )

        if (response.data.erro) {
          this.cepError = 'CEP não encontrado. Verifique o número digitado.'
          this.loadingCep = false
          return
        }

        // Preenche os campos com os dados retornados
        this.form.UFDEST = response.data.uf || ''
        this.form.MUN_DEST = response.data.localidade || ''
        this.form.BAIR_DEST = response.data.bairro || ''
        this.form.LOGR_DEST = response.data.logradouro || ''
        this.form.IBGEMUNDEST = response.data.ibge || ''

        // Exibe mensagem de sucesso
        this.cepSuccess =
          'Endereço encontrado! Você pode editar os campos se necessário.'

        // Limpa a mensagem de sucesso após 5 segundos
        setTimeout(() => {
          this.cepSuccess = ''
        }, 5000)
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
        this.cepError =
          'Erro ao buscar o CEP. Verifique sua conexão e tente novamente.'
      } finally {
        this.loadingCep = false
      }
    },

    toggleSection(section) {
      this.sections[section] = !this.sections[section]
    },
    addItem() {
      this.form.ITENS.push({
        NUMSEQ: this.form.ITENS.length + 1,
        CODPROD: '',
        QTPROD: '',
      })
    },
    removeItem(index) {
      this.form.ITENS.splice(index, 1)
      // Reajustar NUMSEQ
      this.form.ITENS.forEach((item, idx) => {
        item.NUMSEQ = idx + 1
      })
    },
    toStringValue(value) {
      // Converte qualquer valor para string (CorpEM exige todos os valores como string)
      if (value === null || value === undefined || value === '') {
        return ''
      }
      return String(value)
    },
    buildCorpemJSON() {
      // Construir JSON no formato esperado pelo CorpEM
      // IMPORTANTE: CorpEM exige que TODOS os valores sejam strings
      const corpemData = {
        CORPEM_ERP_DOC_SAI: {
          ...this.form,
          // Converter datas para formato dd/mm/yyyy
          DTEMINF: this.formatDateToDDMMYYYY(this.form.DTEMINF),
          DTINCLUSAOERP: this.formatDateToDDMMYYYY(this.form.DTINCLUSAOERP),
          DTLIBERACAOERP: this.formatDateToDDMMYYYY(this.form.DTLIBERACAOERP),
          DTPREV_ENT_SITE: this.formatDateToDDMMYYYY(this.form.DTPREV_ENT_SITE),
          // Adicionar NFes de Entrada selecionadas (checkin_nf) — agora como array de chaves de acesso
          checkin_nf:
            this.selectedCheckinNfs.length > 0
              ? JSON.stringify(
                  this.selectedCheckinNfs
                    .map(nf => (nf.chaveNF || '').replace(/[^\d]/g, ''))
                    .filter(k => k.length >= 44)
                )
              : null,
          // Converter ITENS com valores em string
          ITENS: this.form.ITENS.map(item => {
            const cleanItem = {}
            Object.keys(item).forEach(key => {
              if (
                item[key] !== '' &&
                item[key] !== null &&
                item[key] !== undefined
              ) {
                // Converter para string
                cleanItem[key] = this.toStringValue(item[key])
              } else if (
                key === 'NUMSEQ' ||
                key === 'CODPROD' ||
                key === 'QTPROD'
              ) {
                // Campos obrigatórios sempre incluídos (como string)
                cleanItem[key] = this.toStringValue(item[key])
              }
            })
            return cleanItem
          }),
        },
      }

      // Converter todos os valores do cabeçalho para string
      const header = corpemData.CORPEM_ERP_DOC_SAI
      Object.keys(header).forEach(key => {
        if (key !== 'ITENS') {
          header[key] = this.toStringValue(header[key])
        }
      })

      return corpemData
    },
    formatDateToDDMMYYYY(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    },
    async handleSubmit() {
      this.loading = true
      try {
        const token = localStorage.getItem('token')

        // Verificar se há múltiplos XMLs processados
        if (this.processedXmls.length > 1) {
          // MODO LOTE: Enviar múltiplos pedidos
          await this.handleBatchSubmit(token)
        } else {
          // MODO ÚNICO: Enviar 1 pedido (comportamento original)
          await this.handleSingleSubmit(token)
        }

        this.resetForm()
        this.$emit('pedido-criado')
      } catch (error) {
        console.error('Erro ao criar pedido:', error)
        const errorMsg =
          error.response?.data?.CORPEM_WS_ERRO ||
          error.response?.data?.message ||
          error.response?.data?.error ||
          'Erro ao criar pedido de expedição. Por favor, tente novamente.'
        alert('Erro ao enviar para CorpEM WMS:\n\n' + errorMsg)
      } finally {
        this.loading = false
      }
    },

    // Método para enviar pedido único (comportamento original)
    async handleSingleSubmit(token) {
      const corpemPayload = this.buildCorpemJSON()

      console.log(
        'Payload CorpEM (único):',
        JSON.stringify(corpemPayload, null, 2)
      )

      const response = await axios.post(
        `${BASE_URL}/corpem/pedido-saida`,
        corpemPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      alert(
        'Pedido de expedição criado com sucesso no CorpEM WMS!\n\nResposta: ' +
          JSON.stringify(response.data, null, 2)
      )
    },

    // Método para enviar múltiplos pedidos em lote
    async handleBatchSubmit(token) {
      console.log(`📦 Criando ${this.processedXmls.length} pedidos em lote...`)

      // Preparar documentos (etiqueta) - serão anexados apenas ao primeiro pedido
      const documentos = {}

      if (this.selectedEtiquetaFile) {
        documentos.etiqueta = {
          fileName: this.etiquetaFileName,
          fileSize: String(this.etiquetaFileSize),
          base64: this.form.ETQCLIZPLBASE64,
        }
      }

      // Construir array de pedidos a partir dos XMLs processados
      const pedidos = this.processedXmls.map((xmlData, index) => {
        // Para cada XML, criar um payload CorpEM
        return this.buildCorpemJSONFromNFeData(xmlData.nfeData, index + 1)
      })

      // Preparar payload do lote
      const batchPayload = {
        pedidos: pedidos,
        documentos: Object.keys(documentos).length > 0 ? documentos : null,
      }

      console.log(
        'Payload CorpEM (lote):',
        JSON.stringify(batchPayload, null, 2)
      )

      // Enviar para a rota de lote
      const response = await axios.post(
        `${BASE_URL}/corpem/pedido-saida-lote`,
        batchPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // Mostrar resultado do processamento
      const result = response.data
      const summary = result.summary

      let message = `✅ Processamento em lote concluído!\n\n`
      message += `📦 Total de pedidos: ${summary.total}\n`
      message += `✅ Sucessos: ${summary.sucessos}\n`
      message += `❌ Erros: ${summary.erros}\n`
      message += `🎲 LOT gerado: ${result.lot}\n\n`

      if (result.resultados && result.resultados.length > 0) {
        message += `Detalhes:\n`
        result.resultados.forEach(r => {
          const status = r.success ? '✅' : '❌'
          message += `${status} Pedido ${r.pedido}: ${r.numero}\n`
        })
      }

      alert(message)
    },

    // Método auxiliar: Construir payload CorpEM a partir dos dados da NFe
    buildCorpemJSONFromNFeData(nfeData, sequencia) {
      // Construir estrutura completa do pedido baseado nos dados da NFe
      return {
        CORPEM_ERP_DOC_SAI: {
          // Informações Básicas
          CGCCLIWMS: this.form.CGCCLIWMS || '',
          CGCEMINF: nfeData.cnpjEmitente || '',
          NUMPEDCLI: `${nfeData.numeroNFe}-${sequencia}`, // Tornar único concatenando sequência
          VLTOTPED: nfeData.valorTotal || '',

          // Destinatário
          CGCDEST: nfeData.cnpjDestinatario || '',
          IEDEST: nfeData.ieDestinatario || '',
          NOMEDEST: nfeData.nomeDestinatario || '',

          // Endereço de Entrega
          CEPDEST: nfeData.endereco?.cep || '',
          UFDEST: nfeData.endereco?.uf || '',
          IBGEMUNDEST: nfeData.endereco?.codigoMunicipio || '',
          MUN_DEST: nfeData.endereco?.municipio || '',
          BAIR_DEST: nfeData.endereco?.bairro || '',
          LOGR_DEST: nfeData.endereco?.logradouro || '',
          NUM_DEST: nfeData.endereco?.numero || '',

          // Frete e Transporte
          TP_FRETE:
            nfeData.tipoFrete === '0'
              ? 'C'
              : nfeData.tipoFrete === '1'
                ? 'F'
                : 'C',
          CGC_TRP: nfeData.transportadora?.cnpj || '',
          UF_TRP: nfeData.transportadora?.uf || '',

          // Informações da NF-e
          NUMNF: nfeData.numeroNFe || '',
          SERIENF: nfeData.serieNFe || '',
          DTEMINF: nfeData.dataEmissao || '',
          VLTOTALNF: nfeData.valorTotal || '',
          CHAVENF: nfeData.chaveNFe || '',

          // Itens do Pedido
          ITENS: (nfeData.produtos || []).map((prod, idx) => ({
            NUMSEQ: String(idx + 1),
            CODPROD: prod.codigo || '',
            QTPROD: prod.quantidade || '',
          })),
        },
      }
    },
    handleCancel() {
      if (
        confirm(
          'Deseja cancelar a criação do pedido? Todos os dados serão perdidos.'
        )
      ) {
        this.resetForm()
        this.$emit('cancelar')
      }
    },
    resetForm() {
      this.form = {
        // Informações Básicas
        CGCCLIWMS: '',
        CGCEMINF: '',
        NUMPEDCLI: '',
        VLTOTPED: '',

        // Destinatário
        CGCDEST: '',
        IEDEST: '',
        NOMEDEST: '',

        // Endereço
        CEPDEST: '',
        UFDEST: '',
        IBGEMUNDEST: '',
        MUN_DEST: '',
        BAIR_DEST: '',
        LOGR_DEST: '',
        NUM_DEST: '',

        // Frete
        TP_FRETE: 'C', // CIF (Remetente paga) - padrão fixo
        CGC_TRP: '',
        UF_TRP: '',

        // Informações da NF-e (Opcional)
        NUMNF: '',
        SERIENF: '',
        DTEMINF: '',
        VLTOTALNF: '',
        CHAVENF: '',

        // Etiqueta do Cliente (Opcional)
        ETQCLIFILESIZE: '',
        ETQCLIZPLBASE64: '',

        // Itens
        ITENS: [
          {
            NUMSEQ: 1,
            CODPROD: '',
            QTPROD: '',
          },
        ],
      }

      // Limpar estados da etiqueta
      this.selectedEtiquetaFile = null
      this.etiquetaFileName = ''
      this.etiquetaFileSize = 0

      // Limpar XMLs processados
      this.processedXmls = []
      this.xmlImported = false

      // Limpar busca de agendamentos
      this.checkinNfSearch = ''
      this.checkinNfsResults = []
      this.selectedCheckinNfs = []
      this.checkinNfSearchMessage = ''
    },

    // Métodos para gerenciamento de XMLs processados
    clearProcessedXmls() {
      if (
        confirm(
          'Deseja limpar todos os XMLs processados? Esta ação não pode ser desfeita.'
        )
      ) {
        this.processedXmls = []
        this.xmlImported = false
      }
    },

    removeProcessedXml(index) {
      this.processedXmls.splice(index, 1)
      if (this.processedXmls.length === 0) {
        this.xmlImported = false
      }
    },

    // Métodos para busca de agendamentos (NFes de Entrada)
    async searchCheckinNfs() {
      clearTimeout(this.searchTimeout)

      this.searchTimeout = setTimeout(async () => {
        const searchTerm = this.checkinNfSearch.trim()

        if (searchTerm.length < 3) {
          this.checkinNfsResults = []
          this.checkinNfSearchMessage =
            'Digite pelo menos 3 caracteres para buscar'
          this.searchingCheckinNfs = false
          return
        }

        this.searchingCheckinNfs = true
        this.checkinNfSearchMessage = ''

        try {
          console.log('🔍 Buscando agendamentos:', searchTerm)

          const response = await fetch(
            `${BASE_URL}/schedules/search-for-crossdock?search=${encodeURIComponent(searchTerm)}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            }
          )

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Erro ao buscar agendamentos')
          }

          this.checkinNfsResults = data.schedules || []

          if (this.checkinNfsResults.length === 0) {
            this.checkinNfSearchMessage = 'Nenhum agendamento encontrado'
          } else {
            this.checkinNfSearchMessage = `${this.checkinNfsResults.length} agendamento(s) encontrado(s)`
          }

          console.log(
            `✅ ${this.checkinNfsResults.length} agendamento(s) encontrado(s)`
          )
        } catch (error) {
          console.error('❌ Erro ao buscar agendamentos:', error)
          this.checkinNfSearchMessage =
            'Erro ao buscar agendamentos. Tente novamente.'
          this.checkinNfsResults = []
        } finally {
          this.searchingCheckinNfs = false
        }
      }, 500) // Debounce de 500ms
    },

    toggleCheckinNfSelection(schedule) {
      const index = this.selectedCheckinNfs.findIndex(
        nf => nf.id === schedule.id
      )

      if (index > -1) {
        // Já está selecionado, remover
        this.selectedCheckinNfs.splice(index, 1)
        console.log(`➖ Agendamento ${schedule.numeroNF} removido da seleção`)
      } else {
        // Não está selecionado, adicionar
        this.selectedCheckinNfs.push({
          id: schedule.id,
          numeroNF: schedule.numeroNF,
          chaveNF: schedule.chaveNF,
          cnpjCliente: schedule.cnpjCliente,
          dataAgendamento: schedule.dataAgendamento,
          status: schedule.status,
          armazem: schedule.armazem,
        })
        console.log(`➕ Agendamento ${schedule.numeroNF} adicionado à seleção`)
      }
    },

    removeCheckinNf(id) {
      const index = this.selectedCheckinNfs.findIndex(nf => nf.id === id)
      if (index > -1) {
        const removedNf = this.selectedCheckinNfs[index]
        this.selectedCheckinNfs.splice(index, 1)
        console.log(`🗑️ Agendamento ${removedNf.numeroNF} removido`)
      }
    },

    isCheckinNfSelected(id) {
      return this.selectedCheckinNfs.some(nf => nf.id === id)
    },

    formatDate(dateString) {
      if (!dateString) return '-'

      try {
        const date = new Date(dateString)
        const day = String(date.getDate()).padStart(2, '0')
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const year = date.getFullYear()
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')

        return `${day}/${month}/${year} ${hours}:${minutes}`
      } catch (error) {
        return dateString
      }
    },

    // Métodos para importação de XML
    closeXmlImportModal() {
      this.showXmlImportModal = false
    },

    skipXmlImport() {
      this.showXmlImportModal = false
      console.log('📝 Usuário optou por preencher manualmente')
    },

    selectXmlFile() {
      this.$refs.xmlFileInput.click()
    },

    reimportXml() {
      const confirmReimport = confirm(
        '⚠️ Atenção!\n\nAo importar um novo XML, todos os dados do formulário serão substituídos.\n\nDeseja continuar?'
      )

      if (confirmReimport) {
        this.$refs.xmlFileInput.click()
      }
    },

    async handleXmlFileSelect(event) {
      const files = Array.from(event.target.files)
      if (!files || files.length === 0) return

      console.log(`📄 ${files.length} arquivo(s) XML selecionado(s)`)

      // Validar extensões
      const invalidFiles = files.filter(
        f => !f.name.toLowerCase().endsWith('.xml')
      )
      if (invalidFiles.length > 0) {
        alert(
          `Arquivos inválidos encontrados:\n${invalidFiles.map(f => f.name).join('\n')}\n\nPor favor, selecione apenas arquivos XML válidos.`
        )
        event.target.value = ''
        return
      }

      // Processar todos os XMLs
      const processedList = []
      const errors = []

      for (const file of files) {
        try {
          console.log(`📄 Processando: ${file.name}`)

          // Ler o arquivo
          const xmlText = await this.readFileAsText(file)

          // Fazer parsing do XML
          const nfeData = this.parseNFeXML(xmlText)

          // Adicionar à lista de processados
          processedList.push({
            fileName: file.name,
            nfeData: nfeData,
          })

          console.log(`✅ ${file.name} processado com sucesso`)
        } catch (error) {
          console.error(`❌ Erro ao processar ${file.name}:`, error)
          errors.push({
            fileName: file.name,
            error: error.message,
          })
        }
      }

      // Atualizar estado
      this.processedXmls = processedList
      this.xmlImported = processedList.length > 0

      // Fechar modal
      this.showXmlImportModal = false

      // Mostrar resultado
      if (errors.length > 0) {
        const errorMsg = errors.map(e => `${e.fileName}: ${e.error}`).join('\n')
        alert(
          `⚠️ Alguns arquivos apresentaram erros:\n\n${errorMsg}\n\n✅ ${processedList.length} arquivo(s) processado(s) com sucesso.`
        )
      } else {
        alert(
          `✅ ${processedList.length} arquivo(s) XML processado(s) com sucesso!\n\nOs pedidos serão criados quando você clicar em "Criar Pedido de Expedição".`
        )
      }

      // Se apenas 1 XML foi processado, preencher formulário (comportamento original)
      if (processedList.length === 1) {
        this.fillFormWithNFeData(processedList[0].nfeData)
      }

      // Limpar input
      event.target.value = ''
    },

    readFileAsText(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => resolve(e.target.result)
        reader.onerror = e => reject(e)
        reader.readAsText(file)
      })
    },

    parseNFeXML(xmlText) {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml')

      // Verificar erros de parsing
      const parserError = xmlDoc.querySelector('parsererror')
      if (parserError) {
        throw new Error('Arquivo XML inválido ou corrompido')
      }

      // Extrair elementos principais
      const infNFe = xmlDoc.querySelector('infNFe')
      const ide = xmlDoc.querySelector('ide')
      const emit = xmlDoc.querySelector('emit')
      const dest = xmlDoc.querySelector('dest')
      const transp = xmlDoc.querySelector('transp')
      const ICMSTot = xmlDoc.querySelector('ICMSTot')

      if (!infNFe || !ide || !emit || !dest) {
        throw new Error('XML não contém as tags obrigatórias de NFe')
      }

      // Extrair chave da NFe
      const nfeKey = infNFe.getAttribute('Id')?.replace(/^NFe/, '') || ''

      // Extrair dados básicos
      const nfeData = {
        // Chave e número
        chaveNFe: nfeKey,
        numeroNFe: ide.querySelector('nNF')?.textContent || '',
        serieNFe: ide.querySelector('serie')?.textContent || '',
        dataEmissao:
          ide.querySelector('dhEmi')?.textContent?.slice(0, 10) || '',

        // Emitente
        cnpjEmitente: emit.querySelector('CNPJ')?.textContent || '',
        nomeEmitente: emit.querySelector('xNome')?.textContent || '',

        // Destinatário
        cnpjDestinatario: dest.querySelector('CNPJ')?.textContent || '',
        ieDestinatario: dest.querySelector('IE')?.textContent || '',
        nomeDestinatario: dest.querySelector('xNome')?.textContent || '',
        emailDestinatario: dest.querySelector('email')?.textContent || '',
        telefoneDestinatario: dest.querySelector('fone')?.textContent || '',

        // Endereço
        endereco: null,

        // Transportadora
        transportadora: null,
        tipoFrete: transp?.querySelector('modFrete')?.textContent || '',

        // Valores
        valorTotal: ICMSTot?.querySelector('vNF')?.textContent || '',

        // Produtos
        produtos: [],
      }

      // Extrair endereço do destinatário
      const enderDest = dest.querySelector('enderDest')
      if (enderDest) {
        nfeData.endereco = {
          cep: enderDest.querySelector('CEP')?.textContent || '',
          uf: enderDest.querySelector('UF')?.textContent || '',
          codigoMunicipio: enderDest.querySelector('cMun')?.textContent || '',
          municipio: enderDest.querySelector('xMun')?.textContent || '',
          bairro: enderDest.querySelector('xBairro')?.textContent || '',
          logradouro: enderDest.querySelector('xLgr')?.textContent || '',
          numero: enderDest.querySelector('nro')?.textContent || '',
          complemento: enderDest.querySelector('xCpl')?.textContent || '',
        }
      }

      // Extrair transportadora
      const transporta = transp?.querySelector('transporta')
      if (transporta) {
        nfeData.transportadora = {
          cnpj:
            transporta.querySelector('CNPJ')?.textContent ||
            transporta.querySelector('CPF')?.textContent ||
            '',
          nome: transporta.querySelector('xNome')?.textContent || '',
          uf: transporta.querySelector('UF')?.textContent || '',
        }
      }

      // Extrair produtos
      const detList = xmlDoc.querySelectorAll('det')
      detList.forEach((det, index) => {
        const prod = det.querySelector('prod')
        if (prod) {
          const produto = {
            sequencia: index + 1,
            codigo: prod.querySelector('cProd')?.textContent || '',
            quantidade: prod.querySelector('qCom')?.textContent || '',
            valorUnitario: prod.querySelector('vUnCom')?.textContent || '',
            descricao: prod.querySelector('xProd')?.textContent || '',
          }

          // Tentar extrair lote de rastreabilidade
          const rastro = prod.querySelector('rastro')
          if (rastro) {
            produto.lote = rastro.querySelector('nLote')?.textContent || ''
          }

          nfeData.produtos.push(produto)
        }
      })

      console.log('📦 Dados extraídos do XML:', nfeData)
      return nfeData
    },

    fillFormWithNFeData(nfeData) {
      console.log('📝 Preenchendo formulário com dados do XML...')

      // Informações Básicas
      this.form.CGCCLIWMS = nfeData.cnpjDestinatario.replace(/\D/g, '')
      this.form.CGCEMINF = nfeData.cnpjEmitente.replace(/\D/g, '')
      this.form.VLTOTPED = nfeData.valorTotal // Valor Total Pedido = Valor Total NFe

      // Destinatário
      this.form.CGCDEST = nfeData.cnpjDestinatario.replace(/\D/g, '')
      this.form.IEDEST = nfeData.ieDestinatario
      this.form.NOMEDEST = nfeData.nomeDestinatario

      // Endereço
      if (nfeData.endereco) {
        this.form.CEPDEST = nfeData.endereco.cep.replace(/\D/g, '')
        this.form.UFDEST = nfeData.endereco.uf
        this.form.IBGEMUNDEST = nfeData.endereco.codigoMunicipio
        this.form.MUN_DEST = nfeData.endereco.municipio
        this.form.BAIR_DEST = nfeData.endereco.bairro
        this.form.LOGR_DEST = nfeData.endereco.logradouro
        this.form.NUM_DEST = nfeData.endereco.numero
      }

      // Frete
      // TP_FRETE sempre será 'C' (CIF) por padrão, não importa o que venha no XML
      if (nfeData.transportadora) {
        this.form.CGC_TRP = nfeData.transportadora.cnpj.replace(/\D/g, '')
        this.form.UF_TRP = nfeData.transportadora.uf
      }

      // Nota Fiscal
      this.form.NUMNF = nfeData.numeroNFe
      this.form.SERIENF = nfeData.serieNFe
      this.form.DTEMINF = nfeData.dataEmissao
      this.form.VLTOTALNF = nfeData.valorTotal
      this.form.CHAVENF = nfeData.chaveNFe

      // Produtos
      if (nfeData.produtos && nfeData.produtos.length > 0) {
        this.form.ITENS = nfeData.produtos.map(produto => ({
          NUMSEQ: produto.sequencia,
          CODPROD: produto.codigo,
          QTPROD: produto.quantidade,
        }))
      }

      // Marcar que um XML foi importado
      this.xmlImported = true

      console.log('✅ Formulário preenchido com sucesso')
    },
  },
}
</script>

<style scoped>
.create-expedition-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.header-title-section {
  flex: 1;
}

.header-title-section h2 {
  font-size: 28px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  line-height: 1.2;
}

.page-description {
  color: #64748b;
  font-size: 15px;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding-top: 2px;
}

.btn-reimport-xml {
  padding: 12px 24px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
  white-space: nowrap;
}

.btn-reimport-xml:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.btn-reimport-xml:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.btn-reimport-xml i {
  font-size: 16px;
}

.page-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-container {
  padding: 32px;
}

.form-section {
  margin-bottom: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  padding: 16px 20px;
  background: #f8fafc;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background 0.2s;
  user-select: none;
}

.section-header:hover {
  background: #f1f5f9;
}

.section-header i {
  color: #3b82f6;
  width: 16px;
}

.section-content {
  padding: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-weight: 500;
  color: #475569;
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

.form-group small {
  color: #94a3b8;
  font-size: 12px;
  margin-top: 4px;
}

.form-group small.error-message {
  color: #dc2626;
  font-weight: 500;
}

.form-group small.success-message {
  color: #16a34a;
  font-weight: 500;
}

.input-with-button {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.input-with-button input {
  flex: 1;
}

.btn-search-cep {
  padding: 10px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
}

.btn-search-cep:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.btn-search-cep:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-search-cep i {
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

/* Borda azul para campos obrigatórios preenchidos (válidos) */
.form-group input[required]:not(:focus):not(:placeholder-shown) {
  border-color: #3b82f6;
  border-width: 1.5px;
  background-color: #eff6ff;
}

.form-group select[required]:not(:focus):not(:invalid) {
  border-color: #3b82f6;
  border-width: 1.5px;
  background-color: #eff6ff;
}

/* Selects válidos (com opção selecionada diferente de vazio) */
.form-group select[required]:not(:focus):valid {
  border-color: #3b82f6;
  border-width: 1.5px;
  background-color: #eff6ff;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

/* Itens do Pedido */
.item-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.item-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.btn-remove-item {
  padding: 6px 12px;
  background: #fee2e2;
  color: #991b1b;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s;
}

.btn-remove-item:hover {
  background: #fecaca;
}

.btn-add-item {
  width: 100%;
  padding: 12px;
  background: #dbeafe;
  color: #1e40af;
  border: 2px dashed #3b82f6;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-add-item:hover {
  background: #bfdbfe;
  border-color: #2563eb;
}

/* Botões de Ação */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 24px;
  border-top: 2px solid #e2e8f0;
  margin-top: 32px;
}

.btn {
  padding: 12px 24px;
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
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e2e8f0;
  color: #475569;
}

.btn-secondary:hover {
  background: #cbd5e1;
}

/* Upload de Etiqueta */
.upload-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
}

.upload-description {
  color: #64748b;
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.5;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
  background: white;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.btn-upload {
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.btn-upload:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
}

.upload-hint {
  color: #94a3b8;
  font-size: 12px;
  text-align: center;
}

.file-selected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  transition: all 0.2s;
}

.file-selected:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.file-icon {
  font-size: 24px;
  color: #3b82f6;
  width: 32px;
  text-align: center;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.file-size {
  font-size: 12px;
  color: #64748b;
}

.btn-remove {
  padding: 8px 12px;
  background: #fee2e2;
  color: #991b1b;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  min-width: 40px;
  justify-content: center;
}

.btn-remove:hover {
  background: #fecaca;
  transform: scale(1.05);
}

.btn-remove i {
  font-size: 14px;
}

/* Modal de Importação de XML */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
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

.xml-import-modal {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
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

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-header h3 i {
  color: #3b82f6;
  font-size: 22px;
}

.modal-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  background: #f1f5f9;
  color: #64748b;
}

.modal-body {
  padding: 32px 24px;
}

.xml-import-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 20px;
}

.xml-import-icon {
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

.xml-import-message h4 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.import-description {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.import-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: #3b82f6;
  background: #eff6ff;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 0;
}

.import-hint i {
  font-size: 14px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
}

.modal-footer .btn {
  flex: 1;
  justify-content: center;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .create-expedition-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
  }

  .btn-reimport-xml {
    width: 100%;
    justify-content: center;
  }

  .form-container {
    padding: 20px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}

/* Busca de Agendamentos (NFes de Entrada) */
.badge-count {
  background: #3b82f6;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-left: auto;
}

.search-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  background: #f1f5f9;
  border-radius: 6px;
  font-size: 13px;
  color: #475569;
}

.search-info i {
  color: #3b82f6;
}

.search-results {
  margin-top: 16px;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

.result-item {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:hover {
  background: #f8fafc;
}

.result-item.selected {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
}

.result-checkbox {
  margin-top: 2px;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.result-details {
  flex: 1;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.result-nf {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.result-status {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.result-status.em-estoque {
  background: #dcfce7;
  color: #166534;
}

.result-status.conferencia {
  background: #fef3c7;
  color: #92400e;
}

.result-status.integrado {
  background: #dbeafe;
  color: #1e40af;
}

.result-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  font-size: 13px;
  color: #64748b;
}

.result-info-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.result-info-item i {
  width: 14px;
  color: #94a3b8;
  font-size: 12px;
}

.selected-nfs {
  margin-top: 16px;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.selected-nfs h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.selected-nf-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin-bottom: 8px;
}

.selected-nf-item:last-child {
  margin-bottom: 0;
}

.selected-nf-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.selected-nf-number {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.selected-nf-details {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #64748b;
}

.btn-remove-nf {
  padding: 6px 12px;
  background: #fee2e2;
  color: #991b1b;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s;
}

.btn-remove-nf:hover {
  background: #fecaca;
}

/* ============================================
   SEÇÃO DE XMLs PROCESSADOS
   ============================================ */
.processed-xmls-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 20px;
  margin: 20px;
}

.xmls-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.xmls-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.xmls-header h3 i {
  color: #3b82f6;
}

.btn-clear-xmls {
  padding: 8px 16px;
  background: #fee2e2;
  color: #991b1b;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-clear-xmls:hover {
  background: #fecaca;
  transform: translateY(-1px);
}

.xmls-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.xml-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: all 0.2s;
}

.xml-item:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.xml-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #dbeafe;
  border-radius: 6px;
  flex-shrink: 0;
}

.xml-icon i {
  font-size: 18px;
  color: #3b82f6;
}

.xml-details {
  flex: 1;
  min-width: 0;
}

.xml-filename {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.xml-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #64748b;
  margin: 0;
}

.xml-nf,
.xml-cnpj {
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-remove-xml {
  padding: 6px 10px;
  background: transparent;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-remove-xml:hover {
  background: #fee2e2;
  border-color: #fecaca;
  color: #991b1b;
}

.xmls-info {
  background: #dbeafe;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 12px;
}

.xmls-info p {
  margin: 0;
  font-size: 13px;
  color: #1e40af;
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 1.5;
}

.xmls-info i {
  flex-shrink: 0;
  font-size: 16px;
}

/* Textarea de Observações */
.textarea-observacoes {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  transition: all 0.2s;
}

.textarea-observacoes:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.textarea-observacoes::placeholder {
  color: #94a3b8;
}

.char-counter {
  display: block;
  text-align: right;
  color: #64748b;
  font-size: 12px;
  margin-top: 4px;
}
</style>
