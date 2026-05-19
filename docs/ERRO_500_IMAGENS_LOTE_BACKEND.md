# Erro 500 em `/api/expeditions/lot/:lotId/images` – Análise e alterações no back-end

## Contexto

Ao fazer upload de XML na criação de agendamento/expedição, o front-end chama:

- **GET** `/api/expeditions/lot/{lotId}/images`

Quando a tabela `lot` não existe no banco **dbcheckout** (ou ocorre outro erro de banco), o servidor responde **500 Internal Server Error**.

Os **502 Bad Gateway** que aparecem em seguida costumam ser efeito de infraestrutura (proxy/Cloudflare/upstream), não necessariamente do código da API.

---

## Onde está o código no back-end

- **Arquivo:** `schedule-back-end/routes/expeditions.js`
- **Rota:** `GET /api/expeditions/lot/:lot/images` (por volta da linha 2359)

Fluxo atual:

1. Verificar se a coluna `imagesbase64` existe na tabela `lot` (via `INFORMATION_SCHEMA`).
2. Se não existir, executar `ALTER TABLE lot ADD COLUMN imagesbase64 ...`.
3. Executar `SELECT lot, imagesbase64 FROM lot WHERE lot = ?`.

Se a **tabela `lot` não existir** no dbcheckout:

- O `ALTER TABLE lot ...` falha com erro do tipo *Table 'dbcheckout.lot' doesn't exist*.
- O `catch` só ignora o erro quando a mensagem contém `"Duplicate column name"`, então **não relança** esse erro.
- Em seguida o código executa o `SELECT ... FROM lot`, que falha de novo com *Table 'dbcheckout.lot' doesn't exist* → esse erro é capturado pelo `catch` geral e devolvido como **500**.

Ou seja: a causa mais provável do 500 é **tabela `lot` inexistente** no banco dbcheckout.

---

## Alterações recomendadas no back-end

### 1. Garantir que a tabela `lot` exista no dbcheckout

A aplicação já usa a tabela `lot` em outros pontos (ex.: `routes/corpem.js`, `routes/noteExchange.js`), mas **não há script de criação dessa tabela** no repositório (apenas `check-lot-table.js` que sugere `create-lot-table.js`, que não existe).

**Recomendação:** criar e versionar um script/migration que crie a tabela `lot` se não existir.

Exemplo de SQL compatível com o uso atual (colunas `lot`, `docs`, `obs`, `checkin_nf` e depois `imagesbase64`):

```sql
-- Banco: dbcheckout
CREATE TABLE IF NOT EXISTS `lot` (
  `lot` VARCHAR(30) NOT NULL,
  `docs` JSON NULL,
  `obs` TEXT NULL,
  `checkin_nf` JSON NULL,
  PRIMARY KEY (`lot`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Em seguida aplicar a migration da coluna de imagens, por exemplo:
-- sql/add_imagesbase64_column_lot.sql
```

- Rodar esse script (ou equivalente) uma vez em cada ambiente (homologação/produção) no dbcheckout.
- Opcional: no back-end, na primeira requisição que usar `lot` (ou no startup), checar existência da tabela e criar apenas se não existir (evita 500 em ambientes onde a migration ainda não foi aplicada).

### 2. Tratar “tabela não existe” na rota de imagens

Para evitar 500 quando a tabela ainda não existir:

- No handler de **GET** `/api/expeditions/lot/:lot/images`, após o primeiro uso do banco (por exemplo após o `ALTER` ou antes do `SELECT`), capturar erros cuja mensagem indique que a tabela não existe (ex.: `message.includes("doesn't exist")` ou código de erro MySQL equivalente).
- Nesse caso:
  - **Opção A:** retornar **200** com `{ success: true, lot: lot, images: {} }` (mesmo contrato do “lote sem imagens”), para o front continuar funcionando.
  - **Opção B:** retornar **503** com mensagem amigável do tipo “Recurso de imagens temporariamente indisponível”, sem expor detalhes do banco.

Exemplo de tratamento (Opção A) em `routes/expeditions.js`:

```javascript
// Dentro do catch do GET /lot/:lot/images (por volta da linha 2445)
} catch (error) {
  if (error.message && error.message.includes("doesn't exist")) {
    return res.json({
      success: true,
      lot: req.params.lot,
      images: {}
    });
  }
  return res.status(500).json({
    success: false,
    error: 'Erro ao buscar imagens do lote',
    message: error.message
  });
}
```

Assim, mesmo sem a tabela `lot` criada, a tela de upload/agendamento não quebra com 500.

### 3. Verificar existência da tabela antes de ALTER/SELECT

Antes de consultar `INFORMATION_SCHEMA.COLUMNS` para a coluna `imagesbase64`, verificar se a tabela `lot` existe (por exemplo com `SHOW TABLES LIKE 'lot'` ou consulta a `INFORMATION_SCHEMA.TABLES`). Se não existir:

- Ou criar a tabela (se a política do projeto permitir criação automática),
- Ou pular o `ALTER` e o `SELECT` e retornar logo **200** com `images: {}`.

Isso evita tentar `ALTER TABLE lot` e `SELECT ... FROM lot` quando a tabela não existe.

### 4. Logs e 502

- Para o **500**: garantir que o log do back-end registre o `error.message` (e, se possível, o código do driver MySQL) para facilitar diagnóstico em produção.
- Os **502**: em geral são resolvidos no proxy/servidor (timeout, reinício do Node, etc.); não costumam ser corrigidos apenas por mudança na rota de imagens.

---

## Resumo

| Item | Ação |
|------|------|
| Causa provável do 500 | Tabela `lot` inexistente no dbcheckout |
| Solução estrutural | Migration/script que crie a tabela `lot` no dbcheckout (e depois coluna `imagesbase64` se ainda não existir) |
| Mitigação na rota | Tratar erro “tabela não existe” e retornar 200 com `images: {}` (ou 503 com mensagem genérica) |
| Opcional | Verificar existência da tabela antes de ALTER/SELECT; logar erro completo no 500 |
| 502 | Tratar como problema de infraestrutura/proxy, não da rota de imagens |

Após criar a tabela `lot` no dbcheckout e, se desejar, aplicar o tratamento de “tabela não existe” na rota GET `/api/expeditions/lot/:lot/images`, o erro 500 nesse endpoint tende a deixar de ocorrer nesse cenário.
