<template>
  <div class="lev-valores-admin-page">
    <div class="page-header">
      <h2>
        <i class="fas fa-table"></i>
        Valores levantamento (custos / receita / margem / funcionários)
      </h2>
      <p class="page-hint">
        Visualização e edição direta de
        <code>lev_custo_valor</code>, <code>lev_receita_valor</code>,
        <code>lev_margem_valor</code> e
        <code>lev_operacao_funcionario</code> (quadro de funcionários). Em
        <strong>Estabelecimento</strong>, «Todos os estabelecimentos» lista
        <strong>ML-A</strong>, <strong>ML-B</strong>, <strong>ML</strong> e
        demais códigos gravados naquele ano. O filtro <strong>Mês</strong>
        (quando não é «Todos») restringe por <code>ref_mes</code>.
      </p>
    </div>

    <div class="content-card filtros-card">
      <div class="filtros-row">
        <label class="filtro">
          <span>Tipo</span>
          <select v-model="dominio" class="input-control" @change="onDominioChange">
            <option value="receita">Receita</option>
            <option value="custo">Custos</option>
            <option value="margem">Margem</option>
            <option value="funcionarios">Funcionários (operacional)</option>
          </select>
        </label>
        <label class="filtro">
          <span>Ano</span>
          <select v-model.number="ano" class="input-control">
            <option v-for="a in anosSelect" :key="a" :value="a">{{ a }}</option>
          </select>
        </label>
        <label class="filtro">
          <span>Mês</span>
          <select v-model.number="mesFiltro" class="input-control">
            <option
              v-for="opt in mesFiltroOpcoes"
              :key="'mf-' + opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </label>
        <label class="filtro">
          <span>Estabelecimento</span>
          <select v-model="codigoEstabelecimentoSelect" class="input-control">
            <option value="ALL">Todos os estabelecimentos</option>
            <option value="ML-A">ML-A — Matriz Bloco A</option>
            <option value="ML-B">ML-B — Matriz Bloco B</option>
            <option value="ML">ML (único / legado)</option>
            <option value="OTHER">Outro (digitar)</option>
          </select>
        </label>
        <label v-if="codigoEstabelecimentoSelect === 'OTHER'" class="filtro filtro-grow">
          <span>Código</span>
          <input
            v-model.trim="codigoEstabelecimentoOutro"
            type="text"
            class="input-control"
            maxlength="32"
            placeholder="Ex.: ML-A"
          />
        </label>
        <div class="filtro-actions">
          <button
            type="button"
            class="btn btn-secondary"
            :disabled="carregando || ano < 2000"
            @click="carregar"
          >
            <i :class="carregando ? 'fas fa-spinner fa-spin' : 'fas fa-sync-alt'"></i>
            Carregar
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="gravando || !linhas.length || !temAlteracoes"
            @click="salvar"
          >
            <i :class="gravando ? 'fas fa-spinner fa-spin' : 'fas fa-save'"></i>
            Salvar alterações
          </button>
        </div>
      </div>
      <p v-if="erro" class="alert alert-error">{{ erro }}</p>
    </div>

    <div v-if="linhas.length" class="content-card">
      <div class="table-meta">
        <span>{{ linhas.length }} linha(s)</span>
        <span v-if="temAlteracoes" class="badge-alterado">Alterações não salvas</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-id">Id</th>
              <th v-if="!isFuncionarios">Item</th>
              <th>Mês</th>
              <th>Ano</th>
              <th>Estab.</th>
              <th v-if="dominio === 'margem'">Tipo</th>
              <template v-if="isFuncionarios">
                <th>Qtd. funcionários</th>
                <th>Custo unit. (R$)</th>
              </template>
              <th v-else class="col-valor">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in linhas" :key="row.id" :class="{ 'row-dirty': row._dirty }">
              <td class="col-id"><code>{{ row.id }}</code></td>
              <td v-if="!isFuncionarios">{{ row.item_titulo || '—' }}</td>
              <td>{{ labelMes(row.ref_mes) }}</td>
              <td>{{ row.ref_ano }}</td>
              <td><code>{{ row.codigo_estabelecimento }}</code></td>
              <td v-if="dominio === 'margem'">
                {{ row.tipo_valor === 'percentual' ? '%' : 'R$' }}
              </td>
              <template v-if="isFuncionarios">
                <td>
                  <input
                    v-model="row.qtdEdit"
                    type="text"
                    class="input-cell input-qtd"
                    inputmode="numeric"
                    placeholder="—"
                    @input="marcarDirty(row)"
                  />
                </td>
                <td>
                  <input
                    v-model="row.custoUnitEdit"
                    type="text"
                    class="input-cell"
                    placeholder="Ex.: 5.000,00"
                    @input="marcarDirty(row)"
                  />
                </td>
              </template>
              <td v-else class="col-valor">
                <input
                  v-model="row.valorEdit"
                  type="text"
                  class="input-cell"
                  :placeholder="row.tipo_valor === 'percentual' ? 'Ex.: 12,5' : 'Ex.: 1.234,56'"
                  @input="marcarDirty(row)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="jaCarregou && !carregando" class="content-card empty-hint">
      <p>Nenhuma linha para os filtros atuais.</p>
    </div>
  </div>
