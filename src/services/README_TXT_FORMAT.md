# Formato do Arquivo TXT para Download de NFes

## Especificações do Formato

O arquivo TXT gerado segue um formato de **campos de largura fixa** com 101 caracteres por linha, contendo as informações dos produtos das NFes dos agendamentos selecionados.

### Estrutura dos Campos (101 caracteres por linha)

| Campo | Tamanho | Posição | Descrição | Exemplo |
|-------|---------|---------|-----------|---------|
| Pedido de Compra | 30 chars | 1-30 | ID do primeiro agendamento | `123456                        ` |
| NF Fornecedor | 10 chars | 31-40 | Número da NF-e | `123456    ` |
| Série NF | 3 chars | 41-43 | Série da NF (padrão: 001) | `001` |
| Data Emissão | 8 chars | 44-51 | Data no formato DDMMAAAA | `01032024` |
| Valor da Nota | 10 chars | 52-61 | Valor (pode ser vazio) | `          ` |
| Código Mercadoria | 20 chars | 62-81 | Código do produto | `PROD001             ` |
| Quantidade | 10 chars | 82-91 | Quantidade do produto | `10        ` |
| Valor Unitário | 10 chars | 92-101 | Valor sem vírgulas (centavos) | `11035     ` |

### Regras de Formatação

#### 1. Pedido de Compra
- **Fonte**: Número da NF-e (`schedule.number`)
- **Alteração**: Anteriormente usava ID do agendamento, agora usa o número da NF-e

#### 2. Valores Monetários
- **Formato**: Apenas números, sem vírgulas ou pontos decimais
- **Regra**: Truncar para 2 casas decimais (não arredondar) e multiplicar por 100
- **Exemplo**: 
  - R$ 110,3556 → 110,35 → 11035
  - R$ 10,50 → 10,50 → 1050
  - R$ 0,99 → 0,99 → 99

#### 3. Formatação de Data
- **Formato**: DDMMAAAA (com zeros à esquerda quando necessário)
- **Exemplos**:
  - 01/03/2024 → 01032024
  - 15/12/2024 → 15122024  
  - 01/01/2024 → 01012024

#### 4. Preenchimento
- Todos os campos são preenchidos com espaços à direita até atingir o tamanho especificado
- Campos vazios são preenchidos completamente com espaços

### Exemplo de Linha Completa
```
123456                        123456    00101032024          PROD001             10        11035     
```

### Funções de Formatação

#### Formatação de Data
```javascript
function formatDateForTXT(dateValue) {
  const date = new Date(dateValue)
  const day = String(date.getDate()).padStart(2, '0') // Com zeros à esquerda
  const month = String(date.getMonth() + 1).padStart(2, '0') // Com zeros à esquerda
  const year = String(date.getFullYear())
  return day + month + year
}
```

#### Formatação Monetária
```javascript
function formatMonetaryValue(value) {
  // Truncar para 2 casas decimais e multiplicar por 100
  const truncated = Math.floor(numValue * 100) / 100
  const centavos = Math.floor(truncated * 100)
  return String(centavos)
}
```

### Permissões de Acesso

- **Permitido**: Usuários com `level_access === 0` (Desenvolvedores) e `level_access === 2` (Gerentes)
- **Bloqueado**: Usuários com `level_access === 1` (Usuários básicos - apenas cancelam solicitações)

### Validações Aplicadas

1. Todos os agendamentos devem ser do mesmo cliente (CNPJ)
2. Status permitidos: 'Agendado', 'Conferência', 'Cancelado', 'Tratativa'
3. Agendamentos devem conter dados de produtos válidos

### Nome do Arquivo Gerado

Formato: `[CLIENT_NUMBER]_[ID1]l[ID2]l[ID3].txt`

Exemplo: `12345678000199_100l101l102.txt`

Onde:
- `CLIENT_NUMBER`: Número do cliente (CNPJ ou identificador)
- `ID1`, `ID2`, `ID3`: IDs dos agendamentos separados por 'l'

### Modo de Distribuição

**Download Local**: O arquivo é baixado diretamente no navegador do usuário ao clicar em "Baixar TXT".

**Nota**: A integração via FTP está temporariamente desabilitada e será reativada futuramente conforme necessidade.