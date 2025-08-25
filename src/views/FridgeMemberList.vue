<template>
  <v-app>
    <v-app-bar app class="app-bar-gradient" flat>
      <v-app-bar-nav-icon color="white"></v-app-bar-nav-icon>
      <v-toolbar-title class="font-weight-bold text-white">
        🧊 SmartFridge
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn class="admin-apply-btn" variant="text">
        관리자 신청
      </v-btn>
    </v-app-bar>

    <v-main class="bg-grey-lighten-4">
      <v-container fluid>
        <v-card class="mb-5" rounded="lg">
          <v-card-item>
            <v-card-title class="text-grey-darken-3">📊 사용자 현황</v-card-title>
          </v-card-item>
          <v-divider></v-divider>
          <v-card-text>
            <v-row>
              <v-col v-for="stat in stats" :key="stat.title" cols="12" md="4">
                <div class="d-flex align-center">
                  <span :class="stat.color" class="text-h4 font-weight-bold mr-3">{{ stat.value }}</span>
                  <span class="text-grey-darken-1">{{ stat.title }}</span>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-card rounded="lg">
          <v-card-item>
            <v-card-title class="text-grey-darken-3">👤 사용자 목록</v-card-title>
          </v-card-item>
          <v-divider></v-divider>
          <v-list class="bg-transparent" lines="two">
            <v-list-item
              v-for="user in users"
              :key="user.email"
              class="ma-2 user-list-item"
              rounded="lg"
            >
              <template v-slot:prepend>
                <v-avatar class="avatar-gradient" size="48">
                  <span class="text-white font-weight-bold">{{ user.initial }}</span>
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-bold">{{ user.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ user.email }}</v-list-item-subtitle>

              <template v-slot:append>
                <v-chip
                  :color="getRoleChipColor(user.role)"
                  label
                  size="small"
                  class="font-weight-bold"
                >
                  {{ user.role }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>

        <v-card class="mt-5" rounded="lg">
           <v-card-item>
            <v-card-title class="text-grey-darken-3">사용 안내</v-card-title>
          </v-card-item>
          <v-divider></v-divider>
           <v-list class="bg-transparent">
             <v-list-item v-for="(item, i) in guide" :key="i" density="compact">
               <template v-slot:prepend>
                 <v-icon color="blue-darken-1" class="mr-3">mdi-circle-medium</v-icon>
               </template>
               <v-list-item-title class="text-grey-darken-1">{{ item }}</v-list-item-title>
             </v-list-item>
           </v-list>
        </v-card>

      </v-container>

      <v-btn
        class="fab-gradient"
        position="fixed"
        location="bottom right"
        size="large"
        icon="mdi-arrow-up"
        elevation="8"
      ></v-btn>

    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';

// --- 임시 데이터 ---
// 1. 사용자 현황 데이터
const stats = ref([
  { title: '전체사용자', value: 10, color: 'text-blue-darken-1' },
  { title: '일반 사용자', value: 9, color: 'text-green' },
  { title: '관리자', value: 1, color: 'text-red' },
]);

// 2. 사용자 목록 데이터
const users = ref([
  { name: '홍길동', email: 'hong@example.com', role: '관리자', initial: '홍' },
  { name: '김철수', email: 'kim@example.com', role: '사용자', initial: '김' },
  { name: '이영희', email: 'lee@example.com', role: '사용자', initial: '이' },
  { name: '박민수', email: 'park@example.com', role: '사용자', initial: '박' },
  { name: '최지현', email: 'choi@example.com', role: '사용자', initial: '최' },
]);

// 3. 사용 안내 데이터
const guide = ref([
  '사용자의 역할 배정을 클릭하면 권한을 변경할 수 있습니다.',
  '관리자는 사용자 권한을 자유롭게 변경 가능합니다.',
  '권한 변경 시 확인 절차를 거쳐 안전하게 처리됩니다.',
]);

// --- 헬퍼 함수 ---
// 사용자의 역할(role)에 따라 v-chip의 색상을 반환하는 함수
const getRoleChipColor = (role) => {
  if (role === '관리자') return 'red';
  return 'green';
};

</script>

<style scoped>
.app-bar-gradient {
  background: linear-gradient(91.91deg, #667EEA 0%, #764BA2 100%);
}

.avatar-gradient {
  background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
}

.fab-gradient {
  background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
  color: white;
}

.admin-apply-btn {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  backdrop-filter: blur(5px);
}

.user-list-item {
  background-color: #F8F9FA;
  border: 1px solid #E9ECEF;
  transition: all 0.2s ease-in-out;
}

.user-list-item:hover {
  border-color: #667EEA;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
</style>