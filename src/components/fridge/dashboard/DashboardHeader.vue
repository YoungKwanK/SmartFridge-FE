<template>
  <div class="dashboard-header sf-page-head">
    <div class="header-info">
      <div class="fridge-title-section">
        <h1 class="sf-page-title">{{ fridge.fridgeName }}</h1>
        <span class="type-tag" :class="`is-${(fridge.type || 'member').toLowerCase()}`">
          <v-icon size="14" aria-hidden="true">{{ getTypeIcon(fridge.type) }}</v-icon>
          {{ getTypeText(fridge.type) }}
        </span>
      </div>
      <p v-if="fridge.description" class="sf-page-desc fridge-subtitle">{{ fridge.description }}</p>
    </div>
    <div class="header-actions">
      <button
        type="button"
        class="notification-icon"
        :aria-label="notificationCount > 0 ? `새 알림 ${notificationCount}개 보기` : '알림 보기'"
        @click="showNotificationModal = true"
      >
        <span class="icon-container">
          <v-icon size="24" aria-hidden="true">mdi-bell-outline</v-icon>
          <span
            v-if="notificationCount > 0"
            class="notification-badge sf-num"
            aria-hidden="true"
          >
            {{ notificationCount > 99 ? '99+' : notificationCount }}
          </span>
        </span>
      </button>
    </div>

    <!-- 알림 모달 -->
    <v-dialog v-model="showNotificationModal" max-width="480" persistent>
      <v-card class="notification-modal">
        <v-card-title class="modal-header">
          <div class="modal-title">
            <v-icon color="primary" size="20" class="mr-2">mdi-bell</v-icon>
            <span>최근 알림</span>
          </div>
          <v-btn 
            icon 
            variant="text" 
            size="small"
            @click="showNotificationModal = false"
            class="close-btn"
          >
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="modal-content">
          <div v-if="recentNotifications.length > 0" class="notifications-list">
            <div 
              v-for="(notification, index) in recentNotifications" 
              :key="notification.id"
              class="notification-item"
              :class="{ 'last-item': index === recentNotifications.length - 1, 'unread': !notification.isRead }"
              @click="handleNotificationClick(notification)"
            >
              <div class="notification-icon-wrapper">
                <v-icon 
                  :color="getNotificationColor(notification.type)"
                  size="16"
                  class="notification-type-icon"
                >
                  {{ getNotificationIcon(notification.type) }}
                </v-icon>
              </div>
              <div class="notification-details">
                <div class="notification-header">
                  <span class="notification-type">{{ getNotificationTypeText(notification.type) }}</span>
                  <span class="notification-time">{{ formatTimeAgo(notification.createdAt || notification.timestamp) }}</span>
                </div>
                <div class="notification-content">
                  {{ notification.content || notification.contents || notification.message || '알림 내용' }}
                </div>
              </div>
              <!-- 읽지 않은 알림 표시 -->
              <div v-if="!notification.isRead" class="unread-indicator">
                <v-icon size="10" color="error">mdi-circle</v-icon>
              </div>
            </div>
          </div>
          <div v-else class="no-notifications">
            <v-icon size="36" color="medium-emphasis">mdi-bell-off-outline</v-icon>
            <p class="no-notifications-text">새 알림이 없어요</p>
          </div>
        </v-card-text>
        
        <v-divider></v-divider>
        
                 <v-card-actions class="modal-actions">
           <v-spacer></v-spacer>
           
           <v-btn 
             color="primary" 
             variant="elevated"
             size="small"
             @click="goToNotificationList"
             :disabled="recentNotifications.length === 0"
             class="view-all-btn"
           >
             <v-icon size="16" class="mr-1">mdi-format-list-bulleted</v-icon>
             전체 보기
           </v-btn>
         </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import axios from 'axios';

// Props 정의
const props = defineProps({
  fridgeId: {
    type: String,
    required: true
  }
});

const fridge = ref({});

const store = useStore();
const router = useRouter();

// 반응형 변수들
const showNotificationModal = ref(false);

// 알림 관련 상태
const initialNotifications = ref([]);
const realtimeNotifications = ref([]);

