<template>
  <div class="fridge-dashboard">
    <DashboardHeader />
    <DashboardStats />
    <FoodPreviewTable />
  </div>
</template>

<script setup>
import DashboardHeader from '@/components/FridgeDashboard/DashboardHeader.vue'
import DashboardStats from '@/components/FridgeDashboard/DashboardStats.vue'
import FoodPreviewTable from '@/components/FridgeDashboard/FoodPreviewTable.vue'
</script>

<style scoped>
.fridge-dashboard {
  padding: 32px;
  margin-left: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  position: relative;
}

.fridge-dashboard::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0.1;
  z-index: -1;
}

@media (max-width: 600px) {
  .fridge-dashboard {
    padding: 16px;
    margin-left: 8px;
  }
}
</style>