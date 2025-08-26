<template>
  <div class="admin-layout">
    <div class="inquiry-list">
      <div class="header">
        <h1>문의 목록</h1>
        <button @click="logout" class="logout-btn">로그아웃</button>
      </div>
      
      <div class="navigation-menu">
        <router-link to="/admin" class="nav-item">대시보드</router-link>
        <router-link to="/admin/inquiry" class="nav-item active">문의 목록</router-link>
        <router-link to="/admin/notification" class="nav-item">알림 목록</router-link>
        <router-link to="/admin/users" class="nav-item">사용자 관리</router-link>
      </div>

      <div class="filters">
        <select v-model="statusFilter" @change="filterInquiries">
          <option value="">전체 상태</option>
          <option value="답변대기">답변대기</option>
          <option value="답변완료">답변완료</option>
        </select>
        <input type="text" v-model="searchQuery" placeholder="제목으로 검색..." @input="filterInquiries">
      </div>

      <div class="inquiry-table">
        <table>
          <thead>
            <tr>
              <th>번호</th>
              <th>제목</th>
              <th>작성자</th>
              <th>상태</th>
              <th>작성일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inquiry in filteredInquiries" :key="inquiry.id">
              <td>{{ inquiry.id }}</td>
              <td>{{ inquiry.title }}</td>
              <td>{{ inquiry.author }}</td>
              <td>
                <span :class="inquiry.status === '답변완료' ? 'completed' : 'pending'">
                  {{ inquiry.status }}
                </span>
              </td>
              <td>{{ inquiry.createdAt }}</td>
              <td>
                <button @click="viewInquiry(inquiry)" class="view-btn">보기</button>
                <button v-if="inquiry.status === '답변대기'" @click="replyInquiry(inquiry)" class="reply-btn">답변</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 문의 상세 보기 모달 -->
      <div v-if="selectedInquiry" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ selectedInquiry.title }}</h2>
            <button @click="closeModal" class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <div class="inquiry-detail">
              <p><strong>작성자:</strong> {{ selectedInquiry.author }}</p>
              <p><strong>작성일:</strong> {{ selectedInquiry.createdAt }}</p>
              <p><strong>내용:</strong></p>
              <div class="content">{{ selectedInquiry.content }}</div>
            </div>
            
            <div v-if="selectedInquiry.reply" class="reply-detail">
              <h3>답변</h3>
              <div class="content">{{ selectedInquiry.reply }}</div>
              <p><strong>답변일:</strong> {{ selectedInquiry.replyDate }}</p>
            </div>
            
            <div v-else class="reply-form">
              <h3>답변 작성</h3>
              <textarea v-model="replyContent" placeholder="답변을 입력하세요..." rows="5"></textarea>
              <div class="form-actions">
                <button @click="submitReply" class="submit-btn">답변 등록</button>
                <button @click="closeModal" class="cancel-btn">취소</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InquiryList',
  data() {
    return {
      inquiries: [],
      filteredInquiries: [],
      statusFilter: '',
      searchQuery: '',
      selectedInquiry: null,
      replyContent: ''
    }
  },
  mounted() {
    this.loadInquiries();
  },
  methods: {
    async loadInquiries() {
      try {
        // 실제 API 호출로 대체 필요
        this.inquiries = [
          { id: 1, title: '로그인 문제', author: 'user1@email.com', status: '답변대기', createdAt: '2024-01-15', content: '로그인이 안됩니다.' },
          { id: 2, title: '회원가입 오류', author: 'user2@email.com', status: '답변완료', createdAt: '2024-01-14', content: '회원가입 시 오류가 발생합니다.', reply: '확인해보겠습니다.', replyDate: '2024-01-14' },
          { id: 3, title: '비밀번호 재설정', author: 'user3@email.com', status: '답변대기', createdAt: '2024-01-13', content: '비밀번호 재설정이 안됩니다.' }
        ];
        this.filteredInquiries = [...this.inquiries];
      } catch (error) {
        console.error('문의 목록 로드 실패:', error);
      }
    },
    
    filterInquiries() {
      let filtered = [...this.inquiries];
      
      if (this.statusFilter) {
        filtered = filtered.filter(inquiry => inquiry.status === this.statusFilter);
      }
      
      if (this.searchQuery) {
        filtered = filtered.filter(inquiry => 
          inquiry.title.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      }
      
      this.filteredInquiries = filtered;
    },
    
    viewInquiry(inquiry) {
      this.selectedInquiry = inquiry;
      this.replyContent = '';
    },
    
    replyInquiry(inquiry) {
      this.selectedInquiry = inquiry;
      this.replyContent = '';
    },
    
    async submitReply() {
      try {
        // 실제 API 호출로 대체 필요
        this.selectedInquiry.reply = this.replyContent;
        this.selectedInquiry.replyDate = new Date().toISOString().split('T')[0];
        this.selectedInquiry.status = '답변완료';
        
        // 목록 업데이트
        const index = this.inquiries.findIndex(i => i.id === this.selectedInquiry.id);
        if (index !== -1) {
          this.inquiries[index] = { ...this.selectedInquiry };
        }
        
        this.filterInquiries();
        this.closeModal();
      } catch (error) {
        console.error('답변 등록 실패:', error);
      }
    },
    
    closeModal() {
      this.selectedInquiry = null;
      this.replyContent = '';
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

.inquiry-list {
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
}

.filters select, .filters input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.inquiry-table table {
  width: 100%;
  border-collapse: collapse;
}

.inquiry-table th, .inquiry-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.inquiry-table th {
  background: #f8f9fa;
  font-weight: bold;
}

.completed {
  color: #28a745;
  font-weight: bold;
}

.pending {
  color: #ffc107;
  font-weight: bold;
}

.view-btn, .reply-btn {
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

.reply-btn {
  background: #28a745;
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

.reply-form textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin: 10px 0;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.submit-btn, .cancel-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.submit-btn {
  background: #28a745;
  color: white;
}

.cancel-btn {
  background: #6c757d;
  color: white;
}
</style>
