<template>
  <aside :class="sidebarClasses" :style="sidebarStyles">
    <div class="sidebar-logo expanded">
      <div class="logo-texts">
        <div class="logo-title">Ambiente de Agendamentos</div>
      </div>
    </div>

    <nav class="sidebar-menu">
      <div class="main-menu">
        <div
          v-for="item in filteredMainMenuItems"
          :key="item.id"
          :class="[
            'menu-item',
            {
              active: isMenuActive(item.id),
              'has-submenu': item.submenu && item.submenu.length > 0,
            },
          ]"
        >
          <!-- Menu principal -->
          <div
            @click="
              handleMenuClick(item.id, item.submenu && item.submenu.length > 0)
            "
            class="menu-main"
          >
            <div class="icon-container">
              <i :class="item.icon"></i>
              <!-- Badge de contagem de cargas -->
              <span v-if="item.showBadge && loadsCount > 0" class="badge-count">
                {{ loadsCount }}
              </span>
            </div>
            <span class="menu-label">{{ item.label }}</span>
            <!-- Seta para indicar submenu -->
            <i
              v-if="item.submenu && item.submenu.length > 0"
              :class="[
                'submenu-arrow',
                'fa',
                isSubmenuExpanded(item.id)
                  ? 'fa-chevron-up'
                  : 'fa-chevron-down',
              ]"
            ></i>
          </div>

          <!-- Submenu -->
          <transition name="submenu-slide">
            <div
              v-if="
                item.submenu &&
                item.submenu.length > 0 &&
                isSubmenuExpanded(item.id)
              "
              class="submenu"
            >
              <div
                v-for="subitem in item.submenu"
                :key="subitem.id"
                @click="handleSubmenuClick(subitem.id)"
                :class="['submenu-item', { active: isMenuActive(subitem.id) }]"
              >
                <div class="submenu-icon-container">
                  <i :class="subitem.icon"></i>
                </div>
                <span class="submenu-label">{{ subitem.label }}</span>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <div class="bottom-menu">
        <div
          v-for="item in filteredBottomMenuItems"
          :key="item.id"
          :class="['menu-item', { active: isMenuActive(item.id) }]"
        >
          <!-- Menu inferior -->
          <div @click="handleMenuClick(item.id)" class="menu-main">
            <div class="icon-container">
              <i :class="item.icon"></i>
            </div>
            <span class="menu-label">{{ item.label }}</span>
          </div>
        </div>
      </div>
    </nav>
  </aside>
</template>

<script>
import logoImg from '@/assets/images/logo.png'

