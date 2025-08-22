<template>
  <div class="dashboard-header">
    <div class="header-info">
      <div class="fridge-title-section">
        <h1 class="fridge-title">{{ fridge.fridgeName }}</h1>
        <div class="fridge-type-badge">
          <v-chip 
            :color="getTypeColor(fridge.type)" 
            size="small" 
            variant="elevated"
            class="type-chip"
          >
            <v-icon start size="16">{{ getTypeIcon(fridge.type) }}</v-icon>
            {{ getTypeText(fridge.type) }}
          </v-chip>
        </div>
      </div>
      <p class="fridge-subtitle">{{ fridge.description }}</p>
    </div>
    <div class="header-actions">
      <div class="notification-icon" @click="showNotificationModal = true">
        <div class="icon-container">
          <v-icon color="amber" size="28">mdi-bell-ring</v-icon>
          <div class="notification-badge">{{ notificationCount }}</div>
        </div>
      </div>
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
              :class="{ 'last-item': index === recentNotifications.length - 1 }"
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
                  <span class="notification-time">{{ formatTimeAgo(notification.createdAt) }}</span>
                </div>
                <div class="notification-content">
                  {{ notification.content || notification.contents || '알림 내용' }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-notifications">
            <v-icon size="40" color="grey-lighten-2">mdi-bell-off</v-icon>
            <p class="no-notifications-text">수신된 알림이 없습니다</p>
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
import axios from 'axios';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const fridge = ref({});
const showNotificationModal = ref(false);
const recentNotifications = ref([]);
const notificationCount = ref(0);

const fetchFridgeInfo = async () => {
  try {
    const fridgeId = route.params.fridgeId;
    if (!fridgeId) return;
    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/detail`);
    fridge.value = response.data.result;
  } catch (error) {
    console.error("냉장고 정보를 불러오는 데 실패했습니다:", error);
  }
};

const fetchRecentNotifications = async () => {
  try {
    const fridgeId = route.params.fridgeId;
    if (!fridgeId) return;
    
    const response = await axios.get(
      `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/notification/list?page=0&size=4`
    );
    
    const notifications = response.data.result.content;
    recentNotifications.value = notifications;
    notificationCount.value = notifications.length;
  } catch (error) {
    console.error("최근 알림을 불러오는 데 실패했습니다:", error);
  }
};

const goToNotificationList = () => {
  showNotificationModal.value = false;
  router.push('/notification/list');
};

const getTypeColor = (type) => {
  switch (type) {
    case 'MANAGER': return 'success';
    case 'COMMON': return 'info';
    default: return 'grey';
  }
};

const getTypeIcon = (type) => {
  switch (type) {
    case 'MANAGER': return 'mdi-crown';
    case 'COMMON': return 'mdi-account';
    default: return 'mdi-help';
  }
};

const getTypeText = (type) => {
  switch (type) {
    case 'MANAGER': return '관리자';
    case 'COMMON': return '일반';
    default: return '알 수 없음';
  }
};

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

// 알림 타입에 따른 텍스트 반환
const getNotificationTypeText = (type) => {
  switch (type) {
    case 'ADMIN_REPLY':
      return '관리자 답변';
    case 'NEW_FOOD':
      return '식품 등록';
    case 'EXPIRATION_IMMINENT':
      return '유통기한';
    case 'NEW_ANNOUNCEMENT':
      return '공지사항';
    case 'NEW_COMMENT':
      return '댓글';
    case 'NEW_INQUIRY':
      return '문의';
    case 'NEW_MEMBER':
      return '멤버 참여';
    default:
      return '알림';
  }
};

// 상대적 시간 표시
const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `${diffDays}일 전`;
  } else if (diffHours > 0) {
    return `${diffHours}시간 전`;
  } else {
    return "방금 전";
  }
};

onMounted(() => {
  fetchFridgeInfo();
  fetchRecentNotifications();
});
</script>

<style scoped>
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.header-info {
  flex: 1;
}

.fridge-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.fridge-title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.fridge-type-badge {
  flex-shrink: 0;
}

.type-chip {
  font-weight: 600;
}

.fridge-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.notification-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 12px;
  border-radius: 12px;
  transition: all 0.3s ease;
  background: rgba(255, 193, 7, 0.1);
}

.notification-icon:hover {
  background: rgba(255, 193, 7, 0.2);
  transform: translateY(-2px);
}

.icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: white;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.4);
  border: 2px solid white;
}

.notification-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 반응형 디자인 */
@media (max-width: 960px) {
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-actions {
    align-self: flex-end;
  }
  
  .fridge-title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 600px) {
  .fridge-title {
    font-size: 24px;
  }
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
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.modal-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  color: #6c757d;
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
  border-bottom: 1px solid #e9ecef;
}

.notification-item:last-child {
  border-bottom: none;
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
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.notification-time {
  font-size: 12px;
  color: #6c757d;
}

.notification-content {
  font-size: 14px;
  color: #212529;
  line-height: 1.4;
}

.no-notifications {
  text-align: center;
  padding: 40px 20px;
}

.no-notifications-text {
  margin-top: 16px;
  font-size: 16px;
}

.modal-actions {
  padding: 16px 24px;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.view-all-btn {
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
}
</style>