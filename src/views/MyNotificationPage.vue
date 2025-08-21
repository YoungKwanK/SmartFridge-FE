<template>
  <div class="notification-page">
    <!-- 헤더 영역 -->
    <div class="header-section">
      <h3 class="page-title">알림 목록</h3>
      <v-btn 
        @click="readAll()" 
        class="read-all-btn d-flex justify-center align-center"
        color="primary"
        variant="elevated"
      >
        모두 읽음
      </v-btn>
    </div>

    <!-- 탭 네비게이션 -->
    <div class="tab-navigation">
      <v-tabs
        v-model="selectedTab"
        @update:model-value="filterByTab"
        class="custom-tabs"
        color="primary"
      >
        <v-tab value="all">전체</v-tab>
        <v-tab value="food-register">식품등록 알림</v-tab>
        <v-tab value="expiration">유통기한 알림</v-tab>
        <v-tab value="post">게시글 알림</v-tab>
        <v-tab value="comment">댓글알림</v-tab>
        <v-tab value="qa">Q&A</v-tab>
        <v-tab 
          v-if="userType !== 'common'" 
          value="member"
        >
          멤버 참여
        </v-tab>
      </v-tabs>
    </div>

    <!-- 알림 리스트 -->
    <div class="notification-list">
      <div
        v-for="notification in sortedNotifications"
        :key="notification.id"
        class="notification-item"
        :class="{ 
          'read': notification.read,
          'food-register-border': getNotificationType(notification) === 'food-register',
          'expiration-border': getNotificationType(notification) === 'expiration',
          'post-border': getNotificationType(notification) === 'post',
          'comment-border': getNotificationType(notification) === 'comment',
          'qa-border': getNotificationType(notification) === 'qa',
          'member-border': getNotificationType(notification) === 'member',
          'other-border': getNotificationType(notification) === 'other'
        }"
        @click="goToDetail(notification)"
        @mouseenter="hoveredId = notification.id"
        @mouseleave="hoveredId = null"
      >
        <!-- 알림 타입별 아이콘 -->
        <div class="notification-icon">
          <div 
            v-if="!notification.read" 
            class="unread-dot"
          ></div>
          
          <!-- 식품등록 알림 -->
          <div 
            v-if="getNotificationType(notification) === 'food-register'"
            class="icon food-register-icon"
          >
            🍽️
          </div>
          
          <!-- 유통기한 알림 -->
          <div 
            v-else-if="getNotificationType(notification) === 'expiration'"
            class="icon expiration-icon"
            :class="{ 'urgent': isUrgentExpiration(notification) }"
          >
            ⏰
          </div>
          
          <!-- 게시글 알림 -->
          <div 
            v-else-if="getNotificationType(notification) === 'post'"
            class="icon post-icon"
          >
            📄
          </div>
          
          <!-- 댓글 알림 -->
          <div 
            v-else-if="getNotificationType(notification) === 'comment'"
            class="icon comment-icon"
          >
            💬
          </div>
          
          <!-- Q&A 알림 -->
          <div 
            v-else-if="getNotificationType(notification) === 'qa'"
            class="icon qa-icon"
          >
            ❓
          </div>
          
          <!-- 새로운 멤버 참여 -->
          <div 
            v-else-if="getNotificationType(notification) === 'member'"
            class="icon member-icon"
          >
            👤
          </div>
          
          <!-- 기타 알림 -->
          <div 
            v-else
            class="icon other-icon"
          >
            🔔
          </div>
        </div>

        <!-- 알림 내용 -->
        <div class="notification-content">
          <div class="notification-text">
            {{ getNotificationText(notification) }}
          </div>
          <div class="notification-time">
            {{ formatTimeAgo(notification.createdAt) }}
          </div>
        </div>

        <!-- 삭제 버튼 (읽은 알림에만 표시, 호버 시에만 보임) -->
        <div 
          v-if="notification.read" 
          class="delete-btn"
          @click.stop="confirmDelete(notification)"
        >
          <v-icon 
            size="small" 
            color="black"
            v-show="hoveredId === notification.id"
          >
            mdi-close
          </v-icon>
        </div>
      </div>
    </div>

    <!-- 삭제 확인 모달 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">알림 삭제</v-card-title>
        <v-card-text>정말 삭제하시겠습니까?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text color="red" @click="deleteNotification">삭제</v-btn>
          <v-btn text color="grey" @click="deleteDialog = false">취소</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: 'MyNotificationPage',
  data() {
    return {
      notificationList: [],
      selectedTab: "all",
      selectedCategory: "ALL",
      fridgeId: 1, // 동적 할당할 것임
      hoveredId: null,
      deleteDialog: false,
      deleteTarget: null
    };
  },
  
  async created() {
    await this.fetchNotifications();
  },
  
  computed: {
    // 사용자 타입 (알림 데이터에서 가져옴)
    userType() {
      if (this.notificationList.length > 0) {
        // 첫 번째 알림의 fridgeMemberType을 사용
        return this.notificationList[0].fridgeMemberType || 'common';
      }
      return 'common'; // 기본값
    },
    
    sortedNotifications() {
      // 선택된 카테고리에 따라 알림 필터링
      let filteredNotifications = this.notificationList;
      
      if (this.selectedCategory !== "ALL") {
        filteredNotifications = this.notificationList.filter(n => n.type === this.selectedCategory);
      }
      
      // 읽음/안읽음 상태별로 그룹화
      const unreadNotifications = filteredNotifications.filter(n => !n.read);
      const readNotifications = filteredNotifications.filter(n => n.read);
      
      // 각 그룹 내에서 최신순으로 정렬 (createdAt 내림차순)
      const sortedUnread = unreadNotifications.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      const sortedRead = readNotifications.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      // 안읽은 알림을 먼저, 읽은 알림을 나중에 배치
      return [...sortedUnread, ...sortedRead];
    }
  },
  
  methods: {
    // 알림 목록 조회
    async fetchNotifications() {
      try {
        let url = `${process.env.VUE_APP_API_BASE_URL}/fridge/${this.fridgeId}/notification/list`;
        if (this.selectedCategory !== "ALL") {
          url += `?notificationType=${this.selectedCategory}`;
        }
        const response = await axios.get(url);
        this.notificationList = response.data.result.content;
      } catch (error) {
        console.error('알림 조회 실패:', error);
      }
    },

    // 탭에 따른 필터링
    filterByTab(tab) {
      this.selectedTab = tab;
      
      // 사용자가 'common' 타입이고 멤버 참여 탭을 선택하려는 경우 처리
      if (tab === "member" && this.userType === "common") {
        this.selectedTab = "all";
        this.selectedCategory = "ALL";
        return;
      }
      
      // 탭에 맞는 카테고리로 매핑
      let category = "ALL";
      if (tab === "food-register") {
        category = "NEW_FOOD";
      } else if (tab === "expiration") {
        category = "EXPIRATION";
      } else if (tab === "post") {
        category = "ANNOUNCE";
      } else if (tab === "comment") {
        category = "COMMENT";
      } else if (tab === "qa") {
        category = "INQUIRY";
      } else if (tab === "member") {
        category = "NEW_MEMBER";
      }
      
      // 카테고리 즉시 업데이트하여 computed 속성이 즉시 반응하도록
      this.selectedCategory = category;
      
      // API 호출은 필요에 따라 수행 (선택사항)
      // this.fetchNotifications();
    },

    // 알림 타입 판단
    getNotificationType(notification) {
      if (notification.type === "NEW_FOOD") return "food-register";
      if (notification.type === "EXPIRATION") return "expiration";
      if (notification.type === "ANNOUNCE") return "post";
      if (notification.type === "COMMENT") return "comment";
      if (notification.type === "INQUIRY") return "qa";
      if (notification.type === "NEW_MEMBER") return "member";
      return "other";
    },

    // 알림 내용 텍스트 생성
    getNotificationText(notification) {
      if (notification.type === "EXPIRATION") {
        return `${notification.content} 유통기한 ${this.getExpirationDays(notification)}일 전`;
      }
      if (notification.type === "NEW_FOOD") {
        return "새 식품 등록";
      }
      return notification.content;
    },

    // 유통기한까지 남은 일수 계산
    getExpirationDays(notification) {
      if (notification.type === "EXPIRATION") {
        const today = new Date();
        const expirationDate = new Date(notification.expirationDate || notification.createdAt);
        const diffTime = expirationDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
      }
      return 0;
    },

    // 긴급 유통기한 알림 판단 (3일 이하)
    isUrgentExpiration(notification) {
      if (notification.type === "EXPIRATION") {
        const days = this.getExpirationDays(notification);
        return days <= 3;
      }
      return false;
    },

    // 상대적 시간 표시
    formatTimeAgo(dateStr) {
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
    },

    // 알림 클릭 시 상세 페이지 이동
    async goToDetail(notification) {
      try {
        // 읽음 처리
        const readNotification = [{ notificationId: notification.id }];
        await axios.patch(
          `${process.env.VUE_APP_API_BASE_URL}/fridge/${this.fridgeId}/notification/isRead`, 
          readNotification
        );
        
        // 알림 클릭 시 상세 페이지 이동
        if (notification.targetType === "ANNOUNCE") {
          this.$router.push(`/fridge/${this.fridgeId}/post/${notification.targetId}`);
        } else if (notification.targetType === "FOOD") {
          this.$router.push(`/food/${notification.targetId}`);
        }
        
        // 읽음 처리 후 목록 갱신
        await this.fetchNotifications();
      } catch (error) {
        console.error('알림 상세 이동 실패:', error);
      }
    },

    // 삭제 확인
    confirmDelete(notification) {
      this.deleteTarget = notification;
      this.deleteDialog = true;
    },

    // 알림 삭제
    async deleteNotification() {
      if (!this.deleteTarget) return;
      
      try {
        await axios.delete(
          `${process.env.VUE_APP_API_BASE_URL}/fridge/${this.fridgeId}/notification/delete/${this.deleteTarget.id}`
        );
        
        // 삭제 후 리스트 갱신
        this.notificationList = this.notificationList.filter(n => n.id !== this.deleteTarget.id);
        this.deleteDialog = false;
        this.deleteTarget = null;
      } catch (error) {
        console.error('알림 삭제 실패:', error);
      }
    },

    // 모든 알림 읽음 처리
    async readAll() {
      try {
        const readNotification = this.notificationList.map(n => ({
          notificationId: n.id
        }));
        
        await axios.patch(
          `${process.env.VUE_APP_API_BASE_URL}/fridge/${this.fridgeId}/notification/isRead`, 
          readNotification
        );
        
        // 읽음 처리 후 목록 갱신
        await this.fetchNotifications();
      } catch (error) {
        console.error('모두 읽음 처리 실패:', error);
      }
    }
  }
};
</script>

