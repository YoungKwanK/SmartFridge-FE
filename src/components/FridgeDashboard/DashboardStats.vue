<template>
  <div class="stats-section">
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card total-food">
          <v-card-text class="text-center">
            <v-icon color="brown" size="36">mdi-package-variant</v-icon>
            <div class="stat-number">15</div>
            <div class="stat-label">총 식품 수</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card fresh-food">
          <v-card-text class="text-center">
            <v-icon color="green" size="36">mdi-check-circle</v-icon>
            <div class="stat-number">9</div>
            <div class="stat-label">신선한 식품</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card expiring-soon">
          <v-card-text class="text-center">
            <v-icon color="amber" size="36">mdi-alert</v-icon>
            <div class="stat-number">4</div>
            <div class="stat-label">유통기한 임박</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card expired-food">
          <v-card-text class="text-center">
            <v-icon color="red" size="36">mdi-close-circle</v-icon>
            <div class="stat-number">2</div>
            <div class="stat-label">유통기한 초과</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
// 필요한 경우 props나 emit 추가
</script>

<style scoped>
.stats-section {
  margin-bottom: 32px;
}

.stat-card {
  height: 140px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
}

.stat-card .v-card-text {
  padding: 16px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 12px 0 6px 0;
}

.stat-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

@media (max-width: 600px) {
  .stat-card {
    height: 140px;
  }
  
  .stat-number {
    font-size: 28px;
  }
}
</style>
