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
      <v-tabs v-model="tab" grow class="my-custom-tabs">
        <v-tab value="chat">채팅목록</v-tab>
        <v-tab value="groupbuy">공동구매</v-tab>
      </v-tabs>
      <v-divider></v-divider>
      <v-window v-model="tab" class="flex-grow-1" style="overflow-y: auto;">
        <v-window-item value="chat">
          <v-list>
            <v-list-item
              v-for="room in chatRooms"
              :key="room.id"
              @click="selectRoom(room)"
              :active="selectedRoomId === room.id"
              class="ma-2"
              rounded="lg"
            >
              <v-list-item-title class="font-weight-bold">{{ room.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ room.url }}</v-list-item-subtitle>
              <template v-slot:append>
                <v-chip
                  :color="isRoomFull(room) ? 'red' : 'green'"
                  variant="tonal"
                  size="small"
                  label
                >
                  {{ room.currentParticipants }}/{{ room.maxParticipants }}명
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-window-item>
        <v-window-item value="groupbuy">
          <div class="pa-4 text-center">공동구매 목록이 표시됩니다.</div>
        </v-window-item>
      </v-window>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';

const tab = ref('chat');
const selectedRoomId = ref(null);

// 부모 컴포넌트로 이벤트를 보내기 위한 emit 정의
const emit = defineEmits(['select-room']);

// 실제로는 API를 통해 받아올 채팅방 데이터 예시
const chatRooms = ref([
  { id: 1, title: '포카리 30개 공구!!!', url: 'https://pokari.com', currentParticipants: 10, maxParticipants: 10 },
  { id: 2, title: '닭가슴살 공구하실 분', url: 'https://dakgasumsal.com', currentParticipants: 8, maxParticipants: 10 },
  { id: 3, title: '프로틴 먹고 근손실 면하실 분.', url: 'https://proteinjoa.com', currentParticipants: 123, maxParticipants: 999 },
  { id: 4, title: '업소용 대용량 아이스크림 나눠드실분?!', url: 'https://meongadding.com', currentParticipants: 8, maxParticipants: 77 },
  { id: 5, title: '핵심 아이스 공구해요~~', url: 'https://maximice.com', currentParticipants: 114, maxParticipants: 999 },
  { id: 6, title: '피그마 노예 공구해요', url: 'https://figmanoyeh.com', currentParticipants: 114, maxParticipants: 999 },
  { id: 7, title: '커피 원두 대량 구매', url: 'https://coffee.com', currentParticipants: 45, maxParticipants: 100 },
  { id: 8, title: '과일 세트 공동구매', url: 'https://fruits.com', currentParticipants: 23, maxParticipants: 50 },
  { id: 9, title: '생수 2L 48개 공구', url: 'https://water.com', currentParticipants: 67, maxParticipants: 100 },
  { id: 10, title: '치킨 무 20kg 공동구매', url: 'https://chicken.com', currentParticipants: 89, maxParticipants: 200 },
]);

// 채팅방이 꽉 찼는지 확인하는 함수
const isRoomFull = (room) => {
  return room.currentParticipants >= room.maxParticipants;
};

// 채팅방 선택 시 호출될 함수
const selectRoom = (room) => {
  selectedRoomId.value = room.id;
  // 'select-room' 이벤트를 발생시켜 부모에게 선택된 방 정보를 전달
  emit('select-room', room);
};
</script>

<style scoped>
.chat-sidebar-card {
  height: 100%; /* 남은 공간을 모두 채우도록 수정 */
  border-radius: 24px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}


/* 탭 아래 divider와 v-list 사이의 간격 제거 */
.v-divider {
  margin-bottom: 0 !important;
}


.v-list {
  padding-top: 0 !important; /* 리스트 상단 padding 제거 */
  padding-left: 8px;
  padding-right: 8px;
  flex: 1;
  min-height: 0;
  max-height: 500px; /* 스크롤이 작동하도록 높이 제한 */
  overflow-y: auto;
  overflow-x: hidden;
}


.v-list-item {
  border-radius: 12px !important;
  margin: 4px 0; /* 상하 margin만 조절 */
  transition: all 0.2s ease;
  padding: 8px 12px;
}


.v-list-item:first-child {
  margin-top: 0 !important; /* 첫 번째 아이템의 상단 margin 제거 */
}


.v-list-item:last-child {
  margin-bottom: 0 !important; /* 마지막 아이템의 하단 margin 제거 */
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


/* 스크롤바 스타일링 */
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

/* Firefox 스크롤바 스타일링 */
.v-list {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 #f5f5f5;
}
</style>