export default {
  name: 'SidebarComponent',
  props: {
    user: {
      type: Object,
      default: () => ({}),
    },
    activeMenu: {
      type: String,
      default: 'dashboard',
    },
    collapsed: {
      type: Boolean,
      default: false,
    },
    isMobile: {
      type: Boolean,
      default: false,
    },
    loadsCount: {
      type: Number,
      default: 0,
    },
  },

  data() {
    return {
      expanded: true,
      expandedMenus: {}, // Controla quais menus estão expandidos
      menuItems: [
        {
          id: 'dashboard',
          icon: 'fa fa-home',
          label: 'Principal',
          submenu: [],
        },
        {
          id: 'agendamento',
          icon: 'fa fa-history',
          label: 'Histórico',
          submenu: [],
        },
        {
          id: 'produtos',
          icon: 'fa fa-boxes',
          label: 'Produtos',
          submenu: [],
        },
        {
          id: 'logs-corpem',
          icon: 'fas fa-list-alt',
          label: 'Logs CORPEM',
          submenu: [],
          requiresLevel: 0, // Apenas usuários nível 0
        },
        {
          id: 'administracao',
          icon: 'fa fa-users-cog',
          label: 'Administração',
          submenu: [],
          requiresLevel: 0, // Apenas usuários nível 0
        },
        {
          id: 'gestao',
          icon: 'fa fa-search-plus',
          label: 'Recepção',
          submenu: [],
          requiresNonLevel1: true, // Para usuários nível 0, 2 e 9 (não level 1)
        },
        {
          id: 'expedicao',
          icon: 'fa fa-truck',
          label: 'Expedição',
          submenu: [
            {
              id: 'criar-pedido',
              icon: 'fa fa-plus',
              label: 'Criar pedido',
            },
            {
              id: 'pedidos',
              icon: 'fa fa-list',
              label: 'Pedidos Ativos',
            },
            {
              id: 'historico-expedicao',
              icon: 'fa fa-history',
              label: 'Histórico',
            },
          ],
          requiresLevel: 0, // Apenas usuários nível 0 (desenvolvedores)
        },
      ],
      bottomMenuItems: [
        {
          id: 'ajuda',
          icon: 'fa fa-question-circle',
          label: 'Ajuda',
          submenu: [],
        },
        {
          id: 'versao',
          icon: 'fa fa-code-branch',
          label: 'Versão 0.9.9',
          submenu: [],
          requiresLevel: 0, // Apenas desenvolvedores (nível 0)
        },
      ],
    }
  },

  mounted() {
    // Sidebar montada
  },

  watch: {
    loadsCount(newVal, oldVal) {
      // Contador de cargas atualizado
    },
  },

  computed: {
    sidebarClasses() {
      return {
        sidebar: true,
        'sidebar-expanded': !this.collapsed && !this.isMobile,
        'sidebar-collapsed': this.collapsed && !this.isMobile,
        'sidebar-mobile': this.isMobile,
        'sidebar-mobile-open': this.isMobile && !this.collapsed,
        'sidebar-mobile-closed': this.isMobile && this.collapsed,
      }
    },

    sidebarStyles() {
      if (this.isMobile) {
        // Em mobile, controla visibilidade via transform
        return {
          transform: this.collapsed ? 'translateX(-100%)' : 'translateX(0)',
        }
      }
      return {}
    },

    logoUrl() {
      return logoImg
    },

    userRole() {
      if (!this.user) return 'Usuário'

      switch (this.user.level_access) {
        case 0:
          return 'Desenvolvedor'
        case 1:
          return 'Usuário'
        case 2:
          return 'Administrador'
        case 3:
          return 'Gerente'
        default:
          return 'Usuário'
      }
    },

    filteredMainMenuItems() {
      if (!this.user || this.user.level_access === undefined) {
        return this.menuItems.filter(item => !item.requiresLevel)
      }

      return this.menuItems.filter(item => {
        if (item.requiresLevel !== undefined) {
          // Se requiresLevel é um array, verificar se o nível do usuário está no array
          if (Array.isArray(item.requiresLevel)) {
            return item.requiresLevel.includes(this.user.level_access)
          }
          // Se é um número único, verificar igualdade
          return this.user.level_access === item.requiresLevel
        }

        if (item.requiresNonLevel1 !== undefined) {
          // Para usuários que NÃO são level 1 (permite level 0, level 2 e level 9)
          return this.user.level_access !== 1
        }

        return true
      })
    },

    filteredBottomMenuItems() {
      if (!this.user || this.user.level_access === undefined) {
        return this.bottomMenuItems.filter(item => !item.requiresLevel)
      }

      return this.bottomMenuItems.filter(item => {
        if (item.requiresLevel !== undefined) {
          // Se requiresLevel é um array, verificar se o nível do usuário está no array
          if (Array.isArray(item.requiresLevel)) {
            return item.requiresLevel.includes(this.user.level_access)
          }
          // Se é um número único, verificar igualdade
          return this.user.level_access === item.requiresLevel
        }

        if (item.requiresNonLevel1 !== undefined) {
          // Para usuários que NÃO são level 1 (permite level 0, level 2 e level 9)
          return this.user.level_access !== 1
        }

        return true
      })
    },
  },

  methods: {
    handleMenuClick(menuId, hasSubmenu = false) {
      if (hasSubmenu) {
        // Se o item tem submenu, apenas alterna a expansão
        this.toggleSubmenu(menuId)
      } else {
        // Se não tem submenu, emite o evento normalmente
        this.$emit('menu-click', menuId)
      }
    },

    handleSubmenuClick(submenuId) {
      // Emite evento para item do submenu
      this.$emit('menu-click', submenuId)
    },

    toggleSubmenu(menuId) {
      // Alterna o estado de expansão do submenu (Vue 3 - reatividade automática)
      this.expandedMenus[menuId] = !this.expandedMenus[menuId]
    },

    isSubmenuExpanded(menuId) {
      return !!this.expandedMenus[menuId]
    },

    handleLogout() {
      this.$emit('logout')
    },

    isMenuActive(menuId) {
      return this.activeMenu === menuId
    },
  },
}
</script>

