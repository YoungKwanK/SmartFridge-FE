<template>
    <v-container>
    <v-card>
      <v-card-title>
        <v-row align="center" class="pa-2">
          <v-col class="text-h5">
            냉장고 목록
          </v-col>
          <v-col class="text-right">
            <v-btn class="ml-2" variant="outlined">참여하기</v-btn>
            <v-btn class="ml-2" color="primary">냉장고 만들기</v-btn>
          </v-col>
        </v-row>
      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col
            v-for="fridge in fridgeList"
            :key="fridge.fridgeId"
            cols="12" sm="6" md="4" lg="3"
          >
            <v-card class="mx-auto" outlined>
              <v-card-title class="pb-1">{{ fridge.fridgeName }}</v-card-title>
              
              <v-card-subtitle>{{ fridge.type }}</v-card-subtitle>

              <v-card-text class="py-2">
                <div>{{ fridge.description || '냉장고 설명이 없습니다.' }}</div>
              </v-card-text>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn variant="text" color="primary">수정</v-btn>
                <v-btn color="primary">들어가기</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
      </v-card>
  </v-container>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      fridgeList: [],
    }
  },
  created() {
    this.fetchFridgeList();
  },
  methods: {
    async fetchFridgeList() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/fridge/list`);
        this.fridgeList = response.data.result; 

      } catch (error) {
        console.error("냉장고 목록을 불러오는 데 실패했습니다:", error);
      }
    },
    enterFridge(fridgeId) {
      this.$router.push(`/fridge/${fridgeId}/food`);
    }
  }
}
</script>