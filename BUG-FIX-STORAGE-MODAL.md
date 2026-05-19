# 🐛 BUG FIX: Modal de CD Incompatível não aparecia

**Data:** 2025-11-25
**Arquivo:** `src/views/ManagementPage.vue`
**Função afetada:** `getCurrentUser()`

---

## 📋 RESUMO DO PROBLEMA

O modal de aviso de CD (storage) incompatível não estava aparecendo quando um usuário buscava por um agendamento cujo CD não estava cadastrado na lista de CDs permitidos do usuário.

**Sintoma:** Modal de aviso nunca aparecia, mesmo quando deveria.

---

## ⚠️ IMPORTANTE: COMPORTAMENTO DO MODAL

**O modal é INFORMATIVO, não bloqueia a criação da carga!**

- ✅ O agendamento é **adicionado à lista normalmente**
- ✅ O modal aparece **APÓS** a adição (não antes)
- ✅ Usuário é **avisado** sobre a divergência de CD
- ✅ Usuário pode **continuar criando a carga** normalmente
- ℹ️ Objetivo: **Conscientizar** o usuário sobre CDs fora da sua lista usual

---

## 🔍 CAUSA RAIZ

O método `getCurrentUser()` estava **decodificando o JWT token** para obter os dados do usuário, mas o JWT token **NÃO contém** o campo `config` (onde está o array de `storage`).

### Estrutura do JWT Token (backend):

```javascript
// routes/auth.js linhas 72-82
const token = jwt.sign({
  userId: userData.id,
  user: userData.user,
  name: userData.name,
  level_access: userData.level_access
  // config NÃO está aqui!
}, process.env.JWT_SECRET, { expiresIn: '7d' })
```

### O que o backend envia na resposta do login:

```javascript
// routes/auth.js linhas 94-109
const response = {
  message: 'Login realizado com sucesso',
  user: {
    id: userData.id,
    user: userData.user,
    name: userData.name,
    level_access: userData.level_access,
    cli_access: {...},
    config: {...}  // ← Está na resposta, mas não no token!
  },
  token
}
```

### O que o frontend salva no localStorage:

```javascript
// assets/js/login.js linha 29
localStorage.setItem('user', JSON.stringify(data.user))  // Salva tudo incluindo config ✅
```

### O problema no código:

```javascript
// ANTES (INCORRETO) - src/views/ManagementPage.vue linha 2828
getCurrentUser() {
  const token = localStorage.getItem('token')
  if (!token) return null

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))  // ← Decodifica JWT
    return payload  // ← config não está aqui!
  } catch (error) {
    return null
  }
}
```

---

## ✅ SOLUÇÃO IMPLEMENTADA

Modificar `getCurrentUser()` para ler os dados completos do `localStorage('user')` em vez de decodificar o JWT:

```javascript
// DEPOIS (CORRETO) - src/views/ManagementPage.vue linha 2828
getCurrentUser() {
  // Buscar dados completos do usuário do localStorage (inclui config com storage)
  const userStr = localStorage.getItem('user')
  if (!userStr) return null

  try {
    const user = JSON.parse(userStr)
    return user  // ← Agora inclui config com array de storage!
  } catch (error) {
    console.error('Erro ao parsear dados do usuário do localStorage:', error)
    return null
  }
}
```

---

## 🔧 LÓGICA DE VALIDAÇÃO (AVISO INFORMATIVO - NÃO BLOQUEIA)

```javascript
// src/views/ManagementPage.vue linhas 1709-1791
addToConsultedList(schedule) {
  // 1. Buscar usuário (agora com config!)
  const currentUser = this.getCurrentUser()
  const userConfig = currentUser?.config || {}
  const userStorages = userConfig.storage || []  // Ex: ["CR", "ML"]
  const scheduleStorage = schedule.storage || null

  // 2. Verificar CD e marcar se deve mostrar aviso
  let shouldShowStorageWarning = false
  const shouldValidateCD = userStorages.length > 0

  if (shouldValidateCD && !userStorages.includes(scheduleStorage)) {
    // 3. Preparar detalhes do aviso (NÃO bloqueia)
    this.userStorageMismatchDetails = {
      scheduleStorage: scheduleStorage,
      userStorages: userStorages,
      clientName: schedule.client_name || schedule.client
    }
    shouldShowStorageWarning = true
  }

  // 4. Adicionar à lista SEMPRE (não bloqueia)
  this.consultedNfes.push(schedule)

  // 5. Exibir modal de aviso APÓS adicionar (se necessário)
  if (shouldShowStorageWarning) {
    this.showUserStorageMismatchModal = true
  }
}
```

---

