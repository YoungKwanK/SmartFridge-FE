<template>
  <section class="chat-sidebar" aria-labelledby="chat-list-title">
    <header class="sidebar-head">
      <h1 id="chat-list-title" class="sidebar-title">채팅</h1>
    </header>

    <div v-if="isLoading" class="state-box">
      <v-progress-circular indeterminate color="primary" size="32" />
      <p>채팅방을 불러오는 중이에요</p>
    </div>

    <ul v-else class="room-list">
      <!-- 관리자와의 1:1 채팅 -->
      <li v-if="managerRoom && managerRoom.isManager === false" class="room-item">
        <button
          type="button"
          class="room-main"
          :class="{ 'is-active': selectedRoomId === managerRoom.roomId }"
          :aria-current="selectedRoomId === managerRoom.roomId ? 'true' : undefined"
          @click="selectRoom(managerRoom, 'manager')"
        >
          <span class="room-icon is-manager" aria-hidden="true">
            <v-icon size="20">mdi-shield-account-outline</v-icon>
          </span>
          <span class="room-text">
            <span class="room-name">{{ managerRoom.roomName }}</span>
            <span class="room-meta">냉장고 관리자와 1:1 대화</span>
          </span>
          <span v-if="(managerRoom.unReadCount || 0) > 0" class="unread sf-num" :aria-label="`안 읽은 메시지 ${managerRoom.unReadCount}개`">
            {{ managerRoom.unReadCount > 99 ? '99+' : managerRoom.unReadCount }}
          </span>
        </button>
      </li>

      <!-- 공동구매 채팅 -->
      <li v-for="room in sortedMyPurchaseRooms" :key="room.roomId" class="room-item" :class="{ 'is-closed': !isRoomOpen(room) }">
        <button
          type="button"
          class="room-main"
          :class="{ 'is-active': selectedRoomId === room.roomId }"
          :aria-current="selectedRoomId === room.roomId ? 'true' : undefined"
          @click="startChat(room)"
        >
          <span class="room-icon" aria-hidden="true">
            <v-icon size="20">mdi-cart-outline</v-icon>
          </span>
          <span class="room-text">
            <span class="room-name">
              {{ room.roomName }}
              <span v-if="room.isCreator" class="host-tag">내가 연 방</span>
            </span>
            <span class="room-meta sf-num">
              <span :class="isRoomOpen(room) ? 'status-open' : 'status-closed'">
                {{ isRoomOpen(room) ? '모집 중' : '마감' }}
              </span>
              <span>{{ room.currentParticipants }}/{{ room.maxParticipants }}명</span>
              <span>{{ room.userName }}</span>
            </span>
          </span>
          <span v-if="(room.unReadCount || 0) > 0" class="unread sf-num" :aria-label="`안 읽은 메시지 ${room.unReadCount}개`">
            {{ room.unReadCount > 99 ? '99+' : room.unReadCount }}
          </span>
        </button>

        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon="mdi-dots-horizontal"
              variant="text"
              size="small"
              class="room-menu"
              :aria-label="`${room.roomName} 메뉴`"
            />
          </template>
          <v-list density="compact" min-width="160">
            <v-list-item prepend-icon="mdi-information-outline" title="방 정보 보기" @click="viewRoomInfo(room, true)" />
            <v-list-item
              :prepend-icon="room.isCreator ? 'mdi-delete-outline' : 'mdi-exit-to-app'"
              :title="room.isCreator ? '방 삭제' : '방 나가기'"
              base-color="error"
              @click="leaveRoom(room)"
            />
          </v-list>
        </v-menu>
      </li>
    </ul>

    <p v-if="!isLoading && sortedMyPurchaseRooms.length === 0" class="empty-hint">
      공동구매 채팅은 커뮤니티의 공동구매 글에서 참여할 수 있어요.
    </p>

    <RoomInfoModal
      v-if="selectedRoomIdForModal"
      v-model="isModalOpen"
      :roomId="selectedRoomIdForModal"
      :isParticipant="isParticipantforModal"
      @room-joined="handleRoomJoined"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import RoomInfoModal from './RoomInfoModal.vue';
