<template>
  <div
    class="dev-wa-diretoria dev-wa-diretoria-wrapper"
    style="min-height: 420px; background: #f1f5f9"
  >
    <div class="painel-configuracoes-card dev-wa-diretoria-card">
      <div class="dev-wa-page-title">
        <h3>
          <i class="fab fa-whatsapp dev-wa-title-icon" aria-hidden="true" />
          WhatsApp — BI Diretoria (PNG)
        </h3>
      </div>
      <p class="config-descricao">
        URL e chave da Evolution vêm do <strong>.env</strong> do backend (mesmo
        caminho das rejeições). Destinatários, envio, horários do agendamento e
        regras de dados do resumo são gravados na tabela
        <strong>bi_diretoria_config</strong> (valores do portal prevalecem; .env
        só vale como legado até a primeira configuração explícita em alguns
        campos).
      </p>

      <section class="dev-wa-mensagens">
        <h4 class="dev-wa-section-title dev-wa-section-title-first">
          <i class="fa fa-paper-plane" aria-hidden="true" />
          Destinatários e envio (Diretoria)
        </h4>
        <p class="config-descricao dev-wa-section-desc">
          Ao salvar, números e flags passam a valer do banco (legado:
          <code>WHATSAPP_NUMEROS_DIRETORIA</code> /
          <code>WHATSAPP_DIRETORIA_ENVIAR</code>).
        </p>
        <div
          v-if="diretoriaMensagensLoading"
          class="dev-wa-loading dev-wa-loading-inline"
        >
          <i class="fa fa-spinner fa-spin" />
          Carregando configuração…
        </div>
        <template v-else>
          <div class="config-group">
            <label class="config-check-label">
              <input v-model="diretoriaEnviar" type="checkbox" />
              <span>Permitir envio para a Diretoria (automático e teste)</span>
            </label>
          </div>
          <div v-if="enviarFlagSomenteEnv" class="dev-wa-hint">
            O estado do envio acima reflete o .env (nada salvo ainda no portal
            para esta opção). Ao salvar, o valor fica gravado no banco.
          </div>
          <div class="config-group">
            <label>Números (vírgula, ponto-e-vírgula ou espaço)</label>
            <textarea
              v-model="diretoriaNumeros"
              class="config-input dev-wa-textarea"
              rows="3"
              placeholder="5511999999999, 5511888888888"
            />
          </div>

          <h4 class="dev-wa-section-title dev-wa-section-title--sub">
            <i class="fa fa-clock" aria-hidden="true" />
            Agendamento automático
          </h4>
          <p class="config-descricao dev-wa-section-desc">
            Controla quando o servidor tenta enviar o PNG (seg a sex). O horário
            «última modificação» dos pedidos no painel deve respeitar as regras
            abaixo para o envio da noite.
          </p>
          <div v-if="!waAutoExplicit" class="dev-wa-hint">
            «Automático» ainda pode estar vindo só do .env até você salvar esta
            tela — assim tudo fica gravado no banco.
          </div>
          <div class="config-group">
            <label class="config-check-label">
              <input v-model="waAuto" type="checkbox" />
              <span
                >Ativar envio automático (noite e, se opção abaixo, manhã)</span
              >
            </label>
          </div>
          <div class="config-group">
            <label>Fuso horário (IANA)</label>
            <input
              v-model="waTz"
              type="text"
              class="config-input"
              placeholder="America/Sao_Paulo"
              autocomplete="off"
            />
          </div>
          <div class="config-row-horario">
            <div class="config-group">
              <label>Hora noite (HH:MM)</label>
              <input
                v-model="waHoraNoite"
                type="text"
                class="config-input"
                placeholder="20:30"
                maxlength="5"
              />
            </div>
            <div class="config-group">
              <label>Janela noite (min)</label>
              <input
                v-model.number="waJanelaMinNoite"
                type="number"
                min="1"
                max="1440"
                step="1"
                class="config-input config-input-small"
              />
            </div>
          </div>
          <div class="config-group">
            <label class="config-check-label">
              <input v-model="waManhaAtiva" type="checkbox" />
              <span
                >Fallback manhã (dia útil seguinte, se noite não enviou)</span
              >
            </label>
          </div>
          <div class="config-row-horario">
            <div class="config-group">
              <label>Hora manhã (HH:MM)</label>
              <input
                v-model="waHoraManha"
                type="text"
                class="config-input"
                placeholder="09:00"
                maxlength="5"
              />
            </div>
            <div class="config-group">
              <label>Janela manhã (min)</label>
              <input
                v-model.number="waJanelaMinManha"
                type="number"
                min="1"
                max="1440"
                step="1"
                class="config-input config-input-small"
              />
            </div>
          </div>
          <div class="config-group">
            <label class="config-check-label">
              <input v-model="exigirDtModDataHoje" type="checkbox" />
              <span
                >Exigir que «última modificação» (dados) seja no dia de
                referência</span
              >
            </label>
          </div>
          <div class="config-group">
            <label class="config-check-label">
              <input v-model="exigirHoraMinDtModNoite" type="checkbox" />
              <span>
                No envio da noite, exigir horário mínimo dessa «última
                modificação» (no fuso acima)
              </span>
            </label>
          </div>
          <div class="config-group">
            <label>Horário mínimo (HH:MM)</label>
            <input
              v-model="horaMinDtModNoite"
              type="text"
              class="config-input config-input-small"
              placeholder="20:00"
              maxlength="5"
            />
          </div>

          <button
            type="button"
            class="btn btn-primary dev-wa-save-mensagens"
            :disabled="salvandoDiretoriaMensagens"
            @click="salvarMensagensDiretoria"
          >
            <i
              class="fa"
              :class="
                salvandoDiretoriaMensagens ? 'fa-spinner fa-spin' : 'fa-save'
              "
              aria-hidden="true"
            />
            Salvar configuração (envio e agendamento)
          </button>
        </template>
      </section>

      <div v-if="whatsappDevLoading" class="dev-wa-loading">
        <i class="fa fa-spinner fa-spin" />
        Carregando…
      </div>

      <template v-else-if="whatsappDevInfo">
        <ul class="dev-wa-meta">
          <li>
            <span class="dev-wa-meta-k">Instância Evolution</span>
            <span class="dev-wa-meta-v">{{
              whatsappDevInfo.evolution_instance_name || '—'
            }}</span>
          </li>
          <li>
            <span class="dev-wa-meta-k">URL Evolution</span>
            <span
              class="dev-wa-meta-v"
              :class="{
                'dev-wa-ok': whatsappDevInfo.evolution_url_configured,
                'dev-wa-warn': !whatsappDevInfo.evolution_url_configured,
              }"
              >{{
                whatsappDevInfo.evolution_url_configured
                  ? 'Definida (não localhost)'
                  : 'Configure EVOLUTION_API_* no .env (backend)'
              }}</span
            >
          </li>
          <li>
            <span class="dev-wa-meta-k">API key</span>
            <span
              class="dev-wa-meta-v"
              :class="{
                'dev-wa-ok': whatsappDevInfo.evolution_key_ok,
                'dev-wa-warn': !whatsappDevInfo.evolution_key_ok,
              }"
              >{{
                whatsappDevInfo.evolution_key_ok ? 'Preenchida' : 'Ausente'
              }}</span
            >
          </li>
          <li>
            <span class="dev-wa-meta-k">Contatos</span>
            <span class="dev-wa-meta-v"
              >{{ whatsappDevInfo.count || 0 }} número(s){{
                whatsappDevInfo.numeros_origem_banco ? ' (banco)' : ''
              }}</span
            >
          </li>
        </ul>

        <div
          v-if="whatsappDevInfo.envio_habilitado === false"
          class="dev-wa-alert"
        >
          <i class="fa fa-ban" />
          Envio aos diretores está
          <strong>desligado</strong>
          . Marque a opção acima e salve, ou defina
          <code>WHATSAPP_DIRETORIA_ENVIAR=1</code> no .env (legado) e reinicie.
        </div>

        <div
          v-if="
            !whatsappDevInfo.destinos_definidos || whatsappDevInfo.count === 0
          "
          class="dev-wa-alert"
        >
          <i class="fa fa-exclamation-triangle" />
          Cadastre os números na seção acima ou use
          <code>WHATSAPP_NUMEROS_DIRETORIA</code> no .env.
        </div>

        <ul
          v-if="whatsappDevInfo.count > 0 && whatsappDevInfo.destinos_definidos"
          class="dev-wa-numeros"
        >
          <li
            v-for="(m, i) in whatsappDevInfo.numeros_mascara || []"
            :key="'n-' + i + '-' + m"
          >
            {{ m }}
          </li>
        </ul>

        <h4 class="dev-wa-section-title">
          <i class="fa fa-comment" />
          Legenda junto à imagem (Evolution)
        </h4>
        <p class="config-descricao dev-wa-section-desc">
          Mesmas mensagens do envio automático. Em texto livre, use
          <code class="dev-wa-code">n/</code>
          onde quiser quebrar a linha (vira Enter no WhatsApp).
        </p>

        <div class="config-group dev-wa-legenda-opcoes">
          <label class="config-check-label dev-wa-radio">
            <input v-model="legendaModo" type="radio" value="noite" />
            <span
              ><strong>Noite (20:30)</strong> — requisitos ok no mesmo dia</span
            >
          </label>
          <pre
            v-if="whatsappDevInfo.legenda_noite_preview"
            class="dev-wa-legenda-prev"
            >{{ whatsappDevInfo.legenda_noite_preview }}</pre
          >

          <label class="config-check-label dev-wa-radio">
            <input v-model="legendaModo" type="radio" value="dia_seguinte" />
            <span
              ><strong>Dia útil seguinte</strong> — após falha / fechamento de
              ontem</span
            >
          </label>
          <pre
            v-if="whatsappDevInfo.legenda_dia_seguinte_preview"
            class="dev-wa-legenda-prev"
            >{{ whatsappDevInfo.legenda_dia_seguinte_preview }}</pre
          >

          <label class="config-check-label dev-wa-radio">
            <input v-model="legendaModo" type="radio" value="personalizada" />
            <span><strong>Personalizada</strong> (abaixo)</span>
          </label>
        </div>

        <div v-if="legendaModo === 'personalizada'" class="config-group">
          <label>Texto (opcional: <code>n/</code> para nova linha)</label>
          <textarea
            v-model="whatsappDevCaption"
            class="config-input dev-wa-textarea"
            rows="3"
            placeholder="Ex.: Boa noite! Tudo bem? n/ Segue teste."
          />
        </div>

        <button
          type="button"
          class="dev-wa-send"
          :disabled="
            whatsappEnvioPending ||
            !whatsappDevInfo.count ||
            whatsappDevInfo.envio_habilitado === false
          "
          @click="enviarTeste"
        >
          <i
            :class="
              whatsappEnvioPending ? 'fa fa-spinner fa-spin' : 'fab fa-whatsapp'
            "
          />
          {{
            whatsappEnvioPending
              ? 'Gerando PNG e enviando…'
              : 'Enviar imagem do resumo'
          }}
        </button>

        <div v-if="whatsappEnvioResultadoTexto" class="dev-wa-result">
          {{ whatsappEnvioResultadoTexto }}
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'DevWhatsappDiretoriaPage',
  emits: ['notification'],
  data() {
    return {
      diretoriaMensagensLoading: true,
      diretoriaNumeros: '',
      diretoriaEnviar: false,
      enviarFlagSomenteEnv: false,
      salvandoDiretoriaMensagens: false,
      whatsappDevInfo: null,
      whatsappDevLoading: true,
      whatsappDevCaption: '',
      /** noite | dia_seguinte | personalizada */
      legendaModo: 'noite',
      whatsappEnvioPending: false,
      whatsappEnvioResultadoTexto: '',
      waAuto: false,
      waAutoExplicit: false,
      waTz: 'America/Sao_Paulo',
      waHoraNoite: '20:30',
      waJanelaMinNoite: 1,
      waManhaAtiva: false,
      waHoraManha: '09:00',
      waJanelaMinManha: 5,
      exigirDtModDataHoje: true,
      exigirHoraMinDtModNoite: true,
      horaMinDtModNoite: '20:00',
    }
  },
  async mounted() {
    this.diretoriaMensagensLoading = true
    this.whatsappDevLoading = true
    try {
      await Promise.allSettled([
        this.loadDiretoriaMensagens(),
        this.fetchWhatsappDevInfoCore(),
      ])
    } finally {
      this.diretoriaMensagensLoading = false
      this.whatsappDevLoading = false
    }
  },
  methods: {
    async loadDiretoriaMensagens() {
      const token = localStorage.getItem('token')
      try {
        const { data } = await axios.get(
          '/configuracao-rejeicao/bi-diretoria-mensagens',
          {
            timeout: 30000,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        )
        if (!data?.success) {
          throw new Error(data?.error || 'Resposta inválida')
        }
        this.diretoriaNumeros = data.whatsapp_numeros_diretoria || ''
        this.diretoriaEnviar = !!data.whatsapp_diretoria_enviar
        this.enviarFlagSomenteEnv = !!data.enviar_flag_somente_env
        this.waAuto = !!data.wa_auto
        this.waAutoExplicit = !!data.wa_auto_explicit
        this.waTz = data.wa_tz || 'America/Sao_Paulo'
        this.waHoraNoite = data.wa_hora_noite || '20:30'
        this.waJanelaMinNoite =
          data.wa_janela_min_noite != null
            ? Number(data.wa_janela_min_noite)
            : 1
        this.waManhaAtiva = !!data.wa_manha_ativa
        this.waHoraManha = data.wa_hora_manha || '09:00'
        this.waJanelaMinManha =
          data.wa_janela_min_manha != null
            ? Number(data.wa_janela_min_manha)
            : 5
        this.exigirDtModDataHoje = data.exigir_dt_mod_data_hoje !== false
        this.exigirHoraMinDtModNoite =
          data.exigir_hora_min_dt_mod_noite !== false
        this.horaMinDtModNoite = data.hora_min_dt_mod_noite || '20:00'
      } catch (e) {
        const msg = e?.response?.data?.error || e?.message || 'Erro ao carregar'
        this.$emit(
          'notification',
          `WhatsApp Diretoria — configuração: ${msg}`,
          'error'
        )
      }
    },
    async salvarMensagensDiretoria() {
      const token = localStorage.getItem('token')
      this.salvandoDiretoriaMensagens = true
      try {
        const { data } = await axios.put(
          '/configuracao-rejeicao/bi-diretoria-mensagens',
          {
            whatsapp_numeros_diretoria: this.diretoriaNumeros,
            whatsapp_diretoria_enviar: this.diretoriaEnviar,
            wa_auto: this.waAuto,
            wa_tz: this.waTz,
            wa_hora_noite: this.waHoraNoite,
            wa_janela_min_noite: this.waJanelaMinNoite,
            wa_manha_ativa: this.waManhaAtiva,
            wa_hora_manha: this.waHoraManha,
            wa_janela_min_manha: this.waJanelaMinManha,
            exigir_dt_mod_data_hoje: this.exigirDtModDataHoje,
            exigir_hora_min_dt_mod_noite: this.exigirHoraMinDtModNoite,
            hora_min_dt_mod_noite: this.horaMinDtModNoite,
          },
          {
            timeout: 30000,
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                }
              : { 'Content-Type': 'application/json' },
          }
        )
        if (!data?.success) {
          throw new Error(data?.error || 'Falha ao salvar')
        }
        this.$emit(
          'notification',
          'Configuração de envio e agendamento da diretoria salva.',
          'success'
        )
        await Promise.all([
          this.loadDiretoriaMensagens(),
          this.fetchWhatsappDevInfoCore(),
        ])
      } catch (e) {
        const msg = e?.response?.data?.error || e?.message || 'Erro ao salvar'
        this.$emit('notification', msg, 'error')
      } finally {
        this.salvandoDiretoriaMensagens = false
      }
    },
    montarBodyEnvio() {
      const body = {}
      if (this.legendaModo === 'personalizada') {
        const cap = (this.whatsappDevCaption || '').trim()
        if (cap) body.caption = cap
        else body.legenda_tipo = 'noite'
      } else {
        body.legenda_tipo = this.legendaModo
      }
      return body
    },
    async fetchWhatsappDevInfoCore() {
      const token = localStorage.getItem('token')
      try {
        const { data } = await axios.get('/bi/diretoria/whatsapp-dev', {
          timeout: 30000,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!data?.success) {
          throw new Error(data?.error || 'Resposta inválida')
        }
        this.whatsappDevInfo = data
      } catch (e) {
        this.whatsappDevInfo = null
        const msg = e?.response?.data?.error || e?.message || 'Erro ao carregar'
        this.$emit('notification', `Dev WhatsApp Diretoria — ${msg}`, 'error')
      }
    },
    async enviarTeste() {
      const token = localStorage.getItem('token')
      this.whatsappEnvioPending = true
      this.whatsappEnvioResultadoTexto = ''
      try {
        const res = await axios.post(
          '/bi/diretoria/whatsapp-enviar-teste',
          this.montarBodyEnvio(),
          {
            timeout: 300000,
            validateStatus: s => (s >= 200 && s < 300) || s === 422,
            headers: token
              ? {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                }
              : { 'Content-Type': 'application/json' },
          }
        )
        const data = res.data
        const contaOk = r =>
          r &&
          (r.success === true ||
            r.success === 1 ||
            String(r.success).toLowerCase() === 'true')
        const rs = data?.resultados || []
        const ok =
          typeof data?.enviados_ok === 'number'
            ? Math.max(data.enviados_ok, rs.filter(contaOk).length)
            : rs.filter(contaOk).length
        if (!data?.success && ok === 0) {
          const det =
            rs.length > 0
              ? rs
                  .map(r => `${r.numero_mascara}: ${r.message || '—'}`)
                  .join(' | ')
              : data?.error || 'Falha no envio'
          throw new Error(det)
        }
        const leg =
          data.caption_enviada != null && String(data.caption_enviada)
            ? `\nLegenda:\n${data.caption_enviada}`
            : ''
        this.whatsappEnvioResultadoTexto = `Enviado: ${ok}/${rs.length}. Arquivo: ${data.arquivo || '—'}${leg}`
        this.$emit(
          'notification',
          `WhatsApp: resumo enviado (${ok}/${rs.length} contatos).`,
          'success'
        )
      } catch (e) {
        const msg =
          e?.response?.data?.error ||
          e?.response?.data?.resultados
            ?.map(r => `${r.numero_mascara}: ${r.message}`)
            .join(' | ') ||
          e?.message ||
          'Erro no envio'
        this.whatsappEnvioResultadoTexto = msg
        this.$emit('notification', msg, 'error')
      } finally {
        this.whatsappEnvioPending = false
      }
    },
  },
}
</script>

