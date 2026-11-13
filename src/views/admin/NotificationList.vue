<template>
  <PageLayout title="알림 목록" width="wide" class="notification-list">
    <div class="filters">
      <select v-model="typeFilter" @change="filterNotifications">
        <option value="">전체 타입</option>
        <option value="새 문의">새 문의</option>
        <option value="문의등록">문의등록</option>
        <option value="답변완료">답변완료</option>
        <option value="시스템">시스템</option>
        <option value="사용자">사용자</option>
        <option value="식품만료알림">식품만료알림</option>
        <option value="냉장고초대">냉장고초대</option>
      </select>
      <select v-model="readFilter" @change="filterNotifications">
        <option value="">전체 상태</option>
        <option value="읽지않음">읽지않음</option>
        <option value="읽음">읽음</option>
      </select>
      <button @click="markAllAsRead" class="mark-read-btn">모두 읽음 처리</button>
    </div>

    <div class="notification-table">
      <!-- 디버깅 정보 -->
      <div v-if="loading" class="loading-message">로딩 중...</div>
      <div v-else-if="notifications.length === 0" class="no-data-message">
        알림 데이터가 없습니다. (총 알림 수: {{ notifications.length }})
      </div>
      <div v-else-if="filteredNotifications.length === 0" class="no-data-message">
        필터링된 알림이 없습니다. (원본: {{ notifications.length }}, 필터된: {{ filteredNotifications.length }})
      </div>
      
      <table v-if="filteredNotifications.length > 0">
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
            <p><strong>냉장고 번호:</strong> {{ selectedNotification.fridgeId }}</p>
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
  </PageLayout>
</template>

<script>
import axios from 'axios';
import PageLayout from '@/components/layout/PageLayout.vue';

