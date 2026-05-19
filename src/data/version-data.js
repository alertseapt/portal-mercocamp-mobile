/**
 * Dados de versionamento da aplicação Agenda MercoCamp
 *
 * Estrutura de cada versão:
 * - number: Número da versão (string)
 * - name: Nome descritivo da versão
 * - date: Data de lançamento (ISO string)
 * - type: Tipo da versão (major, minor, patch, beta, alpha)
 * - features: Array de novas funcionalidades
 * - improvements: Array de melhorias
 * - bugfixes: Array de correções de bugs
 * - technical: Array de alterações técnicas
 * - breaking: Array de alterações incompatíveis
 */

export const versionData = [
  {
    number: '0.9.9',
    name: 'Sistema de Paginação e Ordenação do Histórico',
    date: '2025-10-17',
    type: 'minor',
    features: [
      {
        title: 'Paginação da Página de Histórico',
        description:
          'Nova funcionalidade de paginação para visualizar grandes volumes de agendamentos de forma organizada.',
        details: [
          'Paginação com 50 itens por página',
          'Controles de navegação (primeira, anterior, próxima, última)',
          'Números de página com elipses inteligentes',
          'Informações de progresso (mostrando X-Y de Z agendamentos)',
          'Design responsivo e moderno',
          'Auto-scroll para o topo ao trocar de página',
        ],
      },
      {
        title: 'Ordenação Automática por Recentes',
        description:
          'Agendamentos ordenados automaticamente dos mais recentes para os mais antigos.',
        details: [
          'Ordenação por ID em ordem decrescente',
          'Agendamentos mais novos aparecem primeiro',
          'Ordenação aplicada antes da paginação',
          'Performance otimizada com computed properties',
        ],
      },
    ],
    improvements: [
      {
        title: 'Performance e Usabilidade',
        description:
          'Melhorias significativas na experiência do usuário ao navegar pelo histórico.',
        details: [
          'Carregamento mais rápido com apenas 50 itens por vez',
          'Navegação intuitiva entre páginas',
          'Visibilidade clara do total de agendamentos',
          'Integração perfeita com filtros existentes',
          'Reset automático para página 1 ao aplicar filtros',
        ],
      },
      {
        title: 'Interface Visual',
        description: 'Design limpo e profissional dos controles de paginação.',
        details: [
          'Botões estilizados com feedback visual',
          'Indicação clara da página atual',
          'Botões desabilitados quando não aplicáveis',
          'Cores consistentes com o tema da aplicação',
          'Espaçamento adequado para fácil interação',
        ],
      },
    ],
    technical: [
      {
        title: 'Implementação com Vue 3',
        description:
          'Paginação implementada usando computed properties e reatividade do Vue.',
        details: [
          'Computed properties para sortedSchedules e paginatedSchedules',
          'Cálculo dinâmico de totalPages e paginationInfo',
          'Lógica de visiblePages com elipses inteligentes',
          'Métodos de navegação reutilizáveis',
          'Integração com sistema de filtragem existente',
        ],
      },
      {
        title: 'Otimização de Performance',
        description:
          'Código otimizado para lidar eficientemente com grandes volumes de dados.',
        details: [
          'Ordenação in-memory com Array.sort()',
          'Slicing eficiente para paginação',
          'Computed properties com cache automático',
          'Renderização de apenas 50 itens por vez',
          'Sem impacto no carregamento inicial de dados',
        ],
      },
    ],
  },
  {
    number: '0.9.5',
    name: 'Filtros Avançados e Correções de Interface',
    date: '2025-09-22',
    type: 'minor',
    features: [
      {
        title: 'Filtro por Cliente',
        description:
          'Novo filtro para visualizar agendamentos por cliente específico.',
        details: [
          'Filtro por cliente disponível na página Principal',
          'Filtro por cliente disponível na página de Histórico',
          'Interface unificada com modal de seleção de clientes',
          'Busca por nome, CNPJ ou código Corpem',
          'Botão para limpar filtro facilmente',
          'Indicação visual do cliente selecionado',
        ],
      },
      {
        title: 'Contador de Agendamentos',
        description: 'Visualização da quantidade de agendamentos listados.',
        details: [
          'Contador na página Principal mostrando total de agendamentos',
          'Contador na página de Histórico com formatação consistente',
          'Indicação quando filtros estão ativos',
          'Texto responsivo (singular/plural)',
        ],
      },
    ],
    improvements: [
      {
        title: 'Interface Padronizada',
        description:
          'Consistência visual entre diferentes páginas da aplicação.',
        details: [
          'Fontes padronizadas entre páginas Principal e Histórico',
          'Modais com aparência unificada',
          'Truncamento de texto para nomes longos de clientes',
          'Responsividade melhorada dos componentes',
        ],
      },
      {
        title: 'Otimização de Performance',
        description: 'Melhorias na velocidade de carregamento e filtragem.',
        details: [
          'Cache global de clientes para evitar requisições desnecessárias',
          'Filtragem otimizada por nome de cliente',
          'Carregamento inteligente de dados de clientes',
        ],
      },
    ],
    bugfixes: [
      {
        title: 'Correção de Modais Duplicadas',
        description:
          'Resolvido problema de múltiplas janelas "Processamento de arquivos".',
        details: [
          'Implementado gerenciamento centralizado de timers',
          'Prevenção de abertura de modais duplicadas',
          'Limpeza automática de recursos no ciclo de vida do componente',
          'Logs melhorados para debugging',
        ],
      },
      {
        title: 'Correções de Renderização',
        description:
          'Solucionados erros de interface e inconsistências visuais.',
        details: [
          'Correção de erro de função formatCNPJ não encontrada',
          'Remoção de ícones desnecessários em inputs de busca',
          'Alinhamento correto de elementos de interface',
          'Tratamento adequado de estados de carregamento',
        ],
      },
    ],
    technical: [
      {
        title: 'Melhorias no Código',
        description: 'Refatoração e otimização do código fonte.',
        details: [
          'Componentização melhorada para reutilização',
          'Padronização de eventos entre componentes',
          'Gerenciamento de estado mais eficiente',
          'Implementação de beforeUnmount para limpeza de recursos',
        ],
      },
    ],
  },
  {
    number: '0.9.1',
    name: 'Segurança Aprimorada e Limpeza de Interface',
    date: '2025-09-16',
    type: 'minor',
    features: [
      {
        title: 'Login Simplificado',
        description: 'Interface de login mais limpa e focada na segurança.',
        details: [
          'Removidas opções "Lembrar de mim" e "Esqueceu a senha?"',
          'Interface mais limpa e profissional',
          'Processo de login mais direto e seguro',
          'Redução de funcionalidades desnecessárias para ambiente corporativo',
        ],
      },
    ],
    improvements: [
      {
        title: 'Sistema de Conexão com Banco Mais Robusto',
        description:
          'Melhorias significativas na estabilidade e performance do banco de dados.',
        details: [
          'Aumento do pool de conexões de 10 para 25 conexões simultâneas',
          'Sistema inteligente de retry para erros de "Too many connections"',
          'Delays adaptativos para diferentes tipos de erro',
          'Timeout otimizado para queries mais rápidas',
          'Logs detalhados para monitoramento de performance',
        ],
      },
      {
        title: 'Correções de Acesso de Usuários',
        description:
          'Resolvidos problemas onde usuários com permissões específicas não viam seus agendamentos.',
        details: [
          'Correção na lógica de fallback do sistema de autenticação',
          'Usuários restritos não podem mais usar token fallback sem cli_access',
          'Melhor tratamento de cache de usuários',
          'Sistema mais confiável de verificação de permissões',
          'Logs aprimorados para debugging de acessos',
        ],
      },
    ],
    technical: [
      {
        title: 'Otimizações de Middleware de Autenticação',
        description: 'Sistema de autenticação mais seguro e confiável.',
        details: [
          'Prevenção de bypass incorreto para usuários restritos',
          'Timeout adaptativo baseado na saúde do banco',
          'Cache de 15 minutos para melhor performance',
          'Tratamento robusto de falhas de conexão com banco',
        ],
      },
      {
        title: 'Limpeza de Configurações MySQL',
        description:
          'Remoção de configurações não suportadas e otimização da conexão.',
        details: [
          'Removidas configurações inválidas (acquireTimeout, releaseTimeout)',
          'Pool de conexões otimizado para alta concorrência',
          'Eliminação de warnings do MySQL2',
          'Configuração mais limpa e estável',
        ],
      },
    ],
  },
  {
    number: '0.5.0',
    name: 'Agendamento em Lote e Otimizações Massivas',
    date: '2025-09-09',
    type: 'minor',
    features: [
      {
        title: 'Sistema de Agendamento em Lote',
        description:
          'Nova funcionalidade completa para processamento de múltiplas NFes simultaneamente com configuração passo a passo.',
        details: [
          'Modal dedicado para configuração de produtos em lote',
          'Navegação paginada entre NFes com progresso visual',
          'Cache de sessão para reutilização de produtos configurados',
          'Pré-preenchimento automático de produtos já cadastrados',
          'Salvamento automático após cada NFe configurada',
          'Processamento otimizado com feedback de performance',
        ],
      },
      {
        title: 'Cache Inteligente de Produtos',
        description:
          'Sistema avançado de cache que memoriza produtos configurados durante a sessão de lote.',
        details: [
          'Cache em memória para produtos configurados na mesma sessão',
          'Pré-preenchimento automático em NFes subsequentes',
          'Atualização em tempo real durante edição',
          'Limpeza automática ao iniciar nova sessão',
          'Logs detalhados para debugging do cache',
        ],
      },
    ],
    improvements: [
      {
        title: 'Performance de Banco Massivamente Otimizada',
        description:
          'Reescrita completa do sistema de salvamento de produtos para máxima performance.',
        details: [
          'Consultas em lote substituindo loops sequenciais',
          'Transações SQL para operações atômicas',
          'Mapeamento com Map() para lookup O(1)',
          'Redução de 8-16x no tempo de processamento',
          'Métricas de performance em tempo real (produtos/segundo)',
          'Timeout otimizado para operações rápidas',
        ],
      },
      {
        title: 'Interface de Usuário Aprimorada',
        description:
          'Melhorias significativas na experiência visual e usabilidade.',
        details: [
          'Checkboxes maiores e mais visíveis (20px)',
          'Cores diferenciadas para produtos bloqueados vs checkbox selecionada',
          'Layout reorganizado nos controles de produtos',
          'Texto de aviso em vermelho e negrito para maior destaque',
          'Título da sidebar alterado para "Hub de Agendamentos"',
          'Remoção de elementos visuais desnecessários',
        ],
      },
      {
        title: 'Sistema de Logs Avançado',
        description:
          'Logs detalhados para monitoramento e debugging de performance.',
        details: [
          'Logs de performance com timestamps',
          'Métricas de velocidade de processamento',
          'Rastreamento de operações de cache',
          'Feedback visual de progresso em tempo real',
          'Logs separados para frontend e backend',
        ],
      },
    ],
    technical: [
      {
        title: 'Arquitetura de Cache Otimizada',
        description:
          'Implementação de sistema de cache em memória para sessões de lote.',
        details: [
          'Utilização de JavaScript Map para performance máxima',
          'Chaves compostas (código_fornecedor + CNPJ)',
          'Limpeza automática de cache obsoleto',
          'Sincronização com dados do banco de dados',
        ],
      },
      {
        title: 'Otimizações de Backend SQL',
        description:
          'Reescrita completa das operações de banco para operações em lote.',
        details: [
          'Query única com IN() para buscar produtos existentes',
          'Transações START/COMMIT/ROLLBACK automáticas',
          'Preparação de dados em lote antes das operações',
          'Tratamento robusto de erros com rollback',
          'Métricas de performance integradas',
        ],
      },
    ],
  },
  {
    number: '0.0.4',
    name: 'Sistema de Versionamento e Correções Críticas',
    date: '2025-09-08',
    type: 'minor',
    features: [
      {
        title: 'Sistema de Versionamento',
        description:
          'Nova funcionalidade completa para visualização e acompanhamento das versões da aplicação.',
        details: [
          'Página dedicada para notas de atualização',
          'Seletor de versões para consulta do histórico',
          'Interface moderna com timeline de versões',
          'Categorização de alterações (funcionalidades, melhorias, correções)',
          'Integração com menu principal da aplicação',
        ],
      },
      {
        title: 'Alteração de Status na Janela de Informações',
        description:
          'Implementada funcionalidade para alterar status do agendamento diretamente na janela de informações da NF-e.',
        details: [
          'Botão "Em Tratativa" para marcação rápida',
          'Dropdown para alteração de status quando em tratativa',
          'Validação de permissões por nível de usuário',
          'Integração com histórico de alterações',
          'Notificações de feedback para o usuário',
        ],
      },
    ],
    improvements: [
      {
        title: 'Refresh Automático de Página',
        description:
          'Implementado refresh automático após alterações para garantir dados sempre atualizados.',
        details: [
          'Refresh após edição de agendamentos (500ms delay)',
          'Refresh após alteração de status (1000ms delay)',
          'Transições suaves com fechamento de modais',
          'Notificações visíveis antes da atualização',
        ],
      },
      {
        title: 'Integração CORPEM Aprimorada',
        description:
          'Melhorada a integração com sistema CORPEM para evitar rejeições por CNPJs iguais.',
        details: [
          'Detecção automática quando CGCREM = CGCCLIWMS',
          'Alteração do CGCREM para 99999999999999 quando necessário',
          'Logs detalhados para auditoria das alterações',
          'Preservação do CNPJ original no banco de dados',
        ],
      },
    ],
    bugfixes: [
      {
        title: 'Handlers de Evento Ausentes',
        description:
          'Corrigido problema crítico onde botões de alteração de status não funcionavam na janela de informações.',
        details: [
          'Adicionados handlers @mark-tratativa e @change-status',
          'Implementados métodos handleMarkTratativa() e handleChangeStatus()',
          'Criada propriedade computada currentUser()',
          'Integração completa com sistema de notificações',
        ],
      },
    ],
    technical: [
      {
        title: 'Melhoria na Arquitetura de Componentes',
        description:
          'Aprimorada a comunicação entre componentes pai e filho para eventos de alteração.',
        details: [
          'Implementação de event emitters estruturados',
          'Tratamento robusto de erros com feedback',
          'Logs detalhados para debugging',
          'Compatibilidade mantida com funcionalidades existentes',
        ],
      },
    ],
  },
  {
    number: '0.0.3',
    name: 'Otimizações de Performance e UX',
    date: '2025-09-08',
    type: 'patch',
    improvements: [
      {
        title: 'Performance da Lista de Agendamentos',
        description:
          'Otimizada a renderização da lista principal de agendamentos para melhor performance.',
        details: [
          'Implementada virtualização para listas grandes',
          'Lazy loading de dados conforme scroll',
          'Cache inteligente de requisições',
          'Redução de 60% no tempo de carregamento inicial',
        ],
      },
      {
        title: 'Interface do Usuário Aprimorada',
        description:
          'Melhorias significativas na experiência do usuário e responsividade.',
        details: [
          'Design responsivo para dispositivos móveis',
          'Animações suaves em transições',
          'Feedback visual aprimorado para ações',
          'Consistência visual entre componentes',
        ],
      },
    ],
    bugfixes: [
      {
        title: 'Filtros de Data',
        description:
          'Corrigido problema onde filtros de data não eram aplicados corretamente.',
        details: [
          'Validação de intervalo de datas',
          'Formatação consistente de datas',
          'Correção de timezone em filtros',
        ],
      },
      {
        title: 'Modal de Edição',
        description:
          'Resolvidos problemas de validação no modal de edição de agendamentos.',
        details: [
          'Validação de campos obrigatórios aprimorada',
          'Correção de dados não salvos',
          'Melhor tratamento de erros de API',
        ],
      },
    ],
  },
  {
    number: '0.0.2',
    name: 'Sistema de Usuários e Permissões',
    date: '2025-09-08',
    type: 'minor',
    features: [
      {
        title: 'Sistema de Autenticação',
        description:
          'Implementado sistema completo de login e controle de acesso.',
        details: [
          'Tela de login com validação',
          'Sistema de tokens JWT',
          'Logout automático por inatividade',
          'Redirecionamento baseado em perfil',
        ],
      },
      {
        title: 'Níveis de Permissão',
        description:
          'Sistema de permissões baseado em níveis de acesso do usuário.',
        details: [
          'Nível 1: Usuário básico (visualização)',
          'Nível 5: Usuário avançado (edição)',
          'Nível 9: Administrador (configurações)',
          'Controle granular de funcionalidades',
        ],
      },
    ],
    improvements: [
      {
        title: 'Sidebar de Navegação',
        description:
          'Nova sidebar com menu estruturado e informações do usuário.',
        details: [
          'Menu expansível com ícones',
          'Indicação de página ativa',
          'Perfil do usuário com dropdown',
          'Responsive design para mobile',
        ],
      },
    ],
    technical: [
      {
        title: 'Arquitetura de Autenticação',
        description:
          'Implementada infraestrutura robusta para autenticação e autorização.',
        details: [
          'Middleware de autenticação no backend',
          'Interceptors axios para tokens',
          'Guards de rota baseados em permissão',
          'Criptografia segura de senhas',
        ],
      },
    ],
  },
  {
    number: '0.0.1',
    name: 'Versão Inicial - MVP',
    date: '2025-09-08',
    type: 'major',
    features: [
      {
        title: 'Gestão de Agendamentos',
        description:
          'Funcionalidade principal para criar, editar e visualizar agendamentos de entregas.',
        details: [
          'Lista de agendamentos com filtros',
          'Criação de novos agendamentos',
          'Edição de agendamentos existentes',
          'Sistema de status de agendamento',
          'Integração com dados de NF-e',
        ],
      },
      {
        title: 'Upload de XML',
        description:
          'Sistema para upload e processamento de arquivos XML de Notas Fiscais.',
        details: [
          'Interface drag-and-drop para upload',
          'Validação de arquivos XML',
          'Extração automática de dados da NF-e',
          'Processamento em lote de múltiplos arquivos',
        ],
      },
      {
        title: 'Dashboard Principal',
        description:
          'Painel principal com visão geral dos agendamentos e estatísticas.',
        details: [
          'Cards de estatísticas em tempo real',
          'Gráficos de status de agendamentos',
          'Atividades recentes',
          'Entregas pendentes destacadas',
        ],
      },
    ],
    improvements: [
      {
        title: 'Sistema Funciona em Qualquer Tela',
        description: 'O sistema se adapta ao tamanho da sua tela.',
        details: [
          'Funciona bem no computador e celular',
          'Botões fáceis de tocar no celular',
          'Navegação simples e intuitiva',
        ],
      },
    ],
    technical: [
      {
        title: 'Base do Sistema',
        description:
          'Construímos o sistema com tecnologias modernas e confiáveis.',
        details: [
          'Sistema web moderno e rápido',
          'Banco de dados seguro',
          'Atualizações automáticas do sistema',
        ],
      },
      {
        title: 'Conexão com CORPEM',
        description: 'Sistema conectado ao CORPEM para trocar informações.',
        details: [
          'Sincroniza dados automaticamente',
          'Produtos atualizados em tempo real',
          'Registra todas as operações',
        ],
      },
    ],
  },
]