import { notify, notifyError, confirmAction } from '@/composables/chatFeedback';
import axios from 'axios';
import { getErrorMessage, getFridgeId, getResultData } from '@/utils/commonDataHandler';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';

const store = useStore();
const route = useRoute();


const selectedRoomId = ref(null);
const emit = defineEmits(['select-room', 'room-left']);
const isParticipantforModal = ref(false); // 사용자가 해당 방의 참여자인지 여부를 추적하는 ref 추가

// [추가] 모달의 상태를 관리할 ref들을 추가합니다.
const isModalOpen = ref(false); // 모달이 열렸는지 여부
const selectedRoomIdForModal = ref(null); // 모달에 표시할 방 정보

const managerRoom = ref(null);    // 첫 번째 채팅방
const myPurchaseRooms = ref([]);     // 나머지 모든 채팅방
const isLoading = ref(true); // 1. 로딩 상태를 관리할 ref 추가 (초기값 true)
const fridgeId = computed(() => getFridgeId(store));

const myEmail = ref(localStorage.getItem('email'));
let isRefreshingUnread = false;

// 닫힌 채팅방을 하단에 위치시키는 computed 속성
const sortedMyPurchaseRooms = computed(() => {
  return [...myPurchaseRooms.value].sort((a, b) => {
    const aIsOpen = isRoomOpen(a);
    const bIsOpen = isRoomOpen(b);
    
    // 열린 방이 먼저, 닫힌 방이 나중에 오도록 정렬
    if (aIsOpen && !bIsOpen) return -1;
    if (!aIsOpen && bIsOpen) return 1;
    return 0;
  });
});

onMounted(async () => {
  try {
    await loadRooms();
  } catch (error) {
    console.error("채팅방 목록 조회 실패:", error);
  } finally {
    isLoading.value = false;
  }

  // 게시판 공동구매 글에서 들어온 경우(?roomId=) 그 방을 바로 연다
  const targetRoomId = Number(route.query.roomId);
  const targetRoom = targetRoomId ? myPurchaseRooms.value.find(r => r.roomId === targetRoomId) : null;
  if (targetRoom) {
    selectRoom(targetRoom, 'purchase');
  }

  // 전역 SSE로부터 전달되는 실시간 알림 수신 시작
  window.addEventListener('realtime-notification', handleRealtimeNotification);
});

onUnmounted(() => {
  window.removeEventListener('realtime-notification', handleRealtimeNotification);
});

// 관리자와의 1:1 방은 응답에 isManager(Boolean)가 채워져 있고, 공동구매 방은 비어 있다
const isManagerRoom = (room) => typeof room.isManager === 'boolean';