// 실시간 알림 이벤트 핸들러 (onUnmounted에서 참조하기 위해 상단에 정의)
const handleRealtimeNotificationEvent = (event) => {
  const notification = event.detail;
  
  // fridgeId 비교 (문자열과 숫자 타입 모두 고려)
  const eventFridgeId = String(notification.fridgeId);
  const currentFridgeId = String(props.fridgeId);
    
  if (eventFridgeId === currentFridgeId) {
    handleRealtimeNotification(notification);
  }
};

// Props로 받은 fridgeId 사용하여 알림 개수 계산 (채팅 알림 제외)
const notificationCount = computed(() => {
  const allNotifications = [...initialNotifications.value, ...realtimeNotifications.value];
  
  // 채팅 관련 알림 필터링
  const filteredNotifications = allNotifications.filter(notification => {
    const chatTypes = ['MANAGER_CHAT', 'GROUP_CHAT', 'ROOM_FULL'];
    return !chatTypes.includes(notification.type);
  });
  
  return filteredNotifications.length;
});

// 최근 알림 목록 (초기값 + 실시간, 최대 5개)
const recentNotifications = computed(() => {
  const allNotifications = [...initialNotifications.value, ...realtimeNotifications.value];
  
  // 채팅 관련 알림 필터링 (Dashboard에서는 채팅 알림 제외)
  const filteredNotifications = allNotifications.filter(notification => {
    const chatTypes = ['MANAGER_CHAT', 'GROUP_CHAT', 'ROOM_FULL'];
    return !chatTypes.includes(notification.type);
  });
  
  // 데이터 구조 통일: createdAt과 timestamp를 모두 사용
  const normalizedNotifications = filteredNotifications.map(notification => ({
    ...notification,
    // createdAt이 없으면 timestamp 사용, 둘 다 없으면 현재 시간 사용
    normalizedTime: notification.createdAt || notification.timestamp || new Date().toISOString()
  }));
  
  // 최신순으로 정렬하고 최대 5개만 반환
  const sortedNotifications = normalizedNotifications
    .sort((a, b) => new Date(b.normalizedTime) - new Date(a.normalizedTime))
    .slice(0, 5);
  
  return sortedNotifications;
});

// 초기 읽지 않은 알림 가져오기 (최근 5개)
const fetchInitialNotifications = async () => {
  try {
    if (!props.fridgeId) {
      return;
    }
    
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/fridge/${props.fridgeId}/notification/badgeNotification`);
    
    if (response.data.result) {
      // content가 배열인지 확인하고 안전하게 설정
      if (Array.isArray(response.data.result.content)) {
        initialNotifications.value = response.data.result.content;
      } else if (Array.isArray(response.data.result)) {
        // result 자체가 배열인 경우
        initialNotifications.value = response.data.result;
      } else {
        // 다른 구조인 경우 빈 배열로 설정
        initialNotifications.value = [];
      }
    } else {
      initialNotifications.value = [];
    }
  } catch (error) {
    console.error('초기 알림 로딩 실패:', error);
    initialNotifications.value = [];
  }
};

// 냉장고 정보 가져오기 (props로 받은 fridgeId 사용)
const fetchFridgeInfo = async () => {
  try {
    if (!props.fridgeId) {
      return;
    }
    
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/fridge/${props.fridgeId}/detail`);
    if (response.data.result) {
      fridge.value = response.data.result;
    }
  } catch (error) {
    console.error('냉장고 정보 로딩 실패:', error);
  }
};

// 실시간 알림 처리 함수
const handleRealtimeNotification = (notification) => {
  
  // 실시간 알림 데이터 구조 통일
  const normalizedNotification = {
    ...notification,
    // timestamp가 없으면 createdAt 사용, 둘 다 없으면 현재 시간 사용
    timestamp: notification.timestamp || notification.createdAt || new Date().toISOString(),
    // createdAt도 추가하여 일관성 유지
    createdAt: notification.createdAt || notification.timestamp || new Date().toISOString()
  };
  
  
  // 새로운 실시간 알림 추가
  realtimeNotifications.value.unshift(normalizedNotification);
  
  // 최대 5개 유지 (초기값과 실시간 알림 합쳐서)
  const totalCount = initialNotifications.value.length + realtimeNotifications.value.length;
  
  if (totalCount > 5) {
    // 가장 오래된 알림 제거 (초기값에서 제거)
    if (initialNotifications.value.length > 0) {
      initialNotifications.value.pop();
    }
  }
  
};

