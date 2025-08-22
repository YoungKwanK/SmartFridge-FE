<template>
  <div class="tables-section">
    <v-row>
      <!-- 최근 등록한 식품 -->
      <v-col cols="12" lg="6">
        <v-card class="food-table-card">
          <v-card-title class="d-flex justify-space-between align-center">
            <span>최근 등록한 식품</span>
            <div class="table-actions">
              <v-btn color="success" prepend-icon="mdi-plus" size="small">
                식품 등록
              </v-btn>
              <v-btn color="purple" size="small" class="ml-2" @click="goToNonsharedFoodList">
                전체 보기
              </v-btn>
            </div>
          </v-card-title>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>식품명</th>
                  <th>등록자</th>
                  <th>수량</th>
                  <th>유통기한</th>
                  <th>위치</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="food in recentFoods" :key="food.id">
                  <td>{{ food.name }}</td>
                  <td>{{ food.registeredName }}</td>
                  <td>{{ food.quantity }}</td>
                  <td>{{ food.expirationDateTime }}</td>
                  <td>{{ food.storageType }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- 최근 등록한 공유식품 -->
      <v-col cols="12" lg="6">
        <v-card class="food-table-card">
          <v-card-title class="d-flex justify-space-between align-center">
            <span>최근 등록한 공유식품</span>
            <div class="table-actions">
              <v-btn color="success" prepend-icon="mdi-plus" size="small">
                식품 등록
              </v-btn>
              <v-btn color="purple" size="small" class="ml-2" @click="goToSharedFoodList">
                전체 보기
              </v-btn>
            </div>
          </v-card-title>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>식품명</th>
                  <th>등록자</th>
                  <th>수량</th>
                  <th>유통기한</th>
                  <th>위치</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="food in recentSharedFoods" :key="food.id">
                  <td>{{ food.name }}</td>
                  <td>{{ food.registeredName }}</td>
                  <td>{{ food.quantity }}</td>
                  <td>{{ food.expirationDateTime }}</td>
                  <td>{{ food.storageType }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import axios from 'axios';
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import router from '@/router';

const route = useRoute();
const recentFoods = ref([])
const recentSharedFoods = ref([])

const fetchRecentFoods = async () => {
  try {
    const fridgeId = route.params.fridgeId;
    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/food/list?isShared=false`);
    recentFoods.value = response.data.result.content.slice(0, 5);
  } catch (error) {
    console.error("최근 등록한 식품을 불러오는데 실패했습니다:", error);
  }
};

const fetchRecentSharedFoods = async () => {
  try {
    const fridgeId = route.params.fridgeId;
    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/food/list?isShared=true`);
    recentSharedFoods.value = response.data.result.content.slice(0, 5);
  } catch (error) {
    console.error("최근 등록한 공유식품을 불러오는데 실패했습니다:", error);
  }
};

onMounted(() => {
  fetchRecentFoods();
  fetchRecentSharedFoods();
});

const goToSharedFoodList = () => {
  router.push(`/fridge/${route.params.fridgeId}/food/shared`);
}

const goToNonsharedFoodList = () => {
  router.push(`/fridge/${route.params.fridgeId}/food/nonshared`);
}

</script>

<style scoped>
.tables-section {
  margin-bottom: 32px;
}

.food-table-card {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.food-table-card .v-card-title {
  background: rgba(248, 249, 250, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(233, 236, 239, 0.5);
  padding: 20px 24px;
  font-weight: 600;
  color: #333;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.v-table {
  background: transparent;
}

.v-table thead th {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
  font-size: 14px;
  padding: 16px 12px;
  border-bottom: 2px solid #dee2e6;
}

.v-table tbody td {
  padding: 16px 12px;
  color: #495057;
  font-size: 14px;
  border-bottom: 1px solid #e9ecef;
}

.v-table tbody tr:hover {
  background-color: #f8f9fa;
}

/* 반응형 디자인 */
@media (max-width: 960px) {
  .table-actions {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
