<template>
  <!-- App.vue의 v-app/v-main 안에서 그려지므로 v-app을 다시 감싸지 않는다.
       중첩 v-main은 --v-layout-top을 0으로 덮어써 모바일 앱 바 높이를 알 수 없게 된다. -->
  <div class="chat-page" :class="{ 'is-compact': isCompact }">
    <!-- 모바일(md 미만)에서는 목록과 대화 중 하나만 보여 준다 -->
    <div v-show="!isCompact || !selectedRoom" class="chat-list-col">
      <ChatSidebar ref="chatSidebar" @select-room="handleRoomSelect" @room-left="handleRoomLeft" />
    </div>
    <div v-show="!isCompact || selectedRoom" class="chat-window-col">
      <ChatWindow
        :selected-room="selectedRoom"
        :selected-roomType="selectedRoomType"
        :show-back="isCompact"
        @order-completed="handleOrderCompleted"
        @back="handleBack"
      />
    </div>
    <ChatFeedback />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useDisplay } from 'vuetify';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import ChatSidebar from '@/components/chat/ChatSidebar.vue'; // 사이드바 컴포넌트 import
import ChatWindow from '@/components/chat/ChatWindow.vue';   // 채팅창 컴포넌트 import
import ChatFeedback from '@/components/chat/ChatFeedback.vue';

const store = useStore();
const router = useRouter();

// 선택된 채팅방 정보를 저장할 반응형 변수
const selectedRoom = ref(null);
const selectedRoomType = ref(null);
const chatSidebar = ref(null);
const { smAndDown: isCompact } = useDisplay();

// 사이드바에서 채팅방을 선택했을 때 호출될 함수
const handleRoomSelect = (room, roomType) => {
  selectedRoom.value = room;
  selectedRoomType.value = roomType;
};

// 구매 완료 이벤트를 받아서 사이드바 새로고침
const handleOrderCompleted = () => {
  if (chatSidebar.value) {
    chatSidebar.value.refreshRooms();
  }
};

// 보고 있던 채팅방에서 나가거나 방이 삭제되면 대화 화면을 닫는다
const handleRoomLeft = () => {
  selectedRoom.value = null;
  selectedRoomType.value = null;
};

// 모바일에서 목록으로 돌아가기: 방을 닫아야 그 방 알림이 다시 온다
const handleBack = () => {
  chatSidebar.value?.clearSelection();
  handleRoomLeft();
};

// 페이지 진입 시 채팅 알림 제거 및 냉장고 ID 확인
onMounted(() => {
  // 현재 냉장고 ID 확인
  const currentFridgeId = store.getters.getCurrentFridgeId;
  if (!currentFridgeId) {
    // 냉장고 목록 페이지로 리다이렉트
    router.push('/fridge/list');
    return;
  }
  
  // 채팅 페이지 진입 시 알림 제거 (MANAGER_CHAT 배지는 유지)
  // store.dispatch('notification/clearChatNotificationsOnEnter'); // 유저 관리 배지 보호를 위해 주석 처리
});
</script>

<style scoped>
/* 모바일 상단 앱 바(--v-layout-top)와 하단 탭(--v-layout-bottom) 높이만큼 빼서 화면 밖으로 넘치지 않게 한다 */
.chat-page {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  height: calc(100vh - var(--v-layout-top, 0px) - var(--v-layout-bottom, 0px));
  overflow: hidden;
  background: var(--sf-bg);
}

.chat-page.is-compact {
  grid-template-columns: minmax(0, 1fr);
}

.chat-list-col,
.chat-window-col {
  min-height: 0;
  height: 100%;
}
</style>
