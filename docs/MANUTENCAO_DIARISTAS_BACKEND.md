# Manutenção – Cadastro de Diaristas (Back-end)

Documento descrevendo as alterações necessárias no **back-end** para suportar a funcionalidade de cadastro de diaristas na página "Diaristas" (menu Manutenção).

---

## 1. Contexto (Front-end implementado)

- **Menu Manutenção** – Dropdown visível apenas para usuários com `level_access` 0 ou 4.
- **Item Diaristas** – Abre a página de Diaristas.
- **Redirect no login** – Usuários nível 4 são redirecionados para a página Diaristas em vez do portal de agendamentos.
- **Formulário Cadastro Diarista** – Campos Nome e CPF, salvos na tabela `maintenance_daily_workers`.

---

## 2. Tabela no banco de dados

### 2.1 Criação da tabela `maintenance_daily_workers`

```sql
-- Tabela de diaristas (manutenção)
-- Ambiente: homologação e produção (dbcheckinhom e dbcheckin)
-- Ou banco específico de manutenção se houver

CREATE TABLE IF NOT EXISTS maintenance_daily_workers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cpf VARCHAR(11) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_cpf (cpf)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Observações:**
- `name`: Nome completo.
- `cpf`: CPF apenas com dígitos (11 caracteres).
- CPF único para evitar cadastros duplicados.

---

## 3. Endpoints da API

### 3.1 GET `/api/maintenance/daily-workers`

**Objetivo:** Listar diaristas cadastrados (para autocomplete na aba Registro).

**Autenticação:** JWT (obrigatório).

**Autorização:** Apenas usuários com `level_access` 0 ou 4.

**Response (200 OK):**
```json
[
  { "id": 1, "name": "Maria da Silva", "cpf": "12345678901" },
  { "id": 2, "name": "João Santos", "cpf": "98765432100" }
]
```

Ou, alternativamente, com wrapper:
```json
{
  "dailyWorkers": [
    { "id": 1, "name": "Maria da Silva", "cpf": "12345678901" }
  ]
}
```

---

### 3.2 POST `/api/maintenance/daily-workers`

**Objetivo:** Cadastrar um novo diarista.

**Autenticação:** JWT (obrigatório).

**Autorização:** Apenas usuários com `level_access` 0 ou 4.

**Request body:**
```json
{
  "name": "Maria da Silva",
  "cpf": "12345678901"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Diarista cadastrado com sucesso",
  "id": 1,
  "name": "Maria da Silva",
  "cpf": "12345678901"
}
```

**Erros esperados:**
- 400: CPF inválido (menos de 11 dígitos) ou duplicado.
- 401: Token inválido ou ausente.
- 403: Usuário sem permissão (nível diferente de 0 ou 4).

---

## 4. Lógica de negócio

1. Validar que o usuário tem `level_access` 0 ou 4.
2. Validar `name` (obrigatório, não vazio).
3. Validar `cpf` (11 dígitos, apenas números).
4. Normalizar CPF (remover pontuação).
5. Verificar se já existe registro com o mesmo CPF.
6. Inserir na tabela `maintenance_daily_workers`.

---

## 5. Ambientes (homologação e produção)

A funcionalidade deve seguir a mesma regra de ambiente do restante do sistema:

- **Porta 4001** (homologação) → banco `dbcheckinhom` (ou equivalente para manutenção).
- **Porta 4000** (produção) → banco `dbcheckin` (ou equivalente para manutenção).

A tabela `maintenance_daily_workers` deve existir em ambos os bancos.

---

## 6. Login – redirecionamento nível 4

O front-end redireciona usuários nível 4 para Diaristas após o login. O back-end **não precisa** alterar o fluxo de login: o token e o `user` (com `level_access`) continuam sendo retornados normalmente. O redirecionamento é feito apenas no front-end com base em `level_access === 4`.

---

## 7. Sugestão de estrutura no back-end

```
schedule-back-end/
├── routes/
│   └── maintenance.js          # Novas rotas de manutenção
├── middleware/
│   └── authMaintenance.js      # Middleware para níveis 0 e 4 (opcional)
└── sql/
    └── create_maintenance_daily_workers.sql
