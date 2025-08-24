<template>
  <v-container>
    <h1>메인페이지입니다</h1>
    <v-btn :to="'/login'">로그인</v-btn>
    <div class="mt-5">
      <v-badge color="red" :content="unreadCount">
        <v-btn>알림</v-btn>
      </v-badge>

      <!-- 알림 목록 -->
      <div v-if="notifications.length > 0" class="mt-3">
        <h3>최근 알림 ({{ notifications.length }}개)</h3>
        <v-list>
          <v-list-item 
            v-for="(notif, index) in notifications" 
            :key="notif.id || `${notif.type}-${notif.senderEmail}-${index}`"
            class="notification-item"
            :class="{ 'unread': !notif.isRead }"
            @click="markAsRead(notif.id)"
          >
            <template v-slot:prepend>
              <v-icon 
                :color="getNotificationColor(notif.type)"
                size="small"
              >
                {{ getNotificationIcon(notif.type) }}
              </v-icon>
            </template>
            <v-list-item-title>
              <strong>{{ getNotificationTitle(notif.type) }}</strong>
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ notif.senderEmail || '시스템' }}: {{ notif.contents || '알림 내용' }}
            </v-list-item-subtitle>
            <template v-slot:append>
              <v-chip 
                v-if="!notif.isRead" 
                size="small" 
                color="red" 
                text-color="white"
              >
                NEW
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
        
        <!-- 타입별 카운트 표시 -->
        <div class="mt-3">
          <h4>알림 타입별 현황</h4>
          <v-chip-group>
            <v-chip 
              v-for="(count, type) in typeCounts" 
              :key="type"
              :color="getNotificationColor(type)"
              variant="outlined"
              size="small"
            >
              {{ getNotificationTitle(type) }}: {{ count }}
            </v-chip>
          </v-chip-group>
        </div>
      </div>

      <div v-else class="mt-3 text-gray-500">
        현재 알림이 없습니다.
      </div>
    </div>

    <div class="mt-5">
      <v-btn :to="'/#'">문의하기</v-btn>
    </div>
  </v-container>
</template>

<script setup>
import { onMounted, onBeforeUnmount, computed } from 'vue';
import { useStore } from 'vuex';
import { EventSourcePolyfill } from 'event-source-polyfill';

const store = useStore();
let eventSource = null;

// Vuex store에서 상태 가져오기
const notifications = computed(() => store.getters['notification/allNotifications']);
const typeCounts = computed(() => store.getters['notification/typeCounts']);
const unreadCount = computed(() => store.getters['notification/unreadCount']);

onMounted(() => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('토큰이 없어서 SSE 연결을 시도하지 않습니다.');
    return;
  }

  console.log('SSE 연결 시도 중...');
  connectSSE(token);
});

onBeforeUnmount(() => {
  if (eventSource) {
    eventSource.close();
    console.log('SSE 연결 종료');
  }
});

function connectSSE(token) {
  eventSource = new EventSourcePolyfill(
    `${process.env.VUE_APP_API_BASE_URL}/sse/connect/notification`,
    {
      headers: { 
        Authorization: `Bearer ${token}`
      },
      reconnectInterval: 3000,
      maxReconnectAttempts: 10
    }
  );

  eventSource.onopen = () => {
    console.log('SSE 연결 성공');
  };

  // 타입별 커스텀 이벤트 리스너 등록
  const notificationTypes = [
    'ADMIN_REPLY', 'NEW_FOOD', 'EXPIRATION_IMMINENT', 
    'NEW_ANNOUNCEMENT', 'NEW_COMMENT', 'NEW_INQUIRY', 'NEW_MEMBER'
  ];

  notificationTypes.forEach(type => {
    eventSource.addEventListener(type, (event) => {
      console.log(`[SSE] ${type} 이벤트 수신:`, event.data);
      
      try {
        const data = JSON.parse(event.data);
        if (data) {
          // Vuex store에 알림 추가
          store.dispatch('notification/addNotification', {
            ...data,
            type: type,
            timestamp: new Date().toISOString(),
            isRead: false
          });
          
          console.log(`[SSE] ${type} 알림이 store에 추가되었습니다.`);
        }
      } catch (e) {
        console.error(`[SSE] ${type} JSON 파싱 실패:`, e, '원본 데이터:', event.data);
      }
    });
  });

  // 일반 메시지도 처리 (fallback)
  eventSource.onmessage = (event) => {
    console.log(`[SSE] 일반 메시지 수신:`, event.data);
    
    try {
      const data = JSON.parse(event.data);
      if (data && data.type) {
        store.dispatch('notification/addNotification', {
          ...data,
          timestamp: new Date().toISOString(),
          isRead: false
        });
      }
    } catch (e) {
      console.error('[SSE] 일반 메시지 JSON 파싱 실패:', e, '원본 데이터:', event.data);
    }
  };

  eventSource.onerror = (event) => {
    console.error('SSE 연결 에러:', event);
    setTimeout(() => {
      if (eventSource && eventSource.readyState !== EventSource.CLOSED) {
        console.log('SSE 재연결 시도...');
        eventSource.close();
        connectSSE(token);
      }
    }, 5000);
  };
}

// 알림 읽음 처리
function markAsRead(notificationId) {
  if (notificationId) {
    store.dispatch('notification/markAsRead', notificationId);
  }
}

// 알림 타입별 제목
const getNotificationTitle = (type) => {
  switch (type) {
    case 'ADMIN_REPLY': return '관리자 답변';
    case 'NEW_FOOD': return '새로운 음식';
    case 'EXPIRATION_IMMINENT': return '유통기한 임박';
    case 'NEW_ANNOUNCEMENT': return '새로운 공지';
    case 'NEW_COMMENT': return '새로운 댓글';
    case 'NEW_INQUIRY': return '새로운 문의';
    case 'NEW_MEMBER': return '새로운 멤버';
    default: return '알림';
  }
};

// 알림 타입별 아이콘
const getNotificationIcon = (type) => {
  switch (type) {
    case 'ADMIN_REPLY': return 'mdi-account-cog';
    case 'NEW_FOOD': return 'mdi-food';
    case 'EXPIRATION_IMMINENT': return 'mdi-clock-alert';
    case 'NEW_ANNOUNCEMENT': return 'mdi-bullhorn';
    case 'NEW_COMMENT': return 'mdi-comment';
    case 'NEW_INQUIRY': return 'mdi-help-circle';
    case 'NEW_MEMBER': return 'mdi-account-plus';
    default: return 'mdi-bell';
  }
};

// 알림 타입별 색상
const getNotificationColor = (type) => {
  switch (type) {
    case 'ADMIN_REPLY': return 'blue';
    case 'NEW_FOOD': return 'green';
    case 'EXPIRATION_IMMINENT': return 'red';
    case 'NEW_ANNOUNCEMENT': return 'purple';
    case 'NEW_COMMENT': return 'orange';
    case 'NEW_INQUIRY': return 'indigo';
    case 'NEW_MEMBER': return 'teal';
    default: return 'grey';
  }
};
</script>

<style scoped>
/* 메인 페이지 전용 스타일은 여기에 작성합니다. */
.notification-item {
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
}

.notification-item:hover {
  background-color: #f5f5f5;
  transform: translateX(2px);
}

.notification-item:not(:last-child) {
  border-bottom: 1px solid #e0e0e0;
}

.notification-item.unread {
  border-left-color: #1976d2;
  background-color: #f3f8ff;
}

.notification-item.unread:hover {
  background-color: #e3f2fd;
}
</style>