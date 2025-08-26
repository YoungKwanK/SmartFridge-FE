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
export default {
  name: 'AdminDashboard',
  data() {
    return {
      inquiryCount: 0,
      unansweredCount: 0,
      userCount: 0,
      newNotificationCount: 0,
      recentInquiries: []
    }
  },
  mounted() {
    this.loadDashboardData();
  },
  methods: {
    async loadDashboardData() {
      try {
        // 실제 API 호출로 대체 필요
        this.inquiryCount = 15;
        this.unansweredCount = 8;
        this.userCount = 120;
        this.newNotificationCount = 3;
        
        this.recentInquiries = [
          { id: 1, title: '로그인 문제', status: '답변대기', createdAt: '2024-01-15' },
          { id: 2, title: '회원가입 오류', status: '답변완료', createdAt: '2024-01-14' },
          { id: 3, title: '비밀번호 재설정', status: '답변대기', createdAt: '2024-01-13' }
        ];
      } catch (error) {
        console.error('대시보드 데이터 로드 실패:', error);
      }
    },
    
    logout() {
      localStorage.clear();
      this.$router.push('/');
    }
  }
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: #f8f9fa;
}

.admin-dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.logout-btn {
  background: #dc3545;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.navigation-menu {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
}

.nav-item {
  padding: 10px 20px;
  text-decoration: none;
  color: #666;
  border-radius: 4px;
  transition: all 0.3s;
}

.nav-item:hover {
  background: #f8f9fa;
  color: #333;
}

.nav-item.active {
  background: #007bff;
  color: white;
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.stat-card {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.stat-card p {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  color: #007bff;
}

.quick-actions {
  margin: 30px 0;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-top: 15px;
}

.action-btn {
  background: #007bff;
  color: white;
  padding: 12px 24px;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.3s;
}

.action-btn:hover {
  background: #0056b3;
}

.recent-inquiries {
  margin: 30px 0;
}

.inquiry-item {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid #eee;
  background: #f9f9f9;
  margin: 5px 0;
}

.inquiry-item span {
  flex: 1;
  text-align: center;
}
</style>
