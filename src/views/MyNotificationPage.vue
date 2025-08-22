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
          v-if="userType === 'manager'" 
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
        @mouseenter="handleMouseEnter(notification.id)"
        @mouseleave="handleMouseLeave()"
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
       
       <!-- 로딩 인디케이터 및 더 보기 버튼 -->
       <div v-if="isLoading" class="loading-indicator">
         <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
         <span class="loading-text">알림을 불러오는 중...</span>
       </div>
       
       <div v-else-if="hasMoreData" class="load-more-section">
         <v-btn 
           @click="loadMoreData" 
           variant="outlined" 
           color="primary"
           class="load-more-btn"
         >
           더 보기
         </v-btn>
       </div>
       
       <div v-else-if="notificationList.length > 0" class="no-more-data">
         <span class="no-more-text">모든 알림을 불러왔습니다</span>
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
      deleteTarget: null,
      // 페이징 관련 데이터
      currentPage: 0,
      pageSize: 20,
      hasMoreData: true,
      isLoading: false
    };
  },
  
  async created() {
    await this.fetchNotifications();
    // 스크롤 이벤트 리스너 등록
    window.addEventListener('scroll', this.handleScroll);
  },
  
  beforeUnmount() {
    // 스크롤 이벤트 리스너 해제
    window.removeEventListener('scroll', this.handleScroll);
  },
  
  computed: {
    // 사용자 타입 (백엔드 NotificationResDto의 fridgeMemberType 사용)
    userType() {
      if (this.notificationList.length > 0) {
        // 첫 번째 알림의 fridgeMemberType을 사용
        const memberType = this.notificationList[0].fridgeMemberType;
        // MANAGER인 경우에만 멤버 참여 탭 표시
        return memberType === 'MANAGER' ? 'MANAGER' : 'COMMON';
      }
      return 'COMMON'; // 기본값
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
    // 알림 목록 조회 (페이징 지원)
    async fetchNotifications(isLoadMore = false) {
      if (this.isLoading) return;
      
      try {
        this.isLoading = true;
        
        let url = `${process.env.VUE_APP_API_BASE_URL}/fridge/${this.fridgeId}/notification/list`;
        const params = new URLSearchParams();
        
        if (this.selectedCategory !== "ALL") {
          params.append('notificationType', this.selectedCategory);
        }
        
        params.append('page', this.currentPage.toString());
        params.append('size', this.pageSize.toString());
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const response = await axios.get(url);
        const newNotifications = response.data.result.content;
        
        if (isLoadMore) {
          // 추가 로드인 경우 기존 목록에 추가
          this.notificationList = [...this.notificationList, ...newNotifications];
        } else {
          // 새로 로드인 경우 기존 목록 교체
          this.notificationList = newNotifications;
        }
        
        // 더 로드할 데이터가 있는지 확인
        this.hasMoreData = newNotifications.length === this.pageSize;
        
        // 디버깅: 사용자 타입 확인 및 알림 데이터 확인
        if (this.notificationList.length > 0) {
          console.log('첫 번째 알림의 fridgeMemberType:', this.notificationList[0].fridgeMemberType);
          console.log('계산된 userType:', this.userType);
          console.log('알림 목록:', this.notificationList);
          console.log('읽은 알림 개수:', this.notificationList.filter(n => n.read).length);
          console.log('안읽은 알림 개수:', this.notificationList.filter(n => !n.read).length);
          console.log('현재 페이지:', this.currentPage);
          console.log('더 로드할 데이터:', this.hasMoreData);
        }
      } catch (error) {
        console.error('알림 조회 실패:', error);
      } finally {
        this.isLoading = false;
      }
    },

    // 탭에 따른 필터링
    filterByTab(tab) {
      this.selectedTab = tab;
      
      // 사용자가 'manager'가 아니고 멤버 참여 탭을 선택하려는 경우 처리
      if (tab === "member" && this.userType !== "manager") {
        this.selectedTab = "all";
        this.selectedCategory = "ALL";
        return;
      }
      
      // 탭에 맞는 카테고리로 매핑
      let category = "ALL";
      if (tab === "food-register") {
        category = "NEW_FOOD";
      } else if (tab === "expiration") {
        category = "EXPIRATION_IMMINENT";
      } else if (tab === "post") {
        category = "NEW_ANNOUNCEMENT";
      } else if (tab === "comment") {
        category = "NEW_COMMENT";
      } else if (tab === "qa") {
        category = "NEW_INQUIRY";
      } else if (tab === "member") {
        category = "NEW_MEMBER";
      }
      
      // 카테고리 즉시 업데이트하여 computed 속성이 즉시 반응하도록
      this.selectedCategory = category;
      
      // 페이징 초기화 및 새로운 데이터 로드
      this.resetPagination();
      this.fetchNotifications();
    },

    // 알림 타입 판단
    getNotificationType(notification) {
      if (notification.type === "NEW_FOOD") return "food-register";
      if (notification.type === "EXPIRATION_IMMINENT") return "expiration";
      if (notification.type === "NEW_ANNOUNCEMENT") return "post";
      if (notification.type === "NEW_COMMENT") return "comment";
      if (notification.type === "NEW_INQUIRY") return "qa";
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
      console.log('삭제 확인 호출됨:', notification);
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

    // 마우스 진입 처리
    handleMouseEnter(notificationId) {
      this.hoveredId = notificationId;
    },

    // 마우스 이탈 처리
    handleMouseLeave() {
      this.hoveredId = null;
    },

    // 페이징 초기화
    resetPagination() {
      this.currentPage = 0;
      this.hasMoreData = true;
      this.notificationList = [];
    },
    
    // 추가 데이터 로드
    async loadMoreData() {
      if (!this.hasMoreData || this.isLoading) return;
      
      this.currentPage += 1;
      await this.fetchNotifications(true);
    },
    
    // 스크롤 이벤트 처리
    handleScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // 스크롤이 페이지 하단 근처에 도달했을 때 추가 데이터 로드
      if (scrollTop + windowHeight >= documentHeight - 100) {
        this.loadMoreData();
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
  width: 100%;
  margin: 0;
  padding: 0;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f4ff 100%);
  min-height: 100vh;
  box-sizing: border-box;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 40px 50px 20px 50px;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.read-all-btn {
  background: #667eea;
  color: white;
  border-radius: 8px;
  padding: 12px 20px;
  font-weight: 500;
  text-transform: none;
  border: none;
  transition: background-color 0.2s ease;
}

.read-all-btn:hover {
  background: #5a6fd8;
}

.tab-navigation {
  margin-bottom: 30px;
  padding: 0 50px;
}

.custom-tabs {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 50px 30px 50px;
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
  border-radius: 50%;
}

.expiration-icon.urgent {
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
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

/* Vuetify 탭 스타일 오버라이드 */
:deep(.v-tab) {
  text-transform: none;
  font-weight: 500;
  color: #6c757d;
  flex: 1;
  min-width: 0;
}

:deep(.v-tab--selected) {
  color: #2c3e50;
  font-weight: 600;
}

:deep(.v-tab__slider) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

:deep(.v-tabs__wrapper) {
  width: 100%;
}

:deep(.v-tabs__bar) {
  width: 100%;
}

/* 로딩 및 더 보기 관련 스타일 */
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 16px;
}

.loading-text {
  color: #6c757d;
  font-size: 0.875rem;
}

.load-more-section {
  display: flex;
  justify-content: center;
  padding: 30px 20px;
}

.load-more-btn {
  min-width: 120px;
}

.no-more-data {
  display: flex;
  justify-content: center;
  padding: 30px 20px;
}

.no-more-text {
  color: #6c757d;
  font-size: 0.875rem;
  font-style: italic;
}
</style>