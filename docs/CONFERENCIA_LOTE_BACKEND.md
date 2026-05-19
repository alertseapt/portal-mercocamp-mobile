# Conferência em lote – alterações no back-end

## Resumo do fluxo no front-end

Na página **Conferência em lote**, o usuário pode:

1. Selecionar linhas da tabela (checkbox master seleciona/desmarca todas).
2. Clicar em **Em conferência** para marcar os agendamentos encontrados como "Em conferência" e disparar a integração CorpEM (quando o cliente tiver integração ativa).
3. É aberto um modal que lista os agendamentos que serão processados. As integrações são feitas **uma por vez**, em sequência: o front-end só envia a próxima requisição após receber a resposta da anterior, para não congestionar a API CorpEM.
4. Cada linha do modal mostra o resultado (Aguardando → Integrando... → Integrado ou mensagem de erro) conforme as respostas chegam.

## Requisições feitas pelo front-end

O front-end utiliza o endpoint **existente**:

- **Método:** `PATCH`
- **URL:** `/schedules/:id/status`
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`
- **Body (JSON):**
  - `status`: `"Conferência"`
  - `historic_entry`: objeto com `user`, `action`, `comment` (ex.: "Conferência em lote")

Para cada agendamento selecionado (com agendamento encontrado), o front-end chama esse endpoint **uma vez**, aguardando a resposta antes de chamar o próximo.

## Comportamento atual do back-end (alterações implementadas)

### 1. `PATCH /schedules/:id/status` (formato fila – resposta com CorpEM)

- Atualiza o status para "Conferência" (ou "Em conferência"), grava histórico e define `integration = NOW()` quando for a primeira vez.
- Na mudança para Conferência, **aguarda** a integração CorpEM (produtos + NFe) e inclui na resposta:
  - **`corpem_integration`:** `{ success: true | false, message: string }`
- Logs com prefixo `[CONFERÊNCIA]` e `[CORPEM]` (id do agendamento, sucesso/erro).

### 2. `POST /schedules/conferencia-lote` (endpoint em lote – formato fila)

- **URL:** `POST /api/schedules/conferencia-lote`
- **Body:** `{ schedule_ids: number[] }` (obrigatório, 1 a 100 itens). Opcional: `historic_entry`.
- Processa cada `schedule_id` **em sequência**: atualiza status para "Conferência", salva produtos, executa integração CorpEM (aguardando), depois o próximo.
- **Resposta:** `{ results: [ { schedule_id, success, error?, corpem_integration?: { success, message } }, ... ] }`
- Validações: agendamento existe, não é marcação, `checkClientAccess`. Se já estiver em Conferência, retorna sucesso com `corpem_integration: { success: true, message: "Já em conferência" }`.

## Observações

Os itens “resposta explícita CorpEM” e “endpoint em lote” já estão implementados (ver seção anterior).

### Validações e segurança

- Manter a verificação de permissão por cliente (ex.: `checkClientAccess`) para cada agendamento.
- Garantir que apenas agendamentos em status permitido possam ir para "Conferência" (o fluxo atual já trata agendamento de marcação, etc.).
- Não é necessário alterar CORS ou rate limit apenas por causa da Conferência em lote, pois o front-end já limita o envio (uma requisição por vez).

### Logs e monitoramento

- Manter ou reforçar logs ao mudar status para "Conferência" e ao chamar a integração CorpEM (sucesso/falha), para facilitar suporte e análise quando o usuário usar “Em conferência” em lote.

## Conclusão

O front-end pode usar:
- **`PATCH /schedules/:id/status`** de forma sequencial (resposta passa a incluir `corpem_integration` ao mudar para Conferência).
- **`POST /schedules/conferencia-lote`** com `{ schedule_ids: [...] }` para processar em lote em uma única requisição; o back-end processa em sequência e retorna `results` com sucesso/erro e `corpem_integration` por agendamento.

