<template>
  <div class="dashboard-header">
    <div class="header-info">
      <div class="fridge-title-section">
        <h1 class="fridge-title">{{ fridge.fridgeName }}</h1>
        <div class="fridge-type-badge">
          <v-chip 
            :color="getTypeColor(fridge.type)" 
            size="small" 
            variant="elevated"
            class="type-chip"
          >
            <v-icon start size="16">{{ getTypeIcon(fridge.type) }}</v-icon>
            {{ getTypeText(fridge.type) }}
          </v-chip>
        </div>
      </div>
      <p class="fridge-subtitle">{{ fridge.description }}</p>
    </div>
    <div class="header-actions">
      <div class="notification-icon">
        <div class="icon-container">
          <v-icon color="amber" size="28">mdi-bell-ring</v-icon>
          <div class="notification-badge">3</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios';
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const fridge = ref({});

const fetchFridgeInfo = async () => {
  try {
    const fridgeId = route.params.fridgeId;
    if (!fridgeId) return;
    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/detail`);
    fridge.value = response.data.result;
  } catch (error) {
    console.error("냉장고 정보를 불러오는 데 실패했습니다:", error);
  }
};

const getTypeColor = (type) => {
  switch (type) {
    case 'MANAGER': return 'success';
    case 'COMMON': return 'info';
    default: return 'grey';
  }
};

const getTypeIcon = (type) => {
  switch (type) {
    case 'MANAGER': return 'mdi-crown';
    case 'COMMON': return 'mdi-account';
    default: return 'mdi-help';
  }
};

const getTypeText = (type) => {
  switch (type) {
    case 'MANAGER': return '관리자';
    case 'COMMON': return '일반';
    default: return '알 수 없음';
  }
};

onMounted(() => {
  fetchFridgeInfo();
});
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

.fridge-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.fridge-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.fridge-type-badge {
  flex-shrink: 0;
}

.type-chip {
  font-weight: 600;
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

.notification-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 12px;
  border-radius: 12px;
  transition: all 0.3s ease;
  background: rgba(255, 193, 7, 0.1);
}

.notification-icon:hover {
  background: rgba(255, 193, 7, 0.2);
  transform: translateY(-2px);
}

.icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: white;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.4);
  border: 2px solid white;
}

.notification-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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
  
  .fridge-title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 600px) {
  .fridge-title {
    font-size: 24px;
  }
}
</style>