/**
 * Função utilitária para obter dados de uma versão específica
 * @param {string} versionNumber - Número da versão (ex: '0.0.4')
 * @returns {object|null} Dados da versão ou null se não encontrada
 */
export function getVersionData(versionNumber) {
  return versionData.find(version => version.number === versionNumber) || null
}

/**
 * Função utilitária para obter a versão mais recente
 * @returns {object} Dados da versão mais recente
 */
export function getLatestVersion() {
  return versionData[0] // Primeiro item é sempre a versão mais recente
}

/**
 * Função utilitária para obter todas as versões de um tipo específico
 * @param {string} type - Tipo da versão (major, minor, patch, beta, alpha)
 * @returns {array} Array com versões do tipo especificado
 */
export function getVersionsByType(type) {
  return versionData.filter(version => version.type === type)
}

/**
 * Configuração atual da aplicação
 */
export const currentVersion = {
  number: '0.9.9',
  environment: process.env.NODE_ENV || 'development',
  buildDate: new Date().toISOString(),
  features: {
    versionControl: true,
    corpemIntegration: true,
    userPermissions: true,
    xmlUpload: true,
    batchScheduling: true,
    sessionCache: true,
    performanceOptimization: true,
    enhancedSecurity: true,
    improvedAuthentication: true,
    robustDatabaseConnection: true,
  },
}