<style scoped>
/* Estilos com maior especificidade para sobrescrever CSS global */
#app .sidebar,
.sidebar {
  background: linear-gradient(135deg, #1c44f5 0%, #0077ff 100%) !important;
  min-height: 100vh !important;
  height: 100vh !important;
  position: fixed !important;
  left: 0 !important;
  top: 0 !important;
  z-index: 1050 !important;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.15) !important;
  transition: width 0.3s !important;
  display: flex !important;
  flex-direction: column !important;
  width: 260px !important;
  font-family: 'Poppins', sans-serif !important;
}

#app .sidebar-logo,
.sidebar-logo {
  display: flex !important;
  align-items: center !important;
  border-bottom: 1px solid #3b82f6 !important;
  padding: 24px 18px 18px 18px !important;
  transition: all 0.3s !important;
}

#app .logo-box,
.logo-box {
  background: rgba(255, 255, 255, 0.08) !important;
  border-radius: 16px !important;
  width: 48px !important;
  height: 48px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border: 1.5px solid rgba(255, 255, 255, 0.18) !important;
  margin-right: 0 !important;
}

#app .logo-texts,
.logo-texts {
  margin-left: 18px !important;
}

#app .logo-title,
.logo-title {
  font-weight: 600 !important;
  font-size: 1.2rem !important;
  color: #fff !important;
  font-family: 'Poppins', sans-serif !important;
}

#app .sidebar-menu,
.sidebar-menu {
  flex: 1 !important;
  padding: 18px 0 0 0 !important;
  overflow-y: auto !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
}

#app .main-menu,
.main-menu {
  display: flex !important;
  flex-direction: column !important;
  gap: 2px !important;
}

#app .bottom-menu,
.bottom-menu {
  display: flex !important;
  flex-direction: column !important;
  gap: 2px !important;
  margin-top: auto !important;
}

#app .menu-item,
.menu-item {
  display: flex !important;
  flex-direction: column !important;
  position: relative !important;
  margin: 0 8px 6px 8px !important;
  border-radius: 12px !important;
  transition:
    background 0.2s,
    box-shadow 0.2s !important;
}

#app .menu-main,
.menu-main {
  display: flex !important;
  align-items: center !important;
  cursor: pointer !important;
  padding: 13px 14px !important;
  border-radius: 12px !important;
  transition: background 0.2s !important;
  position: relative !important;
}

#app .menu-item.has-submenu .menu-main,
.menu-item.has-submenu .menu-main {
  padding-right: 36px !important;
}

#app .menu-item.active > .menu-main,
.menu-item.active > .menu-main {
  background: rgba(255, 255, 255, 0.18) !important;
  box-shadow: 0 2px 8px 0 rgba(59, 130, 246, 0.08) !important;
}

#app .menu-item:hover > .menu-main,
.menu-item:hover > .menu-main {
  background: rgba(255, 255, 255, 0.12) !important;
}

#app .icon-container,
.icon-container {
  width: 36px !important;
  height: 36px !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin-right: 14px !important;
  font-size: 1.2rem !important;
  color: #fff !important;
  position: relative !important;
}

#app .icon-container i,
.icon-container i {
  font-size: 1.2rem !important;
  color: #fff !important;
  display: inline-block !important;
  font-style: normal !important;
  font-variant: normal !important;
  text-rendering: auto !important;
  -webkit-font-smoothing: antialiased !important;
}

#app .menu-label,
.menu-label {
  font-weight: 500 !important;
  color: #fff !important;
  font-size: 1rem !important;
  letter-spacing: 0.01em !important;
  font-family: 'Poppins', sans-serif !important;
  flex: 1 !important;
}

#app .user-info,
.user-info {
  display: flex !important;
  align-items: center !important;
  padding: 16px 18px !important;
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
  margin-top: auto !important;
}

#app .user-avatar,
.user-avatar {
  width: 40px !important;
  height: 40px !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin-right: 12px !important;
  color: #fff !important;
  font-size: 1.1rem !important;
}

