<template>
  <div class="dashboard-header">
    <div class="header-info">
      <h1 class="fridge-title">행복기숙사 1층 냉장고</h1>
      <p class="fridge-subtitle">공용 냉장고 • 최근 활동: 7월 14일 21:40</p>
    </div>
    <div class="header-actions">
      <div class="notification-icon">
        <v-icon color="amber" size="24">mdi-bell</v-icon>
        <span class="notification-badge">3</span>
      </div>
      <div class="item-icon">
        <v-icon color="brown" size="24">mdi-package-variant</v-icon>
        <span class="notification-badge">5</span>
      </div>
    </div>
  </div>
</template>

<script setup>
// 필요한 경우 props나 emit 추가
</script>

<style scoped>
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.header-info {
  flex: 1;
}

.fridge-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0 0 8px 0;
}

.fridge-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.notification-icon,
.item-icon {
  position: relative;
  cursor: pointer;
}

.notification-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #f44336;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

/* 반응형 디자인 */
@media (max-width: 960px) {
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-actions {
    align-self: flex-end;
  }
}

@media (max-width: 600px) {
  .fridge-title {
    font-size: 24px;
  }
}
</style>
