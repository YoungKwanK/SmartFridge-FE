<template>
  <v-card class="fill-height d-flex flex-column" rounded="0">
    <div v-if="!selectedRoom" class="d-flex justify-center align-center fill-height text-center text-grey">
      <div>
        <p class="text-h6">채팅을 선택해주세요.</p>
        <p>왼쪽 목록에서 채팅방을 선택하면 대화를 시작할 수 있습니다.</p>
      </div>
    </div>

    <template v-else>
      <v-toolbar density="compact">
        <v-toolbar-title class="font-weight-bold">{{ selectedRoom.roomName }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-magnify"></v-btn>
        <v-btn icon="mdi-dots-vertical"></v-btn>
      </v-toolbar>
      <v-divider></v-divider>

      <v-card-text class="flex-grow-1" style="overflow-y: auto;">
        <div class="pa-4 text-center">
          "{{ selectedRoom.roomName }}" 채팅방에 오신 것을 환영합니다!
        </div>
      </v-card-text>
      <v-divider></v-divider>

      <v-card-actions class="pa-2">
        <v-text-field
          v-model="message"
          placeholder="메시지를 입력하세요..."
          variant="solo"
          hide-details
          rounded
          density="comfortable"
        >
          <template v-slot:append-inner>
            <v-btn icon="mdi-send" variant="text" @click="sendMessage"></v-btn>
          </template>
        </v-text-field>
      </v-card-actions>
    </template>
  </v-card>
</template>

<script setup>
import { ref } from 'vue';

// 부모로부터 선택된 채팅방 정보를 props로 받음
const props = defineProps({
  selectedRoom: {
    type: Object,
    default: null
  }
});

const message = ref('');

const sendMessage = () => {
  if (message.value.trim() === '') return;
  alert(`'${props.selectedRoom.title}' 방에 메시지 전송: ${message.value}`);
  message.value = '';
};
</script>

<style scoped>
.fill-height {
  height: 100vh;
}
.flex-grow-1 {
  flex-grow: 1;
}
</style>