<style scoped>
.notification-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f4ff 100%);
  min-height: 100vh;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.read-all-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  text-transform: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.tab-navigation {
  margin-bottom: 30px;
}

.custom-tabs {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-item {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border-left: 4px solid transparent;
}

/* 알림 타입별 왼쪽 테두리 색상 */
.notification-item.food-register-border {
  border-left-color: #61d02d;
}

.notification-item.expiration-border {
  border-left-color: #eb3c4e;
}

.notification-item.post-border {
  border-left-color: #28a745;
}

.notification-item.comment-border {
  border-left-color: #17a2b8;
}

.notification-item.qa-border {
  border-left-color: #6f42c1;
}

.notification-item.member-border {
  border-left-color: #fd7e14;
}

.notification-item.other-border {
  border-left-color: #6c757d;
}

.notification-item:nth-child(even) {
  background: #f8f9fa;
}

.notification-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.notification-item.read {
  background: #f8f9fa;
}

.notification-item.read .notification-text {
  color: #6c757d;
  font-weight: 400;
}

.notification-icon {
  position: relative;
  margin-right: 20px;
  flex-shrink: 0;
}

.unread-dot {
  position: absolute;
  top: -2px;
  left: -2px;
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  z-index: 2;
} 

.icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.food-register-icon {
  /* background: #8B4513; */
  border-radius: 50%;
}

.expiration-icon {
  /* background: #dc3545; */
}

.expiration-icon.urgent {
  /* background: #ffc107; */
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}

.post-icon {
  /* background: #28a745; */
}

.comment-icon {
  /* background: #17a2b8; */
}

.qa-icon {
  /* background: #6f42c1; */
}

.member-icon {
  /* background: #fd7e14; */
}

.other-icon {
  /* background: #6c757d; */
}

.notification-content {
  flex: 1;
}

.notification-text {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.notification-time {
  font-size: 0.875rem;
  color: #6c757d;
}

.delete-btn {
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.delete-btn:hover {
  background-color: #e9ecef;
}

/* Vuetify 탭 스타일 오버라이드 */
:deep(.v-tab) {
  text-transform: none;
  font-weight: 500;
  color: #6c757d;
}

:deep(.v-tab--selected) {
  color: #2c3e50;
  font-weight: 600;
}

:deep(.v-tab__slider) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>