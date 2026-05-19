<template>
  <div
    class="config-pedidos config-pedidos-wrapper"
    style="min-height: 400px; background: #f1f5f9"
  >
    <div class="tab-panel-header">
      <h3><i class="fa fa-clock-o"></i> Config. Pedidos (Atrasados)</h3>
    </div>
    <!-- Fallback visível: se este texto aparecer, o componente está renderizando -->

    <div
      v-if="config === null"
      class="config-carregando"
      style="
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      "
    >
      <i class="fa fa-spinner fa-spin"></i> Carregando configurações...
    </div>
    <div
      v-else-if="config && Object.keys(config).length === 0"
      class="config-carregando"
    >
      <i class="fa fa-exclamation-circle"></i> Erro ao carregar. Verifique o
      console (F12).
    </div>
    <div v-else class="painel-configuracoes-card painel-pedidos-wide">
      <h4><i class="fa fa-bell"></i> Envio automático de pedidos atrasados</h4>
      <p class="config-descricao">
        Configure o envio automático de WhatsApp com resumo e lista de pedidos
        com expedição fora do prazo, separados por admin responsável.
      </p>

      <div class="config-form">
        <div class="config-group">
          <label class="config-check-label">
            <input type="checkbox" v-model="config.ativo" />
            <span>Ativar envio automático</span>
          </label>
        </div>

        <div class="config-section">
          <h5>
            <i class="fa fa-calendar"></i> Pedidos atrasados – intervalo e
            janela
          </h5>
          <p class="config-descricao">
            Intervalo de execução e janela de envio para
            <strong>pedidos atrasados</strong> (e pedidos que saíram do atraso).
            O sistema verifica a cada 15 min; o envio só ocorre quando o
            intervalo tiver passado e a hora atual estiver na janela.
          </p>
          <div class="config-group">
            <label>Intervalo (horas)</label>
            <input
              type="number"
              v-model.number="config.intervalo_horas"
              min="1"
              max="24"
              step="1"
              class="config-input config-input-small"
            />
            <small class="config-small"
              >De quantas em quantas horas pode enviar (ex.: 2 = no máximo a
              cada 2h).</small
            >
          </div>
          <div class="config-row-horario">
            <div class="config-group">
              <label>Hora de início (0-23)</label>
              <input
                type="number"
                v-model.number="config.enviar_horario_inicio"
                min="0"
                max="23"
                step="1"
                placeholder="Ex: 7"
                class="config-input config-input-small"
              />
            </div>
            <div class="config-group">
              <label>Hora de fim (0-23)</label>
              <input
                type="number"
                v-model.number="config.enviar_horario_fim"
                min="0"
                max="23"
                step="1"
                placeholder="Ex: 19"
                class="config-input config-input-small"
              />
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
              >Nenhum marcado = todos os dias. Seg=1, Ter=2, Qua=3, Qui=4,
              Sex=5, Sáb=6, Dom=0.</small
            >
          </div>
        </div>

        <div class="config-group numeros-gestor-group">
          <label
            ><i class="fa fa-phone"></i> Gestores e números (WhatsApp)</label
          >
          <small class="config-small"
            >Selecione o gestor e informe o número. Use "Estabelecimentos" e/ou
            "Adms" para que esse gestor receba só os pedidos do seu escopo (ex.:
            Cristiano só de C2 e ML). Vazio = recebe tudo. Formato número:
            5511999999999.</small
          >
          <div class="numeros-lista">
            <div
              v-for="(item, idx) in config.whatsapp_gestor_list"
              :key="idx"
              class="numero-item numero-gestor-row"
            >
              <select
                v-model="item.gestor"
                class="config-input gestor-select"
                :disabled="salvando"
                @change="onGestorSelect(item)"
              >
                <option value="">Receber tudo (todos os perfis)</option>
                <option
                  v-for="g in listaGestores"
                  :key="g.id"
                  :value="(g.name || g.user || '').toString().trim()"
                >
                  {{ g.name || g.user || `ID ${g.id}` }}
                </option>
              </select>
              <input
                type="text"
                v-model="item.numero"
                placeholder="5511999999999"
                class="config-input numero-input"
              />
              <input
                type="text"
                v-model="item.estabelecimentos"
                placeholder="Estabelecimentos (ex: C2, ML)"
                class="config-input estabelecimentos-input"
                title="Filtrar apenas pedidos desses armazéns"
              />
              <input
                type="text"
                v-model="item.adm"
                placeholder="Adms (ex: SAYMON, DIEGO)"
                class="config-input adm-input"
                title="Filtrar apenas pedidos desses administradores"
              />
              <button
                type="button"
                @click="removerNumero(idx)"
                class="btn-remover-numero"
                :disabled="salvando"
                title="Remover"
              >
                <i class="fa fa-times"></i>
              </button>
            </div>
            <button
              type="button"
              @click="adicionarNumero"
              class="btn-adicionar-numero"
              :disabled="salvando"
            >
              <i class="fa fa-plus"></i> Adicionar gestor / número
            </button>
          </div>
        </div>

        <div class="config-group">
          <label><i class="fa fa-server"></i> Instância Evolution</label>
          <input
            type="text"
            v-model="config.evolution_instance_name"
            placeholder="default"
            class="config-input"
          />
          <small class="config-small"
            >Nome da instância Evolution para envio de mensagens de pedidos.
            Vazio = usa a mesma instância da Config. Rejeições.</small
          >
        </div>

        <div class="config-section">
          <h5><i class="fa fa-paper-plane"></i> O que enviar</h5>
          <div class="config-group">
            <label class="config-check-label">
              <input type="checkbox" v-model="config.enviar_resumo" />
              <span>Enviar mensagem de resumo (Total por admin)</span>
            </label>
          </div>
          <div class="config-group">
            <label class="config-check-label">
              <input type="checkbox" v-model="config.enviar_txt" />
              <span>Enviar arquivo Excel com pedidos separados por admin</span>
            </label>
          </div>
        </div>

        <div class="config-section">
          <h5>
            <i class="fa fa-exclamation-triangle"></i> Probabilidade de atraso –
            Separação
          </h5>
          <p class="config-descricao">
            Alertas para pedidos com data limite hoje que ainda não foram
            separados (coluna SEPARADO vazia). Configure o horário de corte, o
            intervalo de execução e a janela (início/fim/dias) em que as
            mensagens podem ser enviadas.
          </p>
          <div class="config-group">
            <label class="config-check-label">
              <input
                type="checkbox"
                v-model="config.enviar_probabilidade_separacao"
              />
              <span
                >Ativar alerta: sem separação até o horário (risco de
                esquecimento)</span
              >
            </label>
            <label class="config-row-horario" style="margin-left: 1.5rem"
              >Horário de corte (0-23):</label
            >
            <input
              type="number"
              v-model.number="config.horario_probabilidade_sep"
              min="0"
              max="23"
              class="config-input config-input-small"
              style="width: 4rem"
            />
            <span class="config-small"
              >Ex.: 14 = só considera “em risco” após 14h.</span
            >
          </div>
          <div class="config-group">
            <label>Intervalo (horas)</label>
            <input
              type="number"
              v-model.number="config.intervalo_horas_sep"
              min="1"
              max="24"
              placeholder="Ex: 1"
              class="config-input config-input-small"
            />
            <small class="config-small"
              >De quantas em quantas horas pode enviar este alerta. Vazio = usa
              o intervalo de “Pedidos atrasados”.</small
            >
          </div>
          <div class="config-row-horario">
            <div class="config-group">
              <label>Hora de início (0-23)</label>
              <input
                type="number"
                v-model.number="config.enviar_horario_inicio_sep"
                min="0"
                max="23"
                placeholder="Ex: 14"
                class="config-input config-input-small"
              />
            </div>
            <div class="config-group">
              <label>Hora de fim (0-23)</label>
              <input
                type="number"
                v-model.number="config.enviar_horario_fim_sep"
                min="0"
                max="23"
                placeholder="Ex: 16"
                class="config-input config-input-small"
              />
            </div>
          </div>
          <div class="config-group">
            <label>Enviar apenas nos dias</label>
            <div class="config-dias-semana">
              <label
                v-for="d in diasSemanaOpts"
                :key="'sep-' + d.value"
                class="config-check-dia"
              >
                <input
                  type="checkbox"
                  :value="d.value"
                  v-model="diasSemanaSelecionadosSep"
                />
                <span>{{ d.label }}</span>
              </label>
            </div>
            <small class="config-small">Nenhum marcado = todos os dias.</small>
          </div>
        </div>

        <div class="config-section">
          <h5>
            <i class="fa fa-check-square-o"></i> Probabilidade de atraso –
            Checkout
          </h5>
          <p class="config-descricao">
            Alertas para pedidos separados hoje (data limite) que até o horário
            não estão em Cko. Ok / Em Cko. Configure intervalo e janela de envio
            para este cenário.
          </p>
          <div class="config-group">
            <label class="config-check-label">
              <input
                type="checkbox"
                v-model="config.enviar_probabilidade_checkout"
              />
              <span
                >Ativar alerta: separado hoje mas sem checkout até o horário
                (risco de limbo)</span
              >
            </label>
            <label class="config-row-horario" style="margin-left: 1.5rem"
              >Horário de corte (0-23):</label
            >
            <input
              type="number"
              v-model.number="config.horario_probabilidade_cko"
              min="0"
              max="23"
              class="config-input config-input-small"
              style="width: 4rem"
            />
            <span class="config-small">Ex.: 16 = 16h.</span>
          </div>
          <div class="config-group">
            <label>Intervalo (horas)</label>
            <input
              type="number"
              v-model.number="config.intervalo_horas_cko"
              min="1"
              max="24"
              placeholder="Ex: 1"
              class="config-input config-input-small"
            />
            <small class="config-small"
              >De quantas em quantas horas pode enviar. Vazio = usa o intervalo
              de “Pedidos atrasados”.</small
            >
          </div>
          <div class="config-row-horario">
            <div class="config-group">
              <label>Hora de início (0-23)</label>
              <input
                type="number"
                v-model.number="config.enviar_horario_inicio_cko"
                min="0"
                max="23"
                placeholder="Ex: 14"
                class="config-input config-input-small"
              />
            </div>
            <div class="config-group">
              <label>Hora de fim (0-23)</label>
              <input
                type="number"
                v-model.number="config.enviar_horario_fim_cko"
                min="0"
                max="23"
                placeholder="Ex: 18"
                class="config-input config-input-small"
              />
            </div>
          </div>
          <div class="config-group">
            <label>Enviar apenas nos dias</label>
            <div class="config-dias-semana">
              <label
                v-for="d in diasSemanaOpts"
                :key="'cko-' + d.value"
                class="config-check-dia"
              >
                <input
                  type="checkbox"
                  :value="d.value"
                  v-model="diasSemanaSelecionadosCko"
                />
                <span>{{ d.label }}</span>
              </label>
            </div>
            <small class="config-small">Nenhum marcado = todos os dias.</small>
          </div>
        </div>

        <div class="config-section">
          <h5><i class="fa fa-paper-plane"></i> Disparar mensagens de teste</h5>
          <p class="config-descricao">
            Envie agora as mensagens para os gestores configurados e verifique
            se está tudo funcionando (não precisa esperar o intervalo de 2h).
          </p>
          <div class="config-group config-buttons-teste">
            <button
              type="button"
              class="btn-teste-envio"
              :disabled="enviandoTeste !== null"
              @click="dispararTeste('atrasados')"
            >
              <i class="fa fa-clock-o"></i>
              {{
                enviandoTeste === 'atrasados'
                  ? 'Enviando...'
                  : 'Disparar atrasados'
              }}
            </button>
            <button
              type="button"
              class="btn-teste-envio"
              :disabled="enviandoTeste !== null"
              @click="dispararTeste('probabilidade_separacao')"
            >
              <i class="fa fa-exclamation-triangle"></i>
              {{
                enviandoTeste === 'probabilidade_separacao'
                  ? 'Enviando...'
                  : 'Disparar probabilidade (separação)'
              }}
            </button>
            <button
              type="button"
              class="btn-teste-envio"
              :disabled="enviandoTeste !== null"
              @click="dispararTeste('probabilidade_checkout')"
            >
              <i class="fa fa-check-square-o"></i>
              {{
                enviandoTeste === 'probabilidade_checkout'
                  ? 'Enviando...'
                  : 'Disparar probabilidade (checkout)'
              }}
            </button>
          </div>
        </div>

        <button
          class="btn-salvar-config"
          @click="salvarConfig"
          :disabled="salvando"
        >
          <i class="fa fa-save"></i>
          {{ salvando ? 'Salvando...' : 'Salvar Configurações' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import apiService, { configPedidosService } from '@/services/api'

export default {
  name: 'ConfigPedidosPage',
  emits: ['notification'],
  setup(props, { emit }) {
    const config = ref(null) // null = carregando; objeto = pronto
    const salvando = ref(false)
    const enviandoTeste = ref(null) // 'atrasados' | 'probabilidade_separacao' | 'probabilidade_checkout' | null
    const listaGestores = ref([])
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
    const diasSemanaSelecionadosSep = ref([])
    const diasSemanaSelecionadosCko = ref([])

    const notifySuccess = msg => emit('notification', msg, 'success')
    const notifyError = msg => emit('notification', msg, 'error')

    const loadGestores = async () => {
      try {
        const res = await apiService.get('/storage/managers')
        listaGestores.value = Array.isArray(res) ? res : []
      } catch (e) {
        console.warn('Erro ao carregar lista de gestores:', e)
        listaGestores.value = []
      }
    }

    /** Ao selecionar um gestor no dropdown, preenche Estabelecimentos e Adms com os dados desse gestor (da API). */
    const onGestorSelect = item => {
      if (!item || !item.gestor) return
      const gestores = listaGestores.value || []
      const g = gestores.find(g => {
        const nome = String(g.name || '').trim()
        const user = String(g.user || '').trim()
        const idStr = String(g.id ?? '')
        const gestor = String(item.gestor || '').trim()
        return (
          nome === gestor ||
          (user && user.startsWith(gestor)) ||
          idStr === gestor
        )
      })
      if (g) {
        if (Array.isArray(g.estabelecimentos) && g.estabelecimentos.length)
          item.estabelecimentos = g.estabelecimentos.join(', ')
        if (Array.isArray(g.adms) && g.adms.length) item.adm = g.adms.join(', ')
      }
    }

    const loadConfig = async () => {
      try {
        await loadGestores()
        const res = await configPedidosService.getConfig()
        const data = res?.config ?? res?.data?.config ?? res
        if (data && typeof data === 'object') {
          let list = Array.isArray(data.whatsapp_gestor_list)
            ? data.whatsapp_gestor_list.map(x => ({
                gestor: (x.gestor ?? x.g ?? '').toString().trim(),
                numero: (x.numero ?? x.n ?? '').toString().trim(),
                estabelecimentos:
                  (x.estabelecimentos != null
                    ? String(x.estabelecimentos).trim()
                    : '') || '',
                adm: (x.adm != null ? String(x.adm).trim() : '') || '',
              }))
            : []
          const gestores = listaGestores.value || []
          list.forEach(item => {
            if (item.gestor && gestores.length) {
              const g = gestores.find(g => {
                const nome = String(g.name || '')
                  .trim()
                  .toLowerCase()
                const user = String(g.user || '')
                  .trim()
                  .toLowerCase()
                const idStr = String(g.id ?? '').trim()
                const gestor = (item.gestor || '').trim().toLowerCase()
                return (
                  nome === gestor ||
                  (user && user.startsWith(gestor)) ||
                  idStr === (item.gestor || '').trim()
                )
              })
              if (g) {
                if (
                  !item.estabelecimentos &&
                  Array.isArray(g.estabelecimentos) &&
                  g.estabelecimentos.length
                )
                  item.estabelecimentos = g.estabelecimentos.join(', ')
                if (!item.adm && Array.isArray(g.adms) && g.adms.length)
                  item.adm = g.adms.join(', ')
              }
            }
          })
          if (!list.length && Array.isArray(data.whatsapp_gestor_numeros))
            list = data.whatsapp_gestor_numeros
              .filter(n => String(n || '').trim())
              .map(numero => ({
                gestor: '',
                numero: String(numero).trim(),
                estabelecimentos: '',
                adm: '',
              }))
          if (!list.length && data.whatsapp_gestor_numero)
            list = [
              {
                gestor: '',
                numero: String(data.whatsapp_gestor_numero).trim(),
                estabelecimentos: '',
                adm: '',
              },
            ]
          if (!list.length)
            list = [{ gestor: '', numero: '', estabelecimentos: '', adm: '' }]
          const diasStr = (data.enviar_dias_semana || '').toString().trim()
          diasSemanaSelecionados.value = diasStr
            ? diasStr
                .split(',')
                .map(d => String(d).trim())
                .filter(Boolean)
            : []
          const diasSep = (data.enviar_dias_semana_sep || '').toString().trim()
          diasSemanaSelecionadosSep.value = diasSep
            ? diasSep
                .split(',')
                .map(d => String(d).trim())
                .filter(Boolean)
            : []
          const diasCko = (data.enviar_dias_semana_cko || '').toString().trim()
          diasSemanaSelecionadosCko.value = diasCko
            ? diasCko
                .split(',')
                .map(d => String(d).trim())
                .filter(Boolean)
            : []
          config.value = {
            ativo: data.ativo !== false && data.ativo !== 0,
            intervalo_horas: data.intervalo_horas ?? 2,
            whatsapp_gestor_list: list,
            evolution_instance_name: data.evolution_instance_name || null,
            enviar_resumo:
              data.enviar_resumo !== false && data.enviar_resumo !== 0,
            enviar_txt: data.enviar_txt !== false && data.enviar_txt !== 0,
            enviar_horario_inicio: data.enviar_horario_inicio ?? null,
            enviar_horario_fim: data.enviar_horario_fim ?? null,
            enviar_dias_semana: data.enviar_dias_semana || null,
            enviar_probabilidade_separacao:
              data.enviar_probabilidade_separacao !== false &&
              data.enviar_probabilidade_separacao !== 0,
            enviar_probabilidade_checkout:
              data.enviar_probabilidade_checkout !== false &&
              data.enviar_probabilidade_checkout !== 0,
            horario_probabilidade_sep:
              data.horario_probabilidade_sep != null
                ? Number(data.horario_probabilidade_sep)
                : 14,
            horario_probabilidade_cko:
              data.horario_probabilidade_cko != null
                ? Number(data.horario_probabilidade_cko)
                : 16,
            intervalo_horas_sep:
              data.intervalo_horas_sep != null
                ? Number(data.intervalo_horas_sep)
                : null,
            enviar_horario_inicio_sep:
              data.enviar_horario_inicio_sep != null
                ? Number(data.enviar_horario_inicio_sep)
                : null,
            enviar_horario_fim_sep:
              data.enviar_horario_fim_sep != null
                ? Number(data.enviar_horario_fim_sep)
                : null,
            enviar_dias_semana_sep: data.enviar_dias_semana_sep || null,
            intervalo_horas_cko:
              data.intervalo_horas_cko != null
                ? Number(data.intervalo_horas_cko)
                : null,
            enviar_horario_inicio_cko:
              data.enviar_horario_inicio_cko != null
                ? Number(data.enviar_horario_inicio_cko)
                : null,
            enviar_horario_fim_cko:
              data.enviar_horario_fim_cko != null
                ? Number(data.enviar_horario_fim_cko)
                : null,
            enviar_dias_semana_cko: data.enviar_dias_semana_cko || null,
          }
        }
      } catch (e) {
        console.error('Erro ao carregar config pedidos:', e)
        notifyError('Erro: ' + (e.message || 'Não foi possível carregar'))
        diasSemanaSelecionados.value = []
        diasSemanaSelecionadosSep.value = []
        diasSemanaSelecionadosCko.value = []
        config.value = {
          ativo: true,
          intervalo_horas: 2,
          whatsapp_gestor_list: [{ gestor: '', numero: '' }],
          evolution_instance_name: null,
          enviar_resumo: true,
          enviar_txt: true,
          enviar_horario_inicio: null,
          enviar_horario_fim: null,
          enviar_dias_semana: null,
          enviar_probabilidade_separacao: true,
          enviar_probabilidade_checkout: true,
          horario_probabilidade_sep: 14,
          horario_probabilidade_cko: 16,
          intervalo_horas_sep: null,
          enviar_horario_inicio_sep: null,
          enviar_horario_fim_sep: null,
          enviar_dias_semana_sep: null,
          intervalo_horas_cko: null,
          enviar_horario_inicio_cko: null,
          enviar_horario_fim_cko: null,
          enviar_dias_semana_cko: null,
        }
      }
    }

    const salvarConfig = async () => {
      salvando.value = true
      try {
        const list = (config.value.whatsapp_gestor_list || [])
          .map(x => ({
            gestor: String(x.gestor || '').trim(),
            numero: String(x.numero || '').trim(),
            estabelecimentos:
              String(x.estabelecimentos || '').trim() || undefined,
            adm: String(x.adm || '').trim() || undefined,
          }))
          .filter(x => x.numero)
        const diasStr = diasSemanaSelecionados.value?.length
          ? diasSemanaSelecionados.value.join(',')
          : null
        const diasStrSep = diasSemanaSelecionadosSep.value?.length
          ? diasSemanaSelecionadosSep.value.join(',')
          : null
        const diasStrCko = diasSemanaSelecionadosCko.value?.length
          ? diasSemanaSelecionadosCko.value.join(',')
          : null
        await configPedidosService.atualizarConfig({
          ativo: config.value.ativo,
          intervalo_horas: config.value.intervalo_horas,
          whatsapp_gestor_list: list,
          evolution_instance_name: config.value.evolution_instance_name || null,
          enviar_resumo: config.value.enviar_resumo,
          enviar_txt: config.value.enviar_txt,
          enviar_horario_inicio: config.value.enviar_horario_inicio,
          enviar_horario_fim: config.value.enviar_horario_fim,
          enviar_dias_semana: diasStr,
          enviar_probabilidade_separacao:
            config.value.enviar_probabilidade_separacao,
          enviar_probabilidade_checkout:
            config.value.enviar_probabilidade_checkout,
          horario_probabilidade_sep: config.value.horario_probabilidade_sep,
          horario_probabilidade_cko: config.value.horario_probabilidade_cko,
          intervalo_horas_sep: config.value.intervalo_horas_sep ?? null,
          enviar_horario_inicio_sep:
            config.value.enviar_horario_inicio_sep ?? null,
          enviar_horario_fim_sep: config.value.enviar_horario_fim_sep ?? null,
          enviar_dias_semana_sep: diasStrSep,
          intervalo_horas_cko: config.value.intervalo_horas_cko ?? null,
          enviar_horario_inicio_cko:
            config.value.enviar_horario_inicio_cko ?? null,
          enviar_horario_fim_cko: config.value.enviar_horario_fim_cko ?? null,
          enviar_dias_semana_cko: diasStrCko,
        })
        notifySuccess('Configurações salvas com sucesso!')
      } catch (e) {
        notifyError('Erro ao salvar: ' + (e.response?.data?.error || e.message))
      } finally {
        salvando.value = false
      }
    }

    const dispararTeste = async tipo => {
      enviandoTeste.value = tipo
      try {
        const res = await configPedidosService.enviarTeste([tipo])
        const msg = res?.message || 'Mensagem(s) de teste enviada(s).'
        const resultados = res?.resultados
        const detail = resultados
          ? ` Atrasados: ${resultados.atrasados ?? 0}; Prob. separação: ${resultados.probabilidade_separacao ?? 0}; Prob. checkout: ${resultados.probabilidade_checkout ?? 0}.`
          : ''
        notifySuccess(msg + detail)
      } catch (e) {
        const err =
          e.response?.data?.error || e.message || 'Erro ao enviar teste'
        notifyError(err)
      } finally {
        enviandoTeste.value = null
      }
    }

    const adicionarNumero = () => {
      if (!config.value.whatsapp_gestor_list)
        config.value.whatsapp_gestor_list = [
          { gestor: '', numero: '', estabelecimentos: '', adm: '' },
        ]
      config.value.whatsapp_gestor_list.push({
        gestor: '',
        numero: '',
        estabelecimentos: '',
        adm: '',
      })
    }
    const removerNumero = idx => {
      if (
        config.value.whatsapp_gestor_list &&
        config.value.whatsapp_gestor_list.length > 1
      ) {
        config.value.whatsapp_gestor_list.splice(idx, 1)
      }
    }

    onMounted(async () => {
      await loadGestores()
      await loadConfig()
    })

    return {
      config,
      salvando,
      enviandoTeste,
      dispararTeste,
      listaGestores,
      onGestorSelect,
      diasSemanaOpts,
      diasSemanaSelecionados,
      diasSemanaSelecionadosSep,
      diasSemanaSelecionadosCko,
      salvarConfig,
      adicionarNumero,
      removerNumero,
    }
  },
}
</script>

<style scoped>
.config-pedidos {
  padding: 1rem;
  min-height: 400px;
  width: 100%;
  background: #f8fafc;
  color: #1e293b;
  border-radius: 8px;
}
</style>

<style>
/* Garantir que a área de Config. Pedidos seja visível (não scoped para afetar o container) */
.content-area-config-pedidos {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  display: flex !important;
  flex-direction: column;
  width: 100%;
  min-height: 400px;
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

.painel-pedidos-wide {
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

.config-small {
  color: #64748b;
  margin-top: 0.25rem;
  display: block;
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
  font-weight: 500;
  color: #475569;
}

.config-buttons-teste {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.btn-teste-envio {
  padding: 0.6rem 1.25rem;
  border: 1px solid #94a3b8;
  border-radius: 8px;
  background: #f1f5f9;
  color: #475569;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-teste-envio:hover:not(:disabled) {
  background: #e2e8f0;
  border-color: #64748b;
}

.btn-teste-envio:disabled {
  opacity: 0.7;
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

.config-carregando {
  padding: 2rem;
  text-align: center;
  color: #64748b;
}

.numeros-gestor-group .numeros-lista {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.numeros-gestor-group .numero-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 700px;
}

.numeros-gestor-group .numero-gestor-row .gestor-select {
  width: 200px;
  min-width: 160px;
  flex-shrink: 0;
  cursor: pointer;
}

.numeros-gestor-group .numero-input {
  flex: 1;
  min-width: 140px;
}

.numeros-gestor-group .estabelecimentos-input,
.numeros-gestor-group .adm-input {
  min-width: 120px;
  max-width: 160px;
  flex: 0.8;
}

.numeros-gestor-group .btn-remover-numero {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  color: #64748b;
  cursor: pointer;
  flex-shrink: 0;
}

.numeros-gestor-group .btn-remover-numero:hover:not(:disabled) {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}

.numeros-gestor-group .btn-adicionar-numero {
  padding: 0.5rem 1rem;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
  cursor: pointer;
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.numeros-gestor-group .btn-adicionar-numero:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
}
</style>
