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
              <v-btn color="purple" size="small" class="ml-2">
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
                  <th>등록일</th>
                  <th>유통기한</th>
                  <th>위치</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="food in recentFoods" :key="food.id">
                  <td>{{ food.name }}</td>
                  <td>{{ food.registrant }}</td>
                  <td>{{ food.registrationDate }}</td>
                  <td>{{ food.expirationDate }}</td>
                  <td>{{ food.location }}</td>
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
              <v-btn color="purple" size="small" class="ml-2">
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
                  <th>등록일</th>
                  <th>유통기한</th>
                  <th>위치</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="food in recentSharedFoods" :key="food.id">
                  <td>{{ food.name }}</td>
                  <td>{{ food.registrant }}</td>
                  <td>{{ food.registrationDate }}</td>
                  <td>{{ food.expirationDate }}</td>
                  <td>{{ food.location }}</td>
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
import { ref } from 'vue'

// 최근 등록한 식품 데이터
const recentFoods = ref([
  {
    id: 1,
    name: '우유 1층',
    registrant: '홍길동',
    registrationDate: '2025-07-10',
    expirationDate: '2025-07-16',
    location: '냉장실'
  },
  {
    id: 2,
    name: '두부 2층 왼쪽',
    registrant: '김영희',
    registrationDate: '2025-07-12',
    expirationDate: '2025-07-15',
    location: '냉장실'
  },
  {
    id: 3,
    name: '계란 문쪽',
    registrant: '박철수',
    registrationDate: '2025-07-08',
    expirationDate: '2025-07-25',
    location: '냉장실'
  },
  {
    id: 4,
    name: '김치 3층',
    registrant: '이미영',
    registrationDate: '2025-07-05',
    expirationDate: '2025-08-05',
    location: '냉장실'
  },
  {
    id: 5,
    name: '냉동만두 상단',
    registrant: '정민수',
    registrationDate: '2025-07-01',
    expirationDate: '2025-07-14',
    location: '냉동실'
  }
])

// 최근 등록한 공유식품 데이터 (동일한 데이터 사용)
const recentSharedFoods = ref([...recentFoods.value])
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
