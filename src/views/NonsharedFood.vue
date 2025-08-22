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
      const fridgeId = this.$route.params.fridgeId;
      if (!fridgeId) return;
      const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/food/list?isShared=false`);
      this.foodList = response.data.result.content;
    },
    openCreateModal() {
      this.selectedFood = { name: '', quantity: 0, storageStartDate: '', expirationDateTime: '', storageType: '', category: '', shareable: false };
      this.isModalOpen = true;
    },
    openEditModal(food) {
      this.selectedFood = { ...food };
      this.isModalOpen = true;
    },
    
    async handleSave(foodData) {
      try {
        const fridgeId = this.$route.params.fridgeId;
        if (!fridgeId) { console.error('냉장고 ID가 없습니다.'); return; }
        let response;
        if (foodData.id) { // 수정 모드
          response = await axios.put(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/food/update/${foodData.id}`, foodData);
          console.log('식품 수정 성공:', response.data);
        } else { // 등록 모드
          response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/food/register`, foodData);
          console.log('식품 등록 성공:', response.data);
        }
        await this.fetchFoodList();
        alert(foodData.id ? '식품이 수정되었습니다.' : '식품이 등록되었습니다.');
      } catch (error) {
        console.error('식품 저장 실패:', error);
        console.error('에러 상세:', error.response?.data);
        alert('식품 저장에 실패했습니다: ' + (error.response?.data?.message || error.message));
      }
    }
  }
}
</script>