<template>
  <div class="admin-layout">
    <div class="notification-list">
      <div class="header">
        <h1>알림 목록</h1>
        <button @click="logout" class="logout-btn">로그아웃</button>
      </div>
      
      <div class="navigation-menu">
        <router-link to="/admin" class="nav-item">대시보드</router-link>
        <router-link to="/admin/inquiry" class="nav-item">문의 목록</router-link>
        <router-link to="/admin/notification" class="nav-item active">알림 목록</router-link>
        <router-link to="/admin/users" class="nav-item">사용자 관리</router-link>
      </div>

      <div class="filters">
        <select v-model="typeFilter" @change="filterNotifications">
          <option value="">전체 타입</option>
          <option value="문의등록">문의등록</option>
          <option value="시스템">시스템</option>
          <option value="사용자">사용자</option>
        </select>
        <select v-model="readFilter" @change="filterNotifications">
          <option value="">전체 상태</option>
          <option value="읽지않음">읽지않음</option>
          <option value="읽음">읽음</option>
        </select>
        <button @click="markAllAsRead" class="mark-read-btn">모두 읽음 처리</button>
      </div>

      <div class="notification-table">
        <table>
          <thead>
            <tr>
              <th>번호</th>
              <th>타입</th>
              <th>제목</th>
              <th>내용</th>
              <th>상태</th>
              <th>생성일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="notification in filteredNotifications" :key="notification.id" 
                :class="{ unread: notification.status === '읽지않음' }">
              <td>{{ notification.id }}</td>
              <td>
                <span :class="getTypeClass(notification.type)">
                  {{ notification.type }}
                </span>
              </td>
              <td>{{ notification.title }}</td>
              <td>{{ notification.content }}</td>
              <td>
                <span :class="notification.status === '읽음' ? 'read' : 'unread'">
                  {{ notification.status }}
                </span>
              </td>
              <td>{{ notification.createdAt }}</td>
              <td>
                <button @click="viewNotification(notification)" class="view-btn">보기</button>
                <button v-if="notification.status === '읽지않음'" @click="markAsRead(notification)" class="read-btn">읽음</button>
                <button @click="deleteNotification(notification)" class="delete-btn">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 알림 상세 보기 모달 -->
      <div v-if="selectedNotification" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ selectedNotification.title }}</h2>
            <button @click="closeModal" class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <div class="notification-detail">
              <p><strong>타입:</strong> {{ selectedNotification.type }}</p>
              <p><strong>생성일:</strong> {{ selectedNotification.createdAt }}</p>
              <p><strong>상태:</strong> {{ selectedNotification.status }}</p>
              <p><strong>내용:</strong></p>
              <div class="content">{{ selectedNotification.content }}</div>
              
              <div v-if="selectedNotification.relatedData" class="related-data">
                <h3>관련 정보</h3>
                <pre>{{ JSON.stringify(selectedNotification.relatedData, null, 2) }}</pre>
              </div>
            </div>
            
            <div class="modal-actions">
              <button v-if="selectedNotification.status === '읽지않음'" @click="markAsRead(selectedNotification)" class="read-btn">읽음 처리</button>
              <button @click="closeModal" class="close-modal-btn">닫기</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotificationList',
  data() {
    return {
      notifications: [],
      filteredNotifications: [],
      typeFilter: '',
      readFilter: '',
      selectedNotification: null
    }
  },
  mounted() {
    this.loadNotifications();
  },
  methods: {
    async loadNotifications() {
      try {
        // 실제 API 호출로 대체 필요
        this.notifications = [
          { 
            id: 1, 
            type: '문의등록', 
            title: '새로운 문의가 등록되었습니다', 
            content: '사용자 user1@email.com이 "로그인 문제" 문의를 등록했습니다.',
            status: '읽지않음',
            createdAt: '2024-01-15 14:30',
            relatedData: { inquiryId: 1, userId: 'user1', inquiryTitle: '로그인 문제' }
          },
          { 
            id: 2, 
            type: '시스템', 
            title: '시스템 점검 알림', 
            content: '정기 시스템 점검이 예정되어 있습니다.',
            status: '읽음',
            createdAt: '2024-01-15 10:00',
            relatedData: { maintenanceDate: '2024-01-20', duration: '2시간' }
          },
          { 
            id: 3, 
            type: '사용자', 
            title: '새 사용자 가입', 
            content: '새로운 사용자가 가입했습니다.',
            status: '읽지않음',
            createdAt: '2024-01-15 09:15',
            relatedData: { newUserId: 'user123', email: 'newuser@email.com' }
          }
        ];
        this.filteredNotifications = [...this.notifications];
      } catch (error) {
        console.error('알림 목록 로드 실패:', error);
      }
    },
    
    filterNotifications() {
      let filtered = [...this.notifications];
      
      if (this.typeFilter) {
        filtered = filtered.filter(notification => notification.type === this.typeFilter);
      }
      
      if (this.readFilter) {
        filtered = filtered.filter(notification => notification.status === this.readFilter);
      }
      
      this.filteredNotifications = filtered;
    },
    
    getTypeClass(type) {
      const classes = {
        '문의등록': 'type-inquiry',
        '시스템': 'type-system',
        '사용자': 'type-user'
      };
      return classes[type] || '';
    },
    
    viewNotification(notification) {
      this.selectedNotification = notification;
    },
    
    async markAsRead(notification) {
      try {
        // 실제 API 호출로 대체 필요
        notification.status = '읽음';
        
        // 목록 업데이트
        const index = this.notifications.findIndex(n => n.id === notification.id);
        if (index !== -1) {
          this.notifications[index] = { ...notification };
        }
        
        this.filterNotifications();
        
        if (this.selectedNotification && this.selectedNotification.id === notification.id) {
          this.selectedNotification.status = '읽음';
        }
      } catch (error) {
        console.error('읽음 처리 실패:', error);
      }
    },
    
    async markAllAsRead() {
      try {
        // 실제 API 호출로 대체 필요
        this.notifications.forEach(notification => {
          notification.status = '읽음';
        });
        
        this.filterNotifications();
      } catch (error) {
        console.error('전체 읽음 처리 실패:', error);
      }
    },
    
    async deleteNotification(notification) {
      if (confirm('이 알림을 삭제하시겠습니까?')) {
        try {
          // 실제 API 호출로 대체 필요
          const index = this.notifications.findIndex(n => n.id === notification.id);
          if (index !== -1) {
            this.notifications.splice(index, 1);
          }
          
          this.filterNotifications();
          
          if (this.selectedNotification && this.selectedNotification.id === notification.id) {
            this.closeModal();
          }
        } catch (error) {
          console.error('알림 삭제 실패:', error);
        }
      }
    },
    
    closeModal() {
      this.selectedNotification = null;
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

.notification-list {
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



.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  align-items: center;
}

.filters select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.mark-read-btn {
  background: #17a2b8;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.notification-table table {
  width: 100%;
  border-collapse: collapse;
}

.notification-table th, .notification-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.notification-table th {
  background: #f8f9fa;
  font-weight: bold;
}

.notification-table tr.unread {
  background: #fff3cd;
}

.type-inquiry {
  background: #d1ecf1;
  color: #0c5460;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  display: inline-block;
  white-space: nowrap;
  text-align: center;
}

.type-system {
  background: #d4edda;
  color: #155724;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  display: inline-block;
  white-space: nowrap;
  text-align: center;
}

.type-user {
  background: #f8d7da;
  color: #721c24;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  display: inline-block;
  white-space: nowrap;
  text-align: center;
}

.read {
  color: #28a745;
  font-weight: bold;
}

.unread {
  color: #ffc107;
  font-weight: bold;
}

.view-btn, .read-btn, .delete-btn {
  margin: 0 5px;
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.view-btn {
  background: #17a2b8;
  color: white;
}

.read-btn {
  background: #28a745;
  color: white;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  width: 80%;
  max-width: 600px;
  max-height: 80%;
  overflow-y: auto;
  border-radius: 8px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #ddd;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.content {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin: 10px 0;
  white-space: pre-wrap;
}

.related-data {
  margin-top: 20px;
}

.related-data pre {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  justify-content: flex-end;
}

.close-modal-btn {
  background: #6c757d;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