</template>

<script>
import apiService from '../services/api.js'

const MESES_NOME = [
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

function fmtValorExibicao(v, tipoValor) {
  if (v === null || v === undefined || v === '') return ''
  const n = Number(v)
  if (!Number.isFinite(n)) return ''
  if (tipoValor === 'percentual') {
    return n.toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 4,
    })
  }
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function fmtQtdExibicao(v) {
  if (v === null || v === undefined || v === '') return ''
  const n = parseInt(String(v).trim(), 10)
  if (!Number.isFinite(n) || n < 0) return ''
  return String(n)
}

function normCmp(s) {
  return String(s ?? '')
    .replace(/\u00a0/g, ' ')
    .trim()
}

export default {
  name: 'LevantamentoValoresAdminPage',
  data() {
    const y = new Date().getFullYear()
    const anos = []
    for (let a = y - 5; a <= y + 2; a++) anos.push(a)
    return {
      dominio: 'receita',
      ano: y,
      anosSelect: anos,
      codigoEstabelecimentoSelect: 'ML-A',
      codigoEstabelecimentoOutro: '',
      linhas: [],
      baseline: {},
      carregando: false,
      gravando: false,
      erro: '',
      jaCarregou: false,
      mesFiltro: 0,
    }
  },
  computed: {
    isFuncionarios() {
      return this.dominio === 'funcionarios'
    },
    mesFiltroOpcoes() {
      const opts = [{ value: 0, label: 'Todos' }]
      for (let m = 1; m <= 12; m++) {
        opts.push({
          value: m,
          label: `${MESES_NOME[m - 1]} (${m})`,
        })
      }
      return opts
    },
    codigoEstabelecimentoApi() {
      if (this.codigoEstabelecimentoSelect === 'ALL') {
        return ''
      }
      if (this.codigoEstabelecimentoSelect === 'OTHER') {
        const o = (this.codigoEstabelecimentoOutro || '').trim().slice(0, 32)
        return o || 'ML'
      }
      return this.codigoEstabelecimentoSelect
    },
    temAlteracoes() {
      return this.linhas.some(r => r._dirty)
    },
  },
  methods: {
    labelMes(m) {
      const n = Number(m)
      if (n >= 1 && n <= 12) return `${MESES_NOME[n - 1]} (${n})`
      return m != null ? String(m) : '—'
    },
    onDominioChange() {
      this.linhas = []
      this.baseline = {}
      this.jaCarregou = false
      this.erro = ''
    },
    marcarDirty(row) {
      if (this.dominio === 'funcionarios') {
        let b = { q: '', u: '' }
        try {
          const raw = this.baseline[row.id]
          if (raw && typeof raw === 'string' && raw.startsWith('{')) {
            b = JSON.parse(raw)
          }
        } catch (_) {
          b = { q: '', u: '' }
        }
        row._dirty =
          normCmp(row.qtdEdit) !== normCmp(b.q) ||
          normCmp(row.custoUnitEdit) !== normCmp(b.u)
        return
      }
      const base = normCmp(this.baseline[row.id])
      const cur = normCmp(row.valorEdit)
      row._dirty = cur !== base
    },
    async carregar() {
      this.carregando = true
      this.erro = ''
      try {
        const params = {
          dominio: this.dominio,
          ano: this.ano,
        }
        if (this.codigoEstabelecimentoSelect === 'ALL') {
          params.todos_estabelecimentos = '1'
        } else {
          params.codigo_estabelecimento = this.codigoEstabelecimentoApi
        }
        if (this.mesFiltro >= 1 && this.mesFiltro <= 12) {
          params.mes = this.mesFiltro
        }
        const data = await apiService.get(
          '/levantamento-custos-operacionais/admin/valor-linhas',
          params
        )
        if (!data.success) {
          throw new Error(data.error || 'Falha ao carregar.')
        }
        const raw = Array.isArray(data.linhas) ? data.linhas : []
        const base = {}
        if (this.dominio === 'funcionarios') {
          this.linhas = raw.map(r => {
            const id = Number(r.id)
            const qtdStr = fmtQtdExibicao(r.qtd_funcionarios)
            const custoStr = fmtValorExibicao(r.custo_unitario_funcionario, null)
            base[id] = JSON.stringify({
              q: normCmp(qtdStr),
              u: normCmp(custoStr),
            })
            return {
              id,
              item_id: r.item_id,
              item_titulo: r.item_titulo,
              ref_mes: r.ref_mes,
              ref_ano: r.ref_ano,
              codigo_estabelecimento: r.codigo_estabelecimento,
              tipo_valor: r.tipo_valor,
              valorEdit: '',
              qtdEdit: qtdStr,
              custoUnitEdit: custoStr,
              _dirty: false,
            }
          })
        } else {
          this.linhas = raw.map(r => {
            const id = Number(r.id)
            const tipo =
              this.dominio === 'margem' && String(r.tipo_valor) === 'percentual'
                ? 'percentual'
                : null
            const exib = fmtValorExibicao(r.valor, tipo)
            base[id] = exib
            return {
              id,
              item_id: r.item_id,
              item_titulo: r.item_titulo,
              ref_mes: r.ref_mes,
              ref_ano: r.ref_ano,
              codigo_estabelecimento: r.codigo_estabelecimento,
              tipo_valor: r.tipo_valor,
              valorEdit: exib,
              qtdEdit: '',
              custoUnitEdit: '',
              _dirty: false,
            }
          })
        }
        this.baseline = base
        this.jaCarregou = true
        this.$emit(
          'notification',
          `${this.linhas.length} linha(s) carregada(s).`,
          'success'
        )
      } catch (e) {
        console.error(e)
        this.erro = e.message || 'Erro ao carregar.'
        this.linhas = []
        this.baseline = {}
        this.$emit('notification', this.erro, 'error')
      } finally {
        this.carregando = false
      }
    },
    async salvar() {
      const atualizacoes = []
      for (const row of this.linhas) {
        if (!row._dirty) continue
        if (this.dominio === 'funcionarios') {
          atualizacoes.push({
            id: row.id,
            qtd_funcionarios: row.qtdEdit,
            custo_unitario_funcionario: row.custoUnitEdit,
          })
        } else {
          atualizacoes.push({ id: row.id, valor: row.valorEdit })
        }
      }
      if (!atualizacoes.length) {
        this.$emit('notification', 'Nada para salvar.', 'info')
        return
      }
      this.gravando = true
      this.erro = ''
      try {
        const data = await apiService.put(
          '/levantamento-custos-operacionais/admin/valor-linhas',
          {
            dominio: this.dominio,
            atualizacoes,
          }
        )
        if (!data.success) {
          throw new Error(data.error || 'Falha ao gravar.')
        }
        for (const row of this.linhas) {
          if (row._dirty) {
            if (this.dominio === 'funcionarios') {
              this.baseline[row.id] = JSON.stringify({
                q: normCmp(row.qtdEdit),
                u: normCmp(row.custoUnitEdit),
              })
            } else {
              this.baseline[row.id] = normCmp(row.valorEdit)
            }
            row._dirty = false
          }
        }
        this.$emit(
          'notification',
          data.message || 'Valores gravados.',
          'success'
        )
      } catch (e) {
        console.error(e)
        this.erro = e.message || 'Erro ao gravar.'
        this.$emit('notification', this.erro, 'error')
      } finally {
        this.gravando = false
      }
    },
  },
}
</script>

