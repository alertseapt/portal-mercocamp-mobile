<template>
  <div class="recebimento-historico-page">
    <SchedulesList
      ref="schedulesListRef"
      :show-all="true"
      @notification="handleNotification"
      @page-ready="$emit('page-ready')"
    />
  </div>
</template>

<script>
import SchedulesList from '../components/SchedulesList.vue'

export default {
  name: 'RecebimentoHistoricoPage',
  components: {
    SchedulesList,
  },
  methods: {
    handleNotification(notification) {
      // Repassar notificações para o componente pai se necessário
      this.$emit('notification', notification)
    },
  },
  mounted() {
    console.log('RecebimentoHistoricoPage montada')
  },
}
</script>

<style scoped>
.recebimento-historico-page {
  width: 100%;
  height: 100%;
}
</style>