export default {
  name: 'NotificationList',
  components: { PageLayout },
  data() {
    return {
      notifications: [],
      filteredNotifications: [],
      typeFilter: '',
      readFilter: '',
      selectedNotification: null,
      loading: true
    }
  },
  mounted() {
    this.loadNotifications();
  },
  methods: {
    async loadNotifications() {
      try {
        this.loading = true;
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/notification/list`);
        
        console.log('API 응답 전체:', response);
        console.log('API 응답 데이터:', response.data);
        console.log('API 응답 결과:', response.data.result);
        
        if (response.data.status_code === 200) {
          const rawNotifications = response.data.result || [];
          console.log('원본 알림 데이터:', rawNotifications);
          
          this.notifications = rawNotifications.map((notification, index) => {
            console.log(`알림 ${index}:`, notification);
            console.log('notificationId:', notification.notificationId);
            console.log('id:', notification.id);
            console.log('모든 키들:', Object.keys(notification));
            
            return {
              id: notification.notificationId || notification.id || notification.notification_id,
              // 화면에는 새 문의일 때 사용자가 선택한 문의 유형을 표시하고, 필터는 알림 종류로 동작
              type: this.getInquiryTypeKorean(notification.inquiryType) || this.getNotificationTypeKorean(notification.type),
              typeGroup: this.getNotificationTypeKorean(notification.type),
              title: notification.title || '알림',
              content: notification.message || notification.content,
              // 백엔드의 boolean isRead 필드는 JSON에서 read로 내려온다
              status: notification.read ? '읽음' : '읽지않음',
              fridgeId: notification.fridgeId ?? '정보 없음',
              createdAt: notification.createdAt ? new Date(notification.createdAt).toLocaleString() : '-',
              relatedData: notification.relatedData || null
            };
          });
          
          console.log('매핑된 알림 데이터:', this.notifications);
          this.filteredNotifications = [...this.notifications];
        } else {
          console.error('API 응답 상태 코드가 200이 아님:', response.data.status_code);
          alert('알림 목록을 불러올 수 없습니다.');
        }
      } catch (error) {
        console.error('알림 목록 로드 실패:', error);
        alert('알림 목록 로드에 실패했습니다: ' + (error.response?.data?.status_message || error.message));
      } finally {
        this.loading = false;
      }
    },
    
    getInquiryTypeKorean(inquiryType) {
      const inquiryTypeMap = {
        'FUNCTION': '기능 관련',
        'BUG': '버그 신고',
        'ETC': '기타'
      };
      return inquiryTypeMap[inquiryType];
    },

    getNotificationTypeKorean(type) {
      const typeMap = {
        'INQUIRY_CREATED': '문의등록',
        'NEW_INQUIRY': '새 문의',
        'ADMIN_REPLY': '답변완료',
        'SYSTEM': '시스템',
        'USER': '사용자',
        'FOOD_EXPIRY_WARNING': '식품만료알림',
        'FRIDGE_INVITATION': '냉장고초대'
      };
      return typeMap[type] || type;
    },
    
    filterNotifications() {
      let filtered = [...this.notifications];
      
      if (this.typeFilter) {
        filtered = filtered.filter(notification => notification.typeGroup === this.typeFilter);
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
        console.log('읽음 처리할 알림:', notification);
        console.log('알림 ID:', notification.id);
        
        // notificationId가 null이거나 undefined인지 확인
        if (!notification.id) {
          console.error('알림 ID가 없습니다:', notification);
          alert('알림 ID가 없어 읽음 처리할 수 없습니다.');
          return;
        }
        
        // 관리자용 알림 읽음 처리 API 호출
        const response = await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/admin/notification/isRead`, [
          {
            notificationId: notification.id
          }
        ]);
        
        if (response.data.status_code === 200) {
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
          
          alert('알림이 읽음 처리되었습니다.');
        }
      } catch (error) {
        console.error('읽음 처리 실패:', error);
        console.error('Error details:', error.response?.data);
        alert('읽음 처리에 실패했습니다: ' + (error.response?.data?.status_message || error.message));
      }
    },
    
    async markAllAsRead() {
      try {
        // 읽지 않은 알림들만 필터링
        const unreadNotifications = this.notifications.filter(n => n.status === '읽지않음');
        
        if (unreadNotifications.length === 0) {
          alert('읽지 않은 알림이 없습니다.');


          
          return;
        }
        
        // 읽지 않은 알림들의 ID 배열 생성 (유효한 ID만)
        const notificationReadList = unreadNotifications
          .filter(notification => notification.id)
          .map(notification => ({
            notificationId: notification.id
          }));
        
        if (notificationReadList.length === 0) {
          alert('유효한 알림 ID가 없습니다.');
          return;
        }
        
        console.log('전체 읽음 처리할 알림들:', notificationReadList);
        
        // 관리자용 전체 읽음 처리 API 호출
        const response = await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/admin/notification/isRead`, notificationReadList);
        
        if (response.data.status_code === 200) {
          // 모든 알림을 읽음으로 변경
          this.notifications.forEach(notification => {
            if (notification.status === '읽지않음') {
              notification.status = '읽음';
            }
          });
          
          this.filterNotifications();
          
          alert('모든 알림이 읽음 처리되었습니다.');
        }
      } catch (error) {
        console.error('전체 읽음 처리 실패:', error);
        console.error('Error details:', error.response?.data);
        alert('전체 읽음 처리에 실패했습니다: ' + (error.response?.data?.status_message || error.message));
      }
    },
    
    async deleteNotification(notification) {
      if (confirm('이 알림을 삭제하시겠습니까?')) {
        try {
          console.log('삭제할 알림:', notification);
          console.log('알림 ID:', notification.id);
          
          if (!notification.id) {
            console.error('알림 ID가 없습니다:', notification);
            alert('알림 ID가 없어 삭제할 수 없습니다.');
            return;
          }
          
          // 관리자용 알림 삭제 API 호출
          const response = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/admin/notification/delete/${notification.id}`);
          
          if (response.data.status_code === 200) {
            // 목록에서 해당 알림 제거
            const index = this.notifications.findIndex(n => n.id === notification.id);
            if (index !== -1) {
              this.notifications.splice(index, 1);
            }
            
            this.filterNotifications();
            
            // 현재 선택된 알림이 삭제된 알림과 같다면 모달 닫기
            if (this.selectedNotification && this.selectedNotification.id === notification.id) {
              this.closeModal();
            }
            
            alert('알림이 삭제되었습니다.');
          }
        } catch (error) {
          console.error('알림 삭제 실패:', error);
          console.error('Error details:', error.response?.data);
          alert('알림 삭제에 실패했습니다: ' + (error.response?.data?.status_message || error.message));
        }
      }
    },
    
    closeModal() {
      this.selectedNotification = null;
    }
  }
}
</script>

<style scoped src="@/styles/pages/admin.css"></style>
