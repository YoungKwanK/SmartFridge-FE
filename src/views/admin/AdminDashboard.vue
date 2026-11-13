<template>
  <div class="admin-layout">
    <div class="admin-dashboard">
      <div class="header">
        <h1>관리자 대시보드</h1>
        <button @click="logout" class="logout-btn">로그아웃</button>
      </div>
      
      <div class="navigation-menu">
        <router-link to="/admin" class="nav-item active">대시보드</router-link>
        <router-link to="/admin/inquiry" class="nav-item">문의 목록</router-link>
        <router-link to="/admin/notification" class="nav-item">알림 목록</router-link>
        <router-link to="/admin/users" class="nav-item">사용자 관리</router-link>
      </div>
      
      <div class="dashboard-stats">
        <div class="stat-card">
          <h3>총 문의 수</h3>
          <p>{{ inquiryCount }}</p>
        </div>
        <div class="stat-card">
          <h3>미답변 문의</h3>
          <p>{{ unansweredCount }}</p>
        </div>
        <div class="stat-card">
          <h3>총 사용자 수</h3>
          <p>{{ userCount }}</p>
        </div>
        <div class="stat-card">
          <h3>새 알림</h3>
          <p>{{ newNotificationCount }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { snackbar } from '@/composables/snackbar';

export default {
  name: 'AdminDashboard',
  data() {
    return {
      inquiryCount: 0,
      unansweredCount: 0,
      userCount: 0,
      newNotificationCount: 0,
      unreadNotificationCount: 0,
      loading: true
    }
  },
  mounted() {
    this.loadDashboardData();
    this.loadUnreadNotificationCount();
    this.setupNotificationListener();
  },
  beforeUnmount() {
    this.removeNotificationListener();
  },
  methods: {
    async loadDashboardData() {
      try {
        this.loading = true;
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/dashboard`);
        
        if (response.data.status_code === 200) {
          const data = response.data.result;
          this.inquiryCount = data.inquiryCount || 0;
          this.unansweredCount = data.unansweredCount || 0;
          this.userCount = data.userCount || 0;
          this.newNotificationCount = data.newNotification || 0;
        }
      } catch (error) {
        console.error('대시보드 데이터 로드 실패:', error);
        snackbar.show('대시보드 데이터 로드에 실패했습니다.', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    logout() {
      localStorage.clear();
      this.$store.dispatch('user/logout');
      this.$router.push('/');
    },

    // 읽지 않은 알림 개수 로드
    async loadUnreadNotificationCount() {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/notification/count`);
        if (response.data.status_code === 200) {
          this.unreadNotificationCount = response.data.result.unreadCount || 0;
        }
      } catch (error) {
        console.error('읽지 않은 알림 개수 로드 실패:', error);
      }
    },

    // 전역 SSE 이벤트 리스너 설정
    setupNotificationListener() {
      this.notificationListener = (event) => {
        const notification = event.detail;
        this.handleNewNotification(notification);
      };
      window.addEventListener('realtime-notification', this.notificationListener);
    },

    // 전역 SSE 이벤트 리스너 제거
    removeNotificationListener() {
      if (this.notificationListener) {
        window.removeEventListener('realtime-notification', this.notificationListener);
        this.notificationListener = null;
      }
    },

    // 새 알림 처리
    handleNewNotification(notification) {
      if (notification.type === 'NEW_INQUIRY') {
        // 실시간 카운트 업데이트
        this.inquiryCount++;
        this.unansweredCount++;
        this.newNotificationCount++;
        this.unreadNotificationCount++;
      }
    },
  }
}
</script>

<style scoped src="@/styles/pages/admin.css"></style>