<style scoped>
.lev-valores-admin-page {
  padding: 1rem 1.25rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header h2 {
  margin: 0 0 0.5rem;
  font-size: 1.35rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-hint {
  margin: 0;
  color: #5a6570;
  font-size: 0.9rem;
  line-height: 1.45;
}

.content-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  padding: 1rem 1.25rem;
  margin-top: 1rem;
}

.filtros-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem;
}

.filtro {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 140px;
}

.filtro-grow {
  flex: 1;
  min-width: 180px;
}

.filtro span {
  font-size: 0.8rem;
  font-weight: 600;
  color: #495057;
}

.input-control {
  padding: 0.45rem 0.6rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 0.9rem;
}

.filtro-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-left: auto;
}

.table-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  color: #495057;
}

.badge-alterado {
  background: #fff3cd;
  color: #856404;
  padding: 0.2rem 0.55rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.table-wrap {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.data-table th,
.data-table td {
  border: 1px solid #dee2e6;
  padding: 0.45rem 0.55rem;
  text-align: left;
}

.data-table th {
  background: #f1f3f5;
  font-weight: 600;
}

.col-id {
  width: 72px;
}

.col-valor {
  min-width: 160px;
}

.input-cell {
  width: 100%;
  max-width: 220px;
  padding: 0.35rem 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
}

.input-qtd {
  max-width: 120px;
}

.row-dirty {
  background: #fffbeb;
}

.alert-error {
  margin: 0.75rem 0 0;
  color: #842029;
  font-size: 0.9rem;
}

.empty-hint {
  color: #6c757d;
  font-size: 0.95rem;
}
</style>