const fetchRooms = async () => {
  const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/chat/my/rooms/${fridgeId.value}`);
  const allRooms = getResultData(response);
  const rooms = Array.isArray(allRooms) ? allRooms : [];
  return {
    manager: rooms.find(isManagerRoom) ?? null,
    purchase: rooms.filter(room => !isManagerRoom(room)),
  };
};

// 목록을 새로 받아 화면과 배지를 맞춘다
const loadRooms = async () => {
  const { manager, purchase } = await fetchRooms();
  managerRoom.value = manager;
  myPurchaseRooms.value = purchase;
  syncChatBadges();
};

// 채팅 목록 새로고침 (참여·나가기·구매 완료 후)
const refreshRooms = async () => {
  try {
    await loadRooms();
  } catch (error) {
    console.error("채팅방 목록 조회 실패:", error);
    notifyError(getErrorMessage(error));
  }
};

// 채팅방 참여 후 목록 새로고침 함수
const handleRoomJoined = async () => {
  await refreshRooms();
};

// 외부에서 호출할 수 있는 함수들을 expose
defineExpose({
  refreshRooms,
  // 모바일에서 목록으로 돌아갈 때 선택 표시를 지운다
  clearSelection: () => { selectedRoomId.value = null; },
});

const isRoomOpen = (room) => {
  // room.joinStatus 값에 따라 방의 열림/닫힘 상태 판단
  // OPEN: 열린 상태, CLOSED: 닫힌 상태
  return room.joinStatus === 'OPEN';
};


const selectRoom = (room, roomType) => {
  selectedRoomId.value = room.roomId;
  // isCreator와 isOpen 정보를 room 객체에 추가
  const roomWithInfo = {
    ...room,
    isCreator: room.isCreator || false,
    isOpen: isRoomOpen(room)
  };
  
  emit('select-room', roomWithInfo, roomType);
  // 선택 시 해당 방의 미읽음 카운트만 초기화 (배지는 서버 상태 기반으로 유지)
  if (roomType === 'manager') {
    // 관리자 채팅 선택 시
    if (managerRoom.value && managerRoom.value.roomId === room.roomId) {
      managerRoom.value.unReadCount = 0;
    }
  } else {
    // 그룹 채팅 선택 시
    const target = myPurchaseRooms.value.find(r => r.roomId === room.roomId);
    if (target) target.unReadCount = 0;
  }

  syncChatBadges();
};

const startChat = (room) => {
  selectRoom(room, 'purchase');
};

// [수정] viewRoomInfo 함수가 모달을 열도록 수정합니다.
const viewRoomInfo = (room, isParticipant) => {
  selectedRoomIdForModal.value = room.roomId; // 클릭된 방의 정보를 저장
  isModalOpen.value = true;           // 모달을 열도록 상태 변경
  isParticipantforModal.value = isParticipant; // 참여자 여부를 저장
};

const leaveRoom = async (room) => {
  if (!room?.roomId) return;

  // 방장이 나가면 방이 삭제된다
  const isCreator = room.isCreator;
  const actionText = isCreator ? '삭제' : '나가기';
  const confirmed = await confirmAction(isCreator
    ? {
        title: '채팅방 삭제',
        message: `'${room.roomName}' 방을 삭제할까요?\n방장이 나가면 방과 대화 내용이 모두 삭제되고 복구할 수 없습니다.`,
        confirmText: '삭제',
        color: 'error',
      }
    : {
        title: '채팅방 나가기',
        message: `'${room.roomName}' 방에서 나갈까요?`,
        confirmText: '나가기',
        color: 'error',
      });
  if (!confirmed) return;

  isLoading.value = true;
  try {
    await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/purchase/chat/${room.roomId}/leave`);
    notify(isCreator ? '채팅방을 삭제했습니다.' : '채팅방에서 나갔습니다.');
    await refreshRooms();
    // 지금 보고 있던 방일 때만 대화 화면을 닫는다
    if (selectedRoomId.value === room.roomId) {
      selectedRoomId.value = null;
      emit('room-left', room.roomId);
    }
  } catch (error) {
    console.error("채팅방 나가기 실패:", error);
    const status = error.response?.status;
    const reason = status === 403 ? '권한이 없습니다.'
      : status === 404 ? '채팅방을 찾을 수 없습니다.'
      : getErrorMessage(error);
    notifyError(`${actionText}에 실패했습니다: ${reason}`);
  } finally {
    isLoading.value = false;
  }
};

// ---------------- 실시간 알림 처리 (전역 SSE 이벤트) ----------------
function extractRoomIdFromNotification(n) {
  const rid = n?.roomId ?? n?.chatRoomId ?? n?.room?.id ?? n?.relatedData?.roomId ?? null;
  return rid === null ? null : Number(rid);
}

function syncChatBadges() {
  const managerUnreadCount = managerRoom.value?.unReadCount || 0;
  const groupUnreadCount = myPurchaseRooms.value?.reduce((sum, r) => sum + (r.unReadCount || 0), 0) || 0;
  store.commit('notification/setGroupChatCount', managerUnreadCount + groupUnreadCount > 0 ? 1 : 0);

  // 유저 관리 배지도 이미 받은 목록으로 맞춘다 (같은 목록을 다시 조회하지 않음)
  store.commit('notification/setUserManagementBadgeState', {
    hasUnreadMessages: managerUnreadCount > 0,
    isSetByUserManagement: true,
  });
}