onMounted(() => {
  // 전역 SSE 연결이 이미 App.vue에서 관리되므로 여기서는 별도 연결하지 않음
  
  if (!props.fridgeId) {
    return;
  }
  
  fetchFridgeInfo();
  fetchInitialNotifications();
  
  // 실시간 알림 이벤트 리스너 등록
  window.addEventListener('realtime-notification', handleRealtimeNotificationEvent);
  
  // SSE 연결 상태 확인
  
  
});

// fridgeId prop 변경 감지하여 알림 초기화
watch(() => props.fridgeId, (newFridgeId, oldFridgeId) => {
  if (newFridgeId && oldFridgeId && newFridgeId !== oldFridgeId) {
    
    // 기존 알림 초기화
    initialNotifications.value = [];
    realtimeNotifications.value = [];
    
    // 새로운 냉장고 정보와 알림 가져오기
    fetchFridgeInfo();
    fetchInitialNotifications();
    
    // SSE 연결 재설정
    store.dispatch('notification/refreshSSEOnFridgeChange', newFridgeId);
  }
}, { immediate: false });

// 컴포넌트 언마운트 시 이벤트 리스너 정리
onUnmounted(() => {
  window.removeEventListener('realtime-notification', handleRealtimeNotificationEvent);
});

// 전역 SSE 연결이 App.vue에서 관리되므로 별도 연결 코드 제거

// 냉장고 타입 관련 함수들
const getTypeIcon = (type) => {
  switch (type) {
    case 'MANAGER': return 'mdi-account-cog-outline';  // 관리자: 설정 아이콘
    default: return 'mdi-account-outline';             // 일반 멤버
  }
};

const getTypeText = (type) => {
  switch (type) {
    case 'MANAGER': return '관리자';  // 관리자
    case 'COMMON': return '일반';     // 일반 멤버
    default: return '멤버';
  }
};

const handleNotificationClick = async (notification) => {
  // 알림 클릭 시 읽음 처리
  if (!notification.isRead) {
    // 초기 알림에서 제거
    const initialIndex = initialNotifications.value.findIndex(n => n.id === notification.id);
    if (initialIndex !== -1) {
      initialNotifications.value.splice(initialIndex, 1);
    }
    
    // 실시간 알림에서 제거
    const realtimeIndex = realtimeNotifications.value.findIndex(n => n.id === notification.id);
    if (realtimeIndex !== -1) {
      realtimeNotifications.value.splice(realtimeIndex, 1);
    }
    
    // Vuex store에도 반영
    store.commit('notification/markFridgeNotificationAsRead', {
      fridgeId: props.fridgeId,
      notificationId: notification.id
    });

    // 서버에 단건 읽음 처리 반영 (실패해도 UI는 유지)
    try {
      if (notification.id) {
        await axios.patch(
          `${import.meta.env.VITE_API_BASE_URL}/fridge/${props.fridgeId}/notification/isRead`,
          [{ notificationId: notification.id }]
        );
      }
    } catch (error) {
      // 네트워크 오류 등은 무시 (필요 시 재시도 정책 추가 가능)
    }
  }

  // 타입별 라우팅
  const type = notification?.type;
  const extractPostId = (n) => (
    n?.targetId ?? n?.postId ?? n?.announceId ?? n?.announcementId ?? n?.boardId ?? n?.post?.id ?? n?.target?.id ?? null
  );
  const postId = extractPostId(notification);

  if (type === 'EXPIRATION_IMMINENT') {
    router.push('/fridge/food/shared');
    showNotificationModal.value = false;
    return;
  }

  if (type === 'NEW_MEMBER') {
    router.push('/fridge/member/list');
    showNotificationModal.value = false;
    return;
  }

  if (type === 'ADMIN_REPLY' || type === 'ADMIN_REPLY_UPDATED') {
    router.push('/inquiry');
    showNotificationModal.value = false;
    return;
  }

  if (type === 'NEW_ANNOUNCEMENT' || type === 'NEW_COMMENT') {
    if (postId) {
      const commentId = notification?.commentId || notification?.targetCommentId || notification?.comment?.id;
      if (type === 'NEW_COMMENT' && commentId) {
        router.push({ path: `/fridge/post/${postId}`, query: { commentId } });
      } else if (type === 'NEW_COMMENT') {
        router.push({ path: `/fridge/post/${postId}`, query: { scrollTo: 'comments' } });
      } else {
        router.push(`/fridge/post/${postId}`);
      }
    } else {
      router.push('/fridge/community');
    }
    showNotificationModal.value = false;
    return;
  }

  // 기존 fallbacks
  if (notification.targetType === 'ANNOUNCE') {
    if (postId) router.push(`/fridge/post/${postId}`);
    else router.push('/fridge/community');
    showNotificationModal.value = false;
    return;
  }
  if (notification.targetType === 'FOOD') {
    router.push('/fridge/food/shared');
    showNotificationModal.value = false;
    return;
  }
};

