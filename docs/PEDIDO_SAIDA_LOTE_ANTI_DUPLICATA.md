# Pedidos de saída em lote – prevenção de duplicatas (informações para o front-end)

## Problema que estava ocorrendo

Na criação de pedidos de saída, a função era executada duas vezes, gerando:
- **Dois registros** com os mesmos pedidos
- **Dois lotes diferentes** (cada execução gerava um LOT distinto)

Causa provável: o front-end disparava a requisição **duas vezes** (double submit, duplo clique, ou dois disparos do mesmo evento). Cada requisição gerava um novo LOT e inseria os pedidos na tabela `orders`, resultando em duplicidade.

---

## O que foi alterado no back-end

Foi implementada **proteção contra duplicidade** na rota:

**POST /api/corpem/pedido-saida-lote**

- Foi adicionado o middleware **preventDuplicatePedidoSaidaLote**.
- A “assinatura” da requisição é: quantidade de pedidos + identificador do primeiro pedido (CHAVENF ou NUMPEDCLI) + CGCCLIWMS.
- Requisições com a mesma assinatura dentro de **45 segundos** são tratadas como duplicata.

Comportamento:
- **Primeira requisição:** processa normalmente e a resposta é armazenada em cache.
- **Segunda requisição idêntica (duplicata):**
  - Se a primeira **já tiver terminado com sucesso:** o back-end retorna a **mesma resposta** (status 200 e mesmo corpo), sem criar outro lote.
  - Se a primeira **ainda estiver em processamento:** o back-end retorna **409 Conflict** com a mensagem: *"Esta criação de pedido de saída já está sendo processada. Aguarde alguns segundos antes de tentar novamente."*
- Em caso de **erro** (4xx/5xx) na primeira requisição, a chave é removida do cache, permitindo uma nova tentativa legítima.

Com isso, mesmo que o front envie a mesma criação duas vezes, apenas **uma** será efetivamente processada; a outra receberá a resposta em cache ou 409, e **não** será criado um segundo lote.

---

## Recomendações para o front-end

1. **Desabilitar o botão de envio** logo no primeiro clique (evitar segundo clique enquanto a requisição estiver em andamento).
2. **Garantir uma única chamada** à API por ação do usuário (evitar dois handlers no mesmo submit ou `useEffect` que dispare a criação duas vezes).
3. **Tratar o status 409** como “requisição duplicada” e exibir uma mensagem amigável, por exemplo: *“Este pedido já está sendo criado. Aguarde a conclusão.”* — sem tratar como erro crítico de rede.
4. Opcional: ao receber **200** com a resposta de sucesso, desabilitar novo envio por alguns segundos ou até que a tela mude de contexto, para reduzir ainda mais o risco de um segundo envio acidental.

---

## Resumo

| Item | Descrição |
|------|-----------|
| Rota afetada | POST /api/corpem/pedido-saida-lote |
| Proteção no back-end | Middleware que detecta requisições duplicadas (mesmo payload) em 45 segundos |
| Resposta à duplicata (já processada) | 200 com a mesma resposta da primeira requisição (sem criar novo lote) |
| Resposta à duplicata (em processamento) | 409 Conflict com mensagem para aguardar |
| Ação recomendada no front | Desabilitar botão no submit, evitar dupla chamada, tratar 409 com mensagem amigável |