<style scoped>
/* Título dentro do card: evita “faixa” cinza/clara entre a top-bar e o conteúdo. */
.dev-wa-page-title {
  margin: -0.5rem 0 1rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid #e2e8f0;
}

.dev-wa-page-title h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dev-wa-title-icon {
  color: #25d366;
  font-size: 1.15rem;
}

.dev-wa-diretoria-card {
  max-width: 52rem;
  margin: 0 1rem 1.5rem;
}

.dev-wa-mensagens {
  margin: 0 0 1.5rem;
  padding: 1rem 1rem 1.15rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.dev-wa-section-title-first {
  margin-top: 0;
}

.dev-wa-loading-inline {
  padding: 0.75rem 0;
}

.dev-wa-hint {
  font-size: 0.85rem;
  color: #64748b;
  margin: -0.35rem 0 0.75rem;
  line-height: 1.4;
}

.dev-wa-textarea {
  font-family: inherit;
  width: 100%;
  box-sizing: border-box;
}

.dev-wa-save-mensagens {
  margin-top: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.dev-wa-mensagens .config-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.dev-wa-mensagens .config-group > label {
  font-weight: 500;
  color: #475569;
  font-size: 0.95rem;
}

.dev-wa-mensagens .config-check-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.dev-wa-mensagens .config-input {
  padding: 0.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  max-width: 100%;
  box-sizing: border-box;
}

.dev-wa-code {
  font-size: 0.9em;
  padding: 0.1rem 0.35rem;
  background: #e2e8f0;
  border-radius: 4px;
}

.dev-wa-loading {
  padding: 1.5rem;
  color: #64748b;
}

.dev-wa-meta {
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
  display: grid;
  gap: 0.4rem;
  font-size: 0.9rem;
}

.dev-wa-meta li {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.75rem;
}

.dev-wa-meta-k {
  color: #64748b;
  min-width: 10rem;
}

.dev-wa-meta-v {
  font-weight: 600;
  color: #0f172a;
}

.dev-wa-ok {
  color: #15803d;
}

.dev-wa-warn {
  color: #c2410c;
}

.dev-wa-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.65rem 0.75rem;
  border-radius: 8px;
  background: #fff7ed;
  border: 1px solid #fdba74;
  color: #9a3412;
  font-size: 0.88rem;
  margin-bottom: 0.75rem;
}

.dev-wa-numeros {
  margin: 0 0 1.25rem;
  padding-left: 1.2rem;
  color: #334155;
  font-size: 0.9rem;
  line-height: 1.55;
}

.dev-wa-section-title {
  margin: 1rem 0 0.35rem;
  font-size: 1rem;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.dev-wa-section-title--sub {
  margin-top: 1.35rem;
}

.dev-wa-section-desc {
  margin-bottom: 0.75rem;
}

.dev-wa-textarea {
  min-height: 2.75rem;
  resize: vertical;
  font-family: inherit;
}

.dev-wa-send {
  margin-top: 0.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1.1rem;
  border: none;
  border-radius: 8px;
  background: #25d366;
  color: #052e16;
  font-weight: 700;
  font-size: 0.92rem;
  cursor: pointer;
}

.dev-wa-send:hover:not(:disabled) {
  filter: brightness(1.06);
}

.dev-wa-send:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.dev-wa-legenda-opcoes {
  gap: 0.35rem;
}

.dev-wa-radio {
  margin-top: 0.5rem;
}

.dev-wa-legenda-prev {
  margin: 0.25rem 0 0.65rem 1.5rem;
  padding: 0.5rem 0.65rem;
  background: #f1f5f9;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  font-size: 0.85rem;
  color: #334155;
  white-space: pre-wrap;
  font-family: inherit;
  line-height: 1.45;
  max-width: 28rem;
}

.dev-wa-result {
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  font-size: 0.85rem;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