## 📊 ESTRUTURA DO CONFIG DO USUÁRIO

```json
{
  "storage": ["CR", "ML"],  // CDs permitidos
  "emailSettings": {
    "ccEmails": [],
    "statusNotifications": {...}
  },
  "uiSettings": {...}
}
```

**Regras:**
- Array vazio `[]`: Usuário tem acesso a **TODOS** os CDs (apenas para levels 0 e 1)
- Array com CDs `["CR", "ML"]`: Usuário só vê agendamentos desses CDs
- Campo ausente: Tratado como array vazio (acesso total)

---

## 🎯 MODAIS RELACIONADOS

### 1. Modal: Aviso de CD Divergente (INFORMATIVO - NÃO BLOQUEIA)
**Arquivo:** `ManagementPage.vue` linha 294
**Variável:** `showUserStorageMismatchModal`
**Quando aparece:** Usuário busca agendamento de CD que não está em `config.storage`
**Comportamento:** Agendamento é **ADICIONADO** normalmente, modal aparece apenas como **AVISO**

```vue
<div v-if="showUserStorageMismatchModal" class="modal-overlay">
  <div class="modal-container modal-alert">
    <div class="modal-header modal-header-warning">
      <h3>Aviso: CD Divergente</h3>
    </div>
    <div class="modal-body">
      <p><strong>O agendamento foi adicionado à lista, mas identificamos uma divergência de CD.</strong></p>
      <p><strong>CD do agendamento:</strong> {{ scheduleStorage }}</p>
      <p><strong>CDs cadastrados:</strong> {{ userStorages.join(', ') }}</p>
      <p><i class="fas fa-lightbulb"></i> Se você trabalha frequentemente com este CD, entre em contato com o administrador.</p>
    </div>
  </div>
</div>
```

### 2. Modal: CD incompatível entre agendamentos
**Arquivo:** `ManagementPage.vue` linha 250
**Variável:** `showStorageMismatchModal`
**Quando aparece:** Tentativa de adicionar agendamento de CD diferente na mesma carga

---

## 🧪 COMO TESTAR

1. **Criar usuário com CDs restritos:**
```sql
UPDATE users SET config = JSON_SET(
  COALESCE(config, '{}'),
  '$.storage',
  JSON_ARRAY('CR')
) WHERE id = <user_id>;
```

2. **Login com esse usuário**

3. **Na página "Cargas", buscar agendamento com CD diferente (ex: ML ou C1)**

4. **Resultado esperado:**
   - ✅ **Agendamento é adicionado à lista normalmente**
   - ✅ Modal de aviso aparece APÓS adicionar
   - ✅ Título do modal: "Aviso: CD Divergente"
   - ✅ Mensagem: "O agendamento foi adicionado à lista, mas identificamos uma divergência de CD"
   - ✅ Exibe CD do agendamento vs CDs cadastrados do usuário
   - ✅ Botão "Entendi" fecha o modal
   - ✅ Usuário pode continuar criando a carga normalmente

---

## 📝 ARQUIVOS MODIFICADOS

1. **`schedule-front-end/src/views/ManagementPage.vue`**
   - Linha 2828-2840: Método `getCurrentUser()` corrigido

---

## ✅ CHECKLIST DE VERIFICAÇÃO

- [x] `getCurrentUser()` corrigido para ler de `localStorage('user')`
- [x] Validação de CD implementada em `addToConsultedList()`
- [x] Modal `showUserStorageMismatchModal` implementado
- [x] Modal `showStorageMismatchModal` implementado (entre agendamentos)
- [x] Logs de debug adicionados (linhas 1715-1718)
- [x] Tratamento de array vazio (acesso total)
- [x] Documentação criada

---

## 🎓 LIÇÕES APRENDIDAS

1. **JWT tokens são leves por design** - não devem conter muitos dados
2. **Dados completos do usuário** devem ser salvos no localStorage após login
3. **Decodificar JWT** só é útil para verificar expiração, não para obter dados completos
4. **Sempre verificar** se os dados necessários estão disponíveis no objeto usado

---

## 📚 REFERÊNCIAS

- Backend: `schedule-back-end/routes/auth.js` (linhas 71-109)
- Frontend Login: `schedule-front-end/assets/js/login.js` (linha 29)
- Validação: `schedule-front-end/src/views/ManagementPage.vue` (linhas 1709-1775)
- Documentação: `schedule-front-end/CLAUDE.md` (User Config)

---

**Status:** ✅ RESOLVIDO
**Impacto:** ALTO - Funcionalidade crítica de validação agora funciona corretamente
**Risco de regressão:** BAIXO - Mudança isolada e bem testada
