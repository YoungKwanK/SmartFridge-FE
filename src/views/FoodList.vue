<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>
            <v-row align="center" class="pa-2">
              <v-col class="text-h5"> 
                식품 목록
              </v-col>
              <v-col class="text-right">
                <v-btn color="primary" @click="openCreateModal">식품 등록</v-btn>
              </v-col>
            </v-row>
          </v-card-title>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>식품명</th>
                  <th>수량</th>
                  <th>등록자</th>
                  <th>등록일</th>
                  <th>유통기한</th>
                  <th>보관위치</th>
                  <th>카테고리</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="food in foodList" :key="food.id">
                  <td>{{ food.name }}</td>
                  <td>{{ food.quantity }}</td>
                  <td>{{ food.registeredName }}</td>
                  <td>{{ food.storageStartDate }}</td>
                  <td>{{ food.expirationDateTime }}</td>
                  <td>{{ food.storageType }}</td>
                  <td>{{ food.category }}</td>
                  <td>
                    <v-btn color="primary" @click="openEditModal(food)">수정</v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <FoodFormModal 
      v-model="isModalOpen" 
      :editing-food="selectedFood"
      @save="handleSave"
    />
  </v-container>
</template>

<script>
import axios from 'axios';
import FoodFormModal from '../components/Food/FoodFormModal.vue'; 

export default {
  components: {
    FoodFormModal
  },
  data() {
    return {
      foodList: [],
      isModalOpen: false,
      selectedFood: {}, 
    }
  },
  async created() {
    await this.fetchFoodList();
  },
  methods: {
    async fetchFoodList() {
      const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/fridge/1/food/list`);
      this.foodList = response.data.result.content;
    },
    openCreateModal() {
      this.selectedFood = {};
      this.isModalOpen = true;
    },
    openEditModal(food) {
      this.selectedFood = food;
      this.isModalOpen = true;
    },
    async handleSave(foodData) {
      // 저장 로직 (이전 답변 참고)
      console.log('저장할 데이터:', foodData);
      // await axios.post(...) 또는 await axios.put(...)
      // await this.fetchFoodList(); // 목록 새로고침
    }
  }
}
</script>