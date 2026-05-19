<template>
  <div class="recebimento-agenda-page">
    <SchedulesList :show-all="false" @notification="handleNotification" />
  </div>
</template>

<script>
import SchedulesList from '../components/SchedulesList.vue'

export default {
  name: 'RecebimentoAgendaPage',
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
    console.log('RecebimentoAgendaPage montada')
  },
}
</script>

<style scoped>
.recebimento-agenda-page {
  width: 100%;
  height: 100%;
}
</style>