const goToNotificationList = () => {
  router.push(`/notification/list`);
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '방금 전';
  
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  
  return time.toLocaleDateString();
};

const getNotificationTypeText = (type) => {
  switch (type) {
    case 'ADMIN_REPLY': return '관리자 답변';
    case 'ADMIN_REPLY_UPDATED': return '답변 수정';
    case 'EXPIRATION_IMMINENT': return '유통기한 임박';
    case 'NEW_ANNOUNCEMENT': return '새로운 공지';
    case 'NEW_COMMENT': return '새로운 댓글';
    case 'NEW_MEMBER': return '새로운 멤버';
    default: return '알림';
  }
};

// 알림 타입별 아이콘
const getNotificationIcon = (type) => {
  switch (type) {
    case 'ADMIN_REPLY':
    case 'ADMIN_REPLY_UPDATED': return 'mdi-account-cog';
    case 'EXPIRATION_IMMINENT': return 'mdi-clock-alert';
    case 'NEW_ANNOUNCEMENT': return 'mdi-bullhorn';
    case 'NEW_COMMENT': return 'mdi-comment';
    case 'NEW_MEMBER': return 'mdi-account-plus';
    default: return 'mdi-bell';
  }
};

// 알림 타입별 색상
const getNotificationColor = (type) => {
  switch (type) {
    case 'ADMIN_REPLY':
    case 'ADMIN_REPLY_UPDATED': return 'blue';
    case 'EXPIRATION_IMMINENT': return 'red';
    case 'NEW_ANNOUNCEMENT': return 'purple';
    case 'NEW_COMMENT': return 'orange';
    case 'NEW_MEMBER': return 'teal';
    default: return 'grey';
  }
};
</script>

<style scoped>
.header-info {
  flex: 1;
  min-width: 0;
}

.fridge-title-section {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.type-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 8px;
  border-radius: var(--sf-radius-sm);
  background: var(--sf-surface);
  border: 1px solid var(--sf-line);
  font-size: var(--sf-fs-xs);
  font-weight: 600;
  color: var(--sf-text-sub);
}

.type-tag.is-manager {
  background: var(--sf-mint-soft);
  border-color: transparent;
  color: var(--sf-primary);
}

.fridge-subtitle {
  max-width: 60ch;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.notification-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--sf-line);
  border-radius: var(--sf-radius-md);
  background: var(--sf-surface);
  color: var(--sf-text);
  cursor: pointer;
}

.notification-icon:hover {
  border-color: var(--sf-line-strong);
}

.icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-badge {
  position: absolute;
  top: -7px;
  right: -9px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--sf-expired);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--sf-fs-xs);
  font-weight: 700;
  border: 2px solid var(--sf-surface);
  box-sizing: border-box;
  line-height: 1;
}

/* 알림 모달 스타일 */
.notification-modal {
  border-radius: 16px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: var(--sf-bg);
  border-bottom: 1px solid var(--sf-line);
}

.modal-title {
  display: flex;
  align-items: center;
  font-size: var(--sf-fs-lg);
  font-weight: 600;
  color: var(--sf-text);
}

.close-btn {
  color: var(--sf-text-sub);
}

