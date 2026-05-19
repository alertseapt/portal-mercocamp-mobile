<template>
  <div class="recent-activities-card">
    <h3>Atividades Recentes</h3>
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Carregando atividades...</p>
    </div>
    <div
      v-else-if="activities && activities.length > 0"
      class="activities-list"
    >
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="activity-item"
      >
        <div class="activity-icon" :class="activity.type">
          <i :class="getIconClass(activity.type)"></i>
        </div>
        <div class="activity-content">
          <p class="activity-text">{{ activity.text }}</p>
          <span class="activity-time">{{ formatTime(activity.time) }}</span>
        </div>
      </div>
    </div>
    <div v-else class="no-activities">
      <i class="fas fa-inbox"></i>
      <p>Nenhuma atividade recente</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RecentActivities',
  props: {
    activities: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    getIconClass(type) {
      const icons = {
        create: 'fas fa-plus-circle',
        update: 'fas fa-edit',
        delete: 'fas fa-trash-alt',
        status: 'fas fa-exchange-alt',
        comment: 'fas fa-comment',
        default: 'fas fa-info-circle',
      }
      return icons[type] || icons.default
    },
    formatTime(time) {
      if (!time) return ''

      const now = new Date()
      const activityTime = new Date(time)
      const diffMs = now - activityTime
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Agora mesmo'
      if (diffMins === 1) return '1 minuto atrás'
      if (diffMins < 60) return `${diffMins} minutos atrás`
      if (diffHours === 1) return '1 hora atrás'
      if (diffHours < 24) return `${diffHours} horas atrás`
      if (diffDays === 1) return 'Ontem'
      if (diffDays < 7) return `${diffDays} dias atrás`

      // Formato completo para atividades mais antigas
      return activityTime.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
  },
}
</script>

<style scoped>
.recent-activities-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.recent-activities-card h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  color: #2c3e50;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #7f8c8d;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.activities-list {
  flex: 1;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  padding: 0.875rem;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item:hover {
  background-color: #f8f9fa;
}

.activity-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  flex-shrink: 0;
}

.activity-icon i {
  font-size: 1rem;
  color: white;
}

.activity-icon.create {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.activity-icon.update {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.activity-icon.delete {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
}

.activity-icon.status {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.activity-icon.comment {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.activity-icon.default {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-text {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  color: #2c3e50;
  line-height: 1.4;
}

.activity-time {
  font-size: 0.75rem;
  color: #95a5a6;
}

.no-activities {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #95a5a6;
  text-align: center;
}

.no-activities i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.no-activities p {
  margin: 0;
  font-size: 0.875rem;
}

/* Scrollbar customization */
.activities-list::-webkit-scrollbar {
  width: 6px;
}

.activities-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.activities-list::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.activities-list::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}
</style>