```

**Exemplo de rota (Express):**

```javascript
// routes/maintenance.js
const express = require('express')
const router = express.Router()
const { authFast } = require('../middleware/authFast')
const pool = require('../config/database')

// Middleware: apenas níveis 0 e 4
const maintenanceOnly = (req, res, next) => {
  const level = Number(req.user?.level_access)
  if (level !== 0 && level !== 4) {
    return res.status(403).json({ error: 'Acesso negado' })
  }
  next()
}

// GET /api/maintenance/daily-workers - lista para autocomplete
router.get('/daily-workers', authFast, maintenanceOnly, async (req, res) => {
  try {
    const db = pool.checkin // ou pool.checkinHom conforme porta
    const [rows] = await db.execute(
      'SELECT id, name, cpf FROM maintenance_daily_workers ORDER BY name'
    )
    return res.json(rows)
  } catch (err) {
    throw err
  }
})

// POST /api/maintenance/daily-workers
router.post('/daily-workers', authFast, maintenanceOnly, async (req, res) => {
  try {
    const { name, cpf } = req.body
    const cpfClean = String(cpf || '').replace(/\D/g, '')
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome é obrigatório' })
    }
    if (cpfClean.length !== 11) {
      return res.status(400).json({ error: 'CPF inválido (11 dígitos)' })
    }
    
    const db = pool.checkin // ou pool.checkinHom conforme porta
    const [result] = await db.execute(
      'INSERT INTO maintenance_daily_workers (name, cpf) VALUES (?, ?)',
      [name.trim(), cpfClean]
    )
    
    return res.status(200).json({
      success: true,
      message: 'Diarista cadastrado com sucesso',
      id: result.insertId,
      name: name.trim(),
      cpf: cpfClean,
    })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'CPF já cadastrado' })
    }
    throw err
  }
})

module.exports = router
```

Registrar no `app.js`:
```javascript
const maintenanceRouter = require('./routes/maintenance')
app.use('/api/maintenance', maintenanceRouter)
```

---

## 8. Tabela `maintenance_daily_worked` (dias trabalhados)

Registros de dias trabalhados por diarista, alimentados pela aba **Registro** da página Diaristas.

**Colunas (conforme schema existente):**

| Coluna       | Tipo        | Descrição |
|-------------|-------------|-----------|
| `id`        | INT         | PK, auto_increment |
| `worker`    | INT         | ID do diarista (FK para `maintenance_daily_workers.id`) |
| `date`      | DATE        | Data em que o trabalhador trabalhou |
| `value`     | VARCHAR(10) | Valor em reais a pagar (8 dígitos: 6 reais + 2 centavos, ex.: `12345678` = 123.456,78) |
| `payment`   | DATE        | **Nullable.** Data do pagamento da diária; quando NULL, a diária ainda não foi paga |
| `created_at`| DATETIME    | Data/hora de criação do registro (NOT NULL) |
| `created_by`| VARCHAR(50) | ID (ou identificador) do usuário que criou o registro |

A tabela deve existir no mesmo banco que `maintenance_daily_workers` (dbcheckinhom / dbcheckin).

---

## 9. POST `/api/maintenance/daily-workers/registro`

**Objetivo:** Criar registros na tabela `maintenance_daily_worked` para os diaristas e período informados.

**Autenticação:** JWT (obrigatório).

**Autorização:** Apenas usuários com `level_access` 0 ou 4.

**Request body:**
```json
{
  "dataDe": "2026-02-04",
  "dataAte": "2026-02-06",
  "diaristaIds": [1, 2],
  "value": "00012345"
}
```

- `dataDe`, `dataAte`: datas em `YYYY-MM-DD`.
- `diaristaIds`: array de IDs de diaristas (tabela `maintenance_daily_workers`).
- `value`: string de **8 dígitos** (6 reais + 2 centavos), ex. `00012345` = 123,45 reais. Sem vírgula/ponto.

**Lógica no back-end:**

1. Validar `dataDe`, `dataAte` (dataAte >= dataDe).
2. Validar `diaristaIds` (não vazio; IDs existentes em `maintenance_daily_workers`).
3. Validar `value` (string 8 dígitos).
4. Gerar a lista de datas no intervalo **[dataDe, dataAte]** (inclusive). Se `dataDe === dataAte`, uma única data.
5. Para cada `worker_id` em `diaristaIds` e para cada `date` nessa lista, inserir **um** registro em `maintenance_daily_worked`:
   - `worker` = worker_id
   - `date` = date
   - `value` = value (8 dígitos)
   - `created_at` = NOW()
   - `created_by` = ID do usuário autenticado (ex.: `req.user.id` ou equivalente)

**Exemplo:** dataDe 04/02/2026, dataAte 06/02/2026, 2 diaristas → 3 datas × 2 diaristas = **6 registros**.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Registros salvos com sucesso",
  "count": 6
}
```

