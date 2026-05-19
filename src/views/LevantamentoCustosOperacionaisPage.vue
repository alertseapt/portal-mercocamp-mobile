<template>
  <div class="lev-custos-page">
    <div class="page-header">
      <div class="header-title">
        <h2>
          <i class="fas fa-table"></i>
          Importação despesas armazéns
        </h2>
        <p class="page-description">
          A seção <strong>Faturas e funcionários dedicados</strong> (abaixo) usa a
          tabela <code>lev_dedicados_corpem</code> — botão
          <strong>Carregar do banco</strong> traz as linhas já gravadas para
          você ajustar manualmente e gravar de novo. Matriz em dois blocos: use
          <strong>ML-A</strong> ou
          <strong>ML-B</strong>
          (na planilha aparecem como MATRIZ BLOCO A / B). Na
          <strong>importação</strong>, o código em <strong>C1</strong> da
          planilha (linha «Estabelecimento») <strong>prevalece</strong> sobre o
          selecionado na barra, quando estiver preenchido. Selecione
          <strong>ano</strong> e <strong>estabelecimento</strong> para
          <strong>Baixar modelo Excel</strong>: o arquivo traz as colunas
          <strong>jan a dez</strong> daquele ano (ex.: jan/26 … dez/26). O
          <strong>mês</strong> vale para
          <strong>Carregar período</strong> (grade de um mês) e para importação
          no formato antigo (uma coluna). Em <strong>Mês</strong>,
          <strong>Todos — consulta no banco</strong> carrega os
          <strong>12 meses já gravados</strong> para conferência.
          <strong>Importar planilha</strong> só carrega os valores na
          <strong>grade para conferência</strong>; a gravação no banco é feita
          com <strong>Gravar os 12 meses no banco</strong> no aviso amarelo após
          importar o modelo anual (12 colunas). O formato antigo (uma coluna)
          não persiste pelo portal — use o modelo anual para gravar. Após
          importar o modelo anual, a conferência mostra
          <strong>os 12 meses</strong> em colunas. O botão
          <strong>Configurar modelo da planilha</strong> abre as telas de
          cadastro das linhas (custos, receita, margem). Use
          <strong>Quadro funcionários (por mês)</strong> para mês, quantidade
          de funcionários e custo unitário por funcionário (ano +
          estabelecimento da barra). Use
          <strong>Faturas e funcionários dedicados</strong> para uma linha por
          mês com código Corpem, fatura cliente, competência, quantidade e
          custo — mesma lógica de carregar / gravar / modelo Excel.
        </p>
      </div>
    </div>

    <div class="toolbar content-card">
      <div class="toolbar-row">
        <label class="field">
          <span>Mês (grade / formato antigo)</span>
          <select v-model.number="mes" class="input-control">
            <option :value="0">Nenhum</option>
            <option :value="13">Todos — consulta no banco (12 meses)</option>
            <option v-for="m in 12" :key="m" :value="m">
              {{ m }} — {{ meses[m - 1] }}
            </option>
          </select>
        </label>
        <label class="field">
          <span>Ano</span>
          <select v-model.number="ano" class="input-control">
            <option v-for="y in anosSelect" :key="y" :value="y">{{ y }}</option>
          </select>
        </label>
        <label class="field field-grow">
          <span>Estabelecimento</span>
          <select v-model="codigoEstabelecimentoSelect" class="input-control">
            <option value="ML-A">ML-A — Matriz Bloco A</option>
            <option value="ML-B">ML-B — Matriz Bloco B</option>
            <option value="ML">ML (único / legado)</option>
            <option value="OTHER">Outro código…</option>
          </select>
        </label>
        <label
          v-if="codigoEstabelecimentoSelect === 'OTHER'"
          class="field field-grow"
        >
          <span>Código (outro)</span>
          <input
            v-model.trim="codigoEstabelecimentoOutro"
            class="input-control"
            maxlength="32"
            placeholder="Ex.: C2, VN"
          />
        </label>
      </div>
      <div class="toolbar-actions">
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="carregando || !podeCarregarPeriodo"
          @click="carregarPeriodo"
        >
          <i
            :class="carregando ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"
          ></i>
          Carregar período
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="gerandoExcel"
          @click="gerarExcel"
        >
          <i
            :class="
              gerandoExcel ? 'fas fa-spinner fa-spin' : 'fas fa-file-excel'
            "
          ></i>
          Baixar modelo Excel
        </button>
        <button
          type="button"
          class="btn btn-outline"
          @click="mostrarConfiguracaoModelo = !mostrarConfiguracaoModelo"
        >
          <i
            :class="
              mostrarConfiguracaoModelo ? 'fas fa-eye-slash' : 'fas fa-cog'
            "
          ></i>
          {{
            mostrarConfiguracaoModelo
              ? 'Ocultar configuração do modelo'
              : 'Configurar modelo da planilha'
          }}
        </button>
        <button
          type="button"
          class="btn btn-outline"
          @click="toggleQuadroFuncionarios"
        >
          <i
            :class="
              mostrarQuadroFuncionarios ? 'fas fa-eye-slash' : 'fas fa-users'
            "
          ></i>
          {{
            mostrarQuadroFuncionarios
              ? 'Ocultar quadro funcionários'
              : 'Quadro funcionários (por mês)'
          }}
        </button>
        <button
          type="button"
          class="btn btn-outline"
          @click="toggleDedicadosCorpem"
        >
          <i
            :class="
              mostrarDedicadosCorpem ? 'fas fa-eye-slash' : 'fas fa-user-tag'
            "
          ></i>
          {{
            mostrarDedicadosCorpem
              ? 'Ocultar faturas e dedicados'
              : 'Faturas e funcionários dedicados'
          }}
        </button>
        <button
          type="button"
          class="btn btn-import"
          :disabled="importando"
          @click="abrirSeletorImportacao"
        >
          <i
            :class="
              importando ? 'fas fa-spinner fa-spin' : 'fas fa-file-upload'
            "
          ></i>
          Importar planilha
        </button>
        <input
          ref="inputImportar"
          type="file"
          class="sr-only"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          @change="onArquivoImportacaoEscolhido"
        />
      </div>
    </div>

    <div
      v-if="mostrarQuadroFuncionarios"
      class="content-card quadro-func-section"
    >
      <h3>
        <i class="fas fa-users"></i>
        Quadro operacional — funcionários (por mês)
      </h3>
      <p class="hint">
        Para a operação da barra (<strong>{{ codigoEstabelecimentoApi }}</strong
        >) e o ano <strong>{{ ano }}</strong
        >, informe por mês a quantidade de funcionários e o custo unitário por
        funcionário (ex.: 5.000,00). O <strong>Carregar do banco</strong> usa
        exatamente esse código e ano — se gravou via Excel com C1 =
        <strong>ML-A</strong> ou <strong>ML-B</strong>, escolha o mesmo na barra
        (não apenas «ML»). Nos campos em reais, cada dígito entra como centavos
        à direita (ex.: <strong>5</strong> → 0,05;
        <strong>50</strong> → 0,50; <strong>500000</strong> → 5.000,00). Linhas
        totalmente vazias são removidas do banco ao gravar. Execute no banco o
        script
        <code>schedule-back-end/sql/create_lev_operacao_funcionario.sql</code>.
      </p>
      <div class="quadro-func-actions">
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="carregandoOperacaoFunc || ano < 2000"
          @click="carregarOperacaoFuncionarios"
        >
          <i
            :class="
              carregandoOperacaoFunc
                ? 'fas fa-spinner fa-spin'
                : 'fas fa-sync-alt'
            "
          ></i>
          Carregar do banco
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="gravandoOperacaoFunc || ano < 2000"
          @click="gravarOperacaoFuncionarios"
        >
          <i
            :class="
              gravandoOperacaoFunc ? 'fas fa-spinner fa-spin' : 'fas fa-save'
            "
          ></i>
          Gravar no banco
        </button>
      </div>
      <p v-if="erroOperacaoFunc" class="alert alert-error">
        {{ erroOperacaoFunc }}
      </p>
      <div class="table-wrap">
        <table class="data-table quadro-func-table">
          <thead>
            <tr>
              <th class="col-mes">Mês</th>
              <th>Qtd. funcionários</th>
              <th>Custo unitário (R$ / func.)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in operacaoFuncRows" :key="'opf-' + row.mes">
              <td class="col-mes">{{ meses[row.mes - 1] }} ({{ row.mes }})</td>
              <td>
                <input
                  v-model="row.qtd"
                  type="number"
                  min="0"
                  step="1"
                  class="input-cell input-qtd"
                  placeholder="—"
                />
              </td>
              <td>
                <input
                  :value="formatOperacaoFuncMoedaInput(row.unitDigits)"
                  class="input-cell"
                  placeholder="-"
                  inputmode="numeric"
                  autocomplete="off"
                  @keydown="
                    onOperacaoFuncMoedaKeydown($event, row, 'unitDigits')
                  "
                  @paste.prevent="
                    onOperacaoFuncMoedaPaste($event, row, 'unitDigits')
                  "
                  @focus="onOperacaoFuncMoedaFocus"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="mostrarDedicadosCorpem"
      class="content-card quadro-func-section dedicados-corpem-section"
    >
      <h3>
        <i class="fas fa-file-invoice-dollar"></i>
        Faturas e funcionários dedicados
      </h3>
      <p class="hint">
        Várias linhas por cliente/registro. Colunas:
        <strong>Código Corpem</strong> (até 5 caracteres),
        <strong>Fatura cliente</strong> (valor R$, dígitos = centavos),
        <strong>Mês</strong> (1–12), <strong>Ano</strong> (cada linha; modelo
        Excel com coluna em branco),
        <strong>Quantidade funcionários dedicados</strong> e
        <strong>Custo funcionário dedicado (R$)</strong>. O
        <strong>Carregar do banco</strong> filtra pelo ano da barra. Ao gravar,
        os anos presentes nas linhas preenchidas são substituídos no banco.
        Linhas vazias são ignoradas. Tipos no banco: Corpem
        <code>VARCHAR(5)</code>, fatura e custo <code>DECIMAL(10,2)</code>, qtd
        <code>INT</code>. Scripts:
        <code>schedule-back-end/sql/create_lev_dedicados_corpem.sql</code> e
        <code>migrate_lev_dedicados_corpem_v2_mensal.sql</code> se a tabela for
        antiga.
      </p>
      <p v-if="erroDedicadosCorpem" class="alert alert-error">
        {{ erroDedicadosCorpem }}
      </p>
      <div v-if="dedicadosCorpemSemTabela" class="hint dedicados-sem-tabela">
        Tabela ainda não criada ou desatualizada no banco. Execute os scripts
        SQL indicados acima e recarregue.
      </div>
      <div class="quadro-func-actions dedicados-corpem-actions">
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="carregandoDedicadosCorpem || ano < 2000"
          @click="carregarDedicadosCorpemDaApi"
        >
          <i
            :class="
              carregandoDedicadosCorpem
                ? 'fas fa-spinner fa-spin'
                : 'fas fa-sync-alt'
            "
          ></i>
          Carregar do banco
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="gerandoExcelDedicados || ano < 2000"
          @click="gerarExcelModeloDedicadosCorpem"
        >
          <i
            :class="
              gerandoExcelDedicados
                ? 'fas fa-spinner fa-spin'
                : 'fas fa-file-excel'
            "
          ></i>
          Baixar modelo Excel
        </button>
        <button
          type="button"
          class="btn btn-import"
          :disabled="importandoDedicadosPlanilha"
          @click="$refs.inputImportarDedicadosCorpem.click()"
        >
          <i
            :class="
              importandoDedicadosPlanilha
                ? 'fas fa-spinner fa-spin'
                : 'fas fa-file-upload'
            "
          ></i>
          Importar planilha
        </button>
        <button
          type="button"
          class="btn btn-outline"
          @click="adicionarLinhasDedicadosFaturas(25)"
        >
          <i class="fas fa-plus"></i>
          Adicionar 25 linhas
        </button>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="gravandoDedicadosCorpem || ano < 2000"
          @click="gravarDedicadosFaturas"
        >
          <i
            :class="
              gravandoDedicadosCorpem
                ? 'fas fa-spinner fa-spin'
                : 'fas fa-save'
            "
          ></i>
          Gravar no banco
        </button>
        <input
          ref="inputImportarDedicadosCorpem"
          type="file"
          class="sr-only"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          @change="onArquivoDedicadosCorpemEscolhido"
        />
      </div>
      <div class="table-wrap dedicados-faturas-table-wrap">
        <table class="data-table quadro-func-table dedicados-faturas-table">
          <thead>
            <tr>
              <th>Código Corpem</th>
              <th>Fatura cliente (R$)</th>
              <th class="col-mes-num">Mês</th>
              <th class="col-ano">Ano</th>
              <th>Qtd func. dedicados</th>
              <th>Custo func. dedicado (R$)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in dedicadosFaturasRows" :key="row._key">
              <td>
                <input
                  v-model.trim="row.codigoCorpem"
                  type="text"
                  class="input-cell dedicados-input-text dedicados-corpem-5"
                  maxlength="5"
                  placeholder="—"
                  autocomplete="off"
                />
              </td>
              <td>
                <input
                  :value="formatOperacaoFuncMoedaInput(row.faturaDigits)"
                  class="input-cell"
                  placeholder="—"
                  inputmode="numeric"
                  autocomplete="off"
                  @keydown="
                    onOperacaoFuncMoedaKeydown($event, row, 'faturaDigits')
                  "
                  @paste.prevent="
                    onOperacaoFuncMoedaPaste($event, row, 'faturaDigits')
                  "
                  @focus="onOperacaoFuncMoedaFocus"
                />
              </td>
              <td class="col-mes-num">
                <input
                  v-model.number="row.refMes"
                  type="number"
                  min="1"
                  max="12"
                  step="1"
                  class="input-cell input-mes-ano"
                  placeholder="1–12"
                />
              </td>
              <td class="col-ano">
                <input
                  v-model="row.refAno"
                  type="text"
                  inputmode="numeric"
                  maxlength="4"
                  class="input-cell input-mes-ano"
                  placeholder="Ano"
                  autocomplete="off"
                />
              </td>
              <td>
                <input
                  v-model="row.qtd"
                  type="number"
                  min="0"
                  step="1"
                  class="input-cell input-qtd"
                  placeholder="—"
                />
              </td>
              <td>
                <input
                  :value="formatOperacaoFuncMoedaInput(row.custoDigits)"
                  class="input-cell"
                  placeholder="—"
                  inputmode="numeric"
                  autocomplete="off"
                  @keydown="
                    onOperacaoFuncMoedaKeydown($event, row, 'custoDigits')
                  "
                  @paste.prevent="
                    onOperacaoFuncMoedaPaste($event, row, 'custoDigits')
                  "
                  @focus="onOperacaoFuncMoedaFocus"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="importacaoAnualPendente"
      class="content-card alert-import-pending"
    >
      <p>
        <strong>Importação anual pendente</strong> — ano
        {{ importacaoAnualPendente.ano }}, estabelecimento
        {{ importacaoAnualPendente.codigo_estabelecimento }}. Confira a tabela
        abaixo com <strong>os 12 meses</strong>. Nada foi gravado no banco
        ainda.
      </p>
      <div class="alert-import-actions">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="confirmandoImportacaoAnual"
          @click="confirmarImportacaoAnual"
        >
          <i
            :class="
              confirmandoImportacaoAnual
                ? 'fas fa-spinner fa-spin'
                : 'fas fa-database'
            "
          ></i>
          Gravar os 12 meses no banco
        </button>
        <button
          type="button"
          class="btn btn-outline"
          :disabled="confirmandoImportacaoAnual"
          @click="descartarImportacaoAnual"
        >
          Descartar importação
        </button>
      </div>
    </div>

    <p v-if="erroCarregar" class="alert alert-error">{{ erroCarregar }}</p>

    <div
      v-if="
        (importacaoAnualPendente && editCustos.length) || consultaAnualBanco
      "
      class="content-card grade-revisao-anual-wrap"
    >
      <h3 v-if="consultaAnualBanco">
        <i class="fas fa-database"></i>
        Consulta no banco — todos os meses (ano {{ consultaAnualBanco.ano }})
      </h3>
      <h3 v-else>
        <i class="fas fa-table"></i>
        Conferência da importação — todos os meses (ano
        {{ importacaoAnualPendente.ano }})
      </h3>
      <p v-if="consultaAnualBanco" class="hint">
        Valores já gravados para
        <strong>{{ consultaAnualBanco.codigo_estabelecimento }}</strong>
        (somente leitura). Para alterar, ajuste a planilha anual e importe de
        novo; em seguida use <strong>Gravar os 12 meses no banco</strong>.
      </p>
      <p v-else class="hint">
        Valores lidos do Excel por mês. Após validar, use
        <strong>Gravar os 12 meses no banco</strong>.
      </p>

      <h4 class="subsecao-revisao">Custos</h4>
      <div class="table-wrap table-revisao-scroll">
        <table class="data-table table-revisao-12mes">
          <colgroup>
            <col class="col-rev-id" />
            <col class="col-rev-desc" />
            <col v-for="i in 12" :key="'cg-c-' + i" class="col-rev-mes" />
          </colgroup>
          <thead>
            <tr>
              <th class="col-id">Id</th>
              <th class="col-desc-revisao">Descrição</th>
              <th
                v-for="mc in mesesRevisaoColunas"
                :key="'hc-' + mc.mes"
                class="col-mes-revisao"
              >
                {{ mc.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in revisaoCustosRows"
              :key="'rcv-' + row.id"
              :class="{ destaque: row.destaque }"
            >
              <td class="col-id">{{ row.id }}</td>
              <td class="col-desc-revisao">{{ row.titulo }}</td>
              <td
                v-for="mc in mesesRevisaoColunas"
                :key="'rcv-' + row.id + '-' + mc.mes"
                class="col-mes-revisao celula-revisao"
              >
                {{
                  celulaRevisaoImportacaoAnual('custos', row.id, mc.mes, false)
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 class="subsecao-revisao">Receita</h4>
      <div class="table-wrap table-revisao-scroll">
        <table class="data-table table-revisao-12mes">
          <colgroup>
            <col class="col-rev-id" />
            <col class="col-rev-desc" />
            <col v-for="i in 12" :key="'cg-r-' + i" class="col-rev-mes" />
          </colgroup>
          <thead>
            <tr>
              <th class="col-id">Id</th>
              <th class="col-desc-revisao">Descrição</th>
              <th
                v-for="mc in mesesRevisaoColunas"
                :key="'hr-' + mc.mes"
                class="col-mes-revisao"
              >
                {{ mc.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in revisaoReceitaRows" :key="'rrv-' + row.id">
              <td class="col-id">{{ row.id }}</td>
              <td class="col-desc-revisao">{{ row.titulo }}</td>
              <td
                v-for="mc in mesesRevisaoColunas"
                :key="'rrv-' + row.id + '-' + mc.mes"
                class="col-mes-revisao celula-revisao"
              >
                {{
                  celulaRevisaoImportacaoAnual('receita', row.id, mc.mes, false)
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h4 class="subsecao-revisao">Margem</h4>
      <div class="table-wrap table-revisao-scroll">
        <table class="data-table table-revisao-12mes">
          <colgroup>
            <col class="col-rev-id" />
            <col class="col-rev-desc" />
            <col v-for="i in 12" :key="'cg-m-' + i" class="col-rev-mes" />
          </colgroup>
          <thead>
            <tr>
              <th class="col-id">Id</th>
              <th class="col-desc-revisao">Descrição</th>
              <th
                v-for="mc in mesesRevisaoColunas"
                :key="'hm-' + mc.mes"
                class="col-mes-revisao"
              >
                {{ mc.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in revisaoMargemRows"
              :key="'mrv-' + row.id"
              :class="{ 'row-margem-pct': row.tipo_valor === 'percentual' }"
            >
              <td class="col-id">{{ row.id }}</td>
              <td class="col-desc-revisao">{{ row.titulo }}</td>
              <td
                v-for="mc in mesesRevisaoColunas"
                :key="'mrv-' + row.id + '-' + mc.mes"
                class="col-mes-revisao celula-revisao"
              >
                {{
                  celulaRevisaoImportacaoAnual(
                    'margem',
                    row.id,
                    mc.mes,
                    row.tipo_valor === 'percentual'
                  )
                }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <template v-if="mostrarConfiguracaoModelo">
      <div class="content-card catalogo-custos-section">
        <h3>
          <i class="fas fa-layer-group"></i>
          Linhas de custo no modelo
        </h3>
        <p class="hint">
          Inclua despesas extras (ex.: bonificação): o <strong>id</strong> é
          gerado automaticamente (próximo livre). A <strong>ordem</strong> vale
          para as despesas <strong>incluídas por você</strong> (id &gt;
          {{ custoIdPadraoMax }}): posição na planilha e na grade —
          <strong>menor número = mais acima</strong>. Os itens padrão (ids 1–{{
            custoIdPadraoMax
          }}) são <strong>só leitura</strong> no cadastro; apenas valores
          mensais na grade abaixo podem ser preenchidos.
        </p>
        <div class="novo-custo-toolbar">
          <label class="field field-grow">
            <span>Nova despesa</span>
            <input
              v-model.trim="novoCustoTitulo"
              class="input-control"
              placeholder="Ex.: Bonificação"
              maxlength="255"
            />
          </label>
          <label class="field">
            <span>Ordem na lista</span>
            <input
              v-model.number="novoCustoOrdem"
              class="input-control input-ordem"
              type="number"
              step="1"
              placeholder="Automático"
            />
          </label>
          <div class="novo-custo-actions">
            <button
              type="button"
              class="btn btn-primary"
              :disabled="catalogoSalvando || !novoCustoTitulo"
              @click="adicionarCustoCatalogo"
            >
              <i class="fas fa-plus"></i>
              Incluir custo
            </button>
          </div>
        </div>
        <div v-if="catalogoCarregando" class="catalogo-loading">
          Carregando catálogo…
        </div>
        <div v-else-if="catalogoCustos.length" class="table-wrap">
          <table class="data-table catalogo-table">
            <thead>
              <tr>
                <th class="col-id">Id</th>
                <th>Descrição</th>
                <th class="col-ordem">Ordem</th>
                <th class="col-acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in catalogoCustos" :key="'cat-custo-' + c.id">
                <td class="col-id">{{ c.id }}</td>
                <td>
                  <span
                    v-if="!itemCatalogoEditavel(c)"
                    class="catalogo-readonly"
                    >{{ c.titulo }}</span
                  >
                  <input
                    v-else
                    v-model="c.titulo"
                    class="input-cell"
                    type="text"
                    maxlength="255"
                  />
                </td>
                <td class="col-ordem">
                  <span
                    v-if="!itemCatalogoEditavel(c)"
                    class="catalogo-readonly"
                    >{{ c.ordem }}</span
                  >
                  <input
                    v-else
                    v-model.number="c.ordem"
                    class="input-cell input-ordem"
                    type="number"
                    step="1"
                  />
                </td>
                <td class="col-acoes">
                  <template v-if="itemCatalogoEditavel(c)">
                    <button
                      type="button"
                      class="btn btn-sm btn-secondary"
                      :disabled="catalogoSalvando"
                      @click="salvarCustoCatalogo(c)"
                    >
                      Salvar
                    </button>
                    <button
                      v-if="Number(c.id) > custoIdPadraoMax"
                      type="button"
                      class="btn btn-sm btn-danger-outline"
                      :disabled="catalogoSalvando"
                      @click="excluirCustoCatalogo(c)"
                    >
                      Excluir
                    </button>
                  </template>
                  <span v-else class="catalogo-locked-hint">Padrão</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else-if="!catalogoCarregando" class="hint">
          Não foi possível carregar o catálogo (verifique a API e o script SQL).
        </p>
      </div>

      <div
        v-if="!catalogoCarregando && catalogoReceita.length"
        class="content-card catalogo-custos-section"
      >
        <h3>
          <i class="fas fa-coins"></i>
          Linhas de receita no modelo
        </h3>
        <p class="hint">
          Linhas <strong>padrão</strong> (ids 1–{{ receitaIdPadraoMax }}) são só
          leitura no cadastro. Se no futuro houver linhas com id maior, elas
          poderão ser editadas aqui como nas despesas extras.
        </p>
        <div class="table-wrap">
          <table class="data-table catalogo-table">
            <thead>
              <tr>
                <th class="col-id">Id</th>
                <th>Descrição</th>
                <th class="col-ordem">Ordem</th>
                <th class="col-acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in catalogoReceita" :key="'cat-rec-' + r.id">
                <td class="col-id">{{ r.id }}</td>
                <td>
                  <span
                    v-if="!itemCatalogoEditavel(r)"
                    class="catalogo-readonly"
                    >{{ r.titulo }}</span
                  >
                  <input
                    v-else
                    v-model="r.titulo"
                    class="input-cell"
                    type="text"
                    maxlength="255"
                  />
                </td>
                <td class="col-ordem">
                  <span
                    v-if="!itemCatalogoEditavel(r)"
                    class="catalogo-readonly"
                    >{{ r.ordem }}</span
                  >
                  <input
                    v-else
                    v-model.number="r.ordem"
                    class="input-cell input-ordem"
                    type="number"
                    step="1"
                  />
                </td>
                <td class="col-acoes">
                  <button
                    v-if="itemCatalogoEditavel(r)"
                    type="button"
                    class="btn btn-sm btn-secondary"
                    :disabled="catalogoSalvando"
                    @click="salvarReceitaCatalogo(r)"
                  >
                    Salvar
                  </button>
                  <span v-else class="catalogo-locked-hint">Padrão</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="!catalogoCarregando && catalogoMargem.length"
        class="content-card catalogo-custos-section"
      >
        <h3>
          <i class="fas fa-percent"></i>
          Linhas de margem no modelo
        </h3>
        <p class="hint">
          Linhas <strong>padrão</strong> (ids 1–{{ margemIdPadraoMax }}) são só
          leitura no cadastro. Na grade abaixo, linhas em
          <strong>percentual</strong> aceitam % (ex.: 34,5); as demais, R$.
        </p>
        <div class="table-wrap">
          <table class="data-table catalogo-table">
            <thead>
              <tr>
                <th class="col-id">Id</th>
                <th>Descrição</th>
                <th class="col-ordem">Ordem</th>
                <th class="col-tipo">Tipo</th>
                <th class="col-acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in catalogoMargem" :key="'cat-mar-' + m.id">
                <td class="col-id">{{ m.id }}</td>
                <td>
                  <span
                    v-if="!itemCatalogoEditavel(m)"
                    class="catalogo-readonly"
                    >{{ m.titulo }}</span
                  >
                  <input
                    v-else
                    v-model="m.titulo"
                    class="input-cell"
                    type="text"
                    maxlength="255"
                  />
                </td>
                <td class="col-ordem">
                  <span
                    v-if="!itemCatalogoEditavel(m)"
                    class="catalogo-readonly"
                    >{{ m.ordem }}</span
                  >
                  <input
                    v-else
                    v-model.number="m.ordem"
                    class="input-cell input-ordem"
                    type="number"
                    step="1"
                  />
                </td>
                <td class="col-tipo">
                  <span
                    v-if="!itemCatalogoEditavel(m)"
                    class="catalogo-readonly"
                    >{{
                      m.tipo_valor === 'percentual'
                        ? 'Percentual'
                        : 'R$ (moeda)'
                    }}</span
                  >
                  <select
                    v-else
                    v-model="m.tipo_valor"
                    class="input-cell input-tipo"
                  >
                    <option value="moeda">R$ (moeda)</option>
                    <option value="percentual">Percentual</option>
                  </select>
                </td>
                <td class="col-acoes">
                  <button
                    v-if="itemCatalogoEditavel(m)"
                    type="button"
                    class="btn btn-sm btn-secondary"
                    :disabled="catalogoSalvando"
                    @click="salvarMargemCatalogo(m)"
                  >
                    Salvar
                  </button>
                  <span v-else class="catalogo-locked-hint">Padrão</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <div v-if="editCustos.length && !importacaoAnualPendente" class="grids">
      <section class="content-card">
        <h3>Custos</h3>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-id">Id</th>
                <th>Descrição</th>
                <th class="col-valor">Valor (R$)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in editCustos"
                :key="'c-' + row.id"
                :class="{ destaque: row.destaque }"
              >
                <td class="col-id">{{ row.id }}</td>
                <td>{{ row.titulo }}</td>
                <td>
                  <input
                    v-model="row.valorInput"
                    class="input-cell input-moeda"
                    type="text"
                    inputmode="decimal"
                    placeholder="—"
                    @blur="formatarCampoDepoisBlur(row, false)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="content-card">
        <h3>Receita</h3>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-id">Id</th>
                <th>Descrição</th>
                <th class="col-valor">Valor (R$)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in editReceita" :key="'r-' + row.id">
                <td class="col-id">{{ row.id }}</td>
                <td>{{ row.titulo }}</td>
                <td>
                  <input
                    v-model="row.valorInput"
                    class="input-cell input-moeda"
                    type="text"
                    inputmode="decimal"
                    placeholder="—"
                    @blur="formatarCampoDepoisBlur(row, false)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="content-card">
        <h3>Margem</h3>
        <p class="hint">
          Linhas marcadas como <strong>percentual</strong> no catálogo aceitam
          valor como % (ex.: <strong>34,5</strong> ou <strong>34,5%</strong> no
          Excel). As demais linhas são em R$ (formatadas ao sair do campo).
        </p>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th class="col-id">Id</th>
                <th>Descrição</th>
                <th class="col-valor">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in editMargem"
                :key="'m-' + row.id"
                :class="{ 'row-margem-pct': row.tipo_valor === 'percentual' }"
              >
                <td class="col-id">{{ row.id }}</td>
                <td>{{ row.titulo }}</td>
                <td>
                  <input
                    v-model="row.valorInput"
                    :class="[
                      'input-cell',
                      row.tipo_valor === 'percentual'
                        ? 'input-pct'
                        : 'input-moeda',
                    ]"
                    type="text"
                    inputmode="decimal"
                    placeholder="—"
                    @blur="
                      formatarCampoDepoisBlur(
                        row,
                        row.tipo_valor === 'percentual'
                      )
                    "
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section
        v-if="totaisLive && !importacaoAnualPendente"
        class="content-card totais"
      >
        <h3>Totais calculados (referência)</h3>
        <ul>
          <li>
            Soma custos:
            <strong>{{ formatBRL(totaisLive.soma_custos) }}</strong>
          </li>
          <li>
            Receita líquida (linha id 3):
            <strong>{{ formatBRL(totaisLive.receita_liquida) }}</strong>
          </li>
          <li>
            Lucro bruto (líquida − custos):
            <strong>{{ formatBRL(totaisLive.lucro_bruto) }}</strong>
          </li>
          <li>
            Margem %:
            <strong>{{ formatPct(totaisLive.margem_percentual) }}</strong>
          </li>
        </ul>
      </section>
    </div>

    <div
      v-else-if="
        !carregando &&
        !editCustos.length &&
        !importacaoAnualPendente &&
        !consultaAnualBanco
      "
      class="content-card empty-hint"
    >
      <p>
        <strong>Baixar modelo Excel</strong> ou
        <strong>Importar planilha</strong>
        para começar. Ajuste linhas do modelo com
        <strong>Configurar modelo da planilha</strong> se precisar. Para dados
        já salvos de um mês, use <strong>Carregar período</strong>. Para ver o
        ano inteiro no banco, escolha
        <strong>Todos — consulta no banco</strong> no mês e
        <strong>Carregar período</strong>. O modelo
        <strong>Faturas e funcionários dedicados</strong> fica no botão ao lado
        de «Quadro funcionários».
      </p>
    </div>
  </div>
</template>

<script>
import ExcelJS from 'exceljs'
import apiService from '../services/api.js'

const MESES = [
  'JAN',
  'FEV',
  'MAR',
  'ABR',
  'MAI',
  'JUN',
  'JUL',
  'AGO',
  'SET',
  'OUT',
  'NOV',
  'DEZ',
]

/** Valor extra no select de mês: consulta GET /periodo-ano (12 meses no banco). */
const MES_CONSULTA_ANO_INTEIRO = 13

/** Cabeçalhos no Excel: jan/26 … dez/26 (igual ao modelo operacional). */
const MESES_ABREV_PLANILHA = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

const MESES_ABREV_INV = {
  jan: 1,
  fev: 2,
  mar: 3,
  abr: 4,
  mai: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  set: 9,
  out: 10,
  nov: 11,
  dez: 12,
}

function labelMesAnoColunaExcel(ano, mes) {
  const yy = String(ano).slice(-2)
  return `${MESES_ABREV_PLANILHA[mes - 1]}/${yy}`
}

/** Texto da célula C1 no Excel (ML-A / ML-B viram nomes da matriz). */
function textoExibicaoEstabelecimentoNaPlanilha(codigoApi) {
  const c = String(codigoApi || '').trim()
  if (c === 'ML-A') return 'MATRIZ BLOCO A'
  if (c === 'ML-B') return 'MATRIZ BLOCO B'
  return c || 'ML'
}

/**
 * Converte o que veio da planilha (rótulo ou código) para o código usado na API.
 */
function normalizarCodigoEstabelecimentoDaPlanilha(texto) {
  const raw = String(texto || '').trim()
  if (!raw) return ''
  const norm = raw.toUpperCase().replace(/\s+/g, ' ').trim()
  if (norm === 'MATRIZ BLOCO A' || norm === 'ML-A') return 'ML-A'
  if (norm === 'MATRIZ BLOCO B' || norm === 'ML-B') return 'ML-B'
  return raw.slice(0, 32)
}

/** C1 parece código de estabelecimento (quando B1 não traz o rótulo padrão). */
function celulaPareceCodigoEstabelecimentoC1(texto) {
  const raw = String(texto || '').trim()
  if (!raw) return false
  const norm = raw.toUpperCase().replace(/\s+/g, ' ').trim()
  if (norm === 'MATRIZ BLOCO A' || norm === 'ML-A') return true
  if (norm === 'MATRIZ BLOCO B' || norm === 'ML-B') return true
  const compact = raw.replace(/\s+/g, '')
  return /^[A-Za-z0-9_.-]{1,32}$/.test(compact)
}

/** Ex.: "jan/26", "DEZ-2026" → { mes, ano } */
function parseCabecalhoMesColuna(text) {
  const raw = String(text || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
  const m = raw.match(
    /^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)[/.-](\d{2}|\d{4})$/
  )
  if (!m) return null
  let y = parseInt(m[2], 10)
  if (y < 100) y += 2000
  const mes = MESES_ABREV_INV[m[1]]
  if (!mes) return null
  return { mes, ano: y }
}

const ORANGE = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF97316' },
}
const BLUE = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF93C5FD' },
}
const GREEN = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF86EFAC' },
}
const GREY = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE5E7EB' },
}

/** Igual ao seed SQL — usado se a API não estiver disponível; o modelo Excel ainda é gerado. */
const CATALOGO_PADRAO = {
  custos: [
    { id: 1, titulo: 'Aluguel', ordem: 1, destaque: 1 },
    { id: 2, titulo: 'Energia', ordem: 2, destaque: 1 },
    { id: 3, titulo: 'Condomínio', ordem: 3, destaque: 1 },
    { id: 4, titulo: 'IPTU', ordem: 4, destaque: 1 },
    { id: 5, titulo: 'Segpro', ordem: 5, destaque: 0 },
    { id: 6, titulo: 'B11', ordem: 6, destaque: 0 },
    { id: 7, titulo: 'B11 descargas', ordem: 7, destaque: 0 },
    { id: 8, titulo: 'Folha', ordem: 8, destaque: 0 },
    { id: 9, titulo: '13º', ordem: 9, destaque: 0 },
    { id: 10, titulo: 'Insumos', ordem: 10, destaque: 0 },
    { id: 11, titulo: 'Corpem', ordem: 11, destaque: 1 },
    { id: 12, titulo: 'Manutenção', ordem: 12, destaque: 1 },
    { id: 13, titulo: 'Segurança', ordem: 13, destaque: 1 },
    { id: 14, titulo: 'Limpservice', ordem: 14, destaque: 1 },
    { id: 15, titulo: 'Frete', ordem: 15, destaque: 0 },
    { id: 16, titulo: 'Correios', ordem: 16, destaque: 0 },
    { id: 17, titulo: 'Taxi', ordem: 17, destaque: 0 },
    { id: 18, titulo: 'Taxas', ordem: 18, destaque: 0 },
    { id: 19, titulo: 'Previx', ordem: 19, destaque: 0 },
    { id: 20, titulo: 'Agua', ordem: 20, destaque: 1 },
    { id: 21, titulo: 'Fimatec', ordem: 21, destaque: 1 },
    { id: 22, titulo: 'Internet', ordem: 22, destaque: 1 },
    { id: 23, titulo: 'Seguros', ordem: 23, destaque: 1 },
    { id: 24, titulo: 'Brumar', ordem: 24, destaque: 0 },
    { id: 25, titulo: 'Telefone', ordem: 25, destaque: 1 },
  ],
  receita: [
    { id: 1, titulo: 'Receita Bruta', ordem: 1 },
    { id: 2, titulo: 'Impostos', ordem: 2 },
    { id: 3, titulo: 'Receita Liquida', ordem: 3 },
  ],
  margem: [
    { id: 1, titulo: 'Receita Líquida', ordem: 1, tipo_valor: 'moeda' },
    { id: 2, titulo: 'Custos', ordem: 2, tipo_valor: 'moeda' },
    { id: 3, titulo: 'Lucro Bruto', ordem: 3, tipo_valor: 'moeda' },
    { id: 4, titulo: 'Margem', ordem: 4, tipo_valor: 'percentual' },
  ],
}

/** Remove símbolos e normaliza para parse */
function stripMoedaPct(s) {
  return String(s || '')
    .replace(/R\$\s*/gi, '')
    .replace(/%/g, '')
    .replace(/\u00a0/g, ' ')
    .trim()
}

/**
 * Moeda: pt-BR (1.074.387,78), ponto decimal (1234.56), ou EN com vírgula milhar (1,074,387.78).
 */
function parseMoedaFromString(str) {
  if (str === undefined || str === null) return null
  let s = stripMoedaPct(str)
  if (s === '' || s === '—' || s === '-') return null
  if (/^[-–—]\s*R\$/i.test(s)) return null

  let neg = false
  if (/^-/.test(s)) {
    neg = true
    s = s.slice(1).trim()
  }

  const lastDot = s.lastIndexOf('.')
  const lastComma = s.lastIndexOf(',')

  let n = null

  if (lastDot >= 0 && lastComma >= 0) {
    if (lastDot > lastComma) {
      n = parseFloat(s.replace(/,/g, ''))
    } else {
      const frac = s.slice(lastComma + 1).replace(/\D/g, '')
      const intRaw = s.slice(0, lastComma).replace(/\./g, '').replace(/\D/g, '')
      if (!intRaw && !frac) return null
      n = parseFloat(`${intRaw || '0'}.${frac || '0'}`)
    }
  } else if (lastComma >= 0) {
    const commaCount = (s.match(/,/g) || []).length
    if (commaCount > 1) {
      n = parseFloat(s.replace(/,/g, ''))
    } else {
      const li = lastComma
      const frac = s.slice(li + 1).replace(/\D/g, '')
      const intRaw = s.slice(0, li).replace(/\./g, '').replace(/\D/g, '')
      if (!intRaw && !frac) return null
      n = parseFloat(`${intRaw || '0'}.${frac || '0'}`)
    }
  } else if (lastDot >= 0) {
    const parts = s.split('.')
    const last = parts[parts.length - 1]
    if (parts.length > 1 && last.length <= 2 && /^\d+$/.test(last)) {
      const intp = parts.slice(0, -1).join('').replace(/\D/g, '')
      n = parseFloat(`${intp}.${last}`)
    } else {
      n = parseFloat(s.replace(/\./g, ''))
    }
  } else if (/^\d+$/.test(s)) {
    n = parseFloat(s)
  } else {
    n = parseFloat(s.replace(/\D/g, ''))
  }

  if (!Number.isFinite(n)) return null
  return neg ? -n : n
}

/** Percentual: 34,5 / 34.5 / 1,234.5 (milhar EN) — reutiliza lógica de separadores. */
function parsePercentFromString(str) {
  if (str === undefined || str === null) return null
  const n = parseMoedaFromString(str)
  if (!Number.isFinite(n)) return null
  return Math.round(n * 10000) / 10000
}

function parseValorInput(str, isPercent) {
  if (isPercent) return parsePercentFromString(str)
  return parseMoedaFromString(str)
}

function formatMoedaCampo(n) {
  const x = Number(n)
  if (n === undefined || n === null || !Number.isFinite(x)) {
    return (0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }
  return x.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Máximo de dígitos no “valor em centavos” (evita overflow de parseInt). */
const MAX_DIGITOS_CENTAVOS_OPERACAO_FUNC = 14

/**
 * Exibe string só com dígitos como reais (entrada estilo caixa: 5 → 0,05; 50 → 0,50).
 */
function formatMinorDigitsMoedaPtBrStr(digits) {
  const d = String(digits || '').replace(/\D/g, '')
  if (!d) return ''
  const n = parseInt(d, 10)
  if (!Number.isFinite(n)) return ''
  return formatMoedaCampo(n / 100)
}

function minorDigitsToReaisNumber(digits) {
  const d = String(digits || '').replace(/\D/g, '')
  if (!d) return null
  const n = parseInt(d, 10)
  if (!Number.isFinite(n)) return null
  return n / 100
}

function reaisNumberToMinorDigitsStr(v) {
  if (v === null || v === undefined || v === '') return ''
  const n = Number(v)
  if (!Number.isFinite(n)) return ''
  return String(Math.round(n * 100))
}

function formatPercentCampo(n) {
  const x = Number(n)
  if (n === undefined || n === null || !Number.isFinite(x)) {
    return (0).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 4,
    })
  }
  return x.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 4,
  })
}

/** Exibe na grade / Excel: vazio ou inválido → 0,00 ou 0,0 (%). */
function valorApiParaCampo(v, isPercent) {
  if (v === undefined || v === null || v === '') {
    return isPercent ? formatPercentCampo(0) : formatMoedaCampo(0)
  }
  const n = Number(v)
  if (!Number.isFinite(n)) {
    return isPercent ? formatPercentCampo(0) : formatMoedaCampo(0)
  }
  return isPercent ? formatPercentCampo(n) : formatMoedaCampo(n)
}

function linhaLevantamentoValorOuZero(row) {
  if (!row) return row
  const v = row.valor
  if (v === null || v === undefined || v === '') {
    return { ...row, valor: 0 }
  }
  const n = Number(v)
  return { ...row, valor: Number.isFinite(n) ? n : 0 }
}

function normalizarMesesLevantamentoParaApi(meses) {
  return (meses || []).map(bloco => ({
    ...bloco,
    custos: (bloco.custos || []).map(linhaLevantamentoValorOuZero),
    receita: (bloco.receita || []).map(linhaLevantamentoValorOuZero),
    margem: (bloco.margem || []).map(linhaLevantamentoValorOuZero),
  }))
}

function getCellText(cell) {
  if (
    !cell ||
    cell.value === undefined ||
    cell.value === null ||
    cell.value === ''
  )
    return ''
  const v = cell.value
  if (typeof v === 'string' || typeof v === 'number') return String(v).trim()
  if (typeof v === 'object' && Array.isArray(v.richText)) {
    return v.richText
      .map(t => t.text || '')
      .join('')
      .trim()
  }
  if (typeof v === 'object' && v.text != null) return String(v.text).trim()
  if (
    typeof v === 'object' &&
    v.result != null &&
    typeof v.result !== 'object'
  ) {
    return String(v.result).trim()
  }
  return String(v).trim()
}

/** Texto exibido no Excel (resumo formatado) — essencial para % e moeda com R$ */
function getCelulaTextoExibido(cell) {
  if (!cell) return ''
  const t = cell.text != null ? String(cell.text).trim() : ''
  if (t !== '') return t
  return getCellText(cell)
}

/**
 * Lê valor numérico da coluna C. %: texto "34,5% / 34.5%" ou número interno 0,345.
 */
function getCelulaNumero(cell, isPercent) {
  if (!cell) return null
  const rawNull =
    cell.value === undefined ||
    cell.value === null ||
    (typeof cell.value === 'string' && cell.value.trim() === '')
  if (rawNull && (!cell.text || String(cell.text).trim() === '')) return null

  let v = cell.value
  if (
    typeof v === 'object' &&
    v.result != null &&
    typeof v.result === 'number'
  ) {
    v = v.result
  }
  if (typeof v === 'number' && Number.isFinite(v)) {
    if (isPercent) {
      // Excel: 34,5% costuma ser 0,345 em valor interno
      if (Math.abs(v) <= 1 && v !== 0) return Math.round(v * 100 * 100) / 100
      return Math.round(v * 10000) / 10000
    }
    return v
  }

  if (typeof v === 'string') {
    const t = v.trim()
    if (t !== '' && t !== '—' && t !== '-') {
      const parsed = isPercent
        ? parsePercentFromString(t)
        : parseMoedaFromString(t)
      if (parsed != null) return parsed
    }
  }

  const display = getCelulaTextoExibido(cell)
  if (
    display === '' ||
    display === '—' ||
    display === '-' ||
    /^R\$\s*[—-]$/i.test(display)
  )
    return null

  if (isPercent) {
    const fromPct = parsePercentFromString(display)
    if (fromPct != null) return fromPct
  }
  return parseMoedaFromString(display)
}

function lerIdCelula(cell) {
  if (
    !cell ||
    cell.value === undefined ||
    cell.value === null ||
    cell.value === ''
  )
    return null
  let v = cell.value
  if (typeof v === 'object' && v.result != null) v = v.result
  const n = parseInt(String(v).trim(), 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

/** ExcelJS costuma subdimensionar actualRowCount; última linha com dados pode ficar de fora (ex.: Margem id 4 na linha 37). */
function limiteLinhaPlanilha(ws) {
  let n = ws.actualRowCount || 0
  try {
    if (ws.lastRow && typeof ws.lastRow.number === 'number') {
      n = Math.max(n, ws.lastRow.number)
    }
  } catch (_) {
    /* ignora */
  }
  try {
    const d = ws.dimensions
    if (d && typeof d.bottom === 'number') n = Math.max(n, d.bottom)
    else if (d && d.model && typeof d.model.bottom === 'number')
      n = Math.max(n, d.model.bottom)
  } catch (_) {
    /* ignora */
  }
  return Math.min(Math.max(n, 60), 500)
}

function extrairCustosReceitaColUnica(
  ws,
  rowCustos,
  rowReceita,
  rowMargem,
  maxRow
) {
  const custos = []
  for (let ri = rowCustos + 1; ri < rowReceita; ri++) {
    const id = lerIdCelula(ws.getCell(ri, 1))
    if (!id) continue
    custos.push({
      id,
      valor: getCelulaNumero(ws.getCell(ri, 3), false),
    })
  }

  const receita = []
  for (let ri = rowReceita + 1; ri < rowMargem; ri++) {
    const id = lerIdCelula(ws.getCell(ri, 1))
    if (!id) continue
    receita.push({
      id,
      valor: getCelulaNumero(ws.getCell(ri, 3), false),
    })
  }

  const margem = []
  const margemAte = Math.max(maxRow, rowMargem + 15)
  for (let ri = rowMargem + 1; ri <= margemAte; ri++) {
    const id = lerIdCelula(ws.getCell(ri, 1))
    const b = getCellText(ws.getCell(ri, 2))
    if (!id && !b) {
      if (margem.length >= 4) break
      continue
    }
    if (!id) continue
    const isPct = id === 4
    margem.push({
      id,
      valor: getCelulaNumero(ws.getCell(ri, 3), isPct),
    })
    if (margem.length >= 4) break
  }

  return { custos, receita, margem }
}

/**
 * Mapa coluna Excel → mês (1–12), se os 12 cabeçalhos forem jan…dez do mesmo ano.
 */
function mapaColunasAnoNoCabecalho(ws, rowCustos) {
  const parsed = []
  for (let col = 3; col <= 14; col++) {
    const t = getCellText(ws.getCell(rowCustos, col))
    const p = parseCabecalhoMesColuna(t)
    if (!p) {
      return null
    }
    parsed.push({ col, mes: p.mes, ano: p.ano })
  }
  const ano0 = parsed[0].ano
  const okAno = parsed.every(x => x.ano === ano0)
  const okOrdem = parsed.every((x, i) => x.mes === i + 1)
  if (!okAno || !okOrdem) return null
  return {
    ano: ano0,
    colPorMes: Object.fromEntries(parsed.map(x => [x.mes, x.col])),
  }
}

function extrairBlocoMesColunas(
  ws,
  rowCustos,
  rowReceita,
  rowMargem,
  maxRow,
  colValor
) {
  const custos = []
  for (let ri = rowCustos + 1; ri < rowReceita; ri++) {
    const id = lerIdCelula(ws.getCell(ri, 1))
    if (!id) continue
    custos.push({
      id,
      valor: getCelulaNumero(ws.getCell(ri, colValor), false),
    })
  }
  const receita = []
  for (let ri = rowReceita + 1; ri < rowMargem; ri++) {
    const id = lerIdCelula(ws.getCell(ri, 1))
    if (!id) continue
    receita.push({
      id,
      valor: getCelulaNumero(ws.getCell(ri, colValor), false),
    })
  }
  const margem = []
  const margemAte = Math.max(maxRow, rowMargem + 15)
  for (let ri = rowMargem + 1; ri <= margemAte; ri++) {
    const id = lerIdCelula(ws.getCell(ri, 1))
    const b = getCellText(ws.getCell(ri, 2))
    if (!id && !b) {
      if (margem.length >= 4) break
      continue
    }
    if (!id) continue
    const isPct = id === 4
    margem.push({
      id,
      valor: getCelulaNumero(ws.getCell(ri, colValor), isPct),
    })
    if (margem.length >= 4) break
  }
  return { custos, receita, margem }
}

let _dedicadosFaturasRowKeySeq = 0

function novaLinhaDedicadosFatura() {
  return {
    _key: `df-${Date.now()}-${++_dedicadosFaturasRowKeySeq}`,
    codigoCorpem: '',
    faturaDigits: '',
    refMes: '',
    refAno: '',
    qtd: '',
    custoDigits: '',
  }
}

function linhaVaziaFaturasDedicadas(ri, ws) {
  const c1 = getCellText(ws.getCell(ri, 1)).trim()
  const n2 = getCelulaNumero(ws.getCell(ri, 2), false)
  const n3 = getCelulaNumero(ws.getCell(ri, 3), false)
  const n4 = getCelulaNumero(ws.getCell(ri, 4), false)
  const n5 = getCelulaNumero(ws.getCell(ri, 5), false)
  const n6 = getCelulaNumero(ws.getCell(ri, 6), false)
  return (
    !c1 &&
    n2 == null &&
    n3 == null &&
    n4 == null &&
    n5 == null &&
    n6 == null
  )
}

/**
 * Novo layout: A=Código Corpem, B=Fatura (R$), C=Mês, D=Ano, E=Qtd, F=Custo.
 * Legado (12 linhas): A=rótulo mês, B–F como antes (Competência na col. D é ignorada).
 */
function extrairFaturasDedicadasNovaGrade(ws) {
  const maxRow = limiteLinhaPlanilha(ws)
  const out = []
  let emptyStreak = 0
  for (let ri = 2; ri <= maxRow; ri++) {
    if (linhaVaziaFaturasDedicadas(ri, ws)) {
      emptyStreak++
      if (emptyStreak >= 40 && out.length > 0) break
      continue
    }
    emptyStreak = 0
    const codigo = getCellText(ws.getCell(ri, 1)).trim().slice(0, 5)
    let fatura = getCelulaNumero(ws.getCell(ri, 2), false)
    if (fatura == null) {
      const t = getCellText(ws.getCell(ri, 2)).trim()
      const p = parseMoedaFromString(t)
      if (p != null && Number.isFinite(p)) fatura = p
    }
    const mes = Math.round(getCelulaNumero(ws.getCell(ri, 3), false) || 0)
    const ano = Math.round(getCelulaNumero(ws.getCell(ri, 4), false) || 0)
    const nQ = getCelulaNumero(ws.getCell(ri, 5), false)
    let qtd = null
    if (nQ != null && Number.isFinite(nQ)) {
      qtd = Math.max(0, Math.round(nQ))
    }
    const custo = getCelulaNumero(ws.getCell(ri, 6), false)
    const temDado =
      codigo ||
      fatura != null ||
      qtd != null ||
      (custo != null && Number.isFinite(custo))
    if (!temDado) continue
    if (mes < 1 || mes > 12 || ano < 2000 || ano > 2100) {
      throw new Error(
        `Linha ${ri}: com dados preenchidos, informe mês (1–12) e ano (2000–2100) nas colunas C e D.`
      )
    }
    out.push({
      ref_mes: mes,
      ref_ano: ano,
      codigo_corpem: codigo,
      fatura_cliente: fatura,
      funcionarios_dedicados: qtd,
      custo_funcionario_dedicado: custo,
    })
  }
  return out
}

function extrairFaturasDedicadasLegado12(ws, anoFallback) {
  const ano =
    anoFallback >= 2000 && anoFallback <= 2100
      ? anoFallback
      : new Date().getFullYear()
  const linhas = []
  for (let mes = 1; mes <= 12; mes++) {
    const ri = mes + 1
    const codigo = getCellText(ws.getCell(ri, 2)).trim().slice(0, 5)
    let fatura = getCelulaNumero(ws.getCell(ri, 3), false)
    if (fatura == null) {
      const t = getCellText(ws.getCell(ri, 3)).trim()
      const p = parseMoedaFromString(t)
      if (p != null && Number.isFinite(p)) fatura = p
    }
    const nQ = getCelulaNumero(ws.getCell(ri, 5), false)
    let qtd = null
    if (nQ != null && Number.isFinite(nQ)) {
      qtd = Math.max(0, Math.round(nQ))
    }
    const custo = getCelulaNumero(ws.getCell(ri, 6), false)
    linhas.push({
      ref_mes: mes,
      ref_ano: ano,
      codigo_corpem: codigo,
      fatura_cliente: fatura,
      funcionarios_dedicados: qtd,
      custo_funcionario_dedicado: custo,
    })
  }
  return linhas
}

function parecePlanilhaFaturasNovoLayout(ws) {
  const h3 = getCellText(ws.getCell(1, 3))
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  const h4 = getCellText(ws.getCell(1, 4))
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (/\bmes\b/.test(h3) && /\bano\b/.test(h4)) return true
  const y = getCelulaNumero(ws.getCell(2, 4), false)
  return y != null && y >= 2000 && y <= 2100
}

function extrairGradeFaturasDedicadasDoWorkbook(wb, anoBarra) {
  const ws =
    wb.getWorksheet('Faturas dedicados') ||
    (wb.worksheets || []).find(w =>
      /faturas.*dedic|dedic.*faturas|dedicados/i.test(String(w.name || ''))
    ) ||
    wb.worksheets[0]
  if (!ws) {
    throw new Error('Planilha sem abas.')
  }
  if (parecePlanilhaFaturasNovoLayout(ws)) {
    const nova = extrairFaturasDedicadasNovaGrade(ws)
    if (nova.length) return nova
  }
  const legado = extrairFaturasDedicadasLegado12(ws, anoBarra)
  const temAlgum = legado.some(
    r =>
      r.codigo_corpem ||
      r.fatura_cliente != null ||
      r.funcionarios_dedicados != null ||
      (r.custo_funcionario_dedicado != null &&
        Number.isFinite(r.custo_funcionario_dedicado))
  )
  if (!temAlgum) {
    throw new Error(
      'Nenhum dado encontrado. Use o modelo desta seção (colunas A–F: Corpem, Fatura, Mês, Ano, Qtd, Custo).'
    )
  }
  return legado
}

/**
 * Extrai dados do workbook: modo "ano" (12 colunas jan…dez) ou "mes" (coluna C única, legado).
 */
function extrairDadosLevantamentoDoWorkbook(wb) {
  const ws = wb.getWorksheet('Levantamento') || wb.worksheets[0]
  if (!ws) {
    throw new Error('Planilha sem abas.')
  }
  const maxRow = limiteLinhaPlanilha(ws)
  const marcadores = []
  for (let ri = 1; ri <= maxRow; ri++) {
    const b = getCellText(ws.getCell(ri, 2))
    if (b === 'Custos' || b === 'Receita' || b === 'Margem') {
      marcadores.push({ label: b, row: ri })
    }
  }
  const temCustos = marcadores.some(m => m.label === 'Custos')
  const temReceita = marcadores.some(m => m.label === 'Receita')
  const temMargem = marcadores.some(m => m.label === 'Margem')
  if (!temCustos || !temReceita || !temMargem) {
    throw new Error(
      'Planilha inválida: precisa das seções Custos, Receita e Margem (coluna B), como no modelo exportado.'
    )
  }
  const rowCustos = marcadores.find(m => m.label === 'Custos').row
  const rowReceita = marcadores.find(m => m.label === 'Receita').row
  const rowMargem = marcadores.find(m => m.label === 'Margem').row

  let codigoEstabelecimentoArquivo = ''
  const b1 = getCellText(ws.getCell(1, 2))
  const c1Raw = getCellText(ws.getCell(1, 3)).trim()
  if (b1.toUpperCase().includes('ESTABELECIMENTO') && c1Raw) {
    codigoEstabelecimentoArquivo = c1Raw
  } else if (celulaPareceCodigoEstabelecimentoC1(c1Raw)) {
    codigoEstabelecimentoArquivo = c1Raw
  }

  const mapaAno = mapaColunasAnoNoCabecalho(ws, rowCustos)
  if (mapaAno) {
    const meses = []
    for (let mes = 1; mes <= 12; mes++) {
      const col = mapaAno.colPorMes[mes]
      const bloco = extrairBlocoMesColunas(
        ws,
        rowCustos,
        rowReceita,
        rowMargem,
        maxRow,
        col
      )
      meses.push({
        mes,
        custos: bloco.custos,
        receita: bloco.receita,
        margem: bloco.margem,
      })
    }
    return {
      modo: 'ano',
      ano: mapaAno.ano,
      meses,
      codigoEstabelecimentoArquivo,
    }
  }

  const legado = extrairCustosReceitaColUnica(
    ws,
    rowCustos,
    rowReceita,
    rowMargem,
    maxRow
  )
  return {
    modo: 'mes',
    custos: legado.custos,
    receita: legado.receita,
    margem: legado.margem,
    codigoEstabelecimentoArquivo,
  }
}

export default {
  name: 'LevantamentoCustosOperacionaisPage',
  data() {
    const y = new Date().getFullYear()
    const anos = []
    for (let a = y - 3; a <= y + 3; a++) anos.push(a)
    return {
      mes: 0,
      ano: y,
      anosSelect: anos,
      meses: MESES,
      codigoEstabelecimentoSelect: 'ML',
      codigoEstabelecimentoOutro: '',
      carregando: false,
      gerandoExcel: false,
      importando: false,
      erroCarregar: '',
      editCustos: [],
      editReceita: [],
      editMargem: [],
      catalogoCustos: [],
      catalogoReceita: [],
      catalogoMargem: [],
      catalogoCarregando: false,
      catalogoSalvando: false,
      novoCustoTitulo: '',
      novoCustoOrdem: '',
      custoIdPadraoMax: 25,
      receitaIdPadraoMax: 3,
      margemIdPadraoMax: 4,
      importacaoAnualPendente: null,
      consultaAnualBanco: null,
      confirmandoImportacaoAnual: false,
      gerandoExcelDedicados: false,
      dedicadosFaturasRows: [],
      carregandoDedicadosCorpem: false,
      gravandoDedicadosCorpem: false,
      importandoDedicadosPlanilha: false,
      erroDedicadosCorpem: '',
      dedicadosCorpemSemTabela: false,
      mostrarConfiguracaoModelo: false,
      mostrarQuadroFuncionarios: false,
      mostrarDedicadosCorpem: true,
      operacaoFuncRows: [],
      carregandoOperacaoFunc: false,
      gravandoOperacaoFunc: false,
      erroOperacaoFunc: '',
    }
  },
  mounted() {
    this.carregarCatalogoCustos()
  },
  watch: {
    mes() {
      if (this.mes !== MES_CONSULTA_ANO_INTEIRO) {
        this.consultaAnualBanco = null
      }
      if (!this.importacaoAnualPendente || !this.mesSelecionadoParaGrade) {
        return
      }
      this.$nextTick(() => {
        this.aplicarMesAnualNaGrid(this.importacaoAnualPendente, this.mes)
      })
    },
    ano() {
      this.consultaAnualBanco = null
      this.resetOperacaoFuncSeAberto()
      this.resetDedicadosFaturasSeAberto()
    },
    codigoEstabelecimentoApi() {
      this.consultaAnualBanco = null
      this.resetOperacaoFuncSeAberto()
      this.resetDedicadosFaturasSeAberto()
    },
  },
  computed: {
    /** Código enviado à API e usado no nome do arquivo (ML-A, ML-B, ML, …). */
    codigoEstabelecimentoApi() {
      if (this.codigoEstabelecimentoSelect === 'OTHER') {
        const o = (this.codigoEstabelecimentoOutro || '').trim().slice(0, 32)
        return o || 'ML'
      }
      return this.codigoEstabelecimentoSelect
    },
    mesSelecionadoParaGrade() {
      return this.mes >= 1 && this.mes <= 12
    },
    podeCarregarPeriodo() {
      return (
        (this.mesSelecionadoParaGrade ||
          this.mes === MES_CONSULTA_ANO_INTEIRO) &&
        this.ano >= 2000
      )
    },
    revisaoCustosRows() {
      if (this.consultaAnualBanco) {
        return this.consultaAnualBanco.custos || []
      }
      return this.editCustos
    },
    revisaoReceitaRows() {
      if (this.consultaAnualBanco) {
        return this.consultaAnualBanco.receita || []
      }
      return this.editReceita
    },
    revisaoMargemRows() {
      if (this.consultaAnualBanco) {
        return this.consultaAnualBanco.margem || []
      }
      return this.editMargem
    },
    mesesRevisaoColunas() {
      const ano =
        this.consultaAnualBanco?.ano ??
        this.importacaoAnualPendente?.ano ??
        this.ano
      if (!ano) return []
      return Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1,
        label: labelMesAnoColunaExcel(ano, i + 1),
      }))
    },
    totaisLive() {
      if (!this.editCustos.length) return null
      const custosNum = this.editCustos.map(r => ({
        id: r.id,
        valor: parseValorInput(r.valorInput, false),
      }))
      const receitaNum = this.editReceita.map(r => ({
        id: r.id,
        valor: parseValorInput(r.valorInput, false),
      }))
      const somaC = custosNum.reduce(
        (a, x) => a + (x.valor != null ? x.valor : 0),
        0
      )
      const recRow = receitaNum.find(x => Number(x.id) === 3)
      const recLiq = recRow && recRow.valor != null ? recRow.valor : null
      const lucro = recLiq != null ? recLiq - somaC : null
      const margemPct =
        recLiq != null && recLiq !== 0 && lucro != null
          ? (lucro / recLiq) * 100
          : null
      return {
        soma_custos: somaC,
        receita_liquida: recLiq,
        lucro_bruto: lucro,
        margem_percentual: margemPct,
      }
    },
  },
  methods: {
    celulaRevisaoImportacaoAnual(secao, rowId, mesNum, isPercent) {
      const c = this.consultaAnualBanco
      if (c) {
        const list = c[secao]
        const item = (list || []).find(x => Number(x.id) === Number(rowId))
        const vm = item && item.valores_mes ? item.valores_mes : null
        const v = vm
          ? vm[mesNum] !== undefined && vm[mesNum] !== null
            ? vm[mesNum]
            : vm[String(mesNum)]
          : null
        const s = valorApiParaCampo(v, isPercent)
        return isPercent ? `${s}\u00a0%` : s
      }
      const p = this.importacaoAnualPendente
      if (!p) return ''
      const bloco = (p.meses || []).find(x => Number(x.mes) === Number(mesNum))
      const list = bloco ? bloco[secao] || [] : []
      const item = list.find(x => Number(x.id) === Number(rowId))
      const v = item ? item.valor : null
      const s = valorApiParaCampo(v, isPercent)
      return isPercent ? `${s}\u00a0%` : s
    },
    itemCatalogoEditavel(row) {
      if (row && typeof row.editavel === 'boolean') return row.editavel
      const id = Number(row && row.id)
      if (!Number.isFinite(id)) return false
      if (Object.prototype.hasOwnProperty.call(row || {}, 'destaque')) {
        return id > this.custoIdPadraoMax
      }
      if (Object.prototype.hasOwnProperty.call(row || {}, 'tipo_valor')) {
        return id > this.margemIdPadraoMax
      }
      return id > this.receitaIdPadraoMax
    },
    async carregarCatalogoCustos() {
      this.catalogoCarregando = true
      try {
        const data = await apiService.get(
          '/levantamento-custos-operacionais/catalogo'
        )
        if (!data.success)
          throw new Error(data.error || 'Falha ao carregar catálogo')
        const L = data.limites_seed || {}
        if (L.custo_id_max_padrao != null)
          this.custoIdPadraoMax = Number(L.custo_id_max_padrao)
        if (L.receita_id_max_padrao != null)
          this.receitaIdPadraoMax = Number(L.receita_id_max_padrao)
        if (L.margem_id_max_padrao != null)
          this.margemIdPadraoMax = Number(L.margem_id_max_padrao)
        this.catalogoCustos = data.custos || []
        this.catalogoReceita = data.receita || []
        this.catalogoMargem = data.margem || []
      } catch (e) {
        console.error(e)
        this.catalogoCustos = []
        this.catalogoReceita = []
        this.catalogoMargem = []
      } finally {
        this.catalogoCarregando = false
      }
    },
    async sincronizarGradeAposCatalogo() {
      await this.carregarCatalogoCustos()
      if (this.editCustos.length) {
        await this.carregarPeriodo()
      }
    },
    async adicionarCustoCatalogo() {
      const titulo = (this.novoCustoTitulo || '').trim()
      if (!titulo) return
      this.catalogoSalvando = true
      try {
        const body = { titulo }
        if (
          this.novoCustoOrdem !== '' &&
          this.novoCustoOrdem !== null &&
          Number.isFinite(Number(this.novoCustoOrdem))
        ) {
          body.ordem = parseInt(this.novoCustoOrdem, 10)
        }
        const data = await apiService.post(
          '/levantamento-custos-operacionais/item/custo',
          body
        )
        if (!data.success) throw new Error(data.error || 'Falha ao incluir')
        this.novoCustoTitulo = ''
        this.novoCustoOrdem = ''
        this.$emit(
          'notification',
          `Custo incluído com id ${data.item.id}.`,
          'success'
        )
        await this.sincronizarGradeAposCatalogo()
      } catch (e) {
        console.error(e)
        this.$emit(
          'notification',
          e.message || 'Erro ao incluir custo.',
          'error'
        )
      } finally {
        this.catalogoSalvando = false
      }
    },
    async salvarCustoCatalogo(c) {
      if (!this.itemCatalogoEditavel(c)) return
      this.catalogoSalvando = true
      try {
        const titulo = String(c.titulo || '').trim()
        if (!titulo) {
          throw new Error('A descrição não pode ser vazia.')
        }
        const ordem = parseInt(c.ordem, 10)
        if (!Number.isFinite(ordem)) {
          throw new Error('Ordem deve ser um número inteiro.')
        }
        const data = await apiService.patch(
          `/levantamento-custos-operacionais/item/custo/${c.id}`,
          { titulo, ordem }
        )
        if (!data.success) throw new Error(data.error || 'Falha ao atualizar')
        this.$emit('notification', 'Linha de custo atualizada.', 'success')
        await this.sincronizarGradeAposCatalogo()
      } catch (e) {
        console.error(e)
        this.$emit(
          'notification',
          e.message || 'Erro ao salvar linha.',
          'error'
        )
      } finally {
        this.catalogoSalvando = false
      }
    },
    async excluirCustoCatalogo(c) {
      if (Number(c.id) <= this.custoIdPadraoMax) return
      if (
        !window.confirm(
          `Excluir "${c.titulo}" (id ${c.id}) e todos os valores gravados deste item em todos os períodos?`
        )
      )
        return
      this.catalogoSalvando = true
      try {
        const data = await apiService.delete(
          `/levantamento-custos-operacionais/item/custo/${c.id}`
        )
        if (!data.success) {
          throw new Error(data.error || 'Falha ao excluir')
        }
        this.$emit('notification', 'Item excluído.', 'success')
        await this.sincronizarGradeAposCatalogo()
      } catch (e) {
        console.error(e)
        this.$emit('notification', e.message || 'Erro ao excluir.', 'error')
      } finally {
        this.catalogoSalvando = false
      }
    },
    async salvarReceitaCatalogo(r) {
      if (!this.itemCatalogoEditavel(r)) return
      this.catalogoSalvando = true
      try {
        const titulo = String(r.titulo || '').trim()
        if (!titulo) {
          throw new Error('A descrição não pode ser vazia.')
        }
        const ordem = parseInt(r.ordem, 10)
        if (!Number.isFinite(ordem)) {
          throw new Error('Ordem deve ser um número inteiro.')
        }
        const data = await apiService.patch(
          `/levantamento-custos-operacionais/item/receita/${r.id}`,
          { titulo, ordem }
        )
        if (!data.success) throw new Error(data.error || 'Falha ao atualizar')
        this.$emit('notification', 'Linha de receita atualizada.', 'success')
        await this.sincronizarGradeAposCatalogo()
      } catch (e) {
        console.error(e)
        this.$emit(
          'notification',
          e.message || 'Erro ao salvar receita.',
          'error'
        )
      } finally {
        this.catalogoSalvando = false
      }
    },
    async salvarMargemCatalogo(m) {
      if (!this.itemCatalogoEditavel(m)) return
      this.catalogoSalvando = true
      try {
        const titulo = String(m.titulo || '').trim()
        if (!titulo) {
          throw new Error('A descrição não pode ser vazia.')
        }
        const ordem = parseInt(m.ordem, 10)
        if (!Number.isFinite(ordem)) {
          throw new Error('Ordem deve ser um número inteiro.')
        }
        const tipo_valor =
          m.tipo_valor === 'percentual' ? 'percentual' : 'moeda'
        const data = await apiService.patch(
          `/levantamento-custos-operacionais/item/margem/${m.id}`,
          {
            titulo,
            ordem,
            tipo_valor,
          }
        )
        if (!data.success) throw new Error(data.error || 'Falha ao atualizar')
        this.$emit('notification', 'Linha de margem atualizada.', 'success')
        await this.sincronizarGradeAposCatalogo()
      } catch (e) {
        console.error(e)
        this.$emit(
          'notification',
          e.message || 'Erro ao salvar margem.',
          'error'
        )
      } finally {
        this.catalogoSalvando = false
      }
    },
    formatBRL(v) {
      if (v === null || v === undefined || Number.isNaN(v)) {
        return (0).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })
      }
      return Number(v).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })
    },
    toggleQuadroFuncionarios() {
      this.mostrarQuadroFuncionarios = !this.mostrarQuadroFuncionarios
      if (this.mostrarQuadroFuncionarios) {
        this.ensureOperacaoFuncRows()
        this.erroOperacaoFunc = ''
      }
    },
    toggleDedicadosCorpem() {
      this.mostrarDedicadosCorpem = !this.mostrarDedicadosCorpem
      if (this.mostrarDedicadosCorpem) {
        this.ensureDedicadosFaturasRows()
        this.erroDedicadosCorpem = ''
      }
    },
    ensureDedicadosFaturasRows() {
      if (this.dedicadosFaturasRows.length > 0) return
      this.dedicadosFaturasRows = Array.from({ length: 50 }, () =>
        novaLinhaDedicadosFatura()
      )
    },
    adicionarLinhasDedicadosFaturas(n = 25) {
      const k = Math.min(500, Math.max(1, parseInt(n, 10) || 25))
      const novas = Array.from({ length: k }, () => novaLinhaDedicadosFatura())
      this.dedicadosFaturasRows = [...this.dedicadosFaturasRows, ...novas]
    },
    resetDedicadosFaturasSeAberto() {
      if (!this.mostrarDedicadosCorpem) return
      this.dedicadosFaturasRows = []
      this.erroDedicadosCorpem = ''
      this.dedicadosCorpemSemTabela = false
      this.ensureDedicadosFaturasRows()
    },
    ensureOperacaoFuncRows() {
      if (this.operacaoFuncRows.length === 12) return
      this.operacaoFuncRows = Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1,
        qtd: '',
        unitDigits: '',
      }))
    },
    resetOperacaoFuncSeAberto() {
      if (!this.mostrarQuadroFuncionarios) return
      this.operacaoFuncRows = []
      this.erroOperacaoFunc = ''
      this.ensureOperacaoFuncRows()
    },
    formatOperacaoFuncMoedaInput(digits) {
      return formatMinorDigitsMoedaPtBrStr(digits)
    },
    onOperacaoFuncMoedaFocus(e) {
      const el = e?.target
      if (el && typeof el.select === 'function') {
        requestAnimationFrame(() => el.select())
      }
    },
    onOperacaoFuncMoedaKeydown(e, row, prop) {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        const cur = String(row[prop] || '').replace(/\D/g, '')
        const next = (cur + e.key).slice(-MAX_DIGITOS_CENTAVOS_OPERACAO_FUNC)
        row[prop] = next
        return
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        const cur = String(row[prop] || '').replace(/\D/g, '')
        row[prop] = cur.slice(0, -1)
      }
    },
    onOperacaoFuncMoedaPaste(e, row, prop) {
      const raw = (e.clipboardData?.getData('text') || '').trim()
      const n = parseMoedaFromString(raw)
      if (n != null && Number.isFinite(n)) {
        row[prop] = String(Math.round(n * 100)).slice(
          -MAX_DIGITOS_CENTAVOS_OPERACAO_FUNC
        )
        return
      }
      const onlyDigits = raw.replace(/\D/g, '')
      if (!onlyDigits) return
      row[prop] = onlyDigits.slice(-MAX_DIGITOS_CENTAVOS_OPERACAO_FUNC)
    },
    async carregarOperacaoFuncionarios() {
      this.ensureOperacaoFuncRows()
      this.carregandoOperacaoFunc = true
      this.erroOperacaoFunc = ''
      try {
        const data = await apiService.get(
          '/levantamento-custos-operacionais/operacao-funcionarios',
          {
            ano: this.ano,
            codigo_estabelecimento: this.codigoEstabelecimentoApi,
          }
        )
        if (!data.success) {
          throw new Error(
            data.error || 'Falha ao carregar quadro de funcionários.'
          )
        }
        const mesesApi = Array.isArray(data.meses) ? data.meses : []
        const byMes = new Map()
        for (const m of mesesApi) {
          const mesKey = Number(m.mes ?? m.MES ?? m.ref_mes ?? m.REF_MES)
          if (mesKey >= 1 && mesKey <= 12) byMes.set(mesKey, m)
        }
        for (let i = 0; i < 12; i++) {
          const mes = i + 1
          const r = byMes.get(mes)
          const row = this.operacaoFuncRows[i]
          if (!row) continue
          const qtdApi = r && (r.qtd_funcionarios ?? r.QTD_FUNCIONARIOS)
          row.qtd =
            r &&
            qtdApi != null &&
            qtdApi !== '' &&
            Number.isFinite(Number(qtdApi))
              ? String(qtdApi)
              : ''
          const unitApi =
            r &&
            (r.custo_unitario_funcionario ?? r.CUSTO_UNITARIO_FUNCIONARIO)
          row.unitDigits =
            r && unitApi != null && unitApi !== ''
              ? reaisNumberToMinorDigitsStr(unitApi)
              : ''
        }
        const lidas = Number(data.linhas_banco)
        const temDados = this.operacaoFuncRows.some(row => {
          const q = row.qtd != null && String(row.qtd).trim() !== ''
          const u =
            row.unitDigits != null && String(row.unitDigits).trim() !== ''
          return q || u
        })
        if (!temDados) {
          if (Number.isFinite(lidas) && lidas > 0) {
            this.erroOperacaoFunc =
              'O banco retornou linhas, mas não foi possível mapear os valores para a grade. Atualize o backend (GET operacao-funcionarios) ou verifique o script da tabela lev_operacao_funcionario.'
          } else {
            this.$emit(
              'notification',
              `Nenhum quadro gravado para ${this.codigoEstabelecimentoApi} em ${this.ano}. Se importou pelo Excel com C1 = ML-A ou ML-B, selecione o mesmo código na barra.`,
              'warning'
            )
          }
        } else {
          this.$emit(
            'notification',
            'Quadro de funcionários carregado.',
            'success'
          )
        }
      } catch (e) {
        console.error(e)
        const msg =
          e.message || 'Erro ao carregar. Verifique o script SQL e a API.'
        this.erroOperacaoFunc =
          /rota não encontrada/i.test(msg) || /not found/i.test(msg)
            ? `${msg} — Reinicie o backend (schedule-back-end: npm run start:homolog) ou faça deploy com a versão que inclui GET /operacao-funcionarios.`
            : msg
      } finally {
        this.carregandoOperacaoFunc = false
      }
    },
    async gravarOperacaoFuncionarios() {
      this.ensureOperacaoFuncRows()
      this.gravandoOperacaoFunc = true
      this.erroOperacaoFunc = ''
      try {
        const data = await apiService.post(
          '/levantamento-custos-operacionais/operacao-funcionarios',
          {
            ano: this.ano,
            codigo_estabelecimento: this.codigoEstabelecimentoApi,
            meses: this.operacaoFuncRows.map(r => ({
              mes: r.mes,
              qtd_funcionarios: r.qtd,
              custo_unitario_funcionario: r.unitDigits
                ? formatMoedaCampo(minorDigitsToReaisNumber(r.unitDigits) ?? 0)
                : '',
            })),
          }
        )
        if (!data.success) {
          throw new Error(
            data.error || 'Falha ao gravar quadro de funcionários.'
          )
        }
        this.$emit('notification', data.message || 'Quadro gravado.', 'success')
      } catch (e) {
        console.error(e)
        const msg = e.message || 'Erro ao gravar.'
        this.erroOperacaoFunc =
          /rota não encontrada/i.test(msg) || /not found/i.test(msg)
            ? `${msg} — Reinicie o backend (ex.: na pasta schedule-back-end: npm run start:homolog) para carregar a rota operacao-funcionarios, ou faça deploy da versão atual do servidor.`
            : msg
      } finally {
        this.gravandoOperacaoFunc = false
      }
    },
    formatPct(v) {
      if (v === null || v === undefined || Number.isNaN(v)) {
        return `${(0).toFixed(1).replace('.', ',')}%`
      }
      return `${Number(v).toFixed(1).replace('.', ',')}%`
    },
    /** Alinha o select da barra ao código que será gravado (ex.: após importar). */
    aplicarCodigoEstabelecimentoNaUi(codigo) {
      const c = String(codigo || '')
        .trim()
        .slice(0, 32)
      if (!c) return
      const predef = ['ML-A', 'ML-B', 'ML']
      if (predef.includes(c)) {
        this.codigoEstabelecimentoSelect = c
        this.codigoEstabelecimentoOutro = ''
        return
      }
      this.codigoEstabelecimentoSelect = 'OTHER'
      this.codigoEstabelecimentoOutro = c
    },
    aplicarValoresImportadosNaGrid(parsed) {
      const mapList = (rows, list) => {
        const m = new Map((list || []).map(p => [p.id, p.valor]))
        for (const row of rows) {
          if (!m.has(row.id)) continue
          const v = m.get(row.id)
          const isPct = row.tipo_valor === 'percentual'
          row.valorInput = valorApiParaCampo(v, isPct)
        }
      }
      mapList(this.editCustos, parsed.custos)
      mapList(this.editReceita, parsed.receita)
      mapList(this.editMargem, parsed.margem)
    },
    aplicarMesAnualNaGrid(pendente, mesNum) {
      if (!pendente || !pendente.meses) return
      const bloco = pendente.meses.find(x => Number(x.mes) === Number(mesNum))
      if (!bloco) return
      this.aplicarValoresImportadosNaGrid({
        custos: bloco.custos,
        receita: bloco.receita,
        margem: bloco.margem,
      })
    },
    aplicarCatalogoLocal() {
      this.editCustos = CATALOGO_PADRAO.custos.map(r => ({
        ...r,
        valorInput: formatMoedaCampo(0),
      }))
      this.editReceita = CATALOGO_PADRAO.receita.map(r => ({
        ...r,
        valorInput: formatMoedaCampo(0),
      }))
      this.editMargem = CATALOGO_PADRAO.margem.map(r => ({
        ...r,
        valorInput:
          r.tipo_valor === 'percentual'
            ? formatPercentCampo(0)
            : formatMoedaCampo(0),
      }))
    },
    aplicarRespostaPeriodo(data) {
      this.editCustos = (data.custos || []).map(r => ({
        ...r,
        valorInput: valorApiParaCampo(r.valor, false),
      }))
      this.editReceita = (data.receita || []).map(r => ({
        ...r,
        valorInput: valorApiParaCampo(r.valor, false),
      }))
      const tot = data.totais_calculados || {}
      const pctCalc =
        tot.margem_percentual != null &&
        Number.isFinite(Number(tot.margem_percentual))
          ? Number(tot.margem_percentual)
          : null
      this.editMargem = (data.margem || []).map(r => {
        const isPct = r.tipo_valor === 'percentual'
        const valorApiVazio =
          r.valor === null || r.valor === undefined || r.valor === ''
        let valorInput =
          isPct && valorApiVazio && pctCalc != null
            ? formatPercentCampo(pctCalc)
            : valorApiParaCampo(r.valor, isPct)
        return {
          ...r,
          valorInput,
        }
      })
    },
    formatarCampoDepoisBlur(row, isPercent) {
      const n = parseValorInput(row.valorInput, isPercent)
      row.valorInput =
        n == null || !Number.isFinite(n)
          ? isPercent
            ? formatPercentCampo(0)
            : formatMoedaCampo(0)
          : isPercent
            ? formatPercentCampo(n)
            : formatMoedaCampo(n)
    },
    aplicarRespostaCatalogo(data) {
      this.editCustos = (data.custos || []).map(r => ({
        ...r,
        valorInput: formatMoedaCampo(0),
      }))
      this.editReceita = (data.receita || []).map(r => ({
        ...r,
        valorInput: formatMoedaCampo(0),
      }))
      this.editMargem = (data.margem || []).map(r => ({
        ...r,
        valorInput:
          r.tipo_valor === 'percentual'
            ? formatPercentCampo(0)
            : formatMoedaCampo(0),
      }))
    },
    /**
     * Garante linhas na grade para montar o Excel: período (valores salvos) → só catálogo → catálogo embutido.
     * @returns {{ fonte: 'memoria'|'periodo'|'catalogo'|'local' }}
     */
    async preencherGridParaPlanilha() {
      if (this.editCustos.length) {
        return { fonte: 'memoria' }
      }
      if (this.mesSelecionadoParaGrade) {
        try {
          const data = await apiService.get(
            '/levantamento-custos-operacionais/periodo',
            {
              mes: this.mes,
              ano: this.ano,
              codigo_estabelecimento: this.codigoEstabelecimentoApi,
            }
          )
          if (data.success && (data.custos || []).length) {
            this.aplicarRespostaPeriodo(data)
            return { fonte: 'periodo' }
          }
        } catch (_) {
          /* API indisponível ou rota antiga — segue para catálogo local */
        }
      }
      try {
        const data = await apiService.get(
          '/levantamento-custos-operacionais/catalogo'
        )
        if (data.success && (data.custos || []).length) {
          this.aplicarRespostaCatalogo(data)
          return { fonte: 'catalogo' }
        }
      } catch (_) {
        /* ignora */
      }
      this.aplicarCatalogoLocal()
      return { fonte: 'local' }
    },
    async carregarAnoDoBanco() {
      if (this.mes !== MES_CONSULTA_ANO_INTEIRO) return
      if (this.importacaoAnualPendente) {
        this.$emit(
          'notification',
          'Há importação anual pendente. Grave ou descarte antes de consultar o banco.',
          'warning'
        )
        return
      }
      if (!this.ano || this.ano < 2000) {
        this.$emit('notification', 'Selecione um ano válido.', 'warning')
        return
      }
      const anoPedido = this.ano
      const estabPedido = this.codigoEstabelecimentoApi
      this.erroCarregar = ''
      this.carregando = true
      try {
        const data = await apiService.get(
          '/levantamento-custos-operacionais/periodo-ano',
          {
            ano: anoPedido,
            codigo_estabelecimento: estabPedido,
          }
        )
        if (!data.success) {
          throw new Error(data.error || 'Falha ao carregar o ano')
        }
        if (this.mes !== MES_CONSULTA_ANO_INTEIRO) return
        if (Number(data.ano) !== Number(anoPedido)) return
        if (
          String(data.codigo_estabelecimento || '').trim() !==
          String(estabPedido).trim()
        ) {
          return
        }
        this.consultaAnualBanco = {
          ano: data.ano,
          codigo_estabelecimento: data.codigo_estabelecimento,
          custos: data.custos || [],
          receita: data.receita || [],
          margem: data.margem || [],
        }
        this.editCustos = []
        this.editReceita = []
        this.editMargem = []
        this.$emit(
          'notification',
          'Dados do ano carregados do banco (consulta, somente leitura).',
          'success'
        )
      } catch (e) {
        console.error(e)
        this.erroCarregar = e.message || 'Erro ao carregar ano.'
        this.$emit('notification', this.erroCarregar, 'error')
      } finally {
        this.carregando = false
      }
    },
    async carregarPeriodo() {
      if (this.mes === MES_CONSULTA_ANO_INTEIRO) {
        await this.carregarAnoDoBanco()
        return
      }
      if (!this.mesSelecionadoParaGrade) {
        this.$emit(
          'notification',
          'Selecione um mês (1–12), ou «Todos — consulta no banco», para carregar.',
          'warning'
        )
        return
      }
      this.erroCarregar = ''
      this.carregando = true
      try {
        const data = await apiService.get(
          '/levantamento-custos-operacionais/periodo',
          {
            mes: this.mes,
            ano: this.ano,
            codigo_estabelecimento: this.codigoEstabelecimentoApi,
          }
        )
        if (!data.success) {
          throw new Error(data.error || 'Falha ao carregar')
        }
        this.aplicarRespostaPeriodo(data)
        this.$emit('notification', 'Período carregado.', 'success')
      } catch (e) {
        console.error(e)
        const hint404 =
          String(e.message || '').includes('Rota não encontrada') ||
          String(e.message || '').includes('404')
            ? ' Deploy/reinicie o backend com o código que registra /api/levantamento-custos-operacionais. Enquanto isso, use Baixar modelo Excel (catálogo embutido).'
            : ''
        this.erroCarregar =
          (e.message ||
            'Erro ao carregar. Execute o script SQL no dbmercocamp se ainda não criou as tabelas.') +
          hint404
        this.$emit('notification', this.erroCarregar, 'error')
      } finally {
        this.carregando = false
      }
    },
    abrirSeletorImportacao() {
      const el = this.$refs.inputImportar
      if (el) el.click()
    },
    async descartarImportacaoAnual() {
      this.importacaoAnualPendente = null
      this.consultaAnualBanco = null
      this.$emit('notification', 'Importação anual descartada.', 'success')
      this.editCustos = []
      await this.preencherGridParaPlanilha()
    },
    async confirmarImportacaoAnual() {
      const p = this.importacaoAnualPendente
      if (!p) return
      this.confirmandoImportacaoAnual = true
      try {
        const data = await apiService.put(
          '/levantamento-custos-operacionais/periodo-ano',
          {
            ano: p.ano,
            codigo_estabelecimento: p.codigo_estabelecimento,
            meses: normalizarMesesLevantamentoParaApi(p.meses),
          }
        )
        if (!data.success) {
          throw new Error(data.error || 'Falha ao gravar')
        }
        this.importacaoAnualPendente = null
        this.consultaAnualBanco = null
        this.editCustos = []
        this.editReceita = []
        this.editMargem = []
        this.mes = 0
        this.$emit(
          'notification',
          data.message || 'Valores gravados para os 12 meses.',
          'success'
        )
      } catch (e) {
        console.error(e)
        this.$emit(
          'notification',
          e.message || 'Erro ao gravar importação anual.',
          'error'
        )
      } finally {
        this.confirmandoImportacaoAnual = false
      }
    },
    async onArquivoImportacaoEscolhido(event) {
      const input = event.target
      const file = input.files && input.files[0]
      if (!file) return
      input.value = ''
      if (!this.ano) {
        this.$emit(
          'notification',
          'Selecione o ano antes de importar.',
          'warning'
        )
        return
      }
      this.importando = true
      this.consultaAnualBanco = null
      try {
        const buffer = await file.arrayBuffer()
        const wb = new ExcelJS.Workbook()
        await wb.xlsx.load(buffer)
        const parsed = extrairDadosLevantamentoDoWorkbook(wb)
        const uiEstab = this.codigoEstabelecimentoApi.trim()
        const arqEstabRaw = (parsed.codigoEstabelecimentoArquivo || '').trim()
        const arqCodigo = normalizarCodigoEstabelecimentoDaPlanilha(arqEstabRaw)
        const codigoParaGravar = (arqCodigo || uiEstab).trim().slice(0, 32)
        if (arqCodigo) {
          this.aplicarCodigoEstabelecimentoNaUi(arqCodigo)
          if (arqCodigo !== uiEstab) {
            this.$emit(
              'notification',
              `Estabelecimento da planilha (${arqCodigo}) será usado na gravação. O selecionado na barra era «${uiEstab}».`,
              'success'
            )
          }
        }

        this.importacaoAnualPendente = null

        if (parsed.modo === 'ano') {
          const temAlgum = (parsed.meses || []).some(
            m =>
              (m.custos && m.custos.length) ||
              (m.receita && m.receita.length) ||
              (m.margem && m.margem.length)
          )
          if (!temAlgum) {
            throw new Error(
              'Nenhuma linha com id (coluna A) foi encontrada. Use o modelo exportado pelo portal.'
            )
          }
          if (parsed.ano !== this.ano) {
            this.$emit(
              'notification',
              `O ano na planilha (${parsed.ano}) difere do ano selecionado (${this.ano}). A gravação usará o ano da planilha (${parsed.ano}).`,
              'warning'
            )
          }
          await this.preencherGridParaPlanilha()
          const jaTinhaMes = this.mesSelecionadoParaGrade
          this.importacaoAnualPendente = {
            ano: parsed.ano,
            codigo_estabelecimento: codigoParaGravar,
            meses: parsed.meses,
          }
          if (!jaTinhaMes) {
            this.mes = 1
            this.$emit(
              'notification',
              'Planilha anual lida. Confira a tabela com os 12 meses abaixo e use «Gravar os 12 meses no banco» quando estiver ok.',
              'success'
            )
          } else {
            this.aplicarMesAnualNaGrid(this.importacaoAnualPendente, this.mes)
            this.$emit(
              'notification',
              'Planilha anual lida. Confira a tabela com os 12 meses abaixo. Use «Gravar os 12 meses no banco» quando estiver ok.',
              'success'
            )
          }
        } else {
          if (!this.mesSelecionadoParaGrade || !this.ano) {
            throw new Error(
              'Planilha no formato antigo (uma coluna): selecione um mês acima antes de importar (não use Nenhum).'
            )
          }
          if (
            !parsed.custos.length &&
            !parsed.receita.length &&
            !parsed.margem.length
          ) {
            throw new Error(
              'Nenhuma linha com id (coluna A) foi encontrada. Use o modelo exportado pelo portal.'
            )
          }
          await this.preencherGridParaPlanilha()
          this.aplicarValoresImportadosNaGrid(parsed)
          this.$emit(
            'notification',
            'Planilha no formato antigo: valores na grade só para conferência. Para gravar no banco, use o modelo anual (12 meses) e «Gravar os 12 meses no banco».',
            'success'
          )
        }
      } catch (e) {
        console.error(e)
        this.$emit(
          'notification',
          e.message || 'Erro ao ler ou importar a planilha.',
          'error'
        )
      } finally {
        this.importando = false
      }
    },
    setCellMoeda(cell, valor) {
      const n =
        valor === null || valor === undefined || !Number.isFinite(Number(valor))
          ? 0
          : Number(valor)
      cell.value = n
      cell.numFmt = '#,##0.00'
      cell.alignment = { horizontal: 'right' }
    },
    setCellPercent(cell, valorPt) {
      const n =
        valorPt === null ||
        valorPt === undefined ||
        !Number.isFinite(Number(valorPt))
          ? 0
          : Number(valorPt)
      cell.value = n / 100
      cell.numFmt = '0.0%'
      cell.alignment = { horizontal: 'right' }
    },
    valorItemMesAno(lista, id, mes, dadosAno) {
      if (!dadosAno || !Array.isArray(lista)) return null
      const it = lista.find(x => Number(x.id) === Number(id))
      if (!it || !it.valores_mes) return null
      const raw = it.valores_mes[mes]
      if (raw === undefined || raw === null || raw === '') return null
      const n = Number(raw)
      return Number.isFinite(n) ? n : null
    },
    async gerarExcel() {
      this.gerandoExcel = true
      try {
        const { fonte } = await this.preencherGridParaPlanilha()
        if (!this.editCustos.length) {
          this.$emit(
            'notification',
            'Não foi possível montar as linhas da planilha.',
            'error'
          )
          return
        }
        if (fonte === 'local') {
          this.$emit(
            'notification',
            'Modelo gerado com catálogo local. Para gravar no banco, atualize o servidor (rota /api/levantamento-custos-operacionais) e execute o script SQL.',
            'warning'
          )
        }

        let dadosAno = null
        try {
          const d = await apiService.get(
            '/levantamento-custos-operacionais/periodo-ano',
            {
              ano: this.ano,
              codigo_estabelecimento: this.codigoEstabelecimentoApi,
            }
          )
          if (d && d.success) dadosAno = d
        } catch (_) {
          /* API indisponível — modelo em branco exceto mês atual na grade */
        }

        const wb = new ExcelJS.Workbook()
        wb.creator = 'Portal Mercocamp'
        const ws = wb.addWorksheet('Levantamento', {
          properties: { defaultRowHeight: 18 },
          views: [{ showGridLines: true }],
        })
        ws.columns = [
          { width: 6 },
          { width: 36 },
          ...Array.from({ length: 12 }, () => ({ width: 14 })),
        ]

        const anoPlan = this.ano
        const preencherCabecalhoMensal = (
          rowNum,
          tituloSecao,
          fill,
          fontExtra
        ) => {
          const rr = ws.getRow(rowNum)
          rr.getCell(2).value = tituloSecao
          for (let mes = 1; mes <= 12; mes++) {
            rr.getCell(2 + mes).value = labelMesAnoColunaExcel(anoPlan, mes)
          }
          rr.font = { bold: true, ...(fontExtra || {}) }
          for (let c = 2; c <= 14; c++) {
            rr.getCell(c).fill = fill
          }
        }

        let r = 1
        ws.getCell(r, 2).value = 'ESTABELECIMENTO'
        ws.getCell(r, 3).value = textoExibicaoEstabelecimentoNaPlanilha(
          this.codigoEstabelecimentoApi
        )
        ws.getRow(r).font = { bold: true }
        r++

        preencherCabecalhoMensal(r, 'Custos', ORANGE, {
          color: { argb: 'FFFFFFFF' },
        })
        r++

        for (const row of this.editCustos) {
          ws.getCell(r, 1).value = row.id
          ws.getCell(r, 2).value = row.titulo
          for (let mes = 1; mes <= 12; mes++) {
            const col = 2 + mes
            let v = this.valorItemMesAno(
              dadosAno ? dadosAno.custos : [],
              row.id,
              mes,
              dadosAno
            )
            if (
              v == null &&
              !dadosAno &&
              this.mesSelecionadoParaGrade &&
              mes === this.mes
            ) {
              v = parseValorInput(row.valorInput, false)
            }
            this.setCellMoeda(ws.getCell(r, col), v)
            if (row.destaque) {
              ws.getCell(r, 2).fill = GREEN
              ws.getCell(r, col).fill = GREEN
            }
          }
          r++
        }

        r++
        preencherCabecalhoMensal(r, 'Receita', BLUE, {})
        r++

        for (const row of this.editReceita) {
          ws.getCell(r, 1).value = row.id
          ws.getCell(r, 2).value = row.titulo
          for (let mes = 1; mes <= 12; mes++) {
            const col = 2 + mes
            let v = this.valorItemMesAno(
              dadosAno ? dadosAno.receita : [],
              row.id,
              mes,
              dadosAno
            )
            if (
              v == null &&
              !dadosAno &&
              this.mesSelecionadoParaGrade &&
              mes === this.mes
            ) {
              v = parseValorInput(row.valorInput, false)
            }
            this.setCellMoeda(ws.getCell(r, col), v)
          }
          r++
        }

        r++
        preencherCabecalhoMensal(r, 'Margem', ORANGE, {
          color: { argb: 'FFFFFFFF' },
        })
        r++

        for (const row of this.editMargem) {
          ws.getCell(r, 1).value = row.id
          ws.getCell(r, 2).value = row.titulo
          const isPct = row.tipo_valor === 'percentual'
          for (let mes = 1; mes <= 12; mes++) {
            const col = 2 + mes
            let v = this.valorItemMesAno(
              dadosAno ? dadosAno.margem : [],
              row.id,
              mes,
              dadosAno
            )
            if (
              v == null &&
              !dadosAno &&
              this.mesSelecionadoParaGrade &&
              mes === this.mes
            ) {
              v = parseValorInput(row.valorInput, isPct)
            }
            if (isPct) {
              this.setCellPercent(ws.getCell(r, col), v)
            } else {
              this.setCellMoeda(ws.getCell(r, col), v)
            }
            if (isPct) {
              ws.getCell(r, 2).fill = GREY
              ws.getCell(r, col).fill = GREY
            }
          }
          r++
        }

        const buffer = await wb.xlsx.writeBuffer()
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        const safeEst = String(this.codigoEstabelecimentoApi).replace(
          /[/\\?%*:|"<>]/g,
          '-'
        )
        link.download = `Levantamento_custos_operacionais_${safeEst}_${this.ano}.xlsx`
        link.click()
        window.URL.revokeObjectURL(url)
        this.$emit('notification', 'Planilha gerada (12 meses).', 'success')
      } catch (e) {
        console.error(e)
        this.$emit('notification', 'Erro ao gerar Excel.', 'error')
      } finally {
        this.gerandoExcel = false
      }
    },
    async gerarExcelModeloDedicadosCorpem() {
      this.ensureDedicadosFaturasRows()
      this.gerandoExcelDedicados = true
      try {
        const wb = new ExcelJS.Workbook()
        wb.creator = 'Portal Mercocamp'
        const ws = wb.addWorksheet('Faturas dedicados', {
          properties: { defaultRowHeight: 18 },
        })
        ws.columns = [
          { width: 14 },
          { width: 18 },
          { width: 8 },
          { width: 8 },
          { width: 20 },
          { width: 26 },
        ]
        const headers = [
          'Código Corpem',
          'Fatura cliente (R$)',
          'Mês',
          'Ano',
          'Qtd func. dedicados',
          'Custo func. dedicado (R$)',
        ]
        const hr = ws.getRow(1)
        headers.forEach((text, i) => {
          const cell = hr.getCell(i + 1)
          cell.value = text
          cell.font = { bold: true, color: { argb: 'FF1E293B' } }
          cell.fill = BLUE
          cell.alignment = { vertical: 'middle', wrapText: true }
        })
        hr.height = 22
        const grid = this.dedicadosFaturasRows
        const totalLinhas = Math.min(2000, Math.max(100, grid.length + 20))
        for (let i = 0; i < totalLinhas; i++) {
          const r = ws.getRow(i + 2)
          const row = grid[i]
          if (row) {
            r.getCell(1).value = row.codigoCorpem || null
            const fatN = minorDigitsToReaisNumber(row.faturaDigits)
            if (fatN != null && Number.isFinite(fatN)) {
              r.getCell(2).value = fatN
              r.getCell(2).numFmt = '#,##0.00'
            }
            if (row.refMes !== '' && row.refMes != null) {
              const m = parseInt(String(row.refMes).trim(), 10)
              if (Number.isFinite(m)) r.getCell(3).value = m
            }
            if (row.refAno !== '' && row.refAno != null) {
              const y = parseInt(String(row.refAno).trim(), 10)
              if (Number.isFinite(y)) r.getCell(4).value = y
            }
            if (row.qtd !== '' && row.qtd != null) {
              const q = parseInt(String(row.qtd).trim(), 10)
              if (Number.isFinite(q)) r.getCell(5).value = q
            }
            const custoN = minorDigitsToReaisNumber(row.custoDigits)
            if (custoN != null && Number.isFinite(custoN)) {
              r.getCell(6).value = custoN
              r.getCell(6).numFmt = '#,##0.00'
            }
          }
          r.getCell(3).numFmt = '0'
          r.getCell(4).numFmt = '0'
          r.getCell(5).numFmt = '0'
          r.getCell(6).numFmt = '#,##0.00'
          for (let c = 1; c <= 6; c++) {
            r.getCell(c).alignment = {
              horizontal: c >= 3 ? 'right' : 'left',
              vertical: 'middle',
            }
          }
        }
        ws.views = [{ state: 'frozen', ySplit: 1, showGridLines: true }]
        const buffer = await wb.xlsx.writeBuffer()
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        const safeEst = String(this.codigoEstabelecimentoApi).replace(
          /[/\\?%*:|"<>]/g,
          '-'
        )
        link.download = `Modelo_faturas_dedicados_${safeEst}_${this.ano}.xlsx`
        link.click()
        window.URL.revokeObjectURL(url)
        this.$emit(
          'notification',
          'Modelo faturas e dedicados gerado (várias linhas).',
          'success'
        )
      } catch (e) {
        console.error(e)
        this.$emit(
          'notification',
          'Erro ao gerar modelo faturas/dedicados.',
          'error'
        )
      } finally {
        this.gerandoExcelDedicados = false
      }
    },
    async carregarDedicadosCorpemDaApi() {
      this.carregandoDedicadosCorpem = true
      this.erroDedicadosCorpem = ''
      this.dedicadosCorpemSemTabela = false
      try {
        const data = await apiService.get(
          '/levantamento-custos-operacionais/dedicados-corpem',
          {
            ano: this.ano,
            codigo_estabelecimento: this.codigoEstabelecimentoApi,
          }
        )
        if (!data.success) {
          throw new Error(
            data.error || 'Falha ao carregar faturas e dedicados.'
          )
        }
        this.dedicadosCorpemSemTabela = Boolean(data.sem_tabela)
        const linhasApi = data.linhas || []
        this.dedicadosFaturasRows = linhasApi.map(r => {
          const row = novaLinhaDedicadosFatura()
          row.codigoCorpem =
            r.codigo_corpem != null ? String(r.codigo_corpem).slice(0, 5) : ''
          row.faturaDigits =
            r.fatura_cliente != null
              ? reaisNumberToMinorDigitsStr(r.fatura_cliente)
              : ''
          row.refMes =
            r.ref_mes != null && Number.isFinite(Number(r.ref_mes))
              ? Number(r.ref_mes)
              : ''
          row.refAno =
            r.ref_ano != null && Number.isFinite(Number(r.ref_ano))
              ? Number(r.ref_ano)
              : ''
          row.qtd =
            r.funcionarios_dedicados != null &&
            Number.isFinite(Number(r.funcionarios_dedicados))
              ? String(r.funcionarios_dedicados)
              : ''
          row.custoDigits =
            r.custo_funcionario_dedicado != null
              ? reaisNumberToMinorDigitsStr(r.custo_funcionario_dedicado)
              : ''
          return row
        })
        if (this.dedicadosFaturasRows.length === 0) {
          this.ensureDedicadosFaturasRows()
        } else {
          this.adicionarLinhasDedicadosFaturas(15)
        }
        this.$emit(
          'notification',
          'Faturas e funcionários dedicados carregados.',
          'success'
        )
      } catch (e) {
        console.error(e)
        const msg =
          e.message || 'Erro ao carregar. Verifique a API e o script SQL.'
        this.erroDedicadosCorpem =
          /rota não encontrada/i.test(msg) || /not found/i.test(msg)
            ? `${msg} — Reinicie o backend ou faça deploy com a rota dedicados-corpem.`
            : msg
      } finally {
        this.carregandoDedicadosCorpem = false
      }
    },
    async gravarDedicadosFaturas() {
      this.ensureDedicadosFaturasRows()
      this.gravandoDedicadosCorpem = true
      this.erroDedicadosCorpem = ''
      try {
        const data = await apiService.post(
          '/levantamento-custos-operacionais/dedicados-corpem',
          {
            ano: this.ano,
            codigo_estabelecimento: this.codigoEstabelecimentoApi,
            linhas: this.dedicadosFaturasRows.map(r => ({
              ref_mes: r.refMes,
              ref_ano: r.refAno,
              codigo_corpem: r.codigoCorpem,
              fatura_cliente: r.faturaDigits
                ? formatMoedaCampo(
                    minorDigitsToReaisNumber(r.faturaDigits) ?? 0
                  )
                : '',
              funcionarios_dedicados: r.qtd,
              custo_funcionario_dedicado: r.custoDigits
                ? formatMoedaCampo(
                    minorDigitsToReaisNumber(r.custoDigits) ?? 0
                  )
                : '',
            })),
          }
        )
        if (!data.success) {
          throw new Error(
            data.error || 'Falha ao gravar faturas e dedicados.'
          )
        }
        this.$emit(
          'notification',
          data.message || 'Dados gravados.',
          'success'
        )
      } catch (e) {
        console.error(e)
        const msg = e.message || 'Erro ao gravar.'
        this.erroDedicadosCorpem =
          /rota não encontrada/i.test(msg) || /not found/i.test(msg)
            ? `${msg} — Reinicie o backend (schedule-back-end) para carregar a rota.`
            : msg
      } finally {
        this.gravandoDedicadosCorpem = false
      }
    },
    async onArquivoDedicadosCorpemEscolhido(event) {
      const input = event.target
      const file = input.files && input.files[0]
      if (input) input.value = ''
      if (!file) return
      this.importandoDedicadosPlanilha = true
      this.erroDedicadosCorpem = ''
      try {
        const buffer = await file.arrayBuffer()
        const wb = new ExcelJS.Workbook()
        await wb.xlsx.load(buffer)
        const parsed = extrairGradeFaturasDedicadasDoWorkbook(wb, this.ano)
        this.dedicadosFaturasRows = parsed.map(p => {
          const row = novaLinhaDedicadosFatura()
          row.codigoCorpem = (p.codigo_corpem || '').slice(0, 5)
          row.faturaDigits =
            p.fatura_cliente != null && Number.isFinite(p.fatura_cliente)
              ? reaisNumberToMinorDigitsStr(p.fatura_cliente)
              : ''
          row.refMes =
            p.ref_mes != null && Number.isFinite(Number(p.ref_mes))
              ? Number(p.ref_mes)
              : ''
          row.refAno =
            p.ref_ano != null && Number.isFinite(Number(p.ref_ano))
              ? Number(p.ref_ano)
              : ''
          row.qtd =
            p.funcionarios_dedicados != null &&
            Number.isFinite(p.funcionarios_dedicados)
              ? String(p.funcionarios_dedicados)
              : ''
          row.custoDigits =
            p.custo_funcionario_dedicado != null &&
            Number.isFinite(p.custo_funcionario_dedicado)
              ? reaisNumberToMinorDigitsStr(p.custo_funcionario_dedicado)
              : ''
          return row
        })
        this.adicionarLinhasDedicadosFaturas(25)
        this.$emit(
          'notification',
          'Planilha lida: valores na grade. Confira e use «Gravar no banco».',
          'success'
        )
      } catch (e) {
        console.error(e)
        this.erroDedicadosCorpem =
          e.message || 'Erro ao ler a planilha.'
        this.$emit('notification', this.erroDedicadosCorpem, 'error')
      } finally {
        this.importandoDedicadosPlanilha = false
      }
    },
  },
}
</script>