#app .user-details,
.user-details {
  flex: 1 !important;
}

#app .user-name,
.user-name {
  color: #fff !important;
  font-weight: 500 !important;
  font-size: 0.95rem !important;
  margin-bottom: 2px !important;
  font-family: 'Poppins', sans-serif !important;
}

#app .user-role,
.user-role {
  color: rgba(255, 255, 255, 0.7) !important;
  font-size: 0.8rem !important;
  font-family: 'Poppins', sans-serif !important;
}

#app .logout-btn,
.logout-btn {
  background: rgba(239, 68, 68, 0.2) !important;
  border: 1px solid rgba(239, 68, 68, 0.3) !important;
  color: #fca5a5 !important;
  width: 36px !important;
  height: 36px !important;
  border-radius: 8px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;
  transition: all 0.2s !important;
}

#app .logout-btn:hover,
.logout-btn:hover {
  background: rgba(239, 68, 68, 0.3) !important;
  border-color: rgba(239, 68, 68, 0.5) !important;
  color: #fecaca !important;
}

#app .logo-shine,
.logo-shine {
  position: relative !important;
  overflow: hidden !important;
  border-radius: 12px !important;
  display: inline-block !important;
}

#app .logo-shine::after,
.logo-shine::after {
  content: '' !important;
  position: absolute !important;
  top: -50% !important;
  left: -50% !important;
  width: 200% !important;
  height: 200% !important;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0) 30%,
    rgba(255, 255, 255, 0.6) 50%,
    rgba(255, 255, 255, 0) 70%
  ) !important;
  transform: translateX(-100%) rotate(45deg) !important;
  animation: shine 3s infinite !important;
  z-index: 1 !important;
  pointer-events: none !important;
}

@keyframes shine {
  0% {
    transform: translateX(-100%) rotate(45deg);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(100%) rotate(45deg);
    opacity: 0;
  }
}

#app .sidebar-logo-img,
.sidebar-logo-img {
  width: 44px !important;
  height: 44px !important;
  object-fit: contain !important;
  border-radius: 12px !important;
  background: transparent !important;
  display: block !important;
  position: relative !important;
  z-index: 0 !important;
}

/* Efeito hover na logo para intensificar o brilho */
#app .logo-shine:hover::after,
.logo-shine:hover::after {
  animation-duration: 1.5s !important;
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0) 20%,
    rgba(255, 255, 255, 0.8) 50%,
    rgba(255, 255, 255, 0) 80%
  ) !important;
}

/* Container da logo */
#app .logo-box,
.logo-box {
  width: 44px !important;
  height: 44px !important;
  border-radius: 12px !important;
  overflow: hidden !important;
  position: relative !important;
  display: inline-block !important;
}

/* Garantir que todos os ícones sejam visíveis */
#app .fa,
.fa {
  font-family: 'Font Awesome 5 Free' !important;
  font-weight: 900 !important;
  display: inline-block !important;
  font-style: normal !important;
  font-variant: normal !important;
  text-rendering: auto !important;
  -webkit-font-smoothing: antialiased !important;
}

/* Regra específica para ícones do sidebar */
#app .sidebar .fa,
.sidebar .fa {
  font-family: 'Font Awesome 5 Free' !important;
  font-weight: 900 !important;
  display: inline-block !important;
  font-style: normal !important;
  font-variant: normal !important;
  text-rendering: auto !important;
  -webkit-font-smoothing: antialiased !important;
  color: #fff !important;
}

/* Regra específica para ícones dentro dos containers */
#app .sidebar .icon-container .fa,
.sidebar .icon-container .fa {
  font-family: 'Font Awesome 5 Free' !important;
  font-weight: 900 !important;
  display: inline-block !important;
  font-style: normal !important;
  font-variant: normal !important;
  text-rendering: auto !important;
  -webkit-font-smoothing: antialiased !important;
  color: #fff !important;
  font-size: 1.2rem !important;
}

/* Badge de contagem de cargas */
#app .badge-count,
.badge-count {
  position: absolute !important;
  top: -6px !important;
  right: -6px !important;
  background: #ef4444 !important;
  color: #fff !important;
  font-size: 0.7rem !important;
  font-weight: 700 !important;
  min-width: 20px !important;
  height: 20px !important;
  border-radius: 10px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 5px !important;
  border: 2px solid #1c44f5 !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
  z-index: 10 !important;
  animation: badge-pulse 2s ease-in-out infinite !important;
}

