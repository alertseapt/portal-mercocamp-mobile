<template>
  <div class="dashboard-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-content">
        <div class="spinner-container">
          <div class="spinner-circle"></div>
          <div class="spinner-circle"></div>
          <div class="spinner-circle"></div>
        </div>
        <p class="loading-text">Carregando dashboard...</p>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="dashboard-content">
      <!-- Estatísticas -->
      <StatisticsChart />
    </div>
  </div>
</template>

<script>
import StatisticsChart from '../components/StatisticsChart.vue'

export default {
  name: 'DashboardPage',
  components: {
    StatisticsChart,
  },
  props: {
    user: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      loading: false,
    }
  },
  mounted() {
    // Não precisa carregar dados adicionais
    this.loading = false
  },
}
</script>

<style scoped>
.dashboard-page {
  padding: 2rem;
  min-height: 100vh;
  background: #f8f9fa;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

/* Desktop: preenche o wrapper (98% é aplicado no .dashboard-view-wrapper no main.css), sem padding horizontal para alinhar com o banner */
@media (min-width: 1024px) {
  .dashboard-page {
    width: 100%;
    max-width: 100%;
    margin-left: 0;
    margin-right: 0;
    padding-left: 0;
    padding-right: 0;
  }

  .dashboard-content {
    width: 100%;
    max-width: 100%;
  }
}

.dashboard-header {
  margin-bottom: 2rem;
}

.dashboard-title {
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dashboard-title i {
  color: #007bff;
}

.dashboard-subtitle {
  color: #666;
  font-size: 1rem;
}

/* Loading */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loading-content {
  text-align: center;
}

.spinner-container {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 1rem;
}

.spinner-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #007bff;
  animation: bounce 1.4s infinite ease-in-out both;
}

.spinner-circle:nth-child(1) {
  animation-delay: -0.32s;
}

.spinner-circle:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.loading-text {
  color: #666;
  font-size: 1rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  border-left: 4px solid;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-card.stat-primary {
  border-left-color: #007bff;
}

.stat-card.stat-success {
  border-left-color: #28a745;
}

.stat-card.stat-warning {
  border-left-color: #ffc107;
}

.stat-card.stat-danger {
  border-left-color: #dc3545;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.stat-primary .stat-icon {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
}

.stat-success .stat-icon {
  background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
}

.stat-warning .stat-icon {
  background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
}

.stat-danger .stat-icon {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

/* Quick Actions */
.quick-actions-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-title i {
  color: #007bff;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.action-card {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.action-card:hover {
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.action-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.action-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.action-description {
  font-size: 0.875rem;
  color: #666;
  margin: 0;
}

/* Recent Activity */
.recent-activity-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
  flex-shrink: 0;
}

.activity-icon.activity-info {
  background: #17a2b8;
}

.activity-icon.activity-success {
  background: #28a745;
}

.activity-icon.activity-warning {
  background: #ffc107;
}

.activity-icon.activity-danger {
  background: #dc3545;
}

.activity-content {
  flex: 1;
}

.activity-text {
  color: #333;
  margin: 0 0 0.25rem 0;
  font-size: 0.9375rem;
}

.activity-time {
  color: #666;
  font-size: 0.875rem;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #999;
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

/* Responsividade Mobile - elementos ocupam 98% da largura (padding 1% no content-area-dashboard) */
@media (max-width: 768px) {
  .dashboard-page {
    width: 100% !important;
    max-width: 100% !important;
    padding: 1rem 0 !important;
    box-sizing: border-box;
  }

  .dashboard-content {
    width: 100% !important;
    max-width: 100% !important;
  }

  .dashboard-title {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 1.25rem;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .actions-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .action-card {
    padding: 1rem;
  }

  .action-icon {
    width: 50px;
    height: 50px;
    font-size: 1.25rem;
  }

  .section-title {
    font-size: 1.25rem;
  }

  .recent-activity-section {
    padding: 1rem;
  }

  .activity-item {
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .dashboard-page {
    padding: 0.75rem 0 !important;
  }

  .dashboard-title {
    font-size: 1.25rem;
  }

  .stat-card {
    flex-direction: column;
    text-align: center;
  }

  .stat-info {
    width: 100%;
  }
}
</style>