<style scoped>
.lev-custos-page {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 1.5rem clamp(0.75rem, 2vw, 1.5rem);
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
}
.lev-custos-page > .alert-import-pending {
  align-self: flex-start;
  width: 100%;
  max-width: min(100%, 72rem);
  box-sizing: border-box;
}
.lev-custos-page > .toolbar.content-card {
  align-self: flex-start;
  width: auto;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
}
.lev-custos-page > .toolbar.content-card .toolbar-row .field-grow {
  flex: 0 1 16rem;
  max-width: 20rem;
  min-width: 140px;
}
.lev-custos-page > .toolbar.content-card .toolbar-actions {
  flex-wrap: nowrap;
}
.page-header {
  margin-bottom: 1.25rem;
}
.header-title h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.page-description {
  margin: 0;
  color: #64748b;
  font-size: 0.95rem;
}
.dedicados-corpem-section h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #334155;
}
.dedicados-corpem-actions {
  flex-wrap: wrap;
}
.dedicados-sem-tabela {
  margin-top: 0.75rem;
  color: #b45309;
}
.dedicados-faturas-table-wrap {
  margin-top: 1rem;
  overflow-x: auto;
  max-height: min(70vh, 36rem);
  overflow-y: auto;
}
.dedicados-faturas-table {
  min-width: 52rem;
}
.dedicados-faturas-table .dedicados-input-text {
  min-width: 6.5rem;
  width: 100%;
  max-width: 14rem;
}
.dedicados-faturas-table .input-qtd {
  max-width: 7rem;
}
.dedicados-faturas-table .dedicados-corpem-5 {
  max-width: 5.5rem;
  min-width: 4rem;
}
.dedicados-faturas-table .col-mes-num,
.dedicados-faturas-table .col-ano {
  width: 1%;
  white-space: nowrap;
}
.dedicados-faturas-table .input-mes-ano {
  max-width: 5.5rem;
  min-width: 4rem;
}
.content-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}
.toolbar-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: flex-end;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: #475569;
}
.field-grow {
  flex: 1;
  min-width: 140px;
}
.input-control {
  padding: 0.5rem 0.65rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.95rem;
}
.toolbar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
}
.btn-primary {
  background: #0ea5e9;
  color: #fff;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-secondary {
  background: #e2e8f0;
  color: #334155;
}
.btn-outline {
  background: #fff;
  border: 1px solid #cbd5e1;
  color: #334155;
}
.btn-import {
  background: #16a34a;
  color: #fff;
}
.btn-import:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.grids h3 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  color: #334155;
}
.table-wrap {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}
.data-table th,
.data-table td {
  border: 1px solid #e2e8f0;
  padding: 0.4rem 0.5rem;
  text-align: left;
}
.data-table th {
  background: #f8fafc;
}
.col-id {
  width: 3rem;
  text-align: center;
}
.col-valor {
  width: 10rem;
}
.input-cell {
  width: 100%;
  box-sizing: border-box;
  padding: 0.35rem 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
}
.input-moeda,
.input-pct {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
tr.destaque td {
  background: #ecfccb;
}
tr.row-margem-pct td {
  background: #f0fdf4;
}
.hint {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 0.75rem 0;
}
.totais ul {
  margin: 0;
  padding-left: 1.2rem;
  color: #334155;
}
.alert-error {
  color: #b91c1c;
  font-size: 0.9rem;
}
.grade-revisao-anual-wrap {
  padding-left: clamp(0.5rem, 1.2vw, 1rem);
  padding-right: clamp(0.5rem, 1.2vw, 1rem);
}
.grade-revisao-anual-wrap h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.15rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #334155;
}
.subsecao-revisao {
  margin: 1.25rem 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #475569;
}
.subsecao-revisao:first-of-type {
  margin-top: 0.75rem;
}
.table-revisao-scroll {
  overflow-x: visible;
  max-width: 100%;
  margin-bottom: 0.35rem;
}
.table-revisao-12mes {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  table-layout: fixed;
  font-size: clamp(0.62rem, 0.5vw + 0.55rem, 0.78rem);
  border-collapse: collapse;
}
.table-revisao-12mes th,
.table-revisao-12mes td {
  padding: 0.2rem 0.12rem;
  vertical-align: middle;
}
.table-revisao-12mes col.col-rev-id {
  width: 2.5%;
}
.table-revisao-12mes col.col-rev-desc {
  width: 11%;
}
.table-revisao-12mes col.col-rev-mes {
  width: 7.2083%;
}
.table-revisao-12mes .col-desc-revisao {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 0;
}
.table-revisao-12mes .col-mes-revisao {
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.table-revisao-12mes thead th.col-mes-revisao {
  line-height: 1.15;
  white-space: normal;
  word-break: break-word;
  hyphens: auto;
}
.celula-revisao {
  font-variant-numeric: tabular-nums;
}
@media (max-width: 900px) {
  .table-revisao-scroll {
    overflow-x: auto;
  }
  .table-revisao-12mes {
    min-width: 52rem;
  }
}
.alert-import-pending {
  border: 1px solid #fbbf24;
  background: #fffbeb;
  color: #78350f;
}
.alert-import-pending p {
  margin: 0;
  font-size: 0.92rem;
}
.alert-import-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
.empty-hint {
  color: #64748b;
}
.catalogo-custos-section h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #334155;
}
.novo-custo-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 1rem;
}
.novo-custo-toolbar .input-ordem {
  max-width: 8rem;
}
.novo-custo-actions {
  display: flex;
  align-items: flex-end;
}
.catalogo-loading {
  color: #64748b;
  font-size: 0.9rem;
}
.catalogo-readonly {
  display: inline-block;
  padding: 0.35rem 0;
  color: #334155;
}
.catalogo-locked-hint {
  font-size: 0.8rem;
  color: #94a3b8;
}
.catalogo-table .col-tipo {
  width: 10rem;
}
.catalogo-table .input-tipo {
  width: 100%;
  padding: 0.35rem 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 0.9rem;
  background: #fff;
}
.catalogo-table .col-ordem {
  width: 6.5rem;
  text-align: center;
}
.catalogo-table .col-acoes {
  width: 11rem;
  white-space: nowrap;
}
.catalogo-table .col-acoes .btn-sm {
  margin-right: 0.35rem;
}
.btn-sm {
  padding: 0.35rem 0.65rem;
  font-size: 0.8rem;
}
.btn-danger-outline {
  background: #fff;
  border: 1px solid #dc2626;
  color: #b91c1c;
}
.btn-danger-outline:disabled {
  opacity: 0.5;
}
.quadro-func-section {
  margin-top: 0.5rem;
}
.quadro-func-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.quadro-func-table .col-mes {
  white-space: nowrap;
  font-weight: 600;
}
.quadro-func-table .input-qtd {
  max-width: 7rem;
}
</style>
