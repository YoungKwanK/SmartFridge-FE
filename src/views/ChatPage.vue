<template>
  <v-app>
    <v-main class="gradient-background">
      <v-container fluid class="pa-0 fill-height">
        <v-row no-gutters class="fill-height">
          <v-col cols="12" md="4" lg="3" xl="2">
            <ChatSidebar @select-room="handleRoomSelect" />
          </v-col>
          
          <v-col cols="12" md="8" lg="9" xl="10">
            <ChatWindow :selected-room="selectedRoom" :selected-roomType="selectedRoomType" />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue';
import ChatSidebar from '../components/chat/ChatSidebar.vue'; // 사이드바 컴포넌트 import
import ChatWindow from '../components/chat/ChatWindow.vue';   // 채팅창 컴포넌트 import

// 선택된 채팅방 정보를 저장할 반응형 변수
const selectedRoom = ref(null);
const selectedRoomType = ref(null);

// 사이드바에서 채팅방을 선택했을 때 호출될 함수
const handleRoomSelect = (room, roomType) => {
  selectedRoom.value = room;
  selectedRoomType.value = roomType;
};
</script>

<style scoped>
.fill-height {
  height: 100vh;
  overflow: hidden;
}
.gradient-background {
  background: linear-gradient(96.94deg, #667EEA 0%, #764BA2 100%);
}

</style>