/* Seta de submenu */
#app .submenu-arrow,
.submenu-arrow {
  position: absolute !important;
  right: 14px !important;
  font-size: 0.75rem !important;
  color: rgba(255, 255, 255, 0.7) !important;
  transition: transform 0.3s ease !important;
}

/* Container do submenu */
#app .submenu,
.submenu {
  display: flex !important;
  flex-direction: column !important;
  margin-top: 4px !important;
  padding-left: 12px !important;
  overflow: hidden !important;
}

/* Itens do submenu */
#app .submenu-item,
.submenu-item {
  display: flex !important;
  align-items: center !important;
  padding: 10px 14px 10px 18px !important;
  margin: 2px 0 !important;
  border-radius: 8px !important;
  cursor: pointer !important;
  transition: background 0.2s !important;
  background: rgba(255, 255, 255, 0.05) !important;
}

#app .submenu-item:hover,
.submenu-item:hover {
  background: rgba(255, 255, 255, 0.12) !important;
}

#app .submenu-item.active,
.submenu-item.active {
  background: rgba(255, 255, 255, 0.18) !important;
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.1) !important;
}

/* Ícone do submenu */
#app .submenu-icon-container,
.submenu-icon-container {
  width: 28px !important;
  height: 28px !important;
  background: rgba(255, 255, 255, 0.08) !important;
  border-radius: 6px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  margin-right: 12px !important;
  font-size: 0.95rem !important;
  color: #fff !important;
}

#app .submenu-icon-container i,
.submenu-icon-container i {
  font-size: 0.95rem !important;
  color: #fff !important;
}

/* Label do submenu */
#app .submenu-label,
.submenu-label {
  font-weight: 450 !important;
  color: rgba(255, 255, 255, 0.95) !important;
  font-size: 0.9rem !important;
  letter-spacing: 0.01em !important;
  font-family: 'Poppins', sans-serif !important;
}

/* Animação de transição do submenu */
.submenu-slide-enter-active,
.submenu-slide-leave-active {
  transition: all 0.3s ease !important;
  max-height: 300px !important;
  opacity: 1 !important;
}

.submenu-slide-enter,
.submenu-slide-leave-to {
  max-height: 0 !important;
  opacity: 0 !important;
  margin-top: 0 !important;
}

@keyframes badge-pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 3px 8px rgba(239, 68, 68, 0.4);
  }
}

/* Responsividade da Sidebar */
@media (max-width: 992px) {
  #app .sidebar:not(.sidebar-mobile),
  .sidebar:not(.sidebar-mobile) {
    width: 80px !important;
  }

  #app .sidebar:not(.sidebar-mobile) .logo-texts,
  .sidebar:not(.sidebar-mobile) .logo-texts,
  #app .sidebar:not(.sidebar-mobile) .menu-label,
  .sidebar:not(.sidebar-mobile) .menu-label {
    opacity: 0 !important;
    display: none !important;
  }

  #app .sidebar.sidebar-expanded .logo-texts,
  .sidebar.sidebar-expanded .logo-texts,
  #app .sidebar.sidebar-expanded .menu-label,
  .sidebar.sidebar-expanded .menu-label {
    opacity: 1 !important;
    display: block !important;
  }
}

@media (max-width: 768px) {
  /* Em mobile, sidebar ocupa largura total quando aberta */
  #app .sidebar.sidebar-mobile,
  .sidebar.sidebar-mobile {
    width: 280px !important;
    position: fixed !important;
    z-index: 1050 !important;
    transition: transform 0.3s ease !important;
  }

  /* Sidebar colapsada em mobile fica oculta */
  #app .sidebar.sidebar-mobile-closed,
  .sidebar.sidebar-mobile-closed {
    transform: translateX(-100%) !important;
  }

  /* Sidebar aberta em mobile fica visível */
  #app .sidebar.sidebar-mobile-open,
  .sidebar.sidebar-mobile-open {
    transform: translateX(0) !important;
  }
}
</style>