.modal-content {
  padding: 24px;
}

.notifications-list {
  max-height: 300px; /* 스크롤 가능한 최대 높이 */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* 스크롤 부드럽게 */
}

.notification-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--sf-line);
  cursor: pointer; /* 클릭 가능하도록 커서 변경 */
  transition: all 0.2s ease;
  border-radius: 8px;
  margin: 4px 0;
  padding: 12px;
}

.notification-item:hover {
  background-color: var(--sf-bg);
  transform: translateX(4px);
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item.unread {
  background-color: var(--sf-mint-soft);
  border-left: 3px solid var(--sf-primary);
}

.notification-item.unread:hover {
  background-color: var(--sf-mint-soft);
}

.notification-icon-wrapper {
  flex-shrink: 0;
  margin-right: 12px;
}

.notification-type-icon {
  font-weight: 600;
}

.notification-details {
  flex: 1;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.notification-type {
  font-size: var(--sf-fs-md);
  font-weight: 600;
  color: var(--sf-text-sub);
}

.notification-time {
  font-size: var(--sf-fs-xs);
  color: var(--sf-text-sub);
}

.notification-content {
  font-size: var(--sf-fs-md);
  color: var(--sf-text);
  line-height: 1.4;
}

.unread-indicator {
  margin-left: 10px;
  flex-shrink: 0;
}

.no-notifications {
  text-align: center;
  padding: 40px 20px;
}

.no-notifications-text {
  margin-top: 16px;
  font-size: var(--sf-fs-md);
}

.modal-actions {
  padding: 16px 24px;
  background-color: var(--sf-bg);
  border-top: 1px solid var(--sf-line);
}

.view-all-btn {
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
}
.modal-header {

  display: flex;

  justify-content: space-between;

  align-items: center;

  padding: 16px 24px;

  background-color: var(--sf-bg);

  border-bottom: 1px solid var(--sf-line);

}



.modal-title {

  display: flex;

  align-items: center;

  font-size: var(--sf-fs-lg);

  font-weight: 600;

  color: var(--sf-text);

}



.close-btn {

  color: var(--sf-text-sub);

}



.modal-content {

  padding: 24px;

}



.notifications-list {

  max-height: 300px; /* 스크롤 가능한 최대 높이 */

  overflow-y: auto;

  -webkit-overflow-scrolling: touch; /* 스크롤 부드럽게 */

}



.notification-item {

  display: flex;

  align-items: center;

  padding: 12px 0;

  border-bottom: 1px solid var(--sf-line);

  cursor: pointer; /* 클릭 가능하도록 커서 변경 */
  transition: all 0.2s ease;
  border-radius: 8px;
  margin: 4px 0;
  padding: 12px;
}

.notification-item:hover {
  background-color: var(--sf-bg);
  transform: translateX(4px);
}



.notification-item:last-child {

  border-bottom: none;

}


.notification-item.unread {
  background-color: var(--sf-mint-soft);
  border-left: 3px solid var(--sf-primary);
}

.notification-item.unread:hover {
  background-color: var(--sf-mint-soft);
}


.notification-icon-wrapper {

  flex-shrink: 0;

  margin-right: 12px;

}



.notification-type-icon {

  font-weight: 600;

}



.notification-details {

  flex: 1;

}



.notification-header {

  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-bottom: 4px;

}



.notification-type {

  font-size: var(--sf-fs-md);

  font-weight: 600;

  color: var(--sf-text-sub);

}



.notification-time {

  font-size: var(--sf-fs-xs);

  color: var(--sf-text-sub);

}



.notification-content {

  font-size: var(--sf-fs-md);

  color: var(--sf-text);

  line-height: 1.4;

}


.unread-indicator {
  margin-left: 10px;
  flex-shrink: 0;
}


.no-notifications {

  text-align: center;

  padding: 40px 20px;

}



.no-notifications-text {

  margin-top: 16px;

  font-size: var(--sf-fs-md);

}



.modal-actions {

  padding: 16px 24px;

  background-color: var(--sf-bg);

  border-top: 1px solid var(--sf-line);

}



.view-all-btn {

  font-weight: 600;

  text-transform: none;

  letter-spacing: normal;

}

</style>