**Erros esperados:** 400 (validação), 401, 403.

---

## 10. GET `/api/maintenance/daily-workers/unpaid-stats`

**Objetivo:** Retornar a quantidade e o valor total das diárias **não pagas** (registros em `maintenance_daily_worked` onde `payment IS NULL`). Usado na aba **Info** da página Diaristas.

**Autenticação:** JWT (obrigatório).

**Autorização:** Apenas usuários com `level_access` 0 ou 4.

**Lógica no back-end:**

1. Contar registros em `maintenance_daily_worked` onde `payment IS NULL` → `unpaidCount`.
2. Somar o campo `value` (string 8 dígitos) apenas dos registros onde `payment IS NULL`. O resultado deve ser devolvido como string de 8 dígitos (ex.: somando em centavos e formatando; ou convertendo `value` para numérico, somando e formatando de volta para 8 dígitos). Ex.: se houver 3 registros com value `00000100`, `00000200`, `00000050`, a soma é 350 centavos = 3,50 reais → `unpaidTotal`: `"00000350"`.

**Response (200 OK):**
```json
{
  "unpaidCount": 42,
  "unpaidTotal": "00012345"
}
```

- `unpaidCount`: número inteiro (quantidade de diárias não pagas).
- `unpaidTotal`: string de **8 dígitos** (6 reais + 2 centavos), sem vírgula/ponto. Ex.: `"00012345"` = 123,45 reais.

**Erros esperados:** 401, 403.

**Migration:** Adicionar coluna `payment` (DATE NULL) na tabela `maintenance_daily_worked` se ainda não existir:
```sql
ALTER TABLE maintenance_daily_worked
ADD COLUMN payment DATE NULL DEFAULT NULL
COMMENT 'Data do pagamento; NULL = não pago';
```

---

## 11. Resumo

| Item | Descrição |
|------|-----------|
| Tabelas | `maintenance_daily_workers` (cadastro), `maintenance_daily_worked` (dias trabalhados; incluir coluna `payment` DATE NULL) |
| GET | `/api/maintenance/daily-workers` – lista para autocomplete/modal |
| GET | `/api/maintenance/daily-workers/unpaid-stats` – quantidade e valor total de diárias não pagas |
| POST | `/api/maintenance/daily-workers` – cadastrar diarista |
| POST | `/api/maintenance/daily-workers/registro` – criar registros de dias trabalhados (um por data por diarista) |
| Autenticação | JWT |
| Autorização | level_access 0 ou 4 |
| Ambientes | Homologação e produção (porta 4001 / 4000) |
| Login | Sem alteração no back-end; redirect no front-end para nível 4 |
