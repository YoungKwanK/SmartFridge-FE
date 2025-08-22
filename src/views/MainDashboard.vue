<template>
  <v-container>
    <h1>메인페이지입니다</h1>
    <v-btn :to="'/login'">로그인</v-btn>
    <div class="mt-5">
      <v-badge color="red" :content="notificationCount">
        <v-btn>알림</v-btn>
      </v-badge>
      
      <!-- 알림 목록 -->
      <div v-if="notifications.length > 0" class="mt-3">
        <h3>최근 알림 ({{ notificationCount }}개)</h3>
        <v-list>
          <v-list-item 
            v-for="(notif, index) in notifications" 
            :key="`${notif.type}-${index}`"
            class="notification-item"
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
              <strong>{{ notif.type || '알림' }}</strong>
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ notif.senderEmail || '시스템' }}: {{ notif.contents || notif.content || '알림 내용' }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>
      
      <!-- 알림이 없을 때 -->
      <div v-else class="mt-3">
        <p class="text-grey">수신된 알림이 없습니다.</p>
      </div>
    </div>
    <div class="mt-5">
      <v-btn :to="'/inquiry'">문의하기</v-btn>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { EventSourcePolyfill } from 'event-source-polyfill';

const notifications = ref([]);
const notificationCount = ref(0);
let eventSource = null;

onMounted(() => {
  const token = localStorage.getItem('token');
  if (token) {
    console.log('SSE 연결 시도 중...');
    eventSource = new EventSourcePolyfill(
      `${process.env.VUE_APP_API_BASE_URL}/sse/connect/notification`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    // 연결 성공
    eventSource.onopen = () => {
      console.log('SSE 연결 성공');
    };

    // 기본 message 이벤트에서 모든 알림 타입 처리
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE 메시지 수신:', data);

        // 모든 알림 타입 처리 (ADMIN_REPLY만이 아닌)
        if (data && data.type) {
          console.log(`${data.type} 알림 수신:`, data);
          notifications.value.push(data);
          notificationCount.value = notifications.value.length;
        }
      } catch (err) {
        console.error('알림 처리 중 오류:', err);
        console.error('원본 데이터:', event.data);
      }
    };

    // 연결 에러
    eventSource.onerror = (event) => {
      console.error('SSE 연결 에러:', event);
      // 재연결 시도
      setTimeout(() => {
        if (eventSource && eventSource.readyState !== EventSource.CLOSED) {
          console.log('SSE 재연결 시도...');
          eventSource.close();
          // onMounted 로직을 다시 실행하는 대신 간단한 재연결
          const newEventSource = new EventSourcePolyfill(
            `${process.env.VUE_APP_API_BASE_URL}/sse/connect/notification`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          eventSource = newEventSource;
        }
      }, 5000);
    };
  } else {
    console.warn('토큰이 없어서 SSE 연결을 시도하지 않습니다.');
  }
});

onUnmounted(() => {
  if (eventSource) {
    console.log('SSE 연결 종료');
    eventSource.close();
  }
});

// 알림 타입에 따른 아이콘 반환
const getNotificationIcon = (type) => {
  switch (type) {
    case 'ADMIN_REPLY':
      return 'mdi-account-cog';
    case 'NEW_FOOD':
      return 'mdi-food';
    case 'EXPIRATION_IMMINENT':
      return 'mdi-clock-alert';
    case 'NEW_ANNOUNCEMENT':
      return 'mdi-bullhorn';
    case 'NEW_COMMENT':
      return 'mdi-comment';
    case 'NEW_INQUIRY':
      return 'mdi-help-circle';
    case 'NEW_MEMBER':
      return 'mdi-account-plus';
    default:
      return 'mdi-bell';
  }
};

// 알림 타입에 따른 색상 반환
const getNotificationColor = (type) => {
  switch (type) {
    case 'ADMIN_REPLY':
      return 'blue';
    case 'NEW_FOOD':
      return 'green';
    case 'EXPIRATION_IMMINENT':
      return 'red';
    case 'NEW_ANNOUNCEMENT':
      return 'purple';
    case 'NEW_COMMENT':
      return 'orange';
    case 'NEW_INQUIRY':
      return 'indigo';
    case 'NEW_MEMBER':
      return 'teal';
    default:
      return 'grey';
  }
};
</script>

<style scoped>
/* 메인 페이지 전용 스타일은 여기에 작성합니다. */
.notification-item {
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
}

.notification-item:hover {
  background-color: #f5f5f5;
  transform: translateX(2px);
}

.notification-item:not(:last-child) {
  border-bottom: 1px solid #e0e0e0;
}
</style>