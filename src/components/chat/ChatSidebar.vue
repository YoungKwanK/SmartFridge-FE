<template>
  <v-container class="chat-sidebar-container">
    <v-card class="d-flex flex-column chat-sidebar-card" rounded="xl">
      <v-list-item class="pa-4">
        <template v-slot:prepend>
          <v-avatar color="primary" size="48">
            <span class="text-h6">훈</span>
          </v-avatar>
        </template>
        <v-list-item-title class="font-weight-bold text-h6 ml-3">훈이</v-list-item-title>
      </v-list-item>

      <v-tabs v-model="tab" grow>
        <v-tab value="chat">채팅목록</v-tab>
        <v-tab value="groupbuy">공동구매</v-tab>
      </v-tabs>
      <v-divider></v-divider>

      <v-window v-model="tab" class="flex-grow-1" style="overflow-y: auto;">
        <v-window-item value="chat">
          <v-list @mouseleave="hoveredRoomId = null">
            <v-list-item
              v-for="room in chatRooms"
              :key="room.id"
              @click="selectRoom(room)"
              :active="selectedRoomId === room.id"
              class="ma-2 pa-0"
              rounded="lg"
              height="68px"
              @mouseenter="hoveredRoomId = room.id"
            >
              <div v-if="hoveredRoomId !== room.id" class="d-flex align-center fill-height pa-3">
                <div class="flex-grow-1" style="min-width: 0;">
                  <v-list-item-title class="font-weight-bold text-truncate">{{ room.title }}</v-list-item-title>
                  <v-list-item-subtitle class="text-truncate">{{ room.name }}</v-list-item-subtitle>
                </div>
                <v-chip
                  :color="isRoomFull(room) ? 'red' : 'green'"
                  variant="tonal"
                  size="small"
                  label
                >
                  {{ room.currentParticipants }}/{{ room.maxParticipants }}명
                </v-chip>
              </div>

              <div v-else class="hover-actions">
                <div class="action-button" @click.stop="viewRoomInfo(room)">
                  <v-icon size="small">mdi-information-outline</v-icon>
                  <span class="ml-2">정보 보기</span>
                </div>
                <v-divider vertical></v-divider>
                <div class="action-button leave" @click.stop="leaveRoom(room)">
                  <v-icon size="small">mdi-exit-to-app</v-icon>
                  <span class="ml-2">나가기</span>
                </div>
              </div>
            </v-list-item>
          </v-list>
        </v-window-item>

        <v-window-item value="groupbuy">
          <v-list @mouseleave="hoveredRoomId = null">
            <v-list-item
              v-for="room in chatRooms"
              :key="room.id"
              @click="selectRoom(room)"
              :active="selectedRoomId === room.id"
              class="ma-2 pa-0"
              rounded="lg"
              height="68px"
              @mouseenter="hoveredRoomId = room.id"
            >
              <div v-if="hoveredRoomId !== room.id" class="d-flex align-center fill-height pa-3">
                <div class="flex-grow-1">
                  <v-list-item-title class="font-weight-bold">{{ room.title }}</v-list-item-title>
                  <v-list-item-subtitle>{{ room.name }}</v-list-item-subtitle>
                </div>
                <v-chip
                  :color="isRoomFull(room) ? 'red' : 'green'"
                  variant="tonal"
                  size="small"
                  label
                >
                  {{ room.currentParticipants }}/{{ room.maxParticipants }}명
                </v-chip>
              </div>

              <div v-else class="hover-actions">
                <div class="action-button" @click.stop="viewRoomInfo(room)">
                  <v-icon size="small">mdi-information-outline</v-icon>
                  <span class="ml-2">정보 보기</span>
                </div>
                <v-divider vertical></v-divider>
                <div class="action-button leave" @click.stop="leaveRoom(room)">
                  <v-icon size="small">mdi-exit-to-app</v-icon>
                  <span class="ml-2">나가기</span>
                </div>
              </div>
            </v-list-item>
          </v-list>
        </v-window-item>

      </v-window>
    </v-card>
     <RoomInfoModal
      v-if="selectedRoomForModal"
      v-model="isModalOpen"
      :room="selectedRoomForModal"
    />
  </v-container>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import RoomInfoModal from './RoomInfoModal.vue';
import axios from 'axios';

const tab = ref('chat');
const selectedRoomId = ref(null);
const hoveredRoomId = ref(null);
const emit = defineEmits(['select-room']);

// [추가] 모달의 상태를 관리할 ref들을 추가합니다.
const isModalOpen = ref(false); // 모달이 열렸는지 여부
const selectedRoomForModal = ref(null); // 모달에 표시할 방 정보

const chatRooms = ref([]);
const isLoading = ref(true); // 1. 로딩 상태를 관리할 ref 추가 (초기값 true)

onMounted(async () => {
  try {
    const response = await axios.get('/api/chat-rooms');
    chatRooms.value = response.data;
  } catch (error) {
    console.error("API 호출 에러:", error);
  } finally {
    // 2. API 호출이 성공하든 실패하든, 마지막에는 로딩 상태를 false로 변경
    isLoading.value = false;
  }
});

const isRoomFull = (room) => {
  return room.currentParticipants >= room.maxParticipants;
};

const selectRoom = (room) => {
  selectedRoomId.value = room.id;
  emit('select-room', room);
};

// [수정] viewRoomInfo 함수가 모달을 열도록 수정합니다.
const viewRoomInfo = (room) => {
  console.log('정보 보기:', room.title);
  selectedRoomForModal.value = room; // 클릭된 방의 정보를 저장
  isModalOpen.value = true;           // 모달을 열도록 상태 변경
};

const leaveRoom = (room) => {
  console.log('방 나가기:', room.title);
};
</script>

<style scoped>
/* CSS는 변경할 필요가 없습니다. 그대로 사용하시면 됩니다. */
.chat-sidebar-card {
  height: 100%;
  border-radius: 24px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.v-divider {
  margin-bottom: 0 !important;
}

.v-list {
  padding-top: 0 !important;
  padding-left: 8px;
  padding-right: 8px;
  flex: 1;
  min-height: 0;
  max-height: 75vh;
  overflow-y: auto;
}

.v-list-item {
  border-radius: 12px !important;
  margin: 4px 0;
  transition: all 0.2s ease;
}

.v-list-item:first-child {
  margin-top: 0 !important;
}

.v-list-item:last-child {
  margin-bottom: 0 !important;
}

.v-list-item:hover {
  background-color: #f5f5f5;
  transform: translateX(4px);
}

.v-window {
  overflow: hidden !important;
  flex: 1;
  min-height: 0;
}

.v-list::-webkit-scrollbar {
  width: 6px;
}

.v-list::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.v-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
  border: 1px solid #f5f5f5;
}

.v-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.v-list {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f5f5f5;
}

.hover-actions {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  font-size: 0.875rem;
}

.action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  cursor: pointer;
  font-weight: 500;
  color: #333;
  transition: background-color 0.2s;
}

.action-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.action-button.leave:hover {
  color: #D32F2F;
}
</style>