function handleRealtimeNotification(evt) {
  const n = evt?.detail;
  if (!n) return;
  // 내 메시지는 무시
  if (n.senderEmail && n.senderEmail === myEmail.value) return;
  const isChatType = n.type === 'MANAGER_CHAT' || n.type === 'GROUP_CHAT' || n.type === 'ROOM_FULL';
  if (!isChatType) return;

  // 서버가 알림에 방 id(roomId)를 실어 보내므로 그 방만 올린다
  const rid = extractRoomIdFromNotification(n);
  if (rid) {
    // 지금 열려 있는 방은 읽고 있으므로 올리지 않는다
    if (selectedRoomId.value === rid) return;

    const target = managerRoom.value?.roomId === rid
      ? managerRoom.value
      : myPurchaseRooms.value.find(r => r.roomId === rid);
    if (target) {
      target.unReadCount = (target.unReadCount || 0) + 1;
      syncChatBadges();
      return;
    }
  }

  // 방 id를 알 수 없거나 목록에 없는 방(새로 참여한 방 등)이면 서버에서 다시 맞춘다
  refreshUnreadCounts();
}

// 방 객체는 그대로 두고 안 읽은 수만 서버 값으로 맞춘다 (선택된 방 객체가 바뀌지 않게)
async function refreshUnreadCounts() {
  if (isRefreshingUnread) return;
  isRefreshingUnread = true;
  try {
    const { manager, purchase } = await fetchRooms();
    if (manager && managerRoom.value?.roomId === manager.roomId) {
      managerRoom.value.unReadCount = manager.unReadCount || 0;
    }
    const counts = new Map(purchase.map(r => [r.roomId, r.unReadCount || 0]));
    myPurchaseRooms.value.forEach((room) => {
      if (counts.has(room.roomId)) room.unReadCount = counts.get(room.roomId);
    });
    syncChatBadges();
  } catch {
    // 네트워크 오류는 조용히 무시
  } finally {
    isRefreshingUnread = false;
  }
}
</script>

<style scoped>
.chat-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--sf-surface);
  border-right: 1px solid var(--sf-line);
  overflow: hidden;
}

.sidebar-head {
  padding: 20px 20px 12px;
}

.sidebar-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--sf-text);
}

.room-list {
  flex: 1;
  margin: 0;
  padding: 0 8px 8px;
  list-style: none;
  overflow-y: auto;
}

.room-item {
  position: relative;
  display: flex;
  align-items: center;
}

.room-main {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 64px;
  padding: 10px 44px 10px 12px;
  border: none;
  border-radius: var(--sf-radius-md);
  background: none;
  font: inherit;
  text-align: left;
  color: inherit;
  cursor: pointer;
}

.room-item:not(:has(.room-menu)) .room-main {
  padding-right: 12px;
}

.room-main:hover {
  background: var(--sf-bg);
}

.room-main.is-active {
  background: var(--sf-mint-soft);
}

.room-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #FFF0E6;
  color: #C2501A;
}

.room-icon.is-manager {
  background: var(--sf-mint-soft);
  color: var(--sf-primary);
}

.is-closed .room-icon {
  background: var(--sf-bg);
  color: var(--sf-text-faint);
}

.room-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.room-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--sf-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.host-tag {
  margin-left: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--sf-text-faint);
}

.room-meta {
  display: flex;
  gap: 8px;
  font-size: 13px;
  color: var(--sf-text-faint);
  white-space: nowrap;
  overflow: hidden;
}

.status-open {
  font-weight: 600;
  color: var(--sf-primary);
}

.status-closed {
  font-weight: 600;
  color: var(--sf-text-faint);
}

.unread {
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  background: var(--sf-expired);
  font-size: 12px;
  font-weight: 700;
  line-height: 22px;
  text-align: center;
  color: #fff;
}

.room-menu {
  position: absolute;
  right: 4px;
  color: var(--sf-text-faint);
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 16px;
  font-size: 14px;
  color: var(--sf-text-sub);
}

.state-box p {
  margin: 0;
}

.empty-hint {
  margin: 0;
  padding: 12px 20px 20px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--sf-text-faint);
}